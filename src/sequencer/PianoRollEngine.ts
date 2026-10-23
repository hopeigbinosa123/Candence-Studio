/**
 * Piano Roll & MIDI Editing Engine for Cadence Studio
 * Grid quantization, note manipulation, scale constraints, chord assistance, and MIDI export.
 */

import { Note } from '../types/project';
import { MUSICAL_SCALES } from '../constants/defaults';

export type QuantizeGrid = 1 | 0.5 | 0.25 | 0.125 | 0.0625; // 1/1, 1/2, 1/4, 1/8, 1/16 beat

export class PianoRollEngine {
  public notes: Note[] = [];
  public quantizeGrid: QuantizeGrid = 0.25; // 16th notes default
  public snapEnabled: boolean = true;
  public scaleRootPitch: number = 60; // Middle C
  public scaleIndex: number = 1; // Major default

  constructor(initialNotes: Note[] = []) {
    this.notes = [...initialNotes];
  }

  public addNote(pitch: number, startTime: number, duration: number = 1.0, velocity: number = 0.8): Note {
    const snappedStart = this.snapEnabled ? this.snapTime(startTime) : startTime;
    const snappedDuration = this.snapEnabled ? Math.max(this.quantizeGrid, this.snapTime(duration)) : duration;

    const note: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      pitch: Math.max(0, Math.min(127, Math.round(pitch))),
      startTime: Math.max(0, snappedStart),
      duration: Math.max(0.05, snappedDuration),
      velocity: Math.max(0.01, Math.min(1.0, velocity)),
    };

    this.notes.push(note);
    return note;
  }

  public removeNote(noteId: string): boolean {
    const idx = this.notes.findIndex((n) => n.id === noteId);
    if (idx !== -1) {
      this.notes.splice(idx, 1);
      return true;
    }
    return false;
  }

  public moveNote(noteId: string, deltaPitch: number, deltaTimeBeats: number): void {
    const note = this.notes.find((n) => n.id === noteId);
    if (!note) return;

    note.pitch = Math.max(0, Math.min(127, Math.round(note.pitch + deltaPitch)));
    const newStart = note.startTime + deltaTimeBeats;
    note.startTime = this.snapEnabled ? Math.max(0, this.snapTime(newStart)) : Math.max(0, newStart);
  }

  public resizeNote(noteId: string, newDurationBeats: number): void {
    const note = this.notes.find((n) => n.id === noteId);
    if (!note) return;

    const dur = this.snapEnabled ? this.snapTime(newDurationBeats) : newDurationBeats;
    note.duration = Math.max(this.quantizeGrid, dur);
  }

  public setVelocity(noteId: string, velocity: number): void {
    const note = this.notes.find((n) => n.id === noteId);
    if (note) {
      note.velocity = Math.max(0.01, Math.min(1.0, velocity));
    }
  }

  public quantizeAll(): void {
    for (const note of this.notes) {
      note.startTime = this.snapTime(note.startTime);
      note.duration = Math.max(this.quantizeGrid, this.snapTime(note.duration));
    }
  }

  public snapTime(timeInBeats: number): number {
    return Math.round(timeInBeats / this.quantizeGrid) * this.quantizeGrid;
  }

  public isPitchInCurrentScale(pitch: number): boolean {
    const scale = MUSICAL_SCALES[this.scaleIndex] || MUSICAL_SCALES[0];
    const semitone = (pitch - this.scaleRootPitch) % 12;
    const normalized = semitone < 0 ? semitone + 12 : semitone;
    return scale.intervals.includes(normalized);
  }

  /**
   * Generates standard chord notes given a root pitch and chord type
   */
  public insertChord(
    rootPitch: number,
    chordType: 'major' | 'minor' | '7th' | 'maj7' | 'min7' | 'sus4',
    startTime: number,
    duration: number = 2.0
  ): Note[] {
    let intervals: number[] = [0, 4, 7]; // Major triad
    if (chordType === 'minor') intervals = [0, 3, 7];
    else if (chordType === '7th') intervals = [0, 4, 7, 10];
    else if (chordType === 'maj7') intervals = [0, 4, 7, 11];
    else if (chordType === 'min7') intervals = [0, 3, 7, 10];
    else if (chordType === 'sus4') intervals = [0, 5, 7];

    const created: Note[] = [];
    for (const interval of intervals) {
      created.push(this.addNote(rootPitch + interval, startTime, duration, 0.8));
    }
    return created;
  }

  /**
   * Encodes notes to Standard MIDI File (SMF Format 0) ArrayBuffer
   */
  public exportMidiFile(bpm: number = 120): ArrayBuffer {
    const ticksPerQuarter = 480;
    const trackEvents: { tick: number; data: number[] }[] = [];

    // Sort notes chronologically
    for (const note of this.notes) {
      const onTick = Math.round(note.startTime * ticksPerQuarter);
      const offTick = Math.round((note.startTime + note.duration) * ticksPerQuarter);
      const vel = Math.round(note.velocity * 127);

      // Note On: 0x90, pitch, velocity
      trackEvents.push({ tick: onTick, data: [0x90, note.pitch, vel] });
      // Note Off: 0x80, pitch, 0
      trackEvents.push({ tick: offTick, data: [0x80, note.pitch, 0] });
    }

    trackEvents.sort((a, b) => a.tick - b.tick);

    // Build track chunk with delta times
    const trackBytes: number[] = [];
    let lastTick = 0;

    for (const ev of trackEvents) {
      const delta = ev.tick - lastTick;
      lastTick = ev.tick;
      this.writeVarInt(trackBytes, delta);
      trackBytes.push(...ev.data);
    }

    // End of Track Meta Event (0xFF 0x2F 0x00)
    this.writeVarInt(trackBytes, 0);
    trackBytes.push(0xff, 0x2f, 0x00);

    // Construct Header + Track
    const totalSize = 14 + 8 + trackBytes.length;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // Header Chunk: MThd
    this.writeString(view, 0, 'MThd');
    view.setUint32(4, 6, false); // Header size is always 6
    view.setUint16(8, 0, false); // Format 0 (single track)
    view.setUint16(10, 1, false); // 1 track
    view.setUint16(12, ticksPerQuarter, false);

    // Track Chunk: MTrk
    this.writeString(view, 14, 'MTrk');
    view.setUint32(18, trackBytes.length, false);

    for (let i = 0; i < trackBytes.length; i++) {
      view.setUint8(22 + i, trackBytes[i]);
    }

    return buffer;
  }

  private writeVarInt(out: number[], value: number): void {
    let buffer = value & 0x7f;
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= (value & 0x7f) | 0x80;
    }
    while (true) {
      out.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}
