/**
 * Project Serialization, History & Asset Storage for Cadence Studio
 * Versioned .cadence format with full undo/redo stack, autosave, and recovery.
 */

import { Project, Track, Pattern } from '../types/project';
import { PRODUCT_INFO } from '../constants/branding';
import { AUDIO_DEFAULTS } from '../constants/defaults';

export class ProjectManager {
  private currentProject: Project;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxHistorySize: number = 50;

  constructor(initialProject?: Project) {
    this.currentProject = initialProject || this.createBlankProject('New Studio Session');
    this.pushState();
  }

  public get project(): Project {
    return this.currentProject;
  }

  public createBlankProject(title: string = 'Untitled Session'): Project {
    const defaultTrack1: Track = {
      id: 'track-1',
      name: 'Drums',
      type: 'pattern',
      color: '#f43f5e',
      volume: 1.0,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      mixerChannelId: 'ch-drums',
      clips: [
        {
          id: 'clip-drums-1',
          name: 'Main Beat',
          type: 'pattern',
          patternId: 'pattern-1',
          startTime: 0,
          duration: 16,
          offset: 0,
          color: '#f43f5e',
        },
      ],
      automationLaneIds: [],
    };

    const defaultTrack2: Track = {
      id: 'track-2',
      name: 'Synth Lead',
      type: 'midi',
      color: '#06b6d4',
      volume: 0.85,
      pan: -0.15,
      muted: false,
      solo: false,
      armed: false,
      mixerChannelId: 'ch-lead',
      instrumentId: 'subtractive-synth',
      clips: [
        {
          id: 'clip-synth-1',
          name: 'Lead Melody',
          type: 'midi',
          startTime: 0,
          duration: 16,
          offset: 0,
          color: '#06b6d4',
          notes: [
            { id: 'n1', pitch: 60, startTime: 0, duration: 1, velocity: 0.8 },
            { id: 'n2', pitch: 63, startTime: 1, duration: 1, velocity: 0.85 },
            { id: 'n3', pitch: 67, startTime: 2, duration: 1.5, velocity: 0.9 },
            { id: 'n4', pitch: 65, startTime: 3.5, duration: 0.5, velocity: 0.75 },
          ],
        },
      ],
      automationLaneIds: [],
    };

    const defaultTrack3: Track = {
      id: 'track-3',
      name: 'Sub Bass',
      type: 'midi',
      color: '#8b5cf6',
      volume: 0.9,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      mixerChannelId: 'ch-bass',
      instrumentId: 'subtractive-synth',
      clips: [],
      automationLaneIds: [],
    };

    const defaultTrack4: Track = {
      id: 'track-4',
      name: 'Audio Recording',
      type: 'audio',
      color: '#10b981',
      volume: 0.95,
      pan: 0.1,
      muted: false,
      solo: false,
      armed: false,
      mixerChannelId: 'ch-audio',
      clips: [],
      automationLaneIds: [],
    };

    const blank: Project = {
      metadata: {
        id: `proj-${Date.now()}`,
        title,
        artist: 'Cadence Producer',
        version: PRODUCT_INFO.version,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        sampleRate: AUDIO_DEFAULTS.sampleRate,
        bpm: AUDIO_DEFAULTS.defaultBpm,
        timeSignature: AUDIO_DEFAULTS.timeSignature,
      },
      tracks: [defaultTrack1, defaultTrack2, defaultTrack3, defaultTrack4],
      patterns: [],
      activePatternId: 'pattern-1',
      loopRegion: {
        enabled: true,
        start: 0,
        end: 16,
      },
      markers: [
        { id: 'm1', name: 'Intro', time: 0, color: '#38bdf8' },
        { id: 'm2', name: 'Drop', time: 16, color: '#f43f5e' },
      ],
      masterVolume: 0.85,
    };

    return blank;
  }

  public serialize(): string {
    this.currentProject.metadata.modifiedAt = new Date().toISOString();
    return JSON.stringify(this.currentProject, null, 2);
  }

  public deserialize(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as Project;
      // Validate schema
      if (!parsed.metadata || !Array.isArray(parsed.tracks) || !parsed.metadata.bpm) {
        throw new Error('Invalid Cadence project schema');
      }
      this.currentProject = parsed;
      this.undoStack = [];
      this.redoStack = [];
      this.pushState();
      return true;
    } catch (err) {
      console.error('Failed to deserialize project:', err);
      return false;
    }
  }

  public pushState(): void {
    const snapshot = JSON.stringify(this.currentProject);
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo on new action
  }

  public undo(): boolean {
    if (this.undoStack.length <= 1) return false;

    const current = this.undoStack.pop()!;
    this.redoStack.push(current);

    const previous = this.undoStack[this.undoStack.length - 1];
    this.currentProject = JSON.parse(previous);
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;

    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    this.currentProject = JSON.parse(next);
    return true;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
