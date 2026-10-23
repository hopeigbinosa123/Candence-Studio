import React from 'react';
import { X, BookOpen, Keyboard, Mic, HelpCircle, ExternalLink, Sparkles } from 'lucide-react';
import { PRODUCT_INFO } from '../../constants/branding';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#181a24] border border-[#2e3344] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-14 bg-[#1f2230] border-b border-[#2e3344] px-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="text-cyan-400" size={18} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {PRODUCT_INFO.name} Quick Guide & Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#2e3344]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-gray-300">
          {/* Welcome & Philosophy */}
          <div className="bg-[#13151c] p-4 rounded-xl border border-[#272b3a] space-y-2">
            <h3 className="font-extrabold text-sm text-cyan-300">
              Welcome to {PRODUCT_INFO.name}!
            </h3>
            <p className="leading-relaxed">
              Cadence Studio unites the lightning-fast beat sequencing, step grids, and pattern workflow
              of FL Studio with the professional recording, arrangement, mixing, and routing fidelity
              of Cubase—with zero subscriptions, completely open-source.
            </p>
          </div>

          {/* Essential Keyboard Shortcuts */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold uppercase tracking-wider">
              <Keyboard size={15} />
              <span>Studio Keyboard Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-[#13151b] p-2.5 rounded-lg border border-[#262a38] flex justify-between items-center">
                <span className="text-gray-400 font-sans">Play / Pause</span>
                <kbd className="bg-[#242838] text-cyan-300 px-2 py-0.5 rounded text-[11px] font-bold">Space</kbd>
              </div>
              <div className="bg-[#13151b] p-2.5 rounded-lg border border-[#262a38] flex justify-between items-center">
                <span className="text-gray-400 font-sans">Stop / Return</span>
                <kbd className="bg-[#242838] text-cyan-300 px-2 py-0.5 rounded text-[11px] font-bold">Esc / Home</kbd>
              </div>
              <div className="bg-[#13151b] p-2.5 rounded-lg border border-[#262a38] flex justify-between items-center">
                <span className="text-gray-400 font-sans">Toggle Record</span>
                <kbd className="bg-[#242838] text-rose-300 px-2 py-0.5 rounded text-[11px] font-bold">R</kbd>
              </div>
              <div className="bg-[#13151b] p-2.5 rounded-lg border border-[#262a38] flex justify-between items-center">
                <span className="text-gray-400 font-sans">Save Project</span>
                <kbd className="bg-[#242838] text-cyan-300 px-2 py-0.5 rounded text-[11px] font-bold">Ctrl + S</kbd>
              </div>
              <div className="bg-[#13151b] p-2.5 rounded-lg border border-[#262a38] flex justify-between items-center">
                <span className="text-gray-400 font-sans">Undo Edit</span>
                <kbd className="bg-[#242838] text-cyan-300 px-2 py-0.5 rounded text-[11px] font-bold">Ctrl + Z</kbd>
              </div>
              <div className="bg-[#13151b] p-2.5 rounded-lg border border-[#262a38] flex justify-between items-center">
                <span className="text-gray-400 font-sans">Redo Edit</span>
                <kbd className="bg-[#242838] text-cyan-300 px-2 py-0.5 rounded text-[11px] font-bold">Ctrl + Y</kbd>
              </div>
            </div>
          </div>

          {/* Workflow Guides */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-200 uppercase tracking-wider">How to Produce in Cadence:</h4>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-gray-400">
              <li>
                <strong className="text-gray-200">Beat Sequencer:</strong> Click pads on drum lanes (Kick, Snare, Hats) to build your rhythm. Adjust swing groove slider for bounce.
              </li>
              <li>
                <strong className="text-gray-200">Piano Roll:</strong> Click on grid cells to paint melodies or use "Add Chord" buttons to insert harmonic progressions.
              </li>
              <li>
                <strong className="text-gray-200">Arrangement:</strong> Drag and organize clips across timeline tracks to structure your song.
              </li>
              <li>
                <strong className="text-gray-200">Audio Recording:</strong> Click REC on any audio track, grant mic permission, and capture live takes.
              </li>
              <li>
                <strong className="text-gray-200">Mixer & Export:</strong> Balance levels with faders and master limiter, then click "Export WAV" for studio-ready audio files.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-[#1b1e2a] border-t border-[#2e3344] px-5 flex items-center justify-between text-[11px] text-gray-400">
          <span>Cadence Studio open-source edition • MIT License</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#282d3e] hover:bg-[#343a50] text-white font-semibold rounded-lg transition"
          >
            Got it, Let's Make Music
          </button>
        </div>
      </div>
    </div>
  );
};
