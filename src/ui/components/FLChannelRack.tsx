import React, { useState, useEffect } from 'react';
import { Plus, Volume2, Sparkles, Play, Sliders } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';
import { Pattern, StepLane } from '../../types/project';
import { RotaryKnob } from './RotaryKnob';

interface FLChannelRackProps {
  onOpenAI: () => void;
}

interface ChannelSetting {
  id: string;
  name: string;
  voiceId: string;
  pan: number;
  vol: number;
  trackNum: number;
  muted: boolean;
}

export const FLChannelRack: React.FC<FLChannelRackProps> = ({ onOpenAI }) => {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [swingVal, setSwingVal] = useState(15);

  const [channelSettings, setChannelSettings] = useState<Record<string, ChannelSetting>>({
    kick: { id: 'kick', name: '808 Kick', voiceId: 'kick', pan: 0, vol: 100, trackNum: 1, muted: false },
    snare: { id: 'snare', name: '909 Snare', voiceId: 'snare', pan: -5, vol: 90, trackNum: 2, muted: false },
    clap: { id: 'clap', name: 'Studio Clap', voiceId: 'clap', pan: 5, vol: 85, trackNum: 3, muted: false },
    closed_hat: { id: 'closed_hat', name: 'Closed Hat', voiceId: 'closed_hat', pan: -15, vol: 75, trackNum: 4, muted: false },
    open_hat: { id: 'open_hat', name: 'Open Hat', voiceId: 'open_hat', pan: 15, vol: 70, trackNum: 4, muted: false },
    tom: { id: 'tom', name: 'Floor Tom', voiceId: 'tom', pan: -20, vol: 80, trackNum: 5, muted: false },
    perc: { id: 'perc', name: 'Rim / Perc', voiceId: 'perc', pan: 25, vol: 75, trackNum: 6, muted: false },
    lead: { id: 'lead', name: 'Lead Synth', voiceId: 'lead', pan: 0, vol: 85, trackNum: 7, muted: false },
  });

  useEffect(() => {
    if (globalAudioEngine.stepSequencer) {
      setPattern({ ...globalAudioEngine.stepSequencer.getActivePattern() });
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

  const handleAudition = async (voiceId: string) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (voiceId === 'lead') {
      globalAudioEngine.synth?.noteOn(60, 0.85);
      setTimeout(() => globalAudioEngine.synth?.noteOff(60), 200);
    } else if (globalAudioEngine.drumSynth) {
      globalAudioEngine.drumSynth.triggerVoice(voiceId, globalAudioEngine.ctx?.currentTime || 0, 0.9);
    }
  };

  const handleMuteToggle = (id: string) => {
    setChannelSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], muted: !prev[id]?.muted },
    }));
  };

  if (!pattern) return <div className="p-4 text-gray-500">Loading Channel Rack...</div>;

  return (
    <div className="flex-1 bg-[#181a22] flex flex-col overflow-hidden text-gray-200 select-none">
      {/* Top Channel Rack Toolbar */}
      <div className="h-9 bg-gradient-to-b from-[#262b38] to-[#1c202a] border-b border-[#353c4e] px-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">
            CHANNEL RACK
          </span>
          <span className="text-[11px] bg-[#12141a] px-2 py-0.5 rounded border border-[#2e3444] text-gray-300 font-bold">
            {pattern.name}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Swing Knob */}
          <div className="flex items-center space-x-1.5">
            <RotaryKnob
              label="Swing"
              value={swingVal}
              min={0}
              max={60}
              defaultValue={15}
              size={24}
              color="#fb923c"
              unit="%"
              onChange={(val) => {
                setSwingVal(val);
                if (pattern) pattern.swing = val / 100;
              }}
            />
          </div>

          {/* Quick AI Beat Generator */}
          <button
            onClick={onOpenAI}
            className="px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-[11px] font-bold flex items-center space-x-1 shadow transition"
          >
            <Sparkles size={12} />
            <span>AI Beats</span>
          </button>
        </div>
      </div>

      {/* Channel Rows */}
      <div className="flex-1 overflow-auto p-2.5 space-y-1.5 bg-[#14161f]">
        {pattern.stepLanes.map((lane, laneIdx) => {
          const cfg = channelSettings[lane.voiceId] || {
            id: lane.voiceId,
            name: lane.name,
            voiceId: lane.voiceId,
            pan: 0,
            vol: 85,
            trackNum: laneIdx + 1,
            muted: false,
          };

          return (
            <div
              key={lane.id}
              className={`flex items-center bg-[#1c202c] border border-[#2c3244] rounded px-2 py-1 transition ${
                cfg.muted ? 'opacity-40' : 'hover:border-[#3f475f]'
              }`}
            >
              {/* 1. Mute/Solo LED Button */}
              <button
                onClick={() => handleMuteToggle(cfg.id)}
                className={`w-3 h-3 rounded-full mr-2.5 border transition ${
                  cfg.muted
                    ? 'bg-transparent border-gray-600'
                    : 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                }`}
                title={cfg.muted ? 'Unmute Channel' : 'Mute Channel'}
              />

              {/* 2. Mini Pan Knob */}
              <div className="mr-2">
                <RotaryKnob
                  value={cfg.pan}
                  min={-100}
                  max={100}
                  defaultValue={0}
                  size={20}
                  color="#38bdf8"
                  onChange={(v) =>
                    setChannelSettings((prev) => ({
                      ...prev,
                      [cfg.id]: { ...cfg, pan: v },
                    }))
                  }
                />
              </div>

              {/* 3. Mini Vol Knob */}
              <div className="mr-2">
                <RotaryKnob
                  value={cfg.vol}
                  min={0}
                  max={125}
                  defaultValue={85}
                  size={20}
                  color="#fbbf24"
                  onChange={(v) =>
                    setChannelSettings((prev) => ({
                      ...prev,
                      [cfg.id]: { ...cfg, vol: v },
                    }))
                  }
                />
              </div>

              {/* 4. Mixer Track Route Number Box */}
              <div
                className="w-5 h-6 bg-[#11131a] border border-[#2b3142] rounded text-[10px] font-mono font-bold text-gray-400 flex items-center justify-center mr-2 shadow-inner"
                title={`Routed to Mixer Track ${cfg.trackNum}`}
              >
                {cfg.trackNum}
              </div>

              {/* 5. Tactile Channel Button (Click to audition) */}
              <button
                onClick={() => handleAudition(lane.voiceId)}
                className="w-28 h-7 bg-gradient-to-r from-[#292f3e] via-[#222734] to-[#1c202a] border border-[#3c455a] rounded text-left px-2 text-[11px] font-bold text-gray-200 hover:text-cyan-300 hover:border-cyan-500/50 shadow flex items-center justify-between group mr-3 transition"
              >
                <span className="truncate">{cfg.name}</span>
                <Play
                  size={9}
                  className="text-gray-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition"
                />
              </button>

              {/* 6. Iconic FL Studio 16-Step Button Grid (Grouped in 4s) */}
              <div className="flex items-center space-x-1">
                {lane.steps.map((isActive, stepIdx) => {
                  // Beat grouping: 0-3 dark, 4-7 warm red/grey, 8-11 dark, 12-15 warm red/grey
                  const beatGroup = Math.floor(stepIdx / 4) % 2 === 1;
                  const isPlayhead = currentStep === stepIdx;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => handleStepClick(lane.id, stepIdx)}
                      className={`w-6 h-7 rounded-[3px] border transition-all duration-75 relative flex items-center justify-center ${
                        isPlayhead ? 'ring-2 ring-cyan-400 z-10' : ''
                      } ${
                        isActive
                          ? 'bg-gradient-to-b from-orange-400 to-orange-600 border-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.9)]'
                          : beatGroup
                          ? 'bg-[#292d3b] hover:bg-[#343a4c] border-[#3a4154]' // Reddish / lighter 4-beat bar
                          : 'bg-[#1b1e28] hover:bg-[#252a38] border-[#292f3f]' // Dark 4-beat bar
                      }`}
                      title={`Step ${stepIdx + 1} (${isActive ? 'Active' : 'Off'})`}
                    >
                      {/* Active Center Jewel */}
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_4px_white]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 bg-[#161820] border-t border-[#262b3a] px-3 flex items-center justify-between text-[10px] text-gray-500 font-mono">
        <span>8 CHANNELS LOADED</span>
        <span>STEP RES: 1/16 (4 BEATS)</span>
      </div>
    </div>
  );
};
