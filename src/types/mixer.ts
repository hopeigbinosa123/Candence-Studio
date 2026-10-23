/**
 * Mixer & Signal Routing Types
 */

export type EffectType =
  | 'eq'
  | 'compressor'
  | 'limiter'
  | 'delay'
  | 'reverb'
  | 'distortion'
  | 'chorus'
  | 'filter'
  | 'plugin';

export interface EffectConfig {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  params: Record<string, number | string | boolean>;
}

export interface SendRouting {
  targetChannelId: string;
  amount: number; // 0.0 to 1.0
  preFader: boolean;
}

export interface MixerChannel {
  id: string;
  name: string;
  isMaster: boolean;
  color: string;
  volume: number;       // Linear amplitude 0.0 - 1.5 (1.0 = 0dB)
  pan: number;          // -1.0 (Left) to +1.0 (Right)
  muted: boolean;
  solo: boolean;
  inserts: EffectConfig[];
  sends: SendRouting[];
}

export interface MeterData {
  peakL: number;        // 0.0 to 1.0+
  peakR: number;
  rmsL: number;
  rmsR: number;
  clipped: boolean;
}
