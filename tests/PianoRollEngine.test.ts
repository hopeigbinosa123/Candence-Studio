import { describe, it, expect } from 'vitest';
import { PianoRollEngine } from '../src/sequencer/PianoRollEngine';

describe('PianoRollEngine', () => {
  it('adds and snaps notes to grid', () => {
    const engine = new PianoRollEngine();
    engine.snapEnabled = true;
    engine.quantizeGrid = 0.25; // 16th notes

    const note = engine.addNote(60, 0.22, 0.95, 0.85); // 0.22 snaps to 0.25
    expect(note.pitch).toBe(60);
    expect(note.startTime).toBe(0.25);
    expect(note.duration).toBe(1.0); // 0.95 snaps to 1.0
    expect(note.velocity).toBeCloseTo(0.85);
  });

  it('inserts chords with correct musical intervals', () => {
    const engine = new PianoRollEngine();
    // Insert C Major triad (60, 64, 67)
    const notes = engine.insertChord(60, 'major', 0, 2.0);
    expect(notes.length).toBe(3);
    const pitches = notes.map((n) => n.pitch);
    expect(pitches).toEqual([60, 64, 67]);
  });

  it('detects pitches inside selected musical scale', () => {
    const engine = new PianoRollEngine();
    engine.scaleRootPitch = 60; // C
    engine.scaleIndex = 1; // Major (C, D, E, F, G, A, B)

    expect(engine.isPitchInCurrentScale(60)).toBe(true);  // C
    expect(engine.isPitchInCurrentScale(62)).toBe(true);  // D
    expect(engine.isPitchInCurrentScale(64)).toBe(true);  // E
    expect(engine.isPitchInCurrentScale(61)).toBe(false); // C# (not in C Major)
  });

  it('exports standard MIDI format 0 ArrayBuffer', () => {
    const engine = new PianoRollEngine();
    engine.addNote(60, 0, 1, 0.8);
    engine.addNote(64, 1, 1, 0.8);

    const midiBuffer = engine.exportMidiFile(120);
    expect(midiBuffer.byteLength).toBeGreaterThan(20);

    const view = new DataView(midiBuffer);
    const mthd = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    expect(mthd).toBe('MThd');

    const mtrk = String.fromCharCode(view.getUint8(14), view.getUint8(15), view.getUint8(16), view.getUint8(17));
    expect(mtrk).toBe('MTrk');
  });
});
