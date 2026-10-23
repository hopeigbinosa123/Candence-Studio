/**
 * Cadence Studio - Engine & Musical Defaults
 */

export const AUDIO_DEFAULTS = {
  sampleRate: 44100,
  bufferSize: 512,
  defaultBpm: 128,
  timeSignature: { numerator: 4, denominator: 4 },
  stepsPerBeat: 4, // 16th notes
  defaultPatternLength: 16,
  minBpm: 30,
  maxBpm: 300,
  masterVolume: 0.85,
  metronomeGain: 0.5,
};

export const MUSICAL_SCALES = [
  { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9] },
  { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10] },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const DEFAULT_DRUM_VOICES = [
  { id: 'kick', name: 'Kick 808', color: '#ff4d4d', midiPitch: 36 },
  { id: 'snare', name: 'Snare 909', color: '#ffa64d', midiPitch: 38 },
  { id: 'clap', name: 'Hand Clap', color: '#ffdb4d', midiPitch: 39 },
  { id: 'closed_hat', name: 'Closed Hat', color: '#4dff88', midiPitch: 42 },
  { id: 'open_hat', name: 'Open Hat', color: '#4dffff', midiPitch: 46 },
  { id: 'tom', name: 'Low Tom', color: '#4d88ff', midiPitch: 41 },
  { id: 'perc', name: 'Rimshot/Perc', color: '#b84dff', midiPitch: 37 },
  { id: 'crash', name: 'Crash Cymbal', color: '#ff4ddb', midiPitch: 49 },
];
