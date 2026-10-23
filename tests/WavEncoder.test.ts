import { describe, it, expect } from 'vitest';
import { WavEncoder } from '../src/audio/WavEncoder';

describe('WavEncoder', () => {
  it('encodes a 16-bit stereo WAV with correct RIFF header', () => {
    const sampleRate = 44100;
    const numSamples = 1000;
    const left = new Float32Array(numSamples);
    const right = new Float32Array(numSamples);

    // Fill with 440Hz sine wave
    for (let i = 0; i < numSamples; i++) {
      left[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
      right[i] = Math.cos((2 * Math.PI * 440 * i) / sampleRate);
    }

    const buffer = WavEncoder.encode([left, right], {
      sampleRate,
      bitDepth: 16,
      numChannels: 2,
      applyDither: true,
    });

    expect(buffer.byteLength).toBe(44 + numSamples * 2 * 2);

    const view = new DataView(buffer);
    // Check RIFF
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    expect(riff).toBe('RIFF');

    // Check WAVE
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    expect(wave).toBe('WAVE');

    // Check AudioFormat (1 = PCM)
    expect(view.getUint16(20, true)).toBe(1);
    // NumChannels
    expect(view.getUint16(22, true)).toBe(2);
    // SampleRate
    expect(view.getUint32(24, true)).toBe(44100);
    // BitsPerSample
    expect(view.getUint16(34, true)).toBe(16);
    // Check 'data'
    const dataMarker = String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39));
    expect(dataMarker).toBe('data');
    expect(view.getUint32(40, true)).toBe(numSamples * 4);
  });

  it('encodes 24-bit audio properly', () => {
    const left = new Float32Array([0.5, -0.5, 0.0]);
    const buffer = WavEncoder.encode([left], {
      sampleRate: 48000,
      bitDepth: 24,
      numChannels: 1,
    });

    expect(buffer.byteLength).toBe(44 + 3 * 3);
    const view = new DataView(buffer);
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // Mono
    expect(view.getUint32(24, true)).toBe(48000);
    expect(view.getUint16(34, true)).toBe(24); // 24-bit
  });

  it('encodes 32-bit IEEE float WAV properly with format code 3', () => {
    const left = new Float32Array([0.1234, -0.5678]);
    const buffer = WavEncoder.encode([left], {
      sampleRate: 96000,
      bitDepth: 32,
      numChannels: 1,
    });

    const view = new DataView(buffer);
    expect(view.getUint16(20, true)).toBe(3); // IEEE float format code
    expect(view.getUint16(34, true)).toBe(32);
    expect(view.getFloat32(44, true)).toBeCloseTo(0.1234, 4);
  });

  it('normalizes audio to target peak dB correctly', () => {
    const left = new Float32Array([0.25, -0.25, 0.1]);
    const buffer = WavEncoder.encode([left], {
      sampleRate: 44100,
      bitDepth: 32,
      numChannels: 1,
      normalize: true,
      targetPeakDb: 0.0, // Should scale peak from 0.25 to 1.0
    });

    const view = new DataView(buffer);
    expect(view.getFloat32(44, true)).toBeCloseTo(1.0, 3);
    expect(view.getFloat32(48, true)).toBeCloseTo(-1.0, 3);
  });
});
