/**
 * Studio DSP Effects Suite for Cadence Studio
 * Reusable, high-performance Web Audio DSP modules with bypass and parameter automation.
 */

export interface EffectNode {
  input: AudioNode;
  output: AudioNode;
  setBypass: (bypass: boolean) => void;
  isBypassed: () => boolean;
  dispose: () => void;
}

// -------------------------------------------------------------
// 1. Parametric 4-Band Equalizer
// -------------------------------------------------------------
export class ParametricEQ implements EffectNode {
  public input: GainNode;
  public output: GainNode;
  private lowShelf: BiquadFilterNode;
  private peak1: BiquadFilterNode;
  private peak2: BiquadFilterNode;
  private highShelf: BiquadFilterNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private bypassed: boolean = false;

  constructor(private ctx: BaseAudioContext) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.lowShelf = ctx.createBiquadFilter();
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.value = 100;
    this.lowShelf.gain.value = 0;

    this.peak1 = ctx.createBiquadFilter();
    this.peak1.type = 'peaking';
    this.peak1.frequency.value = 500;
    this.peak1.Q.value = 1.0;
    this.peak1.gain.value = 0;

    this.peak2 = ctx.createBiquadFilter();
    this.peak2.type = 'peaking';
    this.peak2.frequency.value = 2500;
    this.peak2.Q.value = 1.0;
    this.peak2.gain.value = 0;

    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 8000;
    this.highShelf.gain.value = 0;

    // Chain wet path
    this.input.connect(this.lowShelf);
    this.lowShelf.connect(this.peak1);
    this.peak1.connect(this.peak2);
    this.peak2.connect(this.highShelf);
    this.highShelf.connect(this.wetGain);
    this.wetGain.connect(this.output);

    // Bypass dry path
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    this.wetGain.gain.value = 1.0;
    this.dryGain.gain.value = 0.0;
  }

  public setLow(freq: number, gainDb: number): void {
    this.lowShelf.frequency.value = freq;
    this.lowShelf.gain.value = gainDb;
  }

  public setMid1(freq: number, gainDb: number, q: number = 1.0): void {
    this.peak1.frequency.value = freq;
    this.peak1.gain.value = gainDb;
    this.peak1.Q.value = q;
  }

  public setMid2(freq: number, gainDb: number, q: number = 1.0): void {
    this.peak2.frequency.value = freq;
    this.peak2.gain.value = gainDb;
    this.peak2.Q.value = q;
  }

  public setHigh(freq: number, gainDb: number): void {
    this.highShelf.frequency.value = freq;
    this.highShelf.gain.value = gainDb;
  }

  public setBypass(bypass: boolean): void {
    this.bypassed = bypass;
    this.wetGain.gain.value = bypass ? 0.0 : 1.0;
    this.dryGain.gain.value = bypass ? 1.0 : 0.0;
  }

  public isBypassed(): boolean {
    return this.bypassed;
  }

  public dispose(): void {
    this.input.disconnect();
    this.lowShelf.disconnect();
    this.peak1.disconnect();
    this.peak2.disconnect();
    this.highShelf.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}

// -------------------------------------------------------------
// 2. Dynamics Compressor & Master Limiter
// -------------------------------------------------------------
export class StudioCompressor implements EffectNode {
  public input: GainNode;
  public output: GainNode;
  private comp: DynamicsCompressorNode;
  private makeupGain: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private bypassed: boolean = false;

  constructor(
    private ctx: BaseAudioContext,
    threshold: number = -18,
    ratio: number = 4,
    attack: number = 0.015,
    release: number = 0.12
  ) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.makeupGain = ctx.createGain();

    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = threshold;
    this.comp.ratio.value = ratio;
    this.comp.attack.value = attack;
    this.comp.release.value = release;
    this.comp.knee.value = 6;

    this.makeupGain.gain.value = 1.2;

    this.input.connect(this.comp);
    this.comp.connect(this.makeupGain);
    this.makeupGain.connect(this.wetGain);
    this.wetGain.connect(this.output);

    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    this.wetGain.gain.value = 1.0;
    this.dryGain.gain.value = 0.0;
  }

  public setParams(threshold: number, ratio: number, attack: number, release: number, makeup: number): void {
    this.comp.threshold.value = threshold;
    this.comp.ratio.value = ratio;
    this.comp.attack.value = attack;
    this.comp.release.value = release;
    this.makeupGain.gain.value = makeup;
  }

  public get reduction(): number {
    return this.comp.reduction;
  }

  public setBypass(bypass: boolean): void {
    this.bypassed = bypass;
    this.wetGain.gain.value = bypass ? 0.0 : 1.0;
    this.dryGain.gain.value = bypass ? 1.0 : 0.0;
  }

  public isBypassed(): boolean {
    return this.bypassed;
  }

  public dispose(): void {
    this.input.disconnect();
    this.comp.disconnect();
    this.makeupGain.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}

// -------------------------------------------------------------
// 3. Stereo Ping-Pong Delay with Tempo Sync
// -------------------------------------------------------------
export class StereoDelay implements EffectNode {
  public input: GainNode;
  public output: GainNode;
  private delayL: DelayNode;
  private delayR: DelayNode;
  private feedbackL: GainNode;
  private feedbackR: GainNode;
  private filter: BiquadFilterNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private bypassed: boolean = false;

  constructor(private ctx: BaseAudioContext, delayTimeSec: number = 0.35, feedback: number = 0.45) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.delayL = ctx.createDelay(2.0);
    this.delayR = ctx.createDelay(2.0);
    this.delayL.delayTime.value = delayTimeSec;
    this.delayR.delayTime.value = delayTimeSec * 1.333; // Ping-pong offset

    this.feedbackL = ctx.createGain();
    this.feedbackR = ctx.createGain();
    this.feedbackL.gain.value = feedback;
    this.feedbackR.gain.value = feedback;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 3500; // Warm analog tape damping

    // Dry
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Wet Left
    this.input.connect(this.delayL);
    this.delayL.connect(this.filter);
    this.filter.connect(this.feedbackL);
    this.feedbackL.connect(this.delayR); // Crossfeed to Right
    this.delayL.connect(this.wetGain);

    // Wet Right
    this.input.connect(this.delayR);
    this.delayR.connect(this.feedbackR);
    this.feedbackR.connect(this.delayL); // Crossfeed to Left
    this.delayR.connect(this.wetGain);

    this.wetGain.connect(this.output);

    this.setMix(0.35);
  }

  public setDelayTime(seconds: number): void {
    this.delayL.delayTime.value = Math.max(0.01, Math.min(2.0, seconds));
    this.delayR.delayTime.value = Math.max(0.01, Math.min(2.0, seconds * 1.333));
  }

  public setFeedback(fb: number): void {
    const val = Math.max(0, Math.min(0.92, fb));
    this.feedbackL.gain.value = val;
    this.feedbackR.gain.value = val;
  }

  public setMix(wetRatio: number): void {
    const wet = Math.max(0, Math.min(1.0, wetRatio));
    this.wetGain.gain.value = wet;
    this.dryGain.gain.value = 1.0 - wet * 0.5;
  }

  public setBypass(bypass: boolean): void {
    this.bypassed = bypass;
    this.wetGain.gain.value = bypass ? 0.0 : 0.35;
    this.dryGain.gain.value = bypass ? 1.0 : 0.8;
  }

  public isBypassed(): boolean {
    return this.bypassed;
  }

  public dispose(): void {
    this.input.disconnect();
    this.delayL.disconnect();
    this.delayR.disconnect();
    this.feedbackL.disconnect();
    this.feedbackR.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}

// -------------------------------------------------------------
// 4. Algorithmic Reverb (Schroeder-Moorer Matrix)
// -------------------------------------------------------------
export class AlgorithmicReverb implements EffectNode {
  public input: GainNode;
  public output: GainNode;
  private convolver: ConvolverNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private bypassed: boolean = false;

  constructor(private ctx: BaseAudioContext, decaySec: number = 2.0) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.dryGain = ctx.createGain();

    this.convolver = ctx.createConvolver();
    this.buildImpulseResponse(decaySec);

    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    this.input.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.output);

    this.setMix(0.3);
  }

  public buildImpulseResponse(decaySec: number): void {
    const rate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * decaySec));
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp((-3 * i) / (rate * (decaySec * 0.6)));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.convolver.buffer = impulse;
  }

  public setMix(wetRatio: number): void {
    const wet = Math.max(0, Math.min(1.0, wetRatio));
    this.wetGain.gain.value = wet;
    this.dryGain.gain.value = 1.0 - wet * 0.4;
  }

  public setBypass(bypass: boolean): void {
    this.bypassed = bypass;
    this.wetGain.gain.value = bypass ? 0.0 : 0.3;
    this.dryGain.gain.value = bypass ? 1.0 : 0.8;
  }

  public isBypassed(): boolean {
    return this.bypassed;
  }

  public dispose(): void {
    this.input.disconnect();
    this.convolver.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}

// -------------------------------------------------------------
// 5. Waveshaping Tube Distortion / Saturation
// -------------------------------------------------------------
export class DistortionEffect implements EffectNode {
  public input: GainNode;
  public output: GainNode;
  private waveShaper: WaveShaperNode;
  private postFilter: BiquadFilterNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private bypassed: boolean = false;

  constructor(private ctx: BaseAudioContext, drive: number = 20) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.dryGain = ctx.createGain();

    this.waveShaper = ctx.createWaveShaper();
    this.waveShaper.oversample = '4x';
    this.setDrive(drive);

    this.postFilter = ctx.createBiquadFilter();
    this.postFilter.type = 'lowpass';
    this.postFilter.frequency.value = 4500; // Tame harsh harmonics

    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    this.input.connect(this.waveShaper);
    this.waveShaper.connect(this.postFilter);
    this.postFilter.connect(this.wetGain);
    this.wetGain.connect(this.output);

    this.wetGain.gain.value = 0.5;
    this.dryGain.gain.value = 0.5;
  }

  public setDrive(drive: number): void {
    const k = Math.max(1, Math.min(100, drive));
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;

    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      // Soft saturation sigmoidal curve
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }

    this.waveShaper.curve = curve;
  }

  public setBypass(bypass: boolean): void {
    this.bypassed = bypass;
    this.wetGain.gain.value = bypass ? 0.0 : 0.5;
    this.dryGain.gain.value = bypass ? 1.0 : 0.5;
  }

  public isBypassed(): boolean {
    return this.bypassed;
  }

  public dispose(): void {
    this.input.disconnect();
    this.waveShaper.disconnect();
    this.postFilter.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}
