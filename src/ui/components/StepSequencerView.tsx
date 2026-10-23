import React, { useState, useEffect } from 'react';
import { Volume2, Plus, Copy, Sparkles, Play } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';
import { Pattern } from '../../types/project';

interface Props {
  onOpenAI: () => void;
}

export const StepSequencerView: React.FC<Props> = ({ onOpenAI }) => {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [patternsList, setPatternsList] = useState<Pattern[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [swing, setSwing] = useState(15);

  useEffect(() => {
    if (globalAudioEngine.stepSequencer) {
      setPattern({ ...globalAudioEngine.stepSequencer.getActivePattern() });
      setPatternsList(globalAudioEngine.stepSequencer.getAllPatterns());
    }

    const unsub = globalAudioEngine.transport.subscribe((state, beat) => {
      if (state === 'playing' || state === 'recording') {
        const step = Math.floor((beat * 4) % (pattern?.lengthInSteps || 16));
        setCurrentStep(step);
      } else {
        setCurrentStep(-1);
      }
    });

    return unsub;
  }, [pattern?.lengthInSteps]);

  const handleStepClick = (laneId: string, stepIndex: number) => {
    if (!globalAudioEngine.stepSequencer) return;
    globalAudioEngine.stepSequencer.toggleStep(laneId, stepIndex);
    setPattern({ ...globalAudioEngine.stepSequencer.getActivePattern() });
  };

  const handlePreviewVoice = async (voiceId: string) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (globalAudioEngine.drumSynth) {
      globalAudioEngine.drumSynth.triggerVoice(voiceId, globalAudioEngine.ctx?.currentTime || 0, 0.9);
    }
  };

  const handleNewPattern = () => {
    if (!globalAudioEngine.stepSequencer) return;
    const newId = `pattern-${Date.now()}`;
    const p = globalAudioEngine.stepSequencer.createDefaultPattern(newId, `Pattern ${patternsList.length + 1}`);
    setPatternsList(globalAudioEngine.stepSequencer.getAllPatterns());
    globalAudioEngine.stepSequencer.setActivePatternId(newId);
    setPattern({ ...p });
  };

  const handleSwingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSwing(val);
    if (pattern) {
      pattern.swing = val / 100;
    }
  };

  if (!pattern) {
    return <div className="p-8 text-gray-500">Initializing Step Sequencer...</div>;
  }

  return (
    <div className="flex-1 bg-[#181a22] flex flex-col overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="h-12 bg-[#1c1f28] border-b border-[#2b3040] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-xs uppercase tracking-wider text-gray-300">Active Pattern:</span>
          <select
            value={pattern.id}
            onChange={(e) => {
              globalAudioEngine.stepSequencer?.setActivePatternId(e.target.value);
              setPattern({ ...globalAudioEngine.stepSequencer!.getActivePattern() });
            }}
            className="bg-[#12141a] text-cyan-400 font-semibold text-xs px-2.5 py-1 rounded border border-[#2e3444] focus:outline-none"
          >
            {patternsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.lengthInSteps} steps)
              </option>
            ))}
          </select>

          <button
            onClick={handleNewPattern}
            className="p-1.5 bg-[#262a38] hover:bg-[#32384a] text-gray-300 rounded text-xs flex items-center space-x-1 transition"
            title="Create New Pattern"
          >
            <Plus size={13} />
            <span>New</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Swing / Groove Control */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">Swing:</span>
            <input
              type="range"
              min="0"
              max="60"
              value={swing}
              onChange={handleSwingChange}
              className="w-20 accent-indigo-400"
            />
            <span className="text-[11px] font-mono text-indigo-300 w-8">{swing}%</span>
          </div>

          <button
            onClick={onOpenAI}
            className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow"
          >
            <Sparkles size={13} />
            <span>AI Beat Generator</span>
          </button>
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="inline-block min-w-full">
          {/* Header Step Counter */}
          <div className="flex items-center mb-2 pl-[180px]">
            {Array.from({ length: pattern.lengthInSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`w-7 text-center font-mono text-[10px] font-semibold ${
                  currentStep === idx
                    ? 'text-cyan-400 font-bold'
                    : idx % 4 === 0
                    ? 'text-indigo-400'
                    : 'text-gray-500'
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Drum Lanes */}
          <div className="space-y-2">
            {pattern.stepLanes.map((lane) => (
              <div
                key={lane.id}
                className="flex items-center bg-[#1f222d] border border-[#2c3142] rounded-lg p-1.5 hover:border-[#3d445c] transition"
              >
                {/* Lane Header */}
                <div className="w-[170px] flex items-center justify-between pr-3">
                  <button
                    onClick={() => handlePreviewVoice(lane.voiceId)}
                    className="flex items-center space-x-2 text-left group flex-1 truncate"
                    title={`Click to preview ${lane.name}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:scale-125 transition" />
                    <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 transition truncate">
                      {lane.name}
                    </span>
                  </button>
                  <button
                    onClick={() => handlePreviewVoice(lane.voiceId)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Play size={11} />
                  </button>
                </div>

                {/* 16-Step Pads */}
                <div className="flex items-center space-x-1">
                  {lane.steps.map((isActive, stepIdx) => {
                    const isBeatMarker = stepIdx % 4 === 0;
                    const isPlayheadHere = currentStep === stepIdx;

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => handleStepClick(lane.id, stepIdx)}
                        className={`step-pad ${isActive ? 'active' : ''} ${
                          isBeatMarker ? 'beat-marker' : ''
                        } ${isPlayheadHere ? 'ring-2 ring-cyan-400 shadow-md shadow-cyan-500/50' : ''}`}
                        title={`Step ${stepIdx + 1} - ${isActive ? 'ON' : 'OFF'}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
