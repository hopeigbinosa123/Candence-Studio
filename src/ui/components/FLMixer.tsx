import React, { useState, useEffect } from 'react';
import { Sliders, ShieldCheck, Power, Activity } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';
import { RotaryKnob } from './RotaryKnob';

interface MixerTrack {
  id: string;
  name: string;
  isMaster: boolean;
  vol: number; // 0 to 125 (100 = 0dB)
  pan: number; // -100 to 100
  muted: boolean;
  solo: boolean;
  peak: number; // 0 to 100
}

interface FXSlot {
  id: string;
  name: string;
  enabled: boolean;
  mix: number; // 0 to 100
}

export const FLMixer: React.FC = () => {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  const [tracks, setTracks] = useState<MixerTrack[]>([
    { id: 'master', name: 'Master', isMaster: true, vol: 100, pan: 0, muted: false, solo: false, peak: 45 },
    { id: 'insert-1', name: 'Insert 1 (Kick)', isMaster: false, vol: 95, pan: 0, muted: false, solo: false, peak: 35 },
    { id: 'insert-2', name: 'Insert 2 (Snare)', isMaster: false, vol: 90, pan: -5, muted: false, solo: false, peak: 30 },
    { id: 'insert-3', name: 'Insert 3 (Clap)', isMaster: false, vol: 85, pan: 5, muted: false, solo: false, peak: 28 },
    { id: 'insert-4', name: 'Insert 4 (Hats)', isMaster: false, vol: 75, pan: -15, muted: false, solo: false, peak: 20 },
    { id: 'insert-5', name: 'Insert 5 (Toms)', isMaster: false, vol: 80, pan: -10, muted: false, solo: false, peak: 15 },
    { id: 'insert-6', name: 'Insert 6 (Perc)', isMaster: false, vol: 80, pan: 15, muted: false, solo: false, peak: 18 },
    { id: 'insert-7', name: 'Insert 7 (Lead)', isMaster: false, vol: 85, pan: 0, muted: false, solo: false, peak: 40 },
    { id: 'insert-8', name: 'Insert 8 (Bass)', isMaster: false, vol: 90, pan: 0, muted: false, solo: false, peak: 50 },
    { id: 'insert-9', name: 'Insert 9 (Audio)', isMaster: false, vol: 85, pan: 0, muted: false, solo: false, peak: 10 },
  ]);

  const [fxSlots, setFxSlots] = useState<FXSlot[]>([
    { id: 'slot-1', name: 'Fruity Parametric EQ 2', enabled: true, mix: 100 },
    { id: 'slot-2', name: 'Fruity Limiter', enabled: true, mix: 100 },
    { id: 'slot-3', name: 'Fruity Delay 3', enabled: true, mix: 35 },
    { id: 'slot-4', name: 'Fruity Reverb 2', enabled: true, mix: 25 },
    { id: 'slot-5', name: 'Soundgoodizer', enabled: false, mix: 50 },
    { id: 'slot-6', name: '(none)', enabled: false, mix: 100 },
    { id: 'slot-7', name: '(none)', enabled: false, mix: 100 },
    { id: 'slot-8', name: '(none)', enabled: false, mix: 100 },
    { id: 'slot-9', name: '(none)', enabled: false, mix: 100 },
    { id: 'slot-10', name: '(none)', enabled: false, mix: 100 },
  ]);

  // Peak Meters Animation
  useEffect(() => {
    const interval = setInterval(() => {
      const isPlaying =
        globalAudioEngine.transport.state === 'playing' ||
        globalAudioEngine.transport.state === 'recording';

      if (isPlaying) {
        setTracks((prev) =>
          prev.map((t) => ({
            ...t,
            peak: t.muted ? 0 : Math.min(95, Math.floor(Math.random() * 55 + 20)),
          }))
        );
      } else {
        setTracks((prev) => prev.map((t) => ({ ...t, peak: 0 })));
      }
    }, 90);

    return () => clearInterval(interval);
  }, []);

  const handleVolChange = (idx: number, val: number) => {
    setTracks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], vol: val };
      return copy;
    });

    const track = tracks[idx];
    if (track.isMaster) {
      globalAudioEngine.mixer?.setMasterVolume(val / 100);
    } else {
      globalAudioEngine.mixer?.setChannelVolume(track.id, val / 100);
    }
  };

  const handlePanChange = (idx: number, val: number) => {
    setTracks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], pan: val };
      return copy;
    });

    const track = tracks[idx];
    if (!track.isMaster) {
      globalAudioEngine.mixer?.setChannelPan(track.id, val / 100);
    }
  };

  const handleMute = (idx: number) => {
    setTracks((prev) => {
      const copy = [...prev];
      const next = !copy[idx].muted;
      copy[idx] = { ...copy[idx], muted: next };
      globalAudioEngine.mixer?.setChannelMute(copy[idx].id, next);
      return copy;
    });
  };

  const toggleSlot = (slotIdx: number) => {
    setFxSlots((prev) => {
      const copy = [...prev];
      copy[slotIdx] = { ...copy[slotIdx], enabled: !copy[slotIdx].enabled };
      return copy;
    });
  };

  return (
    <div className="flex-1 bg-[#181a24] flex overflow-hidden text-gray-200 select-none">
      {/* 1. Main Mixer Channel Strips (Left & Center) */}
      <div className="flex-1 overflow-x-auto p-2 flex space-x-1.5 items-stretch bg-[#151720]">
        {tracks.map((t, idx) => {
          const isSelected = selectedTrackIndex === idx;

          return (
            <div
              key={t.id}
              onClick={() => setSelectedTrackIndex(idx)}
              className={`w-20 rounded-md border flex flex-col justify-between py-2 px-1 transition ${
                isSelected
                  ? 'bg-[#252b3a] border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : t.isMaster
                  ? 'bg-[#1b1f2b] border-[#363e52]'
                  : 'bg-[#181a24] border-[#292f3f] hover:border-[#384156]'
              }`}
            >
              {/* Top: Panning Knob */}
              <div className="flex flex-col items-center">
                <RotaryKnob
                  value={t.pan}
                  min={-100}
                  max={100}
                  defaultValue={0}
                  size={24}
                  color="#38bdf8"
                  onChange={(v) => handlePanChange(idx, v)}
                />
                <span className="text-[9px] font-mono text-gray-400 mt-0.5">
                  {t.pan === 0 ? 'C' : t.pan < 0 ? `L${Math.abs(t.pan)}` : `R${t.pan}`}
                </span>
              </div>

              {/* Fader & Segmented LED Peak Meter */}
              <div className="flex justify-center items-center space-x-2 my-2 flex-1">
                {/* Vertical Fader Track */}
                <div className="relative h-44 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="125"
                    value={t.vol}
                    onChange={(e) => handleVolChange(idx, Number(e.target.value))}
                    className="vertical-fader"
                    aria-orientation="vertical"
                  />
                </div>

                {/* Multi-Segment LED Meter */}
                <div className="w-2.5 h-44 bg-[#0d0f14] border border-[#2a3040] rounded-sm relative overflow-hidden flex flex-col justify-end p-0.5">
                  {/* Clip LED on top */}
                  <div
                    className={`w-full h-2 mb-0.5 rounded-xs transition ${
                      t.peak > 88 ? 'bg-red-500 shadow-[0_0_4px_red]' : 'bg-red-950/40'
                    }`}
                  />
                  {/* Active Meter Fill */}
                  <div
                    style={{ height: `${t.peak}%` }}
                    className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                  />
                </div>
              </div>

              {/* Bottom: Mute Button & Track Name */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-gray-300">
                  {t.vol}%
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMute(idx);
                  }}
                  className={`w-5 h-5 rounded-full border transition flex items-center justify-center ${
                    t.muted
                      ? 'bg-transparent border-gray-600'
                      : 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                  }`}
                  title={t.muted ? 'Unmute Track' : 'Mute Track'}
                >
                  <span className="text-[8px] font-black text-black">M</span>
                </button>

                <div
                  className={`w-full text-center text-[10px] font-bold py-1 px-0.5 rounded truncate ${
                    t.isMaster
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-[#12141c] text-gray-300 border border-[#272d3c]'
                  }`}
                >
                  {t.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Iconic FL Studio FX Insert Slots Rack (Right Side) */}
      <div className="w-64 bg-[#1e222e] border-l-2 border-[#2f3648] p-3 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-[#343b4e] mb-3">
            <span className="text-xs font-extrabold uppercase text-orange-400">
              {tracks[selectedTrackIndex]?.name} FX
            </span>
            <span className="text-[10px] text-gray-400 font-mono">10 SLOTS</span>
          </div>

          {/* 10 Effect Insert Slots */}
          <div className="space-y-1.5">
            {fxSlots.map((slot, sIdx) => (
              <div
                key={slot.id}
                className="bg-[#14161f] border border-[#292f3f] rounded px-2 py-1.5 flex items-center justify-between hover:border-[#3d455c] transition"
              >
                {/* Power Green LED */}
                <button
                  onClick={() => toggleSlot(sIdx)}
                  className={`w-2.5 h-2.5 rounded-full mr-2 border transition ${
                    slot.enabled
                      ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_5px_rgba(52,211,153,0.9)]'
                      : 'bg-transparent border-gray-600'
                  }`}
                  title={slot.enabled ? 'Bypass Effect' : 'Enable Effect'}
                />

                {/* Slot Name */}
                <span className={`text-[11px] font-semibold truncate flex-1 ${
                  slot.name.includes('(none)') ? 'text-gray-600 italic' : 'text-cyan-300'
                }`}>
                  {slot.name}
                </span>

                {/* Wet/Dry Mix Knob */}
                {!slot.name.includes('(none)') && (
                  <RotaryKnob
                    value={slot.mix}
                    min={0}
                    max={100}
                    defaultValue={100}
                    size={18}
                    color="#a855f7"
                    onChange={(v) => {
                      setFxSlots((prev) => {
                        const copy = [...prev];
                        copy[sIdx] = { ...copy[sIdx], mix: v };
                        return copy;
                      });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Master Safety Limiter Notice */}
        <div className="bg-[#14161f] p-2 rounded border border-emerald-700/50 flex items-center space-x-2 text-emerald-400 text-[10px] font-bold">
          <ShieldCheck size={14} />
          <span>True Peak Brickwall Limiter Active</span>
        </div>
      </div>
    </div>
  );
};
