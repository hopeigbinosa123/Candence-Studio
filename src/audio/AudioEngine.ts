/**
 * Master Real-Time Audio Engine for Cadence Studio
 * Synchronizes AudioContext, Transport, Synthesizers, Step Sequencer, Mixer, and Hardware I/O.
 */

import { Transport } from './Transport';
import { MixerGraph } from '../mixer/MixerGraph';
import { SubtractiveSynth } from './instruments/SubtractiveSynth';
import { DrumSynth } from './instruments/DrumSynth';
import { ElectricPiano } from './instruments/ElectricPiano';
import { Sampler } from './instruments/Sampler';
import { StepSequencer } from '../sequencer/StepSequencer';
import { PianoRollEngine } from '../sequencer/PianoRollEngine';
import { AutomationEngine } from '../automation/AutomationEngine';
import { MidiManager } from './MidiManager';
import { AudioRecorder } from './AudioRecorder';
import { Project } from '../types/project';

export class AudioEngine {
  public ctx: AudioContext | null = null;
  public transport: Transport;
  public mixer: MixerGraph | null = null;
  public synth: SubtractiveSynth | null = null;
  public drumSynth: DrumSynth | null = null;
  public electricPiano: ElectricPiano | null = null;
  public sampler: Sampler | null = null;
  public stepSequencer: StepSequencer | null = null;
  public pianoRoll: PianoRollEngine;
  public automation: AutomationEngine;
  public midi: MidiManager;
  public recorder: AudioRecorder | null = null;

  private isInitialized: boolean = false;
  private timerId: number | null = null;
  private lastTimeSec: number = 0;
  private metronomeOsc: OscillatorNode | null = null;

  constructor() {
    this.transport = new Transport(128);
    this.pianoRoll = new PianoRollEngine();
    this.automation = new AutomationEngine();
    this.midi = new MidiManager();
  }

  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });

      // Build Mixer Graph
      this.mixer = new MixerGraph(this.ctx);

      // Channel routing for instruments
      const drumCh = this.mixer.createChannel('ch-drums', 'Drums');
      const leadCh = this.mixer.createChannel('ch-lead', 'Lead Synth');
      const keysCh = this.mixer.createChannel('ch-keys', 'EPiano');
      const bassCh = this.mixer.createChannel('ch-bass', 'Bass');
      const audioCh = this.mixer.createChannel('ch-audio', 'Audio In');

      // Built-in Instruments
      this.drumSynth = new DrumSynth(this.ctx);
      this.drumSynth.outputNode.connect(drumCh.inputNode);

      this.synth = new SubtractiveSynth(this.ctx);
      this.synth.outputNode.connect(leadCh.inputNode);

      this.electricPiano = new ElectricPiano(this.ctx);
      this.electricPiano.outputNode.connect(keysCh.inputNode);

      this.sampler = new Sampler(this.ctx);
      this.sampler.outputNode.connect(leadCh.inputNode);

      // Step Sequencer connected to DrumSynth
      this.stepSequencer = new StepSequencer(this.drumSynth);

      // Hardware Recorder
      this.recorder = new AudioRecorder(this.ctx);

      // Connect MIDI Manager to Subtractive Synth
      this.midi.subscribe((pitch, velocity, isNoteOn) => {
        if (!this.synth) return;
        if (isNoteOn) {
          this.synth.noteOn(pitch, velocity);
        } else {
          this.synth.noteOff(pitch);
        }
      });

      this.isInitialized = true;
      this.startClockLoop();
      return true;
    } catch (err) {
      console.error('Failed to initialize Cadence Audio Engine:', err);
      return false;
    }
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * High-precision lookahead clock loop
   */
  private startClockLoop(): void {
    if (this.timerId !== null) return;

    this.lastTimeSec = performance.now() / 1000;

    const loop = () => {
      const nowSec = performance.now() / 1000;
      const deltaTime = nowSec - this.lastTimeSec;
      this.lastTimeSec = nowSec;

      if (this.transport.state === 'playing' || this.transport.state === 'recording') {
        const prevBeat = this.transport.currentBeat;
        this.transport.advance(deltaTime);
        const currentBeat = this.transport.currentBeat;

        // Schedule Drum Step Sequencer
        if (this.stepSequencer && this.ctx) {
          this.stepSequencer.schedule(currentBeat, this.transport.bpm, 0.1, this.ctx.currentTime);
        }

        // Schedule Metronome Click on Integer Beats
        if (this.transport.metronomeEnabled && this.ctx && Math.floor(currentBeat) !== Math.floor(prevBeat)) {
          this.triggerMetronomeClick(Math.floor(currentBeat));
        }

        // Evaluate Automation
        for (const lane of this.automation.lanes.values()) {
          const val = this.automation.evaluate(lane.id, currentBeat);
          if (lane.targetType === 'volume' && this.mixer) {
            this.mixer.setChannelVolume(lane.targetId, val * 1.5);
          } else if (lane.targetType === 'pan' && this.mixer) {
            this.mixer.setChannelPan(lane.targetId, (val - 0.5) * 2);
          }
        }
      }

      this.timerId = requestAnimationFrame(loop);
    };

    this.timerId = requestAnimationFrame(loop);
  }

  private triggerMetronomeClick(beatIndex: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const isBarStart = beatIndex % this.transport.timeSignature.numerator === 0;
    osc.frequency.setValueAtTime(isBarStart ? 1600 : 1000, this.ctx.currentTime);
    osc.type = 'triangle';

    const vol = this.transport.metronomeGain * 0.4;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    if (this.mixer) {
      gain.connect(this.mixer.masterInput);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playTestTone(frequency: number = 440, durationSec: number = 0.5): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + durationSec);

    osc.connect(gain);
    if (this.mixer) {
      gain.connect(this.mixer.masterInput);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + durationSec + 0.05);
  }
}

// Global Singleton Engine Instance
export const globalAudioEngine = new AudioEngine();
