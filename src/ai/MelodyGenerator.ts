/**
 * AI Melody & Motif Generator for Cadence Studio
 * Contour-guided melodic generator with rhythmic syncopation, scale adherence, and musical resolution.
 */

import { Note } from '../types/project';
import { MUSICAL_SCALES } from '../constants/defaults';
import { MusicalKey } from '../types/ai';

export class MelodyGenerator {
  private static KEY_OFFSETS: Record<MusicalKey, number> = {
    C: 0,
    'C#': 1,
    D: 2,
    'D#': 3,
    E: 4,
    F: 5,
    'F#': 6,
    G: 7,
    'G#': 8,
    A: 9,
    'A#': 10,
    B: 11,
  };

  public static generateMelody(
    key: MusicalKey = 'C',
    scaleName: string = 'Pentatonic Minor',
    lengthBeats: number = 16,
    octave: number = 5
  ): Note[] {
    const scaleObj = MUSICAL_SCALES.find((s) => s.name.toLowerCase().includes(scaleName.toLowerCase())) || MUSICAL_SCALES[10];
    const rootBase = (octave + 1) * 12 + this.KEY_OFFSETS[key];
    const scalePitches = scaleObj.intervals.map((i) => rootBase + i);

    const notes: Note[] = [];
    let currentBeat = 0;
    let prevPitchIndex = 0;

    const durations = [0.5, 0.5, 1.0, 0.75, 0.25, 1.5, 2.0];

    while (currentBeat < lengthBeats) {
      // Pick duration
      const dur = durations[Math.floor(Math.random() * durations.length)];
      if (currentBeat + dur > lengthBeats) {
        // Final note - resolve to root (index 0) or fifth
        const finalDur = Math.max(0.5, lengthBeats - currentBeat);
        notes.push({
          id: `ai-note-${notes.length}`,
          pitch: scalePitches[0],
          startTime: currentBeat,
          duration: finalDur,
          velocity: 0.9,
        });
        break;
      }

      // Stepwise motion or occasional octave jump
      const step = Math.floor(Math.random() * 5) - 2; // -2 to +2
      let newIndex = Math.max(0, Math.min(scalePitches.length - 1, prevPitchIndex + step));
      prevPitchIndex = newIndex;

      // Rest probability (20% syncopation rest)
      if (Math.random() > 0.22) {
        notes.push({
          id: `ai-note-${notes.length}`,
          pitch: scalePitches[newIndex],
          startTime: currentBeat,
          duration: Math.max(0.25, dur * 0.85), // Slight staccato/space
          velocity: 0.7 + Math.random() * 0.25,
        });
      }

      currentBeat += dur;
    }

    return notes;
  }
}
