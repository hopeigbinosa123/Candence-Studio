import React, { useState, useEffect, useRef } from 'react';
import { Music, Sparkles, Wand2, Trash2 } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';
import { Note } from '../../types/project';
import { NOTE_NAMES, MUSICAL_SCALES } from '../../constants/defaults';

interface Props {
  onOpenAI: () => void;
}

export const PianoRollView: React.FC<Props> = ({ onOpenAI }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [scaleIndex, setScaleIndex] = useState(1); // Natural Minor default
  const [rootNote, setRootNote] = useState(60); // C4
  const [currentBeat, setCurrentBeat] = useState(0);

  const minPitch = 48; // C3
  const maxPitch = 72; // C5
  const totalBeats = 16;
  const gridDivisions = 4; // 16th notes per beat

  useEffect(() => {
    if (globalAudioEngine.pianoRoll.notes.length === 0) {
      // Provide an inspiring starter melody
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

  const handleAuditionPitch = async (pitch: number) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (globalAudioEngine.synth) {
      globalAudioEngine.synth.noteOn(pitch, 0.85);
      setTimeout(() => {
        globalAudioEngine.synth?.noteOff(pitch);
      }, 250);
    }
  };

  const handleGridClick = async (pitch: number, beat: number) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();

    // Check if a note already exists at this exact pitch & beat
    const existingIdx = notes.findIndex(
      (n) => n.pitch === pitch && Math.abs(n.startTime - beat) < 0.25
    );

    if (existingIdx !== -1) {
      // Remove note
      const noteId = notes[existingIdx].id;
      globalAudioEngine.pianoRoll.removeNote(noteId);
    } else {
      // Add note
      globalAudioEngine.pianoRoll.addNote(pitch, beat, 1.0, 0.85);
      handleAuditionPitch(pitch);
    }
    setNotes([...globalAudioEngine.pianoRoll.notes]);
  };

  const handleInsertChord = (type: 'major' | 'minor' | '7th' | 'min7') => {
    globalAudioEngine.pianoRoll.insertChord(rootNote, type, Math.floor(currentBeat), 2.0);
    setNotes([...globalAudioEngine.pianoRoll.notes]);
  };

  const handleClearAll = () => {
    globalAudioEngine.pianoRoll.notes = [];
    setNotes([]);
  };

  return (
    <div className="flex-1 bg-[#15171e] flex flex-col overflow-hidden select-none">
      {/* Top Controls Toolbar */}
      <div className="h-12 bg-[#1b1e27] border-b border-[#282d3b] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold uppercase text-gray-300">Scale Guide:</span>
          <select
            value={scaleIndex}
            onChange={(e) => setScaleIndex(Number(e.target.value))}
            className="bg-[#12141a] text-cyan-400 font-semibold text-xs px-2.5 py-1 rounded border border-[#2c3242]"
          >
            {MUSICAL_SCALES.map((s, idx) => (
              <option key={idx} value={idx}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Quick Chord Insertion */}
          <div className="flex items-center space-x-1 pl-2">
            <span className="text-[11px] text-gray-400 font-medium">Add Chord:</span>
            <button
              onClick={() => handleInsertChord('minor')}
              className="px-2 py-0.5 bg-[#252a38] hover:bg-[#31374a] text-cyan-300 rounded text-xs font-semibold"
            >
              Minor
            </button>
            <button
              onClick={() => handleInsertChord('major')}
              className="px-2 py-0.5 bg-[#252a38] hover:bg-[#31374a] text-cyan-300 rounded text-xs font-semibold"
            >
              Major
            </button>
            <button
              onClick={() => handleInsertChord('min7')}
              className="px-2 py-0.5 bg-[#252a38] hover:bg-[#31374a] text-cyan-300 rounded text-xs font-semibold"
            >
              m7
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearAll}
            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-[#252a38] rounded text-xs flex items-center space-x-1"
            title="Clear all notes"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>

          <button
            onClick={onOpenAI}
            className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow"
          >
            <Sparkles size={13} />
            <span>AI Melody Generator</span>
          </button>
        </div>
      </div>

      {/* Piano Roll Grid & Keys */}
      <div className="flex-1 overflow-auto flex">
        {/* Left Piano Keyboard */}
        <div className="w-16 bg-[#181a22] border-r border-[#2a2f3e] flex flex-col-reverse sticky left-0 z-10 shadow-lg">
          {Array.from({ length: maxPitch - minPitch + 1 }).map((_, idx) => {
            const pitch = minPitch + idx;
            const noteName = NOTE_NAMES[pitch % 12];
            const isBlack = noteName.includes('#');
            const isC = noteName === 'C';
            const octave = Math.floor(pitch / 12) - 1;

            return (
              <button
                key={pitch}
                onClick={() => handleAuditionPitch(pitch)}
                className={`h-6 text-[10px] font-bold flex items-center justify-end pr-1 border-b border-[#252936] transition ${
                  isBlack
                    ? 'bg-[#101217] text-gray-400 hover:bg-[#252834]'
                    : isC
                    ? 'bg-[#e5e7eb] text-gray-900 font-extrabold hover:bg-white'
                    : 'bg-[#cbd5e1] text-gray-800 hover:bg-white'
                }`}
              >
                {isC ? `C${octave}` : isBlack ? '' : noteName}
              </button>
            );
          })}
        </div>

        {/* Note Grid Canvas */}
        <div className="flex-1 relative bg-[#13151b] overflow-x-auto min-w-[800px]">
          {/* Playhead Marker */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-20 pointer-events-none shadow-lg shadow-cyan-400/80"
            style={{ left: `${(currentBeat / totalBeats) * 100}%` }}
          />

          {/* Grid rows */}
          <div className="flex flex-col-reverse">
            {Array.from({ length: maxPitch - minPitch + 1 }).map((_, pitchIdx) => {
              const pitch = minPitch + pitchIdx;
              const noteName = NOTE_NAMES[pitch % 12];
              const isBlack = noteName.includes('#');

              return (
                <div
                  key={pitch}
                  className={`h-6 flex border-b border-[#202430] ${
                    isBlack ? 'bg-[#13151b]' : 'bg-[#171922]'
                  }`}
                >
                  {Array.from({ length: totalBeats * gridDivisions }).map((_, stepIdx) => {
                    const beat = stepIdx / gridDivisions;
                    const isBeatStart = stepIdx % gridDivisions === 0;

                    return (
                      <div
                        key={stepIdx}
                        onClick={() => handleGridClick(pitch, beat)}
                        className={`flex-1 border-r hover:bg-[#2e3447]/50 cursor-pointer ${
                          isBeatStart ? 'border-[#2d3244]' : 'border-[#1c202b]'
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
            const rowFromBottom = note.pitch - minPitch;
            if (rowFromBottom < 0 || rowFromBottom > maxPitch - minPitch) return null;

            const bottomPx = rowFromBottom * 24; // 24px per row
            const leftPct = (note.startTime / totalBeats) * 100;
            const widthPct = (note.duration / totalBeats) * 100;

            return (
              <div
                key={note.id}
                onClick={() => handleGridClick(note.pitch, note.startTime)}
                style={{
                  bottom: `${bottomPx + 1}px`,
                  left: `${leftPct}%`,
                  width: `${Math.max(1.2, widthPct)}%`,
                  height: '22px',
                }}
                className="absolute bg-gradient-to-r from-cyan-500 to-indigo-600 border border-cyan-300 rounded shadow-md z-10 flex items-center px-1 text-[10px] font-bold text-white truncate cursor-pointer hover:brightness-110"
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
