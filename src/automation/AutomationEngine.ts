/**
 * Automation & Parameter Modulation Engine for Cadence Studio
 * Multi-lane breakpoint envelopes, linear/bezier interpolation, and real-time parameter scheduling.
 */

import { AutomationLane, AutomationPoint } from '../types/automation';

export class AutomationEngine {
  public lanes: Map<string, AutomationLane> = new Map();

  public createLane(
    id: string,
    trackId: string,
    targetType: AutomationLane['targetType'],
    targetId: string,
    paramKey: string,
    color: string = '#38bdf8'
  ): AutomationLane {
    const lane: AutomationLane = {
      id,
      trackId,
      targetType,
      targetId,
      paramKey,
      color,
      points: [
        { id: `pt-0`, time: 0, value: 0.5, curve: 0 },
        { id: `pt-1`, time: 16, value: 0.5, curve: 0 },
      ],
      enabled: true,
    };
    this.lanes.set(id, lane);
    return lane;
  }

  public addPoint(laneId: string, timeBeats: number, value: number, curve: number = 0): AutomationPoint | null {
    const lane = this.lanes.get(laneId);
    if (!lane) return null;

    const pt: AutomationPoint = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: Math.max(0, timeBeats),
      value: Math.max(0.0, Math.min(1.0, value)),
      curve: Math.max(-1.0, Math.min(1.0, curve)),
    };

    lane.points.push(pt);
    lane.points.sort((a, b) => a.time - b.time);
    return pt;
  }

  public removePoint(laneId: string, pointId: string): boolean {
    const lane = this.lanes.get(laneId);
    if (!lane || lane.points.length <= 1) return false;

    const idx = lane.points.findIndex((p) => p.id === pointId);
    if (idx !== -1) {
      lane.points.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Evaluates the automation curve at an exact beat position.
   * Interpolates linearly or curved based on point curvature factor.
   */
  public evaluate(laneId: string, currentBeat: number): number {
    const lane = this.lanes.get(laneId);
    if (!lane || !lane.enabled || lane.points.length === 0) return 0.5;

    const points = lane.points;
    if (currentBeat <= points[0].time) return points[0].value;
    if (currentBeat >= points[points.length - 1].time) return points[points.length - 1].value;

    // Find bounding points
    let p0 = points[0];
    let p1 = points[1];

    for (let i = 0; i < points.length - 1; i++) {
      if (currentBeat >= points[i].time && currentBeat <= points[i + 1].time) {
        p0 = points[i];
        p1 = points[i + 1];
        break;
      }
    }

    const duration = p1.time - p0.time;
    if (duration <= 0.0001) return p0.value;

    const t = (currentBeat - p0.time) / duration; // 0.0 - 1.0

    // Apply curvature: curve = 0 is linear, curve > 0 curves up, curve < 0 curves down
    let curvedT = t;
    if (p0.curve !== 0) {
      const exponent = Math.pow(2, p0.curve * 2);
      curvedT = Math.pow(t, exponent);
    }

    return p0.value + (p1.value - p0.value) * curvedT;
  }
}
