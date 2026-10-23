import React, { useState } from 'react';
import { X, Download, CheckCircle, Loader2, Disc } from 'lucide-react';
import { Project } from '../../types/project';
import { OfflineRenderer } from '../../audio/OfflineRenderer';

interface Props {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<Props> = ({ project, isOpen, onClose }) => {
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [bitDepth, setBitDepth] = useState<16 | 24 | 32>(24);
  const [channels, setChannels] = useState<1 | 2>(2);
  const [normalize, setNormalize] = useState(true);
  const [dither, setDither] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finishedBlobUrl, setFinishedBlobUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsRendering(true);
    setProgress(0.1);

    try {
      const buffer = await OfflineRenderer.renderProject(
        project,
        {
          sampleRate,
          bitDepth,
          numChannels: channels,
          normalize,
          dither,
          startBeat: 0,
          endBeat: 32,
        },
        (p) => setProgress(p)
      );

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setFinishedBlobUrl(url);

      // Trigger automatic file download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.metadata.title.replace(/\s+/g, '_')}_Master.wav`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a24] border border-[#2b3040] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 bg-[#1e212e] border-b border-[#2b3040] px-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Disc className="text-cyan-400" size={18} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Export Rendered Master WAV
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#2b3040]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Sample Rate & Bit Depth */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 block mb-1.5 font-semibold">Sample Rate</label>
              <select
                value={sampleRate}
                onChange={(e) => setSampleRate(Number(e.target.value))}
                className="w-full bg-[#12141a] text-cyan-300 font-mono font-bold p-2 rounded-lg border border-[#2b3040]"
              >
                <option value={44100}>44.1 kHz (CD Standard)</option>
                <option value={48000}>48.0 kHz (Studio Standard)</option>
                <option value={96000}>96.0 kHz (Hi-Res Audio)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 block mb-1.5 font-semibold">Bit Depth</label>
              <select
                value={bitDepth}
                onChange={(e) => setBitDepth(Number(e.target.value) as any)}
                className="w-full bg-[#12141a] text-cyan-300 font-mono font-bold p-2 rounded-lg border border-[#2b3040]"
              >
                <option value={16}>16-bit PCM (CD / Streaming)</option>
                <option value={24}>24-bit PCM (Studio Mixdown)</option>
                <option value={32}>32-bit Float (Mastering / Lossless)</option>
              </select>
            </div>
          </div>

          {/* Channels & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 block mb-1.5 font-semibold">Channels</label>
              <select
                value={channels}
                onChange={(e) => setChannels(Number(e.target.value) as any)}
                className="w-full bg-[#12141a] text-gray-200 p-2 rounded-lg border border-[#2b3040]"
              >
                <option value={2}>Stereo (2 Channels)</option>
                <option value={1}>Mono (Summed)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 block mb-1.5 font-semibold">Export Range</label>
              <select className="w-full bg-[#12141a] text-gray-200 p-2 rounded-lg border border-[#2b3040]">
                <option>Entire Project Timeline (Bars 1-8)</option>
                <option>Active Loop Region Only</option>
              </select>
            </div>
          </div>

          {/* Checkboxes: Normalization & Dither */}
          <div className="space-y-2 bg-[#12141a] p-3 rounded-lg border border-[#262b3a]">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={normalize}
                onChange={(e) => setNormalize(e.target.checked)}
                className="accent-cyan-400 w-4 h-4 rounded"
              />
              <span className="text-gray-200 font-medium">
                Peak Normalization (Target: -0.1 dB True Peak)
              </span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dither}
                onChange={(e) => setDither(e.target.checked)}
                className="accent-cyan-400 w-4 h-4 rounded"
              />
              <span className="text-gray-200 font-medium">
                TPDF Dithering (Triangular noise shaping for 16-bit conversion)
              </span>
            </label>
          </div>

          {/* Rendering Progress */}
          {isRendering && (
            <div className="space-y-2">
              <div className="flex justify-between text-gray-400 font-semibold">
                <span>Rendering offline DSP audio graph...</span>
                <span>{(progress * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-[#12141a] rounded-full overflow-hidden border border-[#2b3040]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-150"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {finishedBlobUrl && !isRendering && (
            <div className="bg-emerald-950/40 border border-emerald-700/50 p-3 rounded-lg flex items-center space-x-2.5 text-emerald-300 font-semibold">
              <CheckCircle size={17} />
              <span>Export complete! WAV file downloaded successfully.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 bg-[#1a1c26] border-t border-[#2b3040] px-5 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-gray-300 hover:text-white hover:bg-[#252936] rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleStartExport}
            disabled={isRendering}
            className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg flex items-center space-x-2 transition disabled:opacity-50"
          >
            {isRendering ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span>{isRendering ? 'Rendering Audio...' : 'Start Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
