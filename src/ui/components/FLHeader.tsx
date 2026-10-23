import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Circle,
  Repeat,
  Volume2,
  Clock,
  Sparkles,
  Download,
  LayoutGrid,
  Grid,
  Piano,
  Sliders,
  AudioWaveform,
  Cpu,
  Activity,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';
import { TransportState } from '../../types/audio';
import { RotaryKnob } from './RotaryKnob';

interface FLHeaderProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  openWindows: Record<string, boolean>;
  onToggleWindow: (windowId: string) => void;
  onExport: () => void;
  onOpenHelp: () => void;
}

export const FLHeader: React.FC<FLHeaderProps> = ({
  bpm,
  onBpmChange,
  openWindows,
  onToggleWindow,
  onExport,
  onOpenHelp,
}) => {
  const [transportState, setTransportState] = useState<TransportState>('stopped');
  const [playMode, setPlayMode] = useState<'PAT' | 'SONG'>('PAT');
  const [timeDisplay, setTimeDisplay] = useState('01:01:00');
  const [masterVol, setMasterVol] = useState(85);
  const [masterPitch, setMasterPitch] = useState(0);
  const [metronome, setMetronome] = useState(false);
  const oscCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = globalAudioEngine.transport.subscribe((state, beat) => {
      setTransportState(state);
      setTimeDisplay(globalAudioEngine.transport.formatTime(beat));
    });
    return unsub;
  }, []);

  // Top Oscilloscope Display Animation
  useEffect(() => {
    let animId: number;
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderOsc = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0a0d11';
      ctx.fillRect(0, 0, w, h);

      // Grid line
      ctx.strokeStyle = '#141e28';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const isPlaying =
        globalAudioEngine.transport.state === 'playing' ||
        globalAudioEngine.transport.state === 'recording';

      ctx.strokeStyle = isPlaying ? '#38bdf8' : '#22556d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const time = performance.now() / 150;
      for (let x = 0; x < w; x++) {
        let y = h / 2;
        if (isPlaying) {
          // Dynamic synthesized oscilloscope wave
          y += Math.sin(x * 0.12 + time) * 8 + Math.cos(x * 0.05 - time * 0.8) * 5;
        } else {
          y += (Math.random() - 0.5) * 1.5;
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(renderOsc);
    };

    renderOsc();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePlay = async () => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (transportState === 'playing') {
      globalAudioEngine.transport.pause();
    } else {
      globalAudioEngine.transport.play();
    }
  };

  const handleStop = () => {
    globalAudioEngine.transport.stop();
  };

  const handleRecord = async () => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (transportState === 'recording') {
      globalAudioEngine.transport.stop();
    } else {
      globalAudioEngine.transport.record();
    }
  };

  const toggleMetronome = () => {
    const next = !metronome;
    setMetronome(next);
    globalAudioEngine.transport.metronomeEnabled = next;
  };

  return (
    <div className="bg-[#242834] border-b-2 border-[#15171e] text-gray-200 select-none flex flex-col shadow-md">
      {/* 1. Classic FL Studio Menu Bar */}
      <div className="h-6 bg-[#1a1c24] border-b border-[#2d3342] px-3 flex items-center justify-between text-[11px] font-semibold text-gray-400">
        <div className="flex items-center space-x-4">
          <span className="font-extrabold text-orange-400 tracking-wider">CADENCE STUDIO</span>
          <span className="hover:text-white cursor-pointer">FILE</span>
          <span className="hover:text-white cursor-pointer">EDIT</span>
          <span className="hover:text-white cursor-pointer">ADD</span>
          <span className="hover:text-white cursor-pointer">PATTERNS</span>
          <span className="hover:text-white cursor-pointer">VIEW</span>
          <span className="hover:text-white cursor-pointer">OPTIONS</span>
          <span className="hover:text-white cursor-pointer">TOOLS</span>
          <span onClick={onOpenHelp} className="hover:text-white cursor-pointer text-cyan-400">HELP</span>
        </div>

        <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-mono">
          <span>FL-HYBRID ENGINE 1.0</span>
          <span>44.1kHz 32-BIT</span>
        </div>
      </div>

      {/* 2. Main Transport & Window Control Rack */}
      <div className="h-14 bg-gradient-to-b from-[#2a2f3d] to-[#1f222d] px-3 flex items-center justify-between">
        {/* Left: PAT/SONG Switch & Play/Stop/Rec */}
        <div className="flex items-center space-x-3">
          {/* PAT / SONG Mode Switch */}
          <div className="bg-[#14161e] p-1 rounded border border-[#353b4c] flex flex-col space-y-1">
            <button
              onClick={() => setPlayMode('PAT')}
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition ${
                playMode === 'PAT'
                  ? 'bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              PAT
            </button>
            <button
              onClick={() => setPlayMode('SONG')}
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition ${
                playMode === 'SONG'
                  ? 'bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              SONG
            </button>
          </div>

          {/* Transport Buttons (3D Beveled Hardware Look) */}
          <div className="flex items-center space-x-1.5 bg-[#171922] p-1.5 rounded-lg border border-[#363d4e] shadow-inner">
            <button
              onClick={handlePlay}
              className={`w-9 h-9 rounded flex items-center justify-center transition border ${
                transportState === 'playing'
                  ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)]'
                  : 'bg-gradient-to-b from-[#343b4c] to-[#202430] border-[#485268] text-gray-200 hover:brightness-110'
              }`}
              title="Start / Pause Playback (Space)"
            >
              <Play size={18} fill={transportState === 'playing' ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={handleStop}
              className="w-9 h-9 rounded flex items-center justify-center bg-gradient-to-b from-[#343b4c] to-[#202430] border border-[#485268] text-gray-300 hover:text-orange-400 hover:brightness-110 transition"
              title="Stop Playback (Esc / Home)"
            >
              <Square size={16} fill="currentColor" />
            </button>

            <button
              onClick={handleRecord}
              className={`w-9 h-9 rounded flex items-center justify-center transition border ${
                transportState === 'recording'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(225,29,72,0.9)] animate-pulse'
                  : 'bg-gradient-to-b from-[#343b4c] to-[#202430] border-[#485268] text-gray-300 hover:text-rose-400 hover:brightness-110'
              }`}
              title="Arm Recording (R)"
            >
              <Circle size={16} fill={transportState === 'recording' ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Song Time LCD Display */}
          <div className="bg-[#0b0e14] border-2 border-[#333a4c] rounded-md px-3 py-1 shadow-inner flex flex-col justify-center items-center min-w-[90px]">
            <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
              SONG TIME
            </span>
            <span className="font-mono text-base font-extrabold text-emerald-400 tracking-wider drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]">
              {timeDisplay}
            </span>
          </div>

          {/* BPM Tempo LCD Display with Arrows */}
          <div className="bg-[#0b0e14] border-2 border-[#333a4c] rounded-md px-3 py-1 shadow-inner flex items-center space-x-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                TEMPO
              </span>
              <span className="font-mono text-base font-extrabold text-orange-400 tracking-wider drop-shadow-[0_0_6px_rgba(251,146,60,0.7)]">
                {bpm.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => onBpmChange(bpm + 1)}
                className="text-[9px] text-gray-400 hover:text-orange-300 font-bold px-1 bg-[#1c202a] rounded"
              >
                ▲
              </button>
              <button
                onClick={() => onBpmChange(bpm - 1)}
                className="text-[9px] text-gray-400 hover:text-orange-300 font-bold px-1 bg-[#1c202a] rounded"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Oscilloscope Mini-Monitor */}
          <div className="border-2 border-[#333a4c] rounded-md overflow-hidden shadow-inner hidden md:block">
            <canvas ref={oscCanvasRef} width={90} height={38} className="block" />
          </div>

          {/* Metronome & Loop Toggles */}
          <button
            onClick={toggleMetronome}
            className={`px-2 py-1.5 rounded text-xs font-bold border transition ${
              metronome
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : 'bg-[#181a24] text-gray-400 border-[#353c4e] hover:text-gray-200'
            }`}
            title="Metronome Click"
          >
            CLICK
          </button>
        </div>

        {/* Center: Tactile Master Volume & Pitch Knobs */}
        <div className="hidden lg:flex items-center space-x-4 bg-[#181a24] px-3 py-1 rounded-lg border border-[#353c4e]">
          <RotaryKnob
            label="Master"
            value={masterVol}
            min={0}
            max={120}
            defaultValue={85}
            size={32}
            color="#f97316"
            unit="%"
            onChange={(v) => {
              setMasterVol(v);
              globalAudioEngine.mixer?.setMasterVolume(v / 100);
            }}
          />

          <RotaryKnob
            label="Pitch"
            value={masterPitch}
            min={-12}
            max={12}
            defaultValue={0}
            size={32}
            color="#38bdf8"
            unit="st"
            onChange={(v) => setMasterPitch(v)}
          />
        </div>

        {/* Right: Iconic FL Studio Window Toggles */}
        <div className="flex items-center space-x-1.5">
          {/* Playlist / Arrangement */}
          <button
            onClick={() => onToggleWindow('playlist')}
            className={`p-2 rounded border transition ${
              openWindows.playlist
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]'
                : 'bg-[#1b1e28] text-gray-300 border-[#373f54] hover:bg-[#282d3e]'
            }`}
            title="Toggle Playlist / Arrangement (F5)"
          >
            <LayoutGrid size={16} />
          </button>

          {/* Piano Roll */}
          <button
            onClick={() => onToggleWindow('pianoroll')}
            className={`p-2 rounded border transition ${
              openWindows.pianoroll
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                : 'bg-[#1b1e28] text-gray-300 border-[#373f54] hover:bg-[#282d3e]'
            }`}
            title="Toggle Piano Roll (F7)"
          >
            <Piano size={16} />
          </button>

          {/* Channel Rack / Step Sequencer */}
          <button
            onClick={() => onToggleWindow('channelrack')}
            className={`p-2 rounded border transition ${
              openWindows.channelrack
                ? 'bg-orange-600 text-white border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                : 'bg-[#1b1e28] text-gray-300 border-[#373f54] hover:bg-[#282d3e]'
            }`}
            title="Toggle Channel Rack / Sequencer (F6)"
          >
            <Grid size={16} />
          </button>

          {/* Mixer */}
          <button
            onClick={() => onToggleWindow('mixer')}
            className={`p-2 rounded border transition ${
              openWindows.mixer
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                : 'bg-[#1b1e28] text-gray-300 border-[#373f54] hover:bg-[#282d3e]'
            }`}
            title="Toggle Mixer Console (F9)"
          >
            <Sliders size={16} />
          </button>

          {/* Parametric EQ 2 */}
          <button
            onClick={() => onToggleWindow('eq')}
            className={`p-2 rounded border transition ${
              openWindows.eq
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]'
                : 'bg-[#1b1e28] text-gray-300 border-[#373f54] hover:bg-[#282d3e]'
            }`}
            title="Toggle Fruity Parametric EQ 2"
          >
            <Activity size={16} />
          </button>

          {/* Synth Panel */}
          <button
            onClick={() => onToggleWindow('synth')}
            className={`p-2 rounded border transition ${
              openWindows.synth
                ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                : 'bg-[#1b1e28] text-gray-300 border-[#373f54] hover:bg-[#282d3e]'
            }`}
            title="Toggle Subtractive Synthesizer"
          >
            <Cpu size={16} />
          </button>

          {/* AI Music Assistant */}
          <button
            onClick={() => onToggleWindow('ai')}
            className={`px-2.5 py-1.5 rounded border flex items-center space-x-1.5 font-bold text-xs transition ${
              openWindows.ai
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]'
                : 'bg-[#202434] text-purple-300 border-purple-600/40 hover:bg-[#2a3044]'
            }`}
            title="AI Music & Mix Producer"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">AI Studio</span>
          </button>

          {/* Export WAV */}
          <button
            onClick={onExport}
            className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded border border-cyan-400 shadow-md flex items-center space-x-1 transition"
            title="Export Master WAV"
          >
            <Download size={14} />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};
