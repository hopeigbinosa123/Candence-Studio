import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Wand2, Music } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';
import { Note } from '../../types/project';
import { NOTE_NAMES, MUSICAL_SCALES } from '../../constants/defaults';

interface FLPianoRollProps {
  onOpenAI: () => void;
}

export const FLPianoRoll: React.FC<FLPianoRollProps> = ({ onOpenAI }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [scaleIndex, setScaleIndex] = useState(1); // Natural Minor default
  const minPitch = 48; // C3
  const maxPitch = 72; // C5
  const totalBeats = 16;
  const gridDiv = 4; // 16th notes

  useEffect(() => {
    if (globalAudioEngine.pianoRoll.notes.length === 0) {
      globalAudioEngine.pianoRoll.addNote(60, 0, 1.0, 0.85); // C4
      globalAudioEngine.pianoRoll.addNote(63, 1, 1.0, 0.85); // Eb4
      globalAudioEngine.pianoRoll.addNote(67, 2, 1.5, 0.9);  // G4
      globalAudioEngine.pianoRoll.addNote(65, 3.5, 0.5, 0.8); // F4
    }
    setNotes([...globalAudioEngine.pianoRoll.notes]);

    const unsub = globalAudioEngine.transport.subscribe((state, beat) => {
      setCurrentBeat(beat % totalBeats);
    });
    return unsub;
  }, []);

  const handleAudition = async (pitch: number) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (globalAudioEngine.synth) {
      globalAudioEngine.synth.noteOn(pitch, 0.85);
      setTimeout(() => globalAudioEngine.synth?.noteOff(pitch), 250);
    }
  };

  const handleGridClick = async (pitch: number, beat: number) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();

    const existingIdx = notes.findIndex(
      (n) => n.pitch === pitch && Math.abs(n.startTime - beat) < 0.25
    );

    if (existingIdx !== -1) {
      globalAudioEngine.pianoRoll.removeNote(notes[existingIdx].id);
    } else {
      globalAudioEngine.pianoRoll.addNote(pitch, beat, 1.0, 0.85);
      handleAudition(pitch);
    }
    setNotes([...globalAudioEngine.pianoRoll.notes]);
  };

  const handleInsertChord = (type: 'major' | 'minor' | 'min7') => {
    globalAudioEngine.pianoRoll.insertChord(60, type, Math.floor(currentBeat), 2.0);
    setNotes([...globalAudioEngine.pianoRoll.notes]);
  };

  return (
    <div className="flex-1 bg-[#14161f] flex flex-col overflow-hidden text-gray-200 select-none">
      {/* Top Bar */}
      <div className="h-8 bg-gradient-to-b from-[#262b38] to-[#1c202a] border-b border-[#353c4e] px-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold uppercase text-cyan-400 text-[10px]">PIANO ROLL</span>
          <select
            value={scaleIndex}
            onChange={(e) => setScaleIndex(Number(e.target.value))}
            className="bg-[#12141a] text-cyan-300 font-bold text-[11px] px-2 py-0.5 rounded border border-[#2e3444]"
          >
            {MUSICAL_SCALES.map((s, idx) => (
              <option key={idx} value={idx}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-1 pl-2">
            <span className="text-[10px] text-gray-400">Chord:</span>
            <button
              onClick={() => handleInsertChord('minor')}
              className="px-1.5 py-0.5 bg-[#252a38] hover:bg-[#343a4e] text-cyan-300 rounded text-[10px] font-bold"
            >
              Minor
            </button>
            <button
              onClick={() => handleInsertChord('major')}
              className="px-1.5 py-0.5 bg-[#252a38] hover:bg-[#343a4e] text-cyan-300 rounded text-[10px] font-bold"
            >
              Major
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              globalAudioEngine.pianoRoll.notes = [];
              setNotes([]);
            }}
            className="text-gray-400 hover:text-rose-400 p-1"
            title="Clear all notes"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onOpenAI}
            className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-[11px] font-bold flex items-center space-x-1 shadow"
          >
            <Sparkles size={11} />
            <span>AI Melody</span>
          </button>
        </div>
      </div>

      {/* Main Grid & Piano Keys */}
      <div className="flex-1 overflow-auto flex relative bg-[#12141a]">
        {/* Left Piano Keyboard */}
        <div className="w-14 bg-[#181a24] border-r border-[#2b3142] flex flex-col-reverse sticky left-0 z-10 shadow-lg">
          {Array.from({ length: maxPitch - minPitch + 1 }).map((_, idx) => {
            const pitch = minPitch + idx;
            const noteName = NOTE_NAMES[pitch % 12];
            const isBlack = noteName.includes('#');
            const isC = noteName === 'C';
            const octave = Math.floor(pitch / 12) - 1;

            return (
              <button
                key={pitch}
                onClick={() => handleAudition(pitch)}
                className={`h-5 text-[9px] font-bold flex items-center justify-end pr-1 border-b border-[#202432] transition ${
                  isBlack
                    ? 'bg-[#0f1117] text-gray-500 hover:bg-[#202430]'
                    : isC
                    ? 'bg-[#e2e8f0] text-gray-900 font-black'
                    : 'bg-[#cbd5e1] text-gray-800 hover:bg-white'
                }`}
              >
                {isC ? `C${octave}` : isBlack ? '' : noteName}
              </button>
            );
          })}
        </div>

        {/* Note Grid */}
        <div className="flex-1 relative min-w-[700px]">
          {/* Playhead Marker */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-20 pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.9)]"
            style={{ left: `${(currentBeat / totalBeats) * 100}%` }}
          />

          {/* Rows */}
          <div className="flex flex-col-reverse">
            {Array.from({ length: maxPitch - minPitch + 1 }).map((_, pitchIdx) => {
              const pitch = minPitch + pitchIdx;
              const noteName = NOTE_NAMES[pitch % 12];
              const isBlack = noteName.includes('#');

              return (
                <div
                  key={pitch}
                  className={`h-5 flex border-b border-[#1d222e] ${
                    isBlack ? 'bg-[#12141a]' : 'bg-[#161822]'
                  }`}
                >
                  {Array.from({ length: totalBeats * gridDiv }).map((_, stepIdx) => {
                    const beat = stepIdx / gridDiv;
                    const isBeat = stepIdx % gridDiv === 0;

                    return (
                      <div
                        key={stepIdx}
                        onClick={() => handleGridClick(pitch, beat)}
                        className={`flex-1 border-r cursor-pointer hover:bg-cyan-900/30 ${
                          isBeat ? 'border-[#272d3c]' : 'border-[#191c26]'
                        }`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Rendered Notes */}
          {notes.map((note) => {
            const row = note.pitch - minPitch;
            if (row < 0 || row > maxPitch - minPitch) return null;

            const bottomPx = row * 20;
            const leftPct = (note.startTime / totalBeats) * 100;
            const widthPct = (note.duration / totalBeats) * 100;

            return (
              <div
                key={note.id}
                onClick={() => handleGridClick(note.pitch, note.startTime)}
                style={{
                  bottom: `${bottomPx + 1}px`,
                  left: `${leftPct}%`,
                  width: `${Math.max(1.5, widthPct)}%`,
                  height: '18px',
                }}
                className="absolute bg-gradient-to-r from-emerald-400 to-cyan-500 border border-emerald-200 rounded-[2px] shadow-md z-10 flex items-center px-1 text-[9px] font-extrabold text-black truncate cursor-pointer hover:brightness-125"
              >
                {NOTE_NAMES[note.pitch % 12]}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
