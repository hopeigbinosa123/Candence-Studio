import React, { useState } from 'react';
import { X, Sparkles, Music, Grid, Sliders, CheckCircle, Play, ArrowRight } from 'lucide-react';
import { ChordGenerator } from '../../ai/ChordGenerator';
import { MelodyGenerator } from '../../ai/MelodyGenerator';
import { DrumGenerator } from '../../ai/DrumGenerator';
import { MixAssistant } from '../../ai/MixAssistant';
import { MusicalKey, ChordProgressionSuggestion, MixRecommendation } from '../../types/ai';
import { Project } from '../../types/project';
import { globalAudioEngine } from '../../audio/AudioEngine';

interface Props {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onApplyMelody: (notes: any[]) => void;
  onApplyDrums: (lanes: any[], swing: number) => void;
}

export const AIAssistantModal: React.FC<Props> = ({
  project,
  isOpen,
  onClose,
  onApplyMelody,
  onApplyDrums,
}) => {
  const [tab, setTab] = useState<'chords' | 'melody' | 'drums' | 'mix'>('chords');
  const [key, setKey] = useState<MusicalKey>('C');
  const [genre, setGenre] = useState<string>('neosoul');
  const [chordsResult, setChordsResult] = useState<ChordProgressionSuggestion | null>(null);
  const [mixReport, setMixReport] = useState<MixRecommendation[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateChords = () => {
    const result = ChordGenerator.generateProgression(key, genre, 4);
    setChordsResult(result);
    setSuccessMsg(null);
  };

  const handleAuditionChord = async (notes: number[]) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (globalAudioEngine.synth) {
      notes.forEach((pitch) => globalAudioEngine.synth?.noteOn(pitch, 0.75));
      setTimeout(() => {
        notes.forEach((pitch) => globalAudioEngine.synth?.noteOff(pitch));
      }, 700);
    }
  };

  const handleInsertChords = () => {
    if (!chordsResult) return;
    const generatedNotes: any[] = [];
    let beatOffset = 0;

    chordsResult.chords.forEach((chord) => {
      chord.notes.forEach((pitch) => {
        generatedNotes.push({
          id: `ai-chord-${Date.now()}-${pitch}`,
          pitch,
          startTime: beatOffset,
          duration: chord.duration,
          velocity: 0.85,
        });
      });
      beatOffset += chord.duration;
    });

    globalAudioEngine.pianoRoll.notes = [...generatedNotes];
    onApplyMelody(generatedNotes);
    setSuccessMsg('Chords inserted into Piano Roll & Lead Track!');
  };

  const handleGenerateMelody = () => {
    const notes = MelodyGenerator.generateMelody(key, 'Pentatonic Minor', 16, 4);
    globalAudioEngine.pianoRoll.notes = [...notes];
    onApplyMelody(notes);
    setSuccessMsg(`Generated 16-beat ${key} Minor melody motif in Piano Roll!`);
  };

  const handleGenerateDrums = () => {
    const { lanes, swing } = DrumGenerator.generatePattern(genre, 16);
    if (globalAudioEngine.stepSequencer) {
      const active = globalAudioEngine.stepSequencer.getActivePattern();
      active.stepLanes = lanes;
      active.swing = swing;
    }
    onApplyDrums(lanes, swing);
    setSuccessMsg(`Generated ${genre.toUpperCase()} drum groove with humanized velocities!`);
  };

  const handleRunMixAnalysis = () => {
    const recs = MixAssistant.analyzeMix(project);
    setMixReport(recs);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#181a24] border border-[#2e3344] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-14 bg-[#1f2230] border-b border-[#2e3344] px-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-purple-400" size={18} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Cadence AI Music & Mix Assistant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#2e3344]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2a2f3e] bg-[#14161d] px-4 text-xs font-semibold">
          <button
            onClick={() => setTab('chords')}
            className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
              tab === 'chords' ? 'border-purple-500 text-purple-300' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Music size={14} />
            <span>Chord Progressions</span>
          </button>
          <button
            onClick={() => setTab('melody')}
            className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
              tab === 'melody' ? 'border-purple-500 text-purple-300' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Melodic Motifs</span>
          </button>
          <button
            onClick={() => setTab('drums')}
            className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
              tab === 'drums' ? 'border-purple-500 text-purple-300' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Grid size={14} />
            <span>Rhythm & Drums</span>
          </button>
          <button
            onClick={() => {
              setTab('mix');
              handleRunMixAnalysis();
            }}
            className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
              tab === 'mix' ? 'border-purple-500 text-purple-300' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            <span>Acoustic Mix Diagnostic</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 text-xs">
          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-700/60 p-3 rounded-lg flex items-center space-x-2 text-emerald-300 font-semibold animate-in fade-in">
              <CheckCircle size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. CHORD PROGRESSIONS */}
          {tab === 'chords' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1 font-semibold">Musical Key</label>
                  <select
                    value={key}
                    onChange={(e) => setKey(e.target.value as any)}
                    className="w-full bg-[#12141a] text-purple-300 font-bold p-2 rounded-lg border border-[#2b3040]"
                  >
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-semibold">Genre / Style</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#12141a] text-purple-300 font-bold p-2 rounded-lg border border-[#2b3040]"
                  >
                    <option value="neosoul">Neo-Soul / Lofi (ii9 - V13 - Imaj9 - vi7)</option>
                    <option value="trap">Dark Minor Trap (i - VI - iv - V)</option>
                    <option value="pop">Classic Pop (I - V - vi - IV)</option>
                    <option value="edm">Anthem EDM (vi - IV - I - V)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateChords}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow transition"
              >
                Generate Harmonic Progression
              </button>

              {chordsResult && (
                <div className="bg-[#12141a] p-4 rounded-xl border border-[#2b3040] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-300">{chordsResult.name}</span>
                    <button
                      onClick={handleInsertChords}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded shadow flex items-center space-x-1"
                    >
                      <ArrowRight size={13} />
                      <span>Apply to Track</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {chordsResult.chords.map((chord, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleAuditionChord(chord.notes)}
                        className="bg-[#1e212f] hover:bg-[#282d3f] border border-[#343a4e] p-2.5 rounded-lg text-center cursor-pointer transition group"
                        title="Click to preview chord"
                      >
                        <span className="text-[10px] text-gray-500 font-mono block">
                          {chordsResult.romanNumerals[idx]}
                        </span>
                        <span className="text-sm font-extrabold text-white group-hover:text-cyan-300">
                          {chord.name}
                        </span>
                        <Play size={10} className="mx-auto mt-1 text-gray-400 group-hover:text-cyan-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. MELODIC MOTIFS */}
          {tab === 'melody' && (
            <div className="space-y-4">
              <p className="text-gray-300">
                Synthesizes contour-guided melodic phrases adhering to musical scale degrees with natural cadence resolution.
              </p>
              <button
                onClick={handleGenerateMelody}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-2"
              >
                <Sparkles size={15} />
                <span>Generate Melody for Key of {key}</span>
              </button>
            </div>
          )}

          {/* 3. RHYTHM & DRUMS */}
          {tab === 'drums' && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Drum Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#12141a] text-purple-300 font-bold p-2 rounded-lg border border-[#2b3040]"
                >
                  <option value="trap">Trap (Syncopated 808 Kick, Snare on 3, Hi-Hat rolls)</option>
                  <option value="house">Four-on-the-Floor House (Punchy kick, offbeat open hat)</option>
                  <option value="boombap">Boom Bap (Swung groove, ghost notes, warm snare)</option>
                </select>
              </div>
              <button
                onClick={handleGenerateDrums}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-2"
              >
                <Grid size={15} />
                <span>Generate Drum Pattern in Step Sequencer</span>
              </button>
            </div>
          )}

          {/* 4. ACOUSTIC MIX DIAGNOSTIC */}
          {tab === 'mix' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-300">Acoustic Analysis Results:</span>
                <button
                  onClick={handleRunMixAnalysis}
                  className="text-xs text-purple-400 hover:underline font-semibold"
                >
                  Re-analyze
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {mixReport.map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-[#12141a] border border-[#2b3040] p-3 rounded-lg space-y-1"
                  >
                    <div className="flex justify-between">
                      <span className="font-bold text-cyan-400 uppercase text-[10px]">
                        {rec.category} Recommendation
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
