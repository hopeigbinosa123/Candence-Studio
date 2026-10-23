/**
 * Sampler Instrument for Cadence Studio
 * Sample playback, root pitch mapping, multi-pitch transposition, trimming, and ADSR envelope.
 */

export interface SamplerParams {
  rootPitch: number;   // Default 60 (Middle C)
  startOffsetSec: number;
  endOffsetSec?: number;
  loop: boolean;
  loopStartSec: number;
  loopEndSec: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  gain: number;
}

export const DEFAULT_SAMPLER_PARAMS: SamplerParams = {
  rootPitch: 60,
  startOffsetSec: 0,
  loop: false,
  loopStartSec: 0,
  loopEndSec: 1.0,
  attack: 0.005,
  decay: 0.2,
  sustain: 0.8,
  release: 0.15,
  gain: 1.0,
};

export class Sampler {
  public params: SamplerParams = { ...DEFAULT_SAMPLER_PARAMS };
  public outputNode: GainNode;
  private buffer: AudioBuffer | null = null;
  private activeVoices: Map<number, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();

  constructor(private ctx: BaseAudioContext) {
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(1.0, ctx.currentTime);
  }

  public loadBuffer(buffer: AudioBuffer): void {
    this.buffer = buffer;
  }

  public noteOn(pitch: number, velocity: number = 0.8, time: number = this.ctx.currentTime): void {
    if (!this.buffer) return;
    this.noteOff(pitch, time);

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;

    // Pitch transposition ratio: 2^((pitch - root) / 12)
    const semitones = pitch - this.params.rootPitch;
    source.playbackRate.setValueAtTime(Math.pow(2, semitones / 12), time);

    source.loop = this.params.loop;
    if (this.params.loop) {
      source.loopStart = this.params.loopStartSec;
      source.loopEnd = Math.min(this.buffer.duration, this.params.loopEndSec);
    }

    const voiceGain = this.ctx.createGain();
    const peakAmp = velocity * this.params.gain;
    const sustainAmp = peakAmp * this.params.sustain;

    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(peakAmp, time + this.params.attack);
    voiceGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, sustainAmp),
      time + this.params.attack + this.params.decay
    );

    source.connect(voiceGain);
    voiceGain.connect(this.outputNode);

    const offset = Math.max(0, this.params.startOffsetSec);
    const duration = this.params.endOffsetSec
      ? Math.max(0.01, this.params.endOffsetSec - offset)
      : undefined;

    source.start(time, offset, duration);
    this.activeVoices.set(pitch, { source, gain: voiceGain });
  }

  public noteOff(pitch: number, time: number = this.ctx.currentTime): void {
    const voice = this.activeVoices.get(pitch);
    if (!voice) return;

    const releaseTime = Math.max(0.02, this.params.release);
    voice.gain.gain.cancelScheduledValues(time);
    voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), time);
    voice.gain.gain.exponentialRampToValueAtTime(0.00001, time + releaseTime);

    voice.source.stop(time + releaseTime + 0.05);
    this.activeVoices.delete(pitch);
  }

  public stopAll(time: number = this.ctx.currentTime): void {
    for (const [pitch] of this.activeVoices) {
      this.noteOff(pitch, time);
    }
  }
}
