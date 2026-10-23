import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Scissors, Volume2, Sparkles, RefreshCw, ZoomIn, ZoomOut, ArrowLeftRight } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';

export const AudioEditorView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<Float32Array | null>(null);
  const [gainDb, setGainDb] = useState(0);
  const [isNormalized, setIsNormalized] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0.1, end: 0.9 });
  const [statusMsg, setStatusMsg] = useState('Sample loaded: 808_Sub_Punch.wav (44.1kHz / 24-bit PCM)');

  // Generate a starter synthetic waveform (punchy kick transient + sub decay)
  useEffect(() => {
    const sampleRate = 44100;
    const length = Math.floor(sampleRate * 1.5); // 1.5 seconds
    const data = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Exponential sweep from 150Hz to 40Hz
      const freq = 40 + 110 * Math.exp(-t * 12);
      const phase = 2 * Math.PI * freq * t;
      const env = Math.exp(-t * 3.5);
      data[i] = Math.sin(phase) * env * 0.8;
    }

    setAudioBuffer(data);
  }, []);

  // Draw Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background & Center Line
    ctx.fillStyle = '#14161d';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#272b3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Selection highlight
    const selStartX = selection.start * width;
    const selEndX = selection.end * width;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fillRect(selStartX, 0, selEndX - selStartX, height);
    ctx.strokeStyle = '#06b6d4';
    ctx.strokeRect(selStartX, 0, selEndX - selStartX, height);

    // Waveform Path
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();

    const step = Math.ceil(audioBuffer.length / width);
    const ampScale = (height / 2) * Math.pow(10, gainDb / 20);

    for (let x = 0; x < width; x++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = audioBuffer[x * step + j] || 0;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const yTop = height / 2 - max * ampScale;
      const yBottom = height / 2 - min * ampScale;

      ctx.fillRect(x, yTop, 1, Math.max(1, yBottom - yTop));
    }
  }, [audioBuffer, gainDb, selection]);

  const handleAudition = async () => {
    if (!audioBuffer) return;
    await globalAudioEngine.init();
    await globalAudioEngine.resume();

    if (!globalAudioEngine.ctx) return;

    const ctx = globalAudioEngine.ctx;
    const buffer = ctx.createBuffer(1, audioBuffer.length, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);

    const gainMult = Math.pow(10, gainDb / 20);
    for (let i = 0; i < audioBuffer.length; i++) {
      channelData[i] = audioBuffer[i] * gainMult;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    source.connect(gain);

    if (globalAudioEngine.mixer) {
      gain.connect(globalAudioEngine.mixer.masterInput);
    } else {
      gain.connect(ctx.destination);
    }

    setIsPlaying(true);
    source.start();
    source.onended = () => setIsPlaying(false);
  };

  const handleNormalize = () => {
    if (!audioBuffer) return;
    let maxPeak = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      const abs = Math.abs(audioBuffer[i]);
      if (abs > maxPeak) maxPeak = abs;
    }

    if (maxPeak > 0) {
      const targetGain = 0.98 / maxPeak; // -0.1 dB
      const normalized = new Float32Array(audioBuffer.length);
      for (let i = 0; i < audioBuffer.length; i++) {
        normalized[i] = audioBuffer[i] * targetGain;
      }
      setAudioBuffer(normalized);
      setIsNormalized(true);
      setStatusMsg(`Normalized to -0.1 dB peak (Gain factor: ${targetGain.toFixed(2)}x)`);
    }
  };

  const handleReverse = () => {
    if (!audioBuffer) return;
    const reversed = new Float32Array(audioBuffer.length);
    for (let i = 0; i < audioBuffer.length; i++) {
      reversed[i] = audioBuffer[audioBuffer.length - 1 - i];
    }
    setAudioBuffer(reversed);
    setIsReversed(!isReversed);
    setStatusMsg(`Audio snippet ${!isReversed ? 'reversed' : 'restored to original'}`);
  };

  const handleTrimToSelection = () => {
    if (!audioBuffer) return;
    const startIdx = Math.floor(selection.start * audioBuffer.length);
    const endIdx = Math.floor(selection.end * audioBuffer.length);
    const trimmed = audioBuffer.slice(startIdx, endIdx);

    setAudioBuffer(trimmed);
    setSelection({ start: 0, end: 1 });
    setStatusMsg(`Trimmed selection (${((endIdx - startIdx) / 44100).toFixed(2)}s duration)`);
  };

  const handleFade = (type: 'in' | 'out') => {
    if (!audioBuffer) return;
    const updated = new Float32Array(audioBuffer);
    const fadeSamples = Math.floor(audioBuffer.length * 0.2); // 20% fade

    if (type === 'in') {
      for (let i = 0; i < fadeSamples; i++) {
        updated[i] *= i / fadeSamples;
      }
      setStatusMsg('Applied exponential Fade-In');
    } else {
      for (let i = 0; i < fadeSamples; i++) {
        const idx = updated.length - fadeSamples + i;
        updated[idx] *= 1 - i / fadeSamples;
      }
      setStatusMsg('Applied exponential Fade-Out');
    }
    setAudioBuffer(updated);
  };

  return (
    <div className="flex-1 bg-[#15171f] flex flex-col overflow-hidden select-none">
      {/* Editor Toolbar */}
      <div className="h-12 bg-[#1c1f2a] border-b border-[#292f3f] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAudition}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition ${
              isPlaying
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-[#292e3e] text-gray-200 hover:bg-[#343a4e]'
            }`}
          >
            {isPlaying ? <Square size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Auditioning...' : 'Play Selection'}</span>
          </button>

          <button
            onClick={handleTrimToSelection}
            className="px-2.5 py-1.5 bg-[#252936] hover:bg-[#31374a] text-cyan-300 rounded text-xs font-semibold flex items-center space-x-1"
            title="Non-destructive Trim"
          >
            <Scissors size={13} />
            <span>Trim</span>
          </button>

          <button
            onClick={handleNormalize}
            className="px-2.5 py-1.5 bg-[#252936] hover:bg-[#31374a] text-amber-300 rounded text-xs font-semibold flex items-center space-x-1"
            title="Peak Normalize to -0.1 dB"
          >
            <Sparkles size={13} />
            <span>Normalize</span>
          </button>

          <button
            onClick={handleReverse}
            className="px-2.5 py-1.5 bg-[#252936] hover:bg-[#31374a] text-indigo-300 rounded text-xs font-semibold flex items-center space-x-1"
            title="Reverse Audio Samples"
          >
            <ArrowLeftRight size={13} />
            <span>Reverse</span>
          </button>

          <div className="h-4 w-[1px] bg-[#2e3342] mx-1" />

          <button
            onClick={() => handleFade('in')}
            className="px-2 py-1 bg-[#20232e] hover:bg-[#2b3040] text-gray-300 rounded text-xs"
          >
            Fade In
          </button>
          <button
            onClick={() => handleFade('out')}
            className="px-2 py-1 bg-[#20232e] hover:bg-[#2b3040] text-gray-300 rounded text-xs"
          >
            Fade Out
          </button>
        </div>

        {/* Gain Slider */}
        <div className="flex items-center space-x-2">
          <Volume2 size={15} className="text-gray-400" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Gain:</span>
          <input
            type="range"
            min="-18"
            max="18"
            value={gainDb}
            onChange={(e) => setGainDb(Number(e.target.value))}
            className="w-24 accent-cyan-400"
          />
          <span className="text-[11px] font-mono text-cyan-400 w-12 text-right">
            {gainDb > 0 ? `+${gainDb}` : gainDb} dB
          </span>
        </div>
      </div>

      {/* Main Interactive Waveform Display */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl h-72 bg-[#12141a] rounded-xl border border-[#272b3b] overflow-hidden shadow-2xl relative flex flex-col">
          <canvas
            ref={canvasRef}
            width={900}
            height={250}
            className="w-full flex-1 cursor-crosshair"
          />
          <div className="h-7 bg-[#171922] border-t border-[#252938] px-3 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>{statusMsg}</span>
            <span>Selection: {(selection.start * 100).toFixed(0)}% - {(selection.end * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
