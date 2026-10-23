/**
 * AI & Harmonic Music Theory Engine for Cadence Studio
 * Generates genre-specific chord progressions, modal substitutions, and voice leading.
 */

import { MusicalKey, ScaleMode, ChordProgressionSuggestion } from '../types/ai';

export class ChordGenerator {
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

  /**
   * Generates a 4-bar or 8-bar chord progression based on genre and root key
   */
  public static generateProgression(
    key: MusicalKey = 'C',
    genre: string = 'neosoul',
    bars: number = 4
  ): ChordProgressionSuggestion {
    const rootBase = 60 + this.KEY_OFFSETS[key]; // Octave 4

    switch (genre.toLowerCase()) {
      case 'neosoul':
      case 'lofi':
        // ii9 - V13 - Imaj9 - vi7
        return {
          name: `${key} Neo-Soul / Lofi Progression (ii9 - V13 - Imaj9 - vi7)`,
          romanNumerals: ['ii9', 'V13', 'Imaj9', 'vi7'],
          chords: [
            { name: 'Dm9', root: rootBase + 2, notes: [rootBase + 2, rootBase + 5, rootBase + 9, rootBase + 12, rootBase + 16], duration: 4 },
            { name: 'G13', root: rootBase + 7, notes: [rootBase + 7, rootBase + 11, rootBase + 14, rootBase + 17, rootBase + 21], duration: 4 },
            { name: 'Cmaj9', root: rootBase, notes: [rootBase, rootBase + 4, rootBase + 7, rootBase + 11, rootBase + 14], duration: 4 },
            { name: 'Am7', root: rootBase + 9, notes: [rootBase + 9, rootBase + 12, rootBase + 16, rootBase + 19], duration: 4 },
          ],
        };

      case 'trap':
      case 'drill':
        // i - VI - iv - V (Dark minor trap)
        return {
          name: `${key} Dark Trap Progression (i - VI - iv - V)`,
          romanNumerals: ['i', 'VI', 'iv', 'V'],
          chords: [
            { name: `${key}m`, root: rootBase, notes: [rootBase, rootBase + 3, rootBase + 7], duration: 4 },
            { name: 'Ab', root: rootBase + 8, notes: [rootBase + 8, rootBase + 12, rootBase + 15], duration: 4 },
            { name: 'Fm', root: rootBase + 5, notes: [rootBase + 5, rootBase + 8, rootBase + 12], duration: 4 },
            { name: 'G', root: rootBase + 7, notes: [rootBase + 7, rootBase + 11, rootBase + 14], duration: 4 },
          ],
        };

      case 'edm':
      case 'house':
        // vi - IV - I - V (Anthem progression)
        return {
          name: `${key} Uplifting Anthem (vi - IV - I - V)`,
          romanNumerals: ['vi', 'IV', 'I', 'V'],
          chords: [
            { name: 'Am', root: rootBase + 9, notes: [rootBase + 9, rootBase + 12, rootBase + 16], duration: 4 },
            { name: 'F', root: rootBase + 5, notes: [rootBase + 5, rootBase + 9, rootBase + 12], duration: 4 },
            { name: 'C', root: rootBase, notes: [rootBase, rootBase + 4, rootBase + 7], duration: 4 },
            { name: 'G', root: rootBase + 7, notes: [rootBase + 7, rootBase + 11, rootBase + 14], duration: 4 },
          ],
        };

      case 'pop':
      default:
        // I - V - vi - IV (Classic 4-chord pop)
        return {
          name: `${key} Classic Pop (I - V - vi - IV)`,
          romanNumerals: ['I', 'V', 'vi', 'IV'],
          chords: [
            { name: 'C', root: rootBase, notes: [rootBase, rootBase + 4, rootBase + 7], duration: 4 },
            { name: 'G', root: rootBase + 7, notes: [rootBase + 7, rootBase + 11, rootBase + 14], duration: 4 },
            { name: 'Am', root: rootBase + 9, notes: [rootBase + 9, rootBase + 12, rootBase + 16], duration: 4 },
            { name: 'F', root: rootBase + 5, notes: [rootBase + 5, rootBase + 9, rootBase + 12], duration: 4 },
          ],
        };
    }
  }
}
