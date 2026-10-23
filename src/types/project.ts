/**
 * Project Model & Data Structures for Cadence Studio
 * Versioned, serializable to .cadence JSON.
 */

export type TrackType = 'audio' | 'midi' | 'pattern' | 'group';

export interface Note {
  id: string;
  pitch: number;      // MIDI pitch 0-127 (60 = Middle C)
  startTime: number;  // In beats
  duration: number;   // In beats
  velocity: number;   // 0.0 - 1.0
  pan?: number;       // -1.0 to 1.0
  selected?: boolean;
}

export interface StepLane {
  id: string;
  name: string;
  voiceId: string;    // References drum voice or sample
  steps: boolean[];   // Length is pattern length (e.g. 16, 32)
  velocities: number[]; // 0.0 - 1.0
  pitches?: number[];   // Custom pitch offset per step
  muted?: boolean;
}

export interface Pattern {
  id: string;
  name: string;
  color: string;
  lengthInSteps: number; // e.g. 16 for 1 bar of 16ths
  stepLanes: StepLane[];
  swing: number;         // 0.0 to 1.0
}

export interface ClipBase {
  id: string;
  name: string;
  startTime: number;     // In beats
  duration: number;      // In beats
  offset: number;        // In beats (start offset inside content)
  color: string;
  muted?: boolean;
  selected?: boolean;
}

export interface AudioClip extends ClipBase {
  type: 'audio';
  audioBufferId: string; // References loaded audio asset
  gain: number;          // 0.0 to 2.0
  fadeIn: number;        // Beats
  fadeOut: number;       // Beats
  reversed?: boolean;
  normalized?: boolean;
  pitchShift?: number;   // Semitones
}

export interface PatternClip extends ClipBase {
  type: 'pattern';
  patternId: string;     // References Pattern.id
}

export interface MidiClip extends ClipBase {
  type: 'midi';
  notes: Note[];
}

export type Clip = AudioClip | PatternClip | MidiClip;

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  volume: number;        // 0.0 - 1.5 (1.0 = 0dB)
  pan: number;           // -1.0 to 1.0
  muted: boolean;
  solo: boolean;
  armed: boolean;        // For audio or MIDI recording
  mixerChannelId: string;// Routing target
  instrumentId?: string; // Built-in or plugin instrument
  clips: Clip[];
  automationLaneIds: string[];
}

export interface Marker {
  id: string;
  name: string;
  time: number;          // In beats
  color?: string;
}

export interface ProjectMetadata {
  id: string;
  title: string;
  artist: string;
  version: string;
  createdAt: string;
  modifiedAt: string;
  sampleRate: number;
  bpm: number;
  timeSignature: {
    numerator: number;
    denominator: number;
  };
}

export interface Project {
  metadata: ProjectMetadata;
  tracks: Track[];
  patterns: Pattern[];
  activePatternId: string;
  loopRegion: {
    enabled: boolean;
    start: number; // Beats
    end: number;   // Beats
  };
  markers: Marker[];
  masterVolume: number;
}
