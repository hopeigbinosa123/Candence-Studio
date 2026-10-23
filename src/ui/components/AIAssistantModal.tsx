import React, { useState } from 'react';
import { X, Sparkles, Music, Grid, Sliders, CheckCircle, Play, ArrowRight, Volume2 } from 'lucide-react';
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
  const [chordsResult, setChordsResult] = useState<ChordProgressionSuggestion | null>(() =>
    ChordGenerator.generateProgression('C', 'neosoul', 4)
  );
  const [mixReport, setMixReport] = useState<MixRecommendation[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  if (!isOpen) return null;

  // 1. CHORD PROGRESSIONS: Generates and immediately previews
  const handleGenerateChords = async () => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();

    const result = ChordGenerator.generateProgression(key, genre, 4);
    setChordsResult(result);
    setSuccessMsg(`Generated ${result.name}! Click chords or "Apply to Project" below.`);

    // Automatically audition the first chord
    if (result.chords.length > 0) {
      handleAuditionChord(result.chords[0].notes);
    }
  };

  const handleAuditionChord = async (notes: number[]) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (globalAudioEngine.synth) {
      notes.forEach((pitch) => globalAudioEngine.synth?.noteOn(pitch, 0.8));
      setTimeout(() => {
        notes.forEach((pitch) => globalAudioEngine.synth?.noteOff(pitch));
      }, 650);
    }
  };

  const handleInsertChords = async () => {
    if (!chordsResult) return;
    await globalAudioEngine.init();
    await globalAudioEngine.resume();

    const generatedNotes: any[] = [];
    let beatOffset = 0;

    chordsResult.chords.forEach((chord) => {
      chord.notes.forEach((pitch) => {
        generatedNotes.push({
          id: `ai-chord-${Date.now()}-${pitch}-${Math.random().toString(36).substr(2, 4)}`,
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
    setSuccessMsg('Chords applied! Loaded into Piano Roll and Lead Track.');

    // Quick arpeggiated audio feedback
    generatedNotes.slice(0, 4).forEach((n, idx) => {
      setTimeout(() => {
        globalAudioEngine.synth?.noteOn(n.pitch, 0.85);
        setTimeout(() => globalAudioEngine.synth?.noteOff(n.pitch), 250);
      }, idx * 120);
    });
  };

  // 2. MELODIC MOTIFS: Generates, updates piano roll, and plays preview
  const handleGenerateMelody = async () => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();

    const notes = MelodyGenerator.generateMelody(key, 'Pentatonic Minor', 16, 4);
    globalAudioEngine.pianoRoll.notes = [...notes];
    onApplyMelody(notes);
    setSuccessMsg(`Generated 16-beat melody in ${key} Minor! Playing preview...`);

    // Audition preview of first 6 notes
    notes.slice(0, 6).forEach((n, idx) => {
      setTimeout(() => {
        globalAudioEngine.synth?.noteOn(n.pitch, 0.85);
        setTimeout(() => globalAudioEngine.synth?.noteOff(n.pitch), 200);
      }, idx * 160);
    });
  };

  // 3. RHYTHM & DRUMS: Generates pattern, updates sequencer, and previews drum sounds
  const handleGenerateDrums = async () => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();

    const { lanes, swing } = DrumGenerator.generatePattern(genre, 16);

    if (globalAudioEngine.stepSequencer) {
      const active = globalAudioEngine.stepSequencer.getActivePattern();
      active.stepLanes = lanes;
      active.swing = swing;
    }

    onApplyDrums(lanes, swing);
    setSuccessMsg(`Generated ${genre.toUpperCase()} drum pattern! Loaded into Channel Rack.`);

    // Audition kick + snare + clap
    if (globalAudioEngine.drumSynth) {
      const ctxTime = globalAudioEngine.ctx?.currentTime || 0;
      globalAudioEngine.drumSynth.triggerKick(ctxTime, 0.95);
      setTimeout(() => {
        globalAudioEngine.drumSynth?.triggerVoice('closed_hat', globalAudioEngine.ctx?.currentTime || 0, 0.8);
      }, 150);
      setTimeout(() => {
        globalAudioEngine.drumSynth?.triggerVoice('snare', globalAudioEngine.ctx?.currentTime || 0, 0.9);
      }, 300);
    }
  };

  // 4. MIX DIAGNOSTIC
  const handleRunMixAnalysis = () => {
    const recs = MixAssistant.analyzeMix(project);
    setMixReport(recs);
    setSuccessMsg('Mix analysis complete! Check acoustic recommendations below.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-100">
      <div className="bg-[#181a24] border-2 border-purple-500/60 rounded-2xl w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-14 bg-gradient-to-r from-[#251b36] to-[#1c1a2c] border-b border-[#352c4c] px-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="text-purple-400 animate-pulse" size={19} />
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Cadence AI Music & Mix Assistant
              </h2>
              <span className="text-[10px] text-purple-300 font-mono">100% LOCAL & OFFLINE INTELLIGENCE</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#2e263d]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2d283c] bg-[#14151e] px-4 text-xs font-semibold">
          <button
            onClick={() => setTab('chords')}
            className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
              tab === 'chords' ? 'border-purple-500 text-purple-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Music size={14} />
            <span>Harmonic Chords</span>
          </button>
          <button
            onClick={() => setTab('melody')}
            className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
              tab === 'melody' ? 'border-purple-500 text-purple-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Melody Motifs</span>
          </button>
          <button
            onClick={() => setTab('drums')}
            className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
              tab === 'drums' ? 'border-purple-500 text-purple-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Grid size={14} />
            <span>Drum Patterns</span>
          </button>
          <button
            onClick={() => {
              setTab('mix');
              handleRunMixAnalysis();
            }}
            className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
              tab === 'mix' ? 'border-purple-500 text-purple-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            <span>Acoustic Mix Diagnostic</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 text-xs text-gray-200">
          {successMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500/70 p-3 rounded-lg flex items-center space-x-2 text-emerald-300 font-bold animate-in fade-in">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. CHORD PROGRESSIONS */}
          {tab === 'chords' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Musical Key</label>
                  <select
                    value={key}
                    onChange={(e) => setKey(e.target.value as any)}
                    className="w-full bg-[#12131c] text-purple-300 font-bold p-2.5 rounded-lg border border-[#342e47]"
                  >
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Genre / Style</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#12131c] text-purple-300 font-bold p-2.5 rounded-lg border border-[#342e47]"
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
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-lg shadow-lg flex items-center justify-center space-x-2 transition"
              >
                <Sparkles size={15} />
                <span>Generate Harmonic Chords</span>
              </button>

              {chordsResult && (
                <div className="bg-[#12131c] p-4 rounded-xl border border-[#342e47] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-purple-300 text-sm">{chordsResult.name}</span>
                    <button
                      onClick={handleInsertChords}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow flex items-center space-x-1.5 transition"
                    >
                      <ArrowRight size={14} />
                      <span>Apply to Project</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {chordsResult.chords.map((chord, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleAuditionChord(chord.notes)}
                        className="bg-[#1e1c2e] hover:bg-[#2b2742] border border-[#3d3654] p-3 rounded-lg text-center cursor-pointer transition group"
                        title="Click to preview chord"
                      >
                        <span className="text-[10px] text-gray-400 font-mono block">
                          {chordsResult.romanNumerals[idx]}
                        </span>
                        <span className="text-sm font-extrabold text-white group-hover:text-cyan-300">
                          {chord.name}
                        </span>
                        <Play size={11} className="mx-auto mt-1.5 text-purple-400 group-hover:scale-125 transition" />
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
              <p className="text-gray-300 leading-relaxed">
                Generates a musical motif in the key of <strong>{key} Minor</strong>, respecting pitch contour, syncopated rhythm, and natural cadence resolution.
              </p>
              <button
                onClick={handleGenerateMelody}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-lg shadow-lg transition flex items-center justify-center space-x-2"
              >
                <Sparkles size={16} />
                <span>Generate Melody for Key of {key}</span>
              </button>
            </div>
          )}

          {/* 3. RHYTHM & DRUMS */}
          {tab === 'drums' && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 block mb-1 font-bold">Drum Style</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#12131c] text-purple-300 font-bold p-2.5 rounded-lg border border-[#342e47]"
                >
                  <option value="trap">Trap (Syncopated 808 Kick, Snare on 3, Hi-Hat rolls)</option>
                  <option value="house">Four-on-the-Floor House (Punchy kick, offbeat open hat)</option>
                  <option value="boombap">Boom Bap (Swung hip-hop groove, ghost notes, warm snare)</option>
                </select>
              </div>
              <button
                onClick={handleGenerateDrums}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-lg shadow-lg transition flex items-center justify-center space-x-2"
              >
                <Grid size={16} />
                <span>Generate Drum Pattern in Channel Rack</span>
              </button>
            </div>
          )}

          {/* 4. ACOUSTIC MIX DIAGNOSTIC */}
          {tab === 'mix' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-gray-300 text-sm">Acoustic Analysis:</span>
                <button
                  onClick={handleRunMixAnalysis}
                  className="text-xs text-purple-400 hover:underline font-bold"
                >
                  Re-analyze
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {mixReport.map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-[#12131c] border border-[#342e47] p-3 rounded-lg space-y-1"
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
