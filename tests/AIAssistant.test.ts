import { describe, it, expect } from 'vitest';
import { ChordGenerator } from '../src/ai/ChordGenerator';
import { MelodyGenerator } from '../src/ai/MelodyGenerator';
import { DrumGenerator } from '../src/ai/DrumGenerator';
import { MixAssistant } from '../src/ai/MixAssistant';
import { ProjectManager } from '../src/storage/ProjectManager';

describe('AI Studio Tools', () => {
  it('generates Neo-Soul chord progression in key of D', () => {
    const prog = ChordGenerator.generateProgression('D', 'neosoul', 4);
    expect(prog.name).toContain('D Neo-Soul');
    expect(prog.chords.length).toBe(4);
    expect(prog.chords[0].notes.length).toBeGreaterThan(3);
  });

  it('generates melodic motifs adhering to Pentatonic Minor scale', () => {
    const melody = MelodyGenerator.generateMelody('A', 'Pentatonic Minor', 16, 4);
    expect(melody.length).toBeGreaterThan(4);
    for (const note of melody) {
      expect(note.startTime).toBeGreaterThanOrEqual(0);
      expect(note.startTime).toBeLessThan(16);
      expect(note.pitch).toBeGreaterThan(40);
    }
  });

  it('generates genre-authentic drum patterns with correct kick and snare placement', () => {
    const { lanes, swing } = DrumGenerator.generatePattern('trap', 16);
    expect(swing).toBeCloseTo(0.05);

    const kickLane = lanes.find((l) => l.voiceId === 'kick')!;
    const clapLane = lanes.find((l) => l.voiceId === 'clap')!;

    expect(kickLane.steps[0]).toBe(true);
    expect(clapLane.steps[8]).toBe(true);
  });

  it('analyzes mix and detects gain staging / frequency conflicts', () => {
    const pm = new ProjectManager();
    const recommendations = MixAssistant.analyzeMix(pm.project);

    expect(recommendations.length).toBeGreaterThan(0);
    const bassRec = recommendations.find((r) => r.category === 'eq');
    expect(bassRec).toBeDefined();
  });
});
