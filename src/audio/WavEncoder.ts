/**
 * Sample-accurate Binary WAV Encoder for Cadence Studio
 * Supports 16-bit PCM, 24-bit PCM, and 32-bit IEEE Float WAV.
 * Includes TPDF Dithering for pristine 16-bit rendering and peak normalization.
 */

export interface WavEncodingOptions {
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  numChannels: number;
  normalize?: boolean;
  targetPeakDb?: number; // e.g. -0.1 dB
  applyDither?: boolean;
}

export class WavEncoder {
  /**
   * Encodes stereo or mono Float32Array channel buffers into a RIFF/WAVE ArrayBuffer.
   */
  public static encode(
    channels: Float32Array[],
    options: WavEncodingOptions
  ): ArrayBuffer {
    const numChannels = Math.max(1, Math.min(options.numChannels, channels.length));
    const sampleRate = options.sampleRate;
    const bitDepth = options.bitDepth;
    const numSamples = channels[0].length;

    // Optional Peak Normalization
    let gain = 1.0;
    if (options.normalize) {
      let maxPeak = 0;
      for (let c = 0; c < numChannels; c++) {
        const data = channels[c];
        for (let i = 0; i < numSamples; i++) {
          const abs = Math.abs(data[i]);
          if (abs > maxPeak) maxPeak = abs;
        }
      }
      if (maxPeak > 0) {
        const targetLinear = Math.pow(10, (options.targetPeakDb ?? -0.1) / 20);
        gain = targetLinear / maxPeak;
      }
    }

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const bufferSize = 44 + dataSize; // 44 bytes header for standard WAV

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // 1. RIFF Chunk Descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // ChunkSize
    this.writeString(view, 8, 'WAVE');

    // 2. fmt Sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    const audioFormat = bitDepth === 32 ? 3 : 1; // 3 = IEEE Float, 1 = PCM
    view.setUint16(20, audioFormat, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // 3. data Sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // 4. Interleaved Audio Samples
    let offset = 44;
    const applyDither = options.applyDither && bitDepth === 16;

    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i] * gain;

        if (bitDepth === 16) {
          if (applyDither) {
            // Triangular Probability Density Function (TPDF) Dither
            const dither = (Math.random() - Math.random()) / 32768.0;
            sample += dither;
          }
          // Clamp to [-1.0, 1.0]
          sample = Math.max(-1.0, Math.min(1.0, sample));
          const s16 = sample < 0 ? sample * 32768 : sample * 32767;
          view.setInt16(offset, Math.round(s16), true);
          offset += 2;
        } else if (bitDepth === 24) {
          sample = Math.max(-1.0, Math.min(1.0, sample));
          const s24 = sample < 0 ? sample * 8388608 : sample * 8388607;
          const int24 = Math.round(s24);
          view.setUint8(offset, int24 & 0xff);
          view.setUint8(offset + 1, (int24 >> 8) & 0xff);
          view.setUint8(offset + 2, (int24 >> 16) & 0xff);
          offset += 3;
        } else if (bitDepth === 32) {
          view.setFloat32(offset, sample, true);
          offset += 4;
        }
      }
    }

    return buffer;
  }

  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
