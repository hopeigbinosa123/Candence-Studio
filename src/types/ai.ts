/**
 * AI Assistant Types (Composition, Groove & Mix Guidance)
 */

export type MusicalGenre = 'pop' | 'trap' | 'boombap' | 'house' | 'neosoul' | 'edm' | 'lofi' | 'cinematic';
export type MusicalKey = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type ScaleMode = 'major' | 'minor' | 'dorian' | 'mixolydian' | 'pentatonic';

export interface ChordProgressionSuggestion {
  name: string;
  romanNumerals: string[];
  chords: {
    name: string;
    root: number;     // MIDI pitch
    notes: number[];  // Array of MIDI pitches
    duration: number; // In beats
  }[];
}

export interface MelodyGenerationOptions {
  key: MusicalKey;
  mode: ScaleMode;
  lengthBeats: number;
  complexity: 'simple' | 'moderate' | 'complex';
  octave: number;
}

export interface DrumPatternGenerationOptions {
  genre: MusicalGenre;
  tempo: number;
  swing: number;
  density: 'sparse' | 'medium' | 'dense';
}

export interface MixRecommendation {
  channelId: string;
  category: 'eq' | 'dynamics' | 'gain' | 'stereo';
  message: string;
  confidence: number;
  suggestedAction: {
    param: string;
    value: number | string;
  };
}
