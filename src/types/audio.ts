/**
 * Audio Engine, Device & Transport Types
 */

export type TransportState = 'stopped' | 'playing' | 'paused' | 'recording';

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
}

export interface EngineStats {
  sampleRate: number;
  bufferSize: number;
  cpuLoad: number; // 0.0 - 100.0%
  underruns: number;
  latencyMs: number;
  state: AudioContextState;
}

export interface RecordingTake {
  id: string;
  trackId: string;
  startBeat: number;
  durationBeats: number;
  pcmData: Float32Array;
  sampleRate: number;
  channels: number;
  timestamp: number;
}
