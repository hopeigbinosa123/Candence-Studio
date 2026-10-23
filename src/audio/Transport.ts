/**
 * Transport & Master Timeline Clock for Cadence Studio
 * Sample-accurate musical timing, tempo, time-signature, loop, and metronome.
 */

import { TransportState } from '../types/audio';

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export type TransportListener = (state: TransportState, currentBeat: number) => void;

export class Transport {
  private _state: TransportState = 'stopped';
  private _bpm: number = 120;
  private _timeSignature: TimeSignature = { numerator: 4, denominator: 4 };
  private _currentBeat: number = 0;
  private _loopEnabled: boolean = false;
  private _loopStart: number = 0;
  private _loopEnd: number = 16;
  private _metronomeEnabled: boolean = false;
  private _metronomeGain: number = 0.5;

  private listeners: Set<TransportListener> = new Set();

  constructor(bpm: number = 120, timeSig: TimeSignature = { numerator: 4, denominator: 4 }) {
    this._bpm = bpm;
    this._timeSignature = timeSig;
  }

  public get state(): TransportState {
    return this._state;
  }

  public get bpm(): number {
    return this._bpm;
  }

  public set bpm(newBpm: number) {
    this._bpm = Math.max(30, Math.min(320, newBpm));
  }

  public get timeSignature(): TimeSignature {
    return { ...this._timeSignature };
  }

  public set timeSignature(sig: TimeSignature) {
    this._timeSignature = { ...sig };
  }

  public get currentBeat(): number {
    return this._currentBeat;
  }

  public set currentBeat(beat: number) {
    this._currentBeat = Math.max(0, beat);
    this.notify();
  }

  public get loopEnabled(): boolean {
    return this._loopEnabled;
  }

  public set loopEnabled(enabled: boolean) {
    this._loopEnabled = enabled;
  }

  public get loopStart(): number {
    return this._loopStart;
  }

  public set loopStart(val: number) {
    this._loopStart = Math.max(0, val);
  }

  public get loopEnd(): number {
    return this._loopEnd;
  }

  public set loopEnd(val: number) {
    this._loopEnd = Math.max(this._loopStart + 1, val);
  }

  public get metronomeEnabled(): boolean {
    return this._metronomeEnabled;
  }

  public set metronomeEnabled(val: boolean) {
    this._metronomeEnabled = val;
  }

  public get metronomeGain(): number {
    return this._metronomeGain;
  }

  public set metronomeGain(val: number) {
    this._metronomeGain = Math.max(0, Math.min(1, val));
  }

  public play(): void {
    if (this._state !== 'playing') {
      this._state = 'playing';
      this.notify();
    }
  }

  public pause(): void {
    if (this._state === 'playing' || this._state === 'recording') {
      this._state = 'paused';
      this.notify();
    }
  }

  public stop(): void {
    this._state = 'stopped';
    this._currentBeat = 0;
    this.notify();
  }

  public record(): void {
    this._state = 'recording';
    this.notify();
  }

  public advance(deltaTimeSec: number): void {
    if (this._state !== 'playing' && this._state !== 'recording') return;

    const deltaBeats = (deltaTimeSec * this._bpm) / 60;
    this._currentBeat += deltaBeats;

    if (this._loopEnabled && this._currentBeat >= this._loopEnd) {
      const loopLen = this._loopEnd - this._loopStart;
      this._currentBeat = this._loopStart + ((this._currentBeat - this._loopStart) % loopLen);
    }

    this.notify();
  }

  /**
   * Converts beat position to musical Bar:Beat:Sixteenth string (e.g. 01:03:02)
   */
  public formatTime(beat: number = this._currentBeat): string {
    const beatsPerBar = this._timeSignature.numerator;
    const bar = Math.floor(beat / beatsPerBar) + 1;
    const beatInBar = Math.floor(beat % beatsPerBar) + 1;
    const sixteenth = Math.floor((beat % 1) * 4) + 1;

    return `${String(bar).padStart(2, '0')}:${String(beatInBar).padStart(2, '0')}:${String(sixteenth).padStart(2, '0')}`;
  }

  /**
   * Converts beats to seconds at current BPM
   */
  public beatsToSeconds(beats: number): number {
    return (beats * 60) / this._bpm;
  }

  /**
   * Converts seconds to beats at current BPM
   */
  public secondsToBeats(seconds: number): number {
    return (seconds * this._bpm) / 60;
  }

  /**
   * Converts beats to sample count
   */
  public beatsToSamples(beats: number, sampleRate: number): number {
    return Math.round(this.beatsToSeconds(beats) * sampleRate);
  }

  public subscribe(listener: TransportListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this._state, this._currentBeat);
    }
  }
}
