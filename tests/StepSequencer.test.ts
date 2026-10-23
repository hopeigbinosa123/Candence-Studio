import { describe, it, expect, vi } from 'vitest';
import { StepSequencer } from '../src/sequencer/StepSequencer';
import { DrumSynth } from '../src/audio/instruments/DrumSynth';

describe('StepSequencer', () => {
  it('creates default drum pattern with 16 steps', () => {
    // Mock DrumSynth
    const mockDrumSynth = {
      triggerVoice: vi.fn(),
    } as unknown as DrumSynth;

    const seq = new StepSequencer(mockDrumSynth);
    const pattern = seq.getActivePattern();

    expect(pattern.lengthInSteps).toBe(16);
    expect(pattern.stepLanes.length).toBeGreaterThan(4);

    const kickLane = pattern.stepLanes.find((l) => l.voiceId === 'kick');
    expect(kickLane).toBeDefined();
    expect(kickLane!.steps[0]).toBe(true);
    expect(kickLane!.steps[4]).toBe(true);
  });

  it('toggles steps and sets step velocities', () => {
    const mockDrumSynth = { triggerVoice: vi.fn() } as unknown as DrumSynth;
    const seq = new StepSequencer(mockDrumSynth);
    const pattern = seq.getActivePattern();
    const lane = pattern.stepLanes[0];

    const initial = lane.steps[1];
    seq.toggleStep(lane.id, 1);
    expect(lane.steps[1]).toBe(!initial);

    seq.setStepVelocity(lane.id, 1, 0.42);
    expect(lane.velocities[1]).toBeCloseTo(0.42);
  });

  it('duplicates patterns with new unique lane IDs', () => {
    const mockDrumSynth = { triggerVoice: vi.fn() } as unknown as DrumSynth;
    const seq = new StepSequencer(mockDrumSynth);

    const copy = seq.duplicatePattern('pattern-1', 'pattern-2', 'Chorus Beat');
    expect(copy).toBeDefined();
    expect(copy!.id).toBe('pattern-2');
    expect(copy!.name).toBe('Chorus Beat');
    expect(seq.getAllPatterns().length).toBe(2);
  });
});
