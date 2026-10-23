/**
 * Multitrack Hardware Audio Recording Subsystem for Cadence Studio
 * Captures microphone and interface streams into float32 PCM buffers and generates waveform peaks.
 */

import { RecordingTake } from '../types/audio';
import { WavEncoder } from './WavEncoder';

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private recordedChunks: Float32Array[] = [];
  private isRecording: boolean = false;
  private currentTrackId: string = '';
  private startBeat: number = 0;
  private sampleRate: number = 44100;
  public peakLevel: number = 0;

  constructor(private ctx: BaseAudioContext) {
    this.sampleRate = ctx.sampleRate;
  }

  public async requestPermissionAndStart(
    trackId: string,
    currentBeat: number,
    deviceId?: string
  ): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia not supported in this environment');
      return false;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentTrackId = trackId;
      this.startBeat = currentBeat;
      this.recordedChunks = [];
      this.isRecording = true;

      if (this.ctx instanceof AudioContext) {
        this.sourceNode = this.ctx.createMediaStreamSource(this.mediaStream);
        this.processorNode = this.ctx.createScriptProcessor(2048, 1, 1);

        this.processorNode.onaudioprocess = (e) => {
          if (!this.isRecording) return;
          const input = e.inputBuffer.getChannelData(0);
          const copy = new Float32Array(input.length);
          copy.set(input);
          this.recordedChunks.push(copy);

          // Update peak level
          let peak = 0;
          for (let i = 0; i < input.length; i++) {
            const abs = Math.abs(input[i]);
            if (abs > peak) peak = abs;
          }
          this.peakLevel = peak;
        };

        this.sourceNode.connect(this.processorNode);
        this.processorNode.connect(this.ctx.destination);
      }

      return true;
    } catch (err) {
      console.error('Failed to initialize audio recording device:', err);
      return false;
    }
  }

  public stopRecording(currentBeat: number): RecordingTake | null {
    if (!this.isRecording) return null;
    this.isRecording = false;

    // Disconnect and release mic
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    // Merge recorded PCM chunks
    const totalSamples = this.recordedChunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const durationBeats = Math.max(0.25, currentBeat - this.startBeat);

    const take: RecordingTake = {
      id: `take-${Date.now()}`,
      trackId: this.currentTrackId,
      startBeat: this.startBeat,
      durationBeats,
      pcmData: merged,
      sampleRate: this.sampleRate,
      channels: 1,
      timestamp: Date.now(),
    };

    return take;
  }

  /**
   * Helper to convert recorded take PCM to downloadable WAV ArrayBuffer
   */
  public takeToWavBuffer(take: RecordingTake): ArrayBuffer {
    return WavEncoder.encode([take.pcmData], {
      sampleRate: take.sampleRate,
      bitDepth: 24,
      numChannels: 1,
      normalize: true,
    });
  }
}
