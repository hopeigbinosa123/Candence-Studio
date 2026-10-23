import React, { useState, useEffect } from 'react';
import { Sliders, Volume2, ShieldCheck, Sparkles, Plus } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';

interface ChannelState {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  peak: number;
}

export const MixerView: React.FC = () => {
  const [channels, setChannels] = useState<ChannelState[]>([
    { id: 'ch-drums', name: 'Drums Bus', volume: 100, pan: 0, muted: false, solo: false, peak: 45 },
    { id: 'ch-lead', name: 'Lead Synth', volume: 85, pan: -15, muted: false, solo: false, peak: 35 },
    { id: 'ch-keys', name: 'Electric Piano', volume: 90, pan: 10, muted: false, solo: false, peak: 30 },
    { id: 'ch-bass', name: 'Sub Bass', volume: 95, pan: 0, muted: false, solo: false, peak: 50 },
    { id: 'ch-audio', name: 'Audio Vocal', volume: 90, pan: 5, muted: false, solo: false, peak: 20 },
  ]);

  const [masterPeak, setMasterPeak] = useState(40);

  useEffect(() => {
    // Dynamic peak meter animation simulating audio flow
    const interval = setInterval(() => {
      const isPlaying =
        globalAudioEngine.transport.state === 'playing' ||
        globalAudioEngine.transport.state === 'recording';

      if (isPlaying) {
        setChannels((prev) =>
          prev.map((ch) => ({
            ...ch,
            peak: ch.muted ? 0 : Math.min(100, Math.max(5, Math.floor(Math.random() * 65 + 20))),
          }))
        );
        setMasterPeak(Math.min(95, Math.floor(Math.random() * 55 + 30)));
      } else {
        setChannels((prev) => prev.map((ch) => ({ ...ch, peak: 0 })));
        setMasterPeak(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleVolumeChange = (id: string, val: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, volume: val } : ch))
    );
    if (globalAudioEngine.mixer) {
      globalAudioEngine.mixer.setChannelVolume(id, val / 100);
    }
  };

  const handlePanChange = (id: string, val: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, pan: val } : ch))
    );
    if (globalAudioEngine.mixer) {
      globalAudioEngine.mixer.setChannelPan(id, val / 100);
    }
  };

  const handleMute = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const next = !ch.muted;
          globalAudioEngine.mixer?.setChannelMute(id, next);
          return { ...ch, muted: next };
        }
        return ch;
      })
    );
  };

  const handleSolo = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const next = !ch.solo;
          globalAudioEngine.mixer?.setChannelSolo(id, next);
          return { ...ch, solo: next };
        }
        return ch;
      })
    );
  };

  return (
    <div className="flex-1 bg-[#15171f] flex flex-col overflow-hidden select-none">
      {/* Mixer Header */}
      <div className="h-10 bg-[#1b1e28] border-b border-[#292e3d] px-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
          Studio Mixing Console
        </span>
        <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-semibold">
          <ShieldCheck size={14} />
          <span>True Peak Brickwall Safety Limiter Active</span>
        </div>
      </div>

      {/* Channel Strips Row */}
      <div className="flex-1 overflow-x-auto p-4 flex space-x-3 items-stretch">
        {/* Track Channels */}
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="w-32 bg-[#1b1e27] border border-[#2b3040] rounded-xl p-3 flex flex-col justify-between shadow-lg"
          >
            {/* Top Label */}
            <div>
              <div className="text-center font-bold text-xs text-gray-200 truncate mb-2">
                {ch.name}
              </div>

              {/* Inserts Slot Preview */}
              <div className="bg-[#12141a] border border-[#252936] rounded p-1 mb-3 space-y-1">
                <div className="text-[9px] text-gray-500 font-bold uppercase text-center">FX Inserts</div>
                <div className="text-[10px] text-cyan-400 bg-[#1c1f2b] px-1 py-0.5 rounded text-center truncate font-medium">
                  EQ 4-Band
                </div>
                <div className="text-[10px] text-indigo-400 bg-[#1c1f2b] px-1 py-0.5 rounded text-center truncate font-medium">
                  Compressor
                </div>
              </div>

              {/* Pan Slider */}
              <div className="mb-3 text-center">
                <span className="text-[10px] text-gray-400 font-mono block">
                  PAN: {ch.pan === 0 ? 'C' : ch.pan < 0 ? `L${Math.abs(ch.pan)}` : `R${ch.pan}`}
                </span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={ch.pan}
                  onChange={(e) => handlePanChange(ch.id, Number(e.target.value))}
                  className="w-20 accent-cyan-400"
                />
              </div>
            </div>

            {/* Fader & LED Meter Section */}
            <div className="flex justify-center items-center space-x-3 my-2">
              {/* Vertical Fader */}
              <input
                type="range"
                min="0"
                max="130"
                value={ch.volume}
                onChange={(e) => handleVolumeChange(ch.id, Number(e.target.value))}
                className="vertical-fader accent-indigo-400"
                aria-orientation="vertical"
              />

              {/* LED Peak Meter */}
              <div className="led-meter">
                <div className="led-meter-fill" style={{ height: `${ch.peak}%` }} />
              </div>
            </div>

            {/* Bottom Controls: Mute, Solo, Volume dB */}
            <div>
              <div className="text-center font-mono text-[11px] font-bold text-gray-300 mb-2">
                {ch.volume}%
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleMute(ch.id)}
                  className={`py-1 rounded text-xs font-bold transition ${
                    ch.muted ? 'bg-amber-500 text-black' : 'bg-[#272b38] text-gray-300 hover:text-white'
                  }`}
                >
                  MUTE
                </button>
                <button
                  onClick={() => handleSolo(ch.id)}
                  className={`py-1 rounded text-xs font-bold transition ${
                    ch.solo ? 'bg-emerald-500 text-black' : 'bg-[#272b38] text-gray-300 hover:text-white'
                  }`}
                >
                  SOLO
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Master Output Channel Strip */}
        <div className="w-36 bg-[#1f222e] border-2 border-indigo-500/50 rounded-xl p-3 flex flex-col justify-between shadow-2xl ml-4">
          <div>
            <div className="text-center font-extrabold text-xs text-indigo-300 uppercase tracking-wider mb-2">
              Master Out
            </div>
            <div className="bg-[#12141a] border border-[#2b3142] rounded p-1 mb-3 text-center">
              <span className="text-[10px] text-emerald-400 font-bold block">Brickwall Limiter</span>
              <span className="text-[9px] text-gray-400 font-mono">Ceiling: -0.1 dB</span>
            </div>
          </div>

          <div className="flex justify-center items-center space-x-3 my-2">
            <input
              type="range"
              min="0"
              max="120"
              defaultValue="85"
              onChange={(e) => globalAudioEngine.mixer?.setMasterVolume(Number(e.target.value) / 100)}
              className="vertical-fader accent-cyan-400"
              aria-orientation="vertical"
            />
            {/* Dual Stereo LED Meter */}
            <div className="flex space-x-0.5">
              <div className="led-meter w-2">
                <div className="led-meter-fill" style={{ height: `${masterPeak}%` }} />
              </div>
              <div className="led-meter w-2">
                <div className="led-meter-fill" style={{ height: `${Math.max(0, masterPeak - 3)}%` }} />
              </div>
            </div>
          </div>

          <div className="text-center font-mono text-[11px] font-bold text-cyan-300">
            MASTER 0dB
          </div>
        </div>
      </div>
    </div>
  );
};
