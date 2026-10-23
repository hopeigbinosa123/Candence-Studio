import React, { useState, useEffect, useRef } from 'react';
import { Activity, Sparkles, Volume2 } from 'lucide-react';
import { RotaryKnob } from './RotaryKnob';

interface EQBand {
  id: number;
  freq: number; // Hz
  gain: number; // -18 to +18 dB
  q: number; // 0.1 to 10
  color: string;
}

export const FLEqualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [bands, setBands] = useState<EQBand[]>([
    { id: 1, freq: 40, gain: 0, q: 1.0, color: '#ef4444' },    // Sub
    { id: 2, freq: 120, gain: -2, q: 1.2, color: '#f97316' },  // Bass
    { id: 3, freq: 350, gain: -3, q: 1.5, color: '#eab308' },  // Low Mid (Mud cut)
    { id: 4, freq: 1000, gain: 0, q: 1.0, color: '#22c55e' },  // Mid
    { id: 5, freq: 3200, gain: 2.5, q: 1.2, color: '#06b6d4' },// High Mid (Presence)
    { id: 6, freq: 8000, gain: 1.5, q: 1.0, color: '#3b82f6' },// Treble
    { id: 7, freq: 16000, gain: 3.0, q: 0.8, color: '#a855f7' },// Air
  ]);

  const [activeBandId, setActiveBandId] = useState(5);

  // Draw Realistic Fruity Parametric EQ 2 Spectrum & Response Curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Heat-map Spectrum Background
      const bgGrad = ctx.createLinearGradient(0, h, 0, 0);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(0.5, '#121422');
      bgGrad.addColorStop(1, '#20162b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = '#222838';
      ctx.lineWidth = 1;

      // dB horizontal lines
      [-12, -6, 0, 6, 12].forEach((db) => {
        const y = h / 2 - (db / 18) * (h / 2);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = '#4a5568';
        ctx.font = '9px monospace';
        ctx.fillText(`${db > 0 ? '+' : ''}${db}dB`, 5, y - 2);
      });

      // Frequency vertical lines (logarithmic: 100Hz, 1kHz, 10kHz)
      [100, 1000, 10000].forEach((freq) => {
        const x = (Math.log10(freq / 20) / Math.log10(20000 / 20)) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        ctx.fillStyle = '#4a5568';
        ctx.font = '9px monospace';
        ctx.fillText(`${freq >= 1000 ? `${freq / 1000}k` : freq}Hz`, x + 3, h - 5);
      });

      // 2. Animated Real-Time Spectrum Waterfall / Bars
      const time = performance.now() / 200;
      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let x = 0; x < w; x += 4) {
        const normX = x / w;
        // Spectrum energy distribution
        const energy =
          Math.sin(normX * 8 + time) * 15 +
          Math.cos(normX * 14 - time * 0.7) * 10 +
          Math.sin(normX * 22 + time * 1.5) * 6;
        const barHeight = Math.max(10, (h / 2) * (1 - normX * 0.5) + energy);
        ctx.lineTo(x, h - barHeight);
      }
      ctx.lineTo(w, h);
      ctx.fill();

      // 3. Composite EQ Curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      for (let x = 0; x <= w; x++) {
        const freqAtX = 20 * Math.pow(20000 / 20, x / w);
        let totalGainDb = 0;

        bands.forEach((b) => {
          const octDiff = Math.log2(freqAtX / b.freq);
          const bell = Math.exp(-0.5 * Math.pow(octDiff * b.q * 1.5, 2));
          totalGainDb += b.gain * bell;
        });

        const y = h / 2 - (totalGainDb / 18) * (h / 2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // 4. Band Control Dots
      bands.forEach((b) => {
        const x = (Math.log10(b.freq / 20) / Math.log10(20000 / 20)) * w;
        const y = h / 2 - (b.gain / 18) * (h / 2);
        const isSelected = activeBandId === b.id;

        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ffffff' : '#111827';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.id), x, y);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [bands, activeBandId]);

  const updateActiveBand = (key: keyof EQBand, val: number) => {
    setBands((prev) =>
      prev.map((b) => (b.id === activeBandId ? { ...b, [key]: val } : b))
    );
  };

  const current = bands.find((b) => b.id === activeBandId) || bands[0];

  return (
    <div className="flex-1 bg-[#161822] flex flex-col overflow-hidden text-gray-200 select-none">
      {/* Top Banner */}
      <div className="h-8 bg-[#1f2330] border-b border-[#303748] px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity size={14} className="text-purple-400" />
          <span className="text-xs font-extrabold uppercase text-purple-300">
            Fruity Parametric EQ 2
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">7-BAND PRECISION DSP</span>
      </div>

      {/* Main Spectrum Visualizer Screen */}
      <div className="flex-1 p-3 flex flex-col">
        <div className="flex-1 rounded-lg border-2 border-[#2f364a] overflow-hidden shadow-2xl relative bg-[#0a0d14]">
          <canvas
            ref={canvasRef}
            width={600}
            height={260}
            className="w-full h-full block cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const normX = clickX / rect.width;
              const freq = 20 * Math.pow(20000 / 20, normX);
              // Pick closest band
              let closest = bands[0];
              let minDist = Infinity;
              bands.forEach((b) => {
                const dist = Math.abs(Math.log10(b.freq) - Math.log10(freq));
                if (dist < minDist) {
                  minDist = dist;
                  closest = b;
                }
              });
              setActiveBandId(closest.id);
            }}
          />
        </div>

        {/* Bottom 7-Band Controls Strip */}
        <div className="h-24 bg-[#1b1f2b] border border-[#2e3546] rounded-lg mt-2 p-2 flex items-center justify-between shadow-lg">
          {/* Band Selector Buttons */}
          <div className="flex space-x-1">
            {bands.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBandId(b.id)}
                style={{
                  borderColor: activeBandId === b.id ? b.color : 'transparent',
                }}
                className={`w-7 h-16 rounded border-2 flex flex-col items-center justify-between py-1 transition ${
                  activeBandId === b.id
                    ? 'bg-[#292f40] shadow-[0_0_8px_currentColor]'
                    : 'bg-[#151720] hover:bg-[#202432]'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-[10px] font-black">{b.id}</span>
                <span className="text-[8px] font-mono text-gray-400">
                  {b.gain > 0 ? `+${b.gain}` : b.gain}
                </span>
              </button>
            ))}
          </div>

          {/* Active Band Fine-Tuning Rotary Knobs */}
          <div className="flex items-center space-x-4 bg-[#14161f] p-2 rounded-lg border border-[#2b3142]">
            <RotaryKnob
              label="Freq"
              value={current.freq}
              min={20}
              max={20000}
              defaultValue={1000}
              size={30}
              color={current.color}
              unit="Hz"
              onChange={(v) => updateActiveBand('freq', v)}
            />

            <RotaryKnob
              label="Gain"
              value={current.gain}
              min={-18}
              max={18}
              defaultValue={0}
              size={30}
              color={current.color}
              unit="dB"
              onChange={(v) => updateActiveBand('gain', v)}
            />

            <RotaryKnob
              label="Q Band"
              value={current.q}
              min={0.1}
              max={5.0}
              step={0.1}
              defaultValue={1.0}
              size={30}
              color={current.color}
              onChange={(v) => updateActiveBand('q', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
