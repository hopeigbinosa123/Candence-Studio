/**
 * Automation & Parameter Modulation Types
 */

export type CurveInterpolation = 'linear' | 'exponential' | 'bezier' | 'step';

export interface AutomationPoint {
  id: string;
  time: number;  // In beats
  value: number; // Normalized 0.0 - 1.0
  curve: number; // Curvature factor (-1.0 to 1.0, 0 = linear)
}

export interface AutomationLane {
  id: string;
  trackId: string;
  targetType: 'volume' | 'pan' | 'effectParam' | 'synthParam';
  targetId: string; // channelId, effectId, or synth param name
  paramKey: string;
  color: string;
  points: AutomationPoint[];
  enabled: boolean;
}
