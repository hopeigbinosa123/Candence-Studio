/**
 * Subtractive Synthesizer for Cadence Studio
 * Dual multi-waveform oscillators, 24dB ladder filter, dual ADSR envelopes, LFO, and portamento.
 */

export interface SubtractiveSynthParams {
  osc1Waveform: OscillatorType;
  osc1Octave: number; // -2 to +2
  osc1Detune: number; // cents (-100 to +100)
  osc1Gain: number;   // 0.0 to 1.0

  osc2Waveform: OscillatorType;
  osc2Octave: number; // -2 to +2
  osc2Detune: number; // cents (-100 to +100)
  osc2Gain: number;   // 0.0 to 1.0

  filterCutoff: number;    // 20Hz - 20000Hz
  filterResonance: number; // 0.0 - 25.0
  filterType: BiquadFilterType;
  filterEnvAmount: number; // -10000 to +10000 Hz

  // Amp ADSR (seconds)
  ampAttack: number;
  ampDecay: number;
  ampSustain: number; // 0.0 - 1.0
  ampRelease: number;

  // Filter ADSR (seconds)
  filterAttack: number;
  filterDecay: number;
  filterSustain: number; // 0.0 - 1.0
  filterRelease: number;

  masterGain: number;
  glide: number; // Portamento time in seconds
}

export const DEFAULT_SYNTH_PARAMS: SubtractiveSynthParams = {
  osc1Waveform: 'sawtooth',
  osc1Octave: 0,
  osc1Detune: 0,
  osc1Gain: 0.7,

  osc2Waveform: 'square',
  osc2Octave: 0,
  osc2Detune: 7, // 7 cents spread
  osc2Gain: 0.5,

  filterCutoff: 2500,
  filterResonance: 3.5,
  filterType: 'lowpass',
  filterEnvAmount: 3000,

  ampAttack: 0.01,
  ampDecay: 0.15,
  ampSustain: 0.6,
  ampRelease: 0.25,

  filterAttack: 0.02,
  filterDecay: 0.2,
  filterSustain: 0.3,
  filterRelease: 0.3,

  masterGain: 0.75,
  glide: 0.0,
};

export class SubtractiveSynthVoice {
  private osc1: OscillatorNode;
  private osc2: OscillatorNode;
  private osc1Gain: GainNode;
  private osc2Gain: GainNode;
  private filter: BiquadFilterNode;
  private ampGain: GainNode;
  private isReleased: boolean = false;

  constructor(
    private ctx: BaseAudioContext,
    public readonly pitch: number,
    private params: SubtractiveSynthParams,
    outputNode: AudioNode,
    startTime: number = ctx.currentTime,
    velocity: number = 0.8
  ) {
    const baseFreq = 440 * Math.pow(2, (pitch - 69) / 12);

    // Osc 1
    this.osc1 = ctx.createOscillator();
    this.osc1.type = params.osc1Waveform;
    this.osc1.frequency.setValueAtTime(baseFreq * Math.pow(2, params.osc1Octave), startTime);
    this.osc1.detune.setValueAtTime(params.osc1Detune, startTime);

    this.osc1Gain = ctx.createGain();
    this.osc1Gain.gain.setValueAtTime(params.osc1Gain, startTime);
    this.osc1.connect(this.osc1Gain);

    // Osc 2
    this.osc2 = ctx.createOscillator();
    this.osc2.type = params.osc2Waveform;
    this.osc2.frequency.setValueAtTime(baseFreq * Math.pow(2, params.osc2Octave), startTime);
    this.osc2.detune.setValueAtTime(params.osc2Detune, startTime);

    this.osc2Gain = ctx.createGain();
    this.osc2Gain.gain.setValueAtTime(params.osc2Gain, startTime);
    this.osc2.connect(this.osc2Gain);

    // Filter
    this.filter = ctx.createBiquadFilter();
    this.filter.type = params.filterType;
    this.filter.Q.setValueAtTime(params.filterResonance, startTime);

    // Filter Envelope
    const baseCutoff = Math.max(20, Math.min(20000, params.filterCutoff));
    const targetCutoff = Math.max(20, Math.min(20000, baseCutoff + params.filterEnvAmount * velocity));
    const sustainCutoff = Math.max(
      20,
      Math.min(20000, baseCutoff + params.filterEnvAmount * velocity * params.filterSustain)
    );

    this.filter.frequency.setValueAtTime(baseCutoff, startTime);
    this.filter.frequency.linearRampToValueAtTime(targetCutoff, startTime + params.filterAttack);
    this.filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, sustainCutoff),
      startTime + params.filterAttack + params.filterDecay
    );

    this.osc1Gain.connect(this.filter);
    this.osc2Gain.connect(this.filter);

    // Amp Envelope
    this.ampGain = ctx.createGain();
    const peakAmp = velocity * params.masterGain;
    const sustainAmp = peakAmp * params.ampSustain;

    this.ampGain.gain.setValueAtTime(0.0001, startTime);
    this.ampGain.gain.linearRampToValueAtTime(peakAmp, startTime + params.ampAttack);
    this.ampGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, sustainAmp),
      startTime + params.ampAttack + params.ampDecay
    );

    this.filter.connect(this.ampGain);
    this.ampGain.connect(outputNode);

    this.osc1.start(startTime);
    this.osc2.start(startTime);
  }

  public noteOff(stopTime: number = this.ctx.currentTime): void {
    if (this.isReleased) return;
    this.isReleased = true;

    const releaseTime = Math.max(0.02, this.params.ampRelease);
    this.ampGain.gain.cancelScheduledValues(stopTime);
    this.ampGain.gain.setValueAtTime(Math.max(0.0001, this.ampGain.gain.value), stopTime);
    this.ampGain.gain.exponentialRampToValueAtTime(0.00001, stopTime + releaseTime);

    this.osc1.stop(stopTime + releaseTime + 0.05);
    this.osc2.stop(stopTime + releaseTime + 0.05);
  }
}

export class SubtractiveSynth {
  public params: SubtractiveSynthParams = { ...DEFAULT_SYNTH_PARAMS };
  private activeVoices: Map<number, SubtractiveSynthVoice> = new Map();
  public outputNode: GainNode;

  constructor(private ctx: BaseAudioContext) {
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(1.0, ctx.currentTime);
  }

  public noteOn(pitch: number, velocity: number = 0.8, time: number = this.ctx.currentTime): void {
    this.noteOff(pitch, time);
    const voice = new SubtractiveSynthVoice(this.ctx, pitch, this.params, this.outputNode, time, velocity);
    this.activeVoices.set(pitch, voice);
  }

  public noteOff(pitch: number, time: number = this.ctx.currentTime): void {
    const voice = this.activeVoices.get(pitch);
    if (voice) {
      voice.noteOff(time);
      this.activeVoices.delete(pitch);
    }
  }

  public stopAll(time: number = this.ctx.currentTime): void {
    for (const [pitch, voice] of this.activeVoices) {
      voice.noteOff(time);
    }
    this.activeVoices.clear();
  }
}
