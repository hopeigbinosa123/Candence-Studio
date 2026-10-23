import React, { useEffect, useState } from 'react';
import { Play, Pause, Square, Circle, Repeat, SkipBack, Volume2, Mic } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';
import { TransportState } from '../../types/audio';

interface Props {
  onRecordToggle?: () => void;
  isRecording?: boolean;
}

export const TransportControls: React.FC<Props> = ({ onRecordToggle, isRecording = false }) => {
  const [state, setState] = useState<TransportState>('stopped');
  const [timeCode, setTimeCode] = useState('01:01:01');
  const [loop, setLoop] = useState(true);

  useEffect(() => {
    const unsub = globalAudioEngine.transport.subscribe((newState, beat) => {
      setState(newState);
      setTimeCode(globalAudioEngine.transport.formatTime(beat));
    });
    setLoop(globalAudioEngine.transport.loopEnabled);
    return unsub;
  }, []);

  const handlePlayPause = async () => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (state === 'playing') {
      globalAudioEngine.transport.pause();
    } else {
      globalAudioEngine.transport.play();
    }
  };

  const handleStop = () => {
    globalAudioEngine.transport.stop();
  };

  const handleReturnToZero = () => {
    globalAudioEngine.transport.currentBeat = 0;
  };

  const handleToggleLoop = () => {
    const next = !loop;
    setLoop(next);
    globalAudioEngine.transport.loopEnabled = next;
  };

  return (
    <div className="flex items-center space-x-2 bg-[#181a20] px-3 py-1.5 rounded-lg border border-[#2b303d]">
      <button
        onClick={handleReturnToZero}
        title="Return to Start (Home)"
        className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252834] rounded transition"
      >
        <SkipBack size={16} />
      </button>

      <button
        onClick={handlePlayPause}
        title={state === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
        className={`p-2 rounded font-medium flex items-center justify-center transition ${
          state === 'playing'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
            : 'bg-[#282c38] text-gray-200 hover:bg-[#343a49]'
        }`}
      >
        {state === 'playing' ? <Pause size={17} /> : <Play size={17} />}
      </button>

      <button
        onClick={handleStop}
        title="Stop"
        className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252834] rounded transition"
      >
        <Square size={16} />
      </button>

      <button
        onClick={onRecordToggle}
        title="Record (R)"
        className={`p-1.5 rounded transition ${
          isRecording
            ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50'
            : 'text-gray-400 hover:text-rose-400 hover:bg-[#252834]'
        }`}
      >
        <Circle size={16} fill={isRecording ? 'currentColor' : 'none'} />
      </button>

      <button
        onClick={handleToggleLoop}
        title="Toggle Loop Cycle"
        className={`p-1.5 rounded transition ${
          loop ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Repeat size={15} />
      </button>

      {/* Musical Timecode Display (Bar:Beat:16th) */}
      <div className="bg-[#0e0f12] px-3 py-1 rounded font-mono text-cyan-400 text-sm font-semibold tracking-wider border border-[#222530] min-w-[78px] text-center shadow-inner">
        {timeCode}
      </div>
    </div>
  );
};
