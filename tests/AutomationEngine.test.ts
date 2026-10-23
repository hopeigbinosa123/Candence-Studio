import { describe, it, expect } from 'vitest';
import { AutomationEngine } from '../src/automation/AutomationEngine';

describe('AutomationEngine', () => {
  it('creates an automation lane with default endpoints', () => {
    const auto = new AutomationEngine();
    const lane = auto.createLane('lane-vol', 'track-1', 'volume', 'ch-lead', 'volume');

    expect(lane.points.length).toBe(2);
    expect(auto.evaluate('lane-vol', 0)).toBeCloseTo(0.5);
    expect(auto.evaluate('lane-vol', 16)).toBeCloseTo(0.5);
  });

  it('interpolates linearly between automation points', () => {
    const auto = new AutomationEngine();
    const lane = auto.createLane('lane-filter', 'track-2', 'synthParam', 'subtractive-synth', 'filterCutoff');

    // Add point at beat 8 with value 1.0 (endpoints at 0: 0.5 and 16: 0.5)
    lane.points[0].value = 0.0;
    lane.points[1].value = 1.0;

    // At beat 8, should be halfway = 0.5
    expect(auto.evaluate('lane-filter', 8)).toBeCloseTo(0.5);
    // At beat 4, should be 0.25
    expect(auto.evaluate('lane-filter', 4)).toBeCloseTo(0.25);
  });

  it('applies non-linear curve factors', () => {
    const auto = new AutomationEngine();
    const lane = auto.createLane('lane-curve', 'track-1', 'volume', 'ch-lead', 'volume');
    lane.points[0].value = 0.0;
    lane.points[0].curve = 0.5; // Exponential curve up
    lane.points[1].value = 1.0;

    const midValue = auto.evaluate('lane-curve', 8);
    // With positive curve, midValue should be less than 0.5 (slow rise then steep)
    expect(midValue).toBeLessThan(0.5);
  });
});
