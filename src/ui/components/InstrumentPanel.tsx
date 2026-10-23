import React, { useState } from 'react';
import { Cpu, Music, Play, Sliders, Waves, Activity } from 'lucide-react';
import { globalAudioEngine } from '../../audio/AudioEngine';
import { SubtractiveSynthParams, DEFAULT_SYNTH_PARAMS } from '../../audio/instruments/SubtractiveSynth';

export const InstrumentPanel: React.FC = () => {
  const [params, setParams] = useState<SubtractiveSynthParams>({
    ...DEFAULT_SYNTH_PARAMS,
    ...(globalAudioEngine.synth?.params || {}),
  });

  const updateParam = <K extends keyof SubtractiveSynthParams>(key: K, value: SubtractiveSynthParams[K]) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    if (globalAudioEngine.synth) {
      globalAudioEngine.synth.params = updated;
    }
  };

  const handleTestNote = async (pitch: number = 60) => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();
    if (globalAudioEngine.synth) {
      globalAudioEngine.synth.noteOn(pitch, 0.9);
      setTimeout(() => {
        globalAudioEngine.synth?.noteOff(pitch);
      }, 400);
    }
  };

  return (
    <div className="flex-1 bg-[#14161d] flex flex-col overflow-y-auto select-none p-6">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header & Quick Audition Keys */}
        <div className="bg-[#1b1e28] border border-[#2b3040] rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Cpu size={22} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Cadence Analog Subtractive Synthesizer
              </h2>
              <p className="text-xs text-gray-400">
                Dual Anti-Aliased Oscillators, 24dB Moog-Style Resonant Filter & Dual Envelopes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-400 mr-2">Audition Notes:</span>
            {[48, 55, 60, 64, 67, 72].map((p) => (
              <button
                key={p}
                onClick={() => handleTestNote(p)}
                className="px-2.5 py-1 bg-[#252936] hover:bg-cyan-600 hover:text-white text-cyan-300 font-mono font-bold text-xs rounded border border-[#343a4c] transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Synth Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Oscillators Section */}
          <div className="bg-[#1b1e27] border border-[#292e3c] rounded-xl p-4 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#2a2f3f] pb-2 text-cyan-400 font-bold text-xs uppercase">
              <Waves size={15} />
              <span>Oscillators</span>
            </div>

            {/* Osc 1 */}
            <div className="bg-[#13151b] p-3 rounded-lg border border-[#232734] space-y-2">
              <span className="text-[11px] font-bold text-gray-300 block uppercase">Oscillator 1</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Waveform</label>
                  <select
                    value={params.osc1Waveform}
                    onChange={(e) => updateParam('osc1Waveform', e.target.value as OscillatorType)}
                    className="w-full bg-[#1c1f2b] text-gray-200 text-xs px-2 py-1 rounded border border-[#2f3546]"
                  >
                    <option value="sawtooth">Sawtooth</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="sine">Sine</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Octave ({params.osc1Octave})</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    value={params.osc1Octave}
                    onChange={(e) => updateParam('osc1Octave', Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Osc 2 */}
            <div className="bg-[#13151b] p-3 rounded-lg border border-[#232734] space-y-2">
              <span className="text-[11px] font-bold text-gray-300 block uppercase">Oscillator 2</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Waveform</label>
                  <select
                    value={params.osc2Waveform}
                    onChange={(e) => updateParam('osc2Waveform', e.target.value as OscillatorType)}
                    className="w-full bg-[#1c1f2b] text-gray-200 text-xs px-2 py-1 rounded border border-[#2f3546]"
                  >
                    <option value="sawtooth">Sawtooth</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="sine">Sine</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Detune ({params.osc2Detune} cents)</label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={params.osc2Detune}
                    onChange={(e) => updateParam('osc2Detune', Number(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Resonant Filter Section */}
          <div className="bg-[#1b1e27] border border-[#292e3c] rounded-xl p-4 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#2a2f3f] pb-2 text-indigo-400 font-bold text-xs uppercase">
              <Activity size={15} />
              <span>24dB Filter</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Cutoff Frequency</span>
                  <span className="text-indigo-400 font-mono font-bold">{Math.round(params.filterCutoff)} Hz</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="12000"
                  value={params.filterCutoff}
                  onChange={(e) => updateParam('filterCutoff', Number(e.target.value))}
                  className="w-full accent-indigo-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Resonance (Q)</span>
                  <span className="text-indigo-400 font-mono font-bold">{params.filterResonance.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="18"
                  step="0.1"
                  value={params.filterResonance}
                  onChange={(e) => updateParam('filterResonance', Number(e.target.value))}
                  className="w-full accent-indigo-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Filter Envelope Amount</span>
                  <span className="text-indigo-400 font-mono font-bold">+{params.filterEnvAmount} Hz</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8000"
                  value={params.filterEnvAmount}
                  onChange={(e) => updateParam('filterEnvAmount', Number(e.target.value))}
                  className="w-full accent-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Amplitude ADSR Envelope */}
          <div className="bg-[#1b1e27] border border-[#292e3c] rounded-xl p-4 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#2a2f3f] pb-2 text-emerald-400 font-bold text-xs uppercase">
              <Sliders size={15} />
              <span>Amp ADSR</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Attack</span>
                  <span className="text-emerald-400 font-mono font-bold">{(params.ampAttack * 1000).toFixed(0)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.8"
                  step="0.005"
                  value={params.ampAttack}
                  onChange={(e) => updateParam('ampAttack', Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Decay</span>
                  <span className="text-emerald-400 font-mono font-bold">{(params.ampDecay * 1000).toFixed(0)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.5"
                  step="0.01"
                  value={params.ampDecay}
                  onChange={(e) => updateParam('ampDecay', Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Sustain</span>
                  <span className="text-emerald-400 font-mono font-bold">{(params.ampSustain * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.01"
                  value={params.ampSustain}
                  onChange={(e) => updateParam('ampSustain', Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Release</span>
                  <span className="text-emerald-400 font-mono font-bold">{(params.ampRelease * 1000).toFixed(0)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="2.5"
                  step="0.01"
                  value={params.ampRelease}
                  onChange={(e) => updateParam('ampRelease', Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
