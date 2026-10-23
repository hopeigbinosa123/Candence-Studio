import { describe, it, expect } from 'vitest';
import { Transport } from '../src/audio/Transport';

describe('Transport', () => {
  it('initializes with default BPM and time signature', () => {
    const transport = new Transport(120, { numerator: 4, denominator: 4 });
    expect(transport.bpm).toBe(120);
    expect(transport.state).toBe('stopped');
    expect(transport.currentBeat).toBe(0);
    expect(transport.formatTime()).toBe('01:01:01');
  });

  it('accurately converts beats to seconds and back', () => {
    const transport = new Transport(120);
    // At 120 BPM, 1 beat is 0.5 seconds
    expect(transport.beatsToSeconds(1)).toBeCloseTo(0.5);
    expect(transport.beatsToSeconds(4)).toBeCloseTo(2.0);
    expect(transport.secondsToBeats(2.0)).toBeCloseTo(4.0);
    expect(transport.beatsToSamples(4, 44100)).toBe(88200);
  });

  it('handles playback progression and looping', () => {
    const transport = new Transport(120);
    transport.loopEnabled = true;
    transport.loopStart = 0;
    transport.loopEnd = 4; // 1 bar loop
    transport.play();

    expect(transport.state).toBe('playing');

    // Advance 1 second = 2 beats
    transport.advance(1.0);
    expect(transport.currentBeat).toBeCloseTo(2.0);

    // Advance another 1.5 seconds = 3 beats -> total 5 beats -> loops to 1.0
    transport.advance(1.5);
    expect(transport.currentBeat).toBeCloseTo(1.0);

    transport.stop();
    expect(transport.state).toBe('stopped');
    expect(transport.currentBeat).toBe(0);
  });

  it('formats bar:beat:sixteenth display string correctly', () => {
    const transport = new Transport(120);
    transport.currentBeat = 4.5; // Bar 2, beat 1, sixteenth 3
    expect(transport.formatTime()).toBe('02:01:03');
  });
});
