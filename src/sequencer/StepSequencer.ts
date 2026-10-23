/**
 * Step Sequencer Engine for Cadence Studio (FL Studio Inspired Workflow)
 * Handles step grids, drum lanes, swing groove, step accents, and pattern scheduling.
 */

import { Pattern, StepLane } from '../types/project';
import { DrumSynth } from '../audio/instruments/DrumSynth';
import { DEFAULT_DRUM_VOICES } from '../constants/defaults';

export class StepSequencer {
  private patterns: Map<string, Pattern> = new Map();
  private activePatternId: string = 'pattern-1';
  private lastScheduledStep: number = -1;

  constructor(private drumSynth: DrumSynth) {
    this.createDefaultPattern('pattern-1', 'Main Beat');
  }

  public createDefaultPattern(id: string, name: string): Pattern {
    const stepLanes: StepLane[] = DEFAULT_DRUM_VOICES.map((voice) => {
      const steps = new Array(16).fill(false);
      const velocities = new Array(16).fill(0.8);

      // Default classic 4-on-the-floor / house / trap rhythm starter
      if (voice.id === 'kick') {
        steps[0] = true;
        steps[4] = true;
        steps[8] = true;
        steps[12] = true;
      } else if (voice.id === 'snare' || voice.id === 'clap') {
        if (voice.id === 'snare') {
          steps[4] = true;
          steps[12] = true;
        }
      } else if (voice.id === 'closed_hat') {
        for (let i = 0; i < 16; i += 2) {
          steps[i] = true;
          velocities[i] = i % 4 === 0 ? 0.9 : 0.6; // Accent on downbeats
        }
      }

      return {
        id: `lane-${voice.id}`,
        name: voice.name,
        voiceId: voice.id,
        steps,
        velocities,
      };
    });

    const pattern: Pattern = {
      id,
      name,
      color: '#4f46e5',
      lengthInSteps: 16,
      stepLanes,
      swing: 0.15, // Subtle groove
    };

    this.patterns.set(id, pattern);
    return pattern;
  }

  public getActivePattern(): Pattern {
    return this.patterns.get(this.activePatternId) || this.patterns.values().next().value!;
  }

  public setActivePatternId(id: string): void {
    if (this.patterns.has(id)) {
      this.activePatternId = id;
    }
  }

  public getAllPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  public toggleStep(laneId: string, stepIndex: number): boolean {
    const pattern = this.getActivePattern();
    const lane = pattern.stepLanes.find((l) => l.id === laneId);
    if (!lane || stepIndex < 0 || stepIndex >= pattern.lengthInSteps) return false;

    lane.steps[stepIndex] = !lane.steps[stepIndex];
    return lane.steps[stepIndex];
  }

  public setStepVelocity(laneId: string, stepIndex: number, velocity: number): void {
    const pattern = this.getActivePattern();
    const lane = pattern.stepLanes.find((l) => l.id === laneId);
    if (!lane || stepIndex < 0 || stepIndex >= pattern.lengthInSteps) return;

    lane.velocities[stepIndex] = Math.max(0.0, Math.min(1.0, velocity));
  }

  public duplicatePattern(sourceId: string, newId: string, newName: string): Pattern | null {
    const src = this.patterns.get(sourceId);
    if (!src) return null;

    const copy: Pattern = {
      id: newId,
      name: newName,
      color: src.color,
      lengthInSteps: src.lengthInSteps,
      swing: src.swing,
      stepLanes: src.stepLanes.map((lane) => ({
        ...lane,
        id: `lane-${lane.voiceId}-${Date.now()}`,
        steps: [...lane.steps],
        velocities: [...lane.velocities],
      })),
    };

    this.patterns.set(newId, copy);
    return copy;
  }

  /**
   * Schedules step triggers for a given time window (lookahead scheduler)
   */
  public schedule(
    currentBeat: number,
    bpm: number,
    scheduleAheadSec: number,
    currentTimeAudioSec: number
  ): void {
    const pattern = this.getActivePattern();
    const stepsPerBeat = 4; // 16th notes
    const currentStepFloat = (currentBeat * stepsPerBeat) % pattern.lengthInSteps;
    const currentStep = Math.floor(currentStepFloat);

    if (currentStep !== this.lastScheduledStep) {
      this.lastScheduledStep = currentStep;

      // Calculate swing timing offset (delay even 16th steps)
      const isOffbeat = currentStep % 2 === 1;
      const stepDurationSec = 60 / (bpm * stepsPerBeat);
      const swingOffsetSec = isOffbeat ? pattern.swing * (stepDurationSec * 0.4) : 0;
      const triggerTime = currentTimeAudioSec + swingOffsetSec;

      for (const lane of pattern.stepLanes) {
        if (lane.steps[currentStep] && !lane.muted) {
          const velocity = lane.velocities[currentStep] ?? 0.8;
          this.drumSynth.triggerVoice(lane.voiceId, triggerTime, velocity);
        }
      }
    }
  }

  public resetPlayback(): void {
    this.lastScheduledStep = -1;
  }
}
