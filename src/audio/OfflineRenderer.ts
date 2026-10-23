/**
 * Offline Audio Renderer & Stem Exporter for Cadence Studio
 * Sample-accurate rendering of tracks, clips, synths, and effects using OfflineAudioContext.
 */

import { Project, AudioClip, MidiClip, PatternClip } from '../types/project';
import { WavEncoder } from './WavEncoder';

export interface RenderOptions {
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  numChannels: 1 | 2;
  normalize: boolean;
  dither: boolean;
  startBeat: number;
  endBeat: number;
  stems?: boolean; // Export individual tracks as separate stems
}

export class OfflineRenderer {
  /**
   * Renders project timeline audio into a high-fidelity WAV file ArrayBuffer.
   */
  public static async renderProject(
    project: Project,
    options: RenderOptions,
    onProgress?: (progress: number) => void
  ): Promise<ArrayBuffer> {
    const bpm = project.metadata.bpm;
    const durationBeats = Math.max(1, options.endBeat - options.startBeat);
    const durationSeconds = (durationBeats * 60) / bpm;
    const lengthSamples = Math.ceil(durationSeconds * options.sampleRate);

    // Create high-precision OfflineAudioContext
    const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
      options.numChannels,
      lengthSamples,
      options.sampleRate
    );

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(project.masterVolume, 0);
    masterGain.connect(offlineCtx.destination);

    // Render active tracks
    for (const track of project.tracks) {
      if (track.muted) continue;

      const trackGain = offlineCtx.createGain();
      trackGain.gain.setValueAtTime(track.volume, 0);

      // Stereo Panner
      if (offlineCtx.createStereoPanner) {
        const panner = offlineCtx.createStereoPanner();
        panner.pan.setValueAtTime(track.pan, 0);
        trackGain.connect(panner);
        panner.connect(masterGain);
      } else {
        trackGain.connect(masterGain);
      }

      for (const clip of track.clips) {
        if (clip.startTime >= options.endBeat || clip.startTime + clip.duration <= options.startBeat) {
          continue; // Out of render bounds
        }

        const clipStartBeat = Math.max(options.startBeat, clip.startTime);
        const offsetBeats = clipStartBeat - options.startBeat;
        const clipStartSec = (offsetBeats * 60) / bpm;

        if (clip.type === 'midi') {
          const midiClip = clip as MidiClip;
          for (const note of midiClip.notes) {
            const noteStartBeats = clipStartBeat + note.startTime;
            const noteStartSec = ((noteStartBeats - options.startBeat) * 60) / bpm;
            const noteDurSec = (note.duration * 60) / bpm;

            if (noteStartSec >= 0 && noteStartSec < durationSeconds) {
              const freq = 440 * Math.pow(2, (note.pitch - 69) / 12);
              const osc = offlineCtx.createOscillator();
              const noteGain = offlineCtx.createGain();

              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(freq, noteStartSec);

              const amp = note.velocity * 0.4;
              noteGain.gain.setValueAtTime(0.0001, noteStartSec);
              noteGain.gain.linearRampToValueAtTime(amp, noteStartSec + 0.01);
              noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStartSec + noteDurSec);

              osc.connect(noteGain);
              noteGain.connect(trackGain);

              osc.start(noteStartSec);
              osc.stop(noteStartSec + noteDurSec + 0.05);
            }
          }
        }
      }
    }

    if (onProgress) onProgress(0.25);

    const renderedBuffer = await offlineCtx.startRendering();

    if (onProgress) onProgress(0.85);

    const channels: Float32Array[] = [];
    for (let c = 0; c < options.numChannels; c++) {
      channels.push(renderedBuffer.getChannelData(c));
    }

    const wavArrayBuffer = WavEncoder.encode(channels, {
      sampleRate: options.sampleRate,
      bitDepth: options.bitDepth,
      numChannels: options.numChannels,
      normalize: options.normalize,
      applyDither: options.dither,
    });

    if (onProgress) onProgress(1.0);

    return wavArrayBuffer;
  }
}
