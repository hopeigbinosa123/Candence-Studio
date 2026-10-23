import React, { useState } from 'react';
import {
  Music,
  Save,
  FolderOpen,
  Download,
  Sparkles,
  HelpCircle,
  Volume2,
  Clock,
  Layers,
  Settings,
  Bell,
} from 'lucide-react';
import { TransportControls } from './TransportControls';
import { PRODUCT_INFO } from '../../constants/branding';
import { globalAudioEngine } from '../../audio/AudioEngine';

interface Props {
  projectTitle: string;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onSave: () => void;
  onOpen: () => void;
  onExport: () => void;
  onOpenAIModal: () => void;
  onOpenHelp: () => void;
  onRecordToggle: () => void;
  isRecording: boolean;
}

export const Header: React.FC<Props> = ({
  projectTitle,
  bpm,
  onBpmChange,
  onSave,
  onOpen,
  onExport,
  onOpenAIModal,
  onOpenHelp,
  onRecordToggle,
  isRecording,
}) => {
  const [metronome, setMetronome] = useState(false);
  const [masterVol, setMasterVol] = useState(85);

  const toggleMetronome = () => {
    const next = !metronome;
    setMetronome(next);
    globalAudioEngine.transport.metronomeEnabled = next;
  };

  const handleMasterVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setMasterVol(val);
    if (globalAudioEngine.mixer) {
      globalAudioEngine.mixer.setMasterVolume(val / 100);
    }
  };

  return (
    <header className="h-14 bg-[#14161c] border-b border-[#282c38] px-4 flex items-center justify-between select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-950/60 font-bold text-white text-base">
          C
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm tracking-wide text-gray-100">{PRODUCT_INFO.name}</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/60 px-1.5 py-0.5 rounded font-mono font-medium">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium truncate max-w-[160px]">{projectTitle}</p>
        </div>
      </div>

      {/* Central Transport & Master Clock */}
      <div className="flex items-center space-x-3">
        <TransportControls onRecordToggle={onRecordToggle} isRecording={isRecording} />

        {/* BPM & Time Signature */}
        <div className="flex items-center space-x-2 bg-[#181a20] px-3 py-1.5 rounded-lg border border-[#2b303d]">
          <div className="flex items-center space-x-1.5">
            <Clock size={14} className="text-gray-400" />
            <span className="text-[11px] uppercase font-semibold text-gray-400">BPM</span>
            <input
              type="number"
              min="40"
              max="280"
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-14 bg-[#0e0f12] text-amber-400 font-mono text-sm px-1.5 py-0.5 rounded border border-[#262936] text-center font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="h-4 w-[1px] bg-[#2e3342]" />

          {/* Metronome Toggle */}
          <button
            onClick={toggleMetronome}
            title="Metronome (Click)"
            className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
              metronome
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            CLICK
          </button>
        </div>

        {/* Master Volume */}
        <div className="flex items-center space-x-2 bg-[#181a20] px-3 py-1.5 rounded-lg border border-[#2b303d]">
          <Volume2 size={15} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="120"
            value={masterVol}
            onChange={handleMasterVol}
            className="w-20 accent-cyan-400"
            title={`Master Volume: ${masterVol}%`}
          />
          <span className="text-[11px] font-mono text-gray-400 w-7 text-right">{masterVol}%</span>
        </div>
      </div>

      {/* Action Buttons: Save, Open, Export, AI Assistant, Help */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onSave}
          title="Save Project (Ctrl+S)"
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[#252834] rounded transition flex items-center space-x-1.5 text-xs font-medium"
        >
          <Save size={15} />
          <span className="hidden lg:inline">Save</span>
        </button>

        <button
          onClick={onOpen}
          title="Open Project (Ctrl+O)"
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[#252834] rounded transition flex items-center space-x-1.5 text-xs font-medium"
        >
          <FolderOpen size={15} />
          <span className="hidden lg:inline">Open</span>
        </button>

        <button
          onClick={onExport}
          title="Export Rendered Master WAV"
          className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded shadow text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <Download size={14} />
          <span>Export WAV</span>
        </button>

        <button
          onClick={onOpenAIModal}
          title="AI Studio Assistant (Chords, Melodies, Beats, Mix)"
          className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded shadow text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline">AI Studio</span>
        </button>

        <button
          onClick={onOpenHelp}
          title="Keyboard Shortcuts & User Guide"
          className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-[#252834] rounded transition"
        >
          <HelpCircle size={17} />
        </button>
      </div>
    </header>
  );
};
