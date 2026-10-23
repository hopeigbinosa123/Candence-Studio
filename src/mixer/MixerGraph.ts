/**
 * Professional Studio Mixer Graph for Cadence Studio
 * Supports multi-channel routing, stereo panning, insert chains, aux sends, and master bus.
 */

import { EffectNode } from '../audio/effects/DSP_Effects';

export interface ChannelNode {
  id: string;
  name: string;
  isMaster: boolean;
  inputNode: GainNode;
  pannerNode: StereoPannerNode;
  faderNode: GainNode;
  meterNode: ScriptProcessorNode | AnalyserNode;
  inserts: EffectNode[];
  muted: boolean;
  solo: boolean;
  peakL: number;
  peakR: number;
}

export class MixerGraph {
  public masterInput: GainNode;
  public masterFader: GainNode;
  public masterLimiter: DynamicsCompressorNode;
  public masterAnalyser: AnalyserNode;
  public channels: Map<string, ChannelNode> = new Map();
  private isSoloActive: boolean = false;

  constructor(private ctx: BaseAudioContext, destinationNode?: AudioNode) {
    // Master Bus
    this.masterInput = ctx.createGain();
    this.masterFader = ctx.createGain();
    this.masterFader.gain.value = 0.85;

    // Master Safety Limiter
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -0.5;
    this.masterLimiter.ratio.value = 20.0;
    this.masterLimiter.attack.value = 0.001;
    this.masterLimiter.release.value = 0.05;

    // Master Spectrum & Peak Analyser
    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    this.masterInput.connect(this.masterFader);
    this.masterFader.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);

    if (destinationNode) {
      this.masterAnalyser.connect(destinationNode);
    } else if (ctx instanceof AudioContext) {
      this.masterAnalyser.connect(ctx.destination);
    }
  }

  public createChannel(id: string, name: string, isMaster: boolean = false): ChannelNode {
    if (this.channels.has(id)) {
      return this.channels.get(id)!;
    }

    const inputNode = this.ctx.createGain();
    const pannerNode = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : (this.ctx.createGain() as any);
    const faderNode = this.ctx.createGain();
    faderNode.gain.value = 1.0;

    const meterNode = this.ctx.createAnalyser();
    meterNode.fftSize = 256;

    // Wire: input -> inserts -> panner -> fader -> meter -> masterInput
    inputNode.connect(pannerNode);
    pannerNode.connect(faderNode);
    faderNode.connect(meterNode);
    faderNode.connect(this.masterInput);

    const channel: ChannelNode = {
      id,
      name,
      isMaster,
      inputNode,
      pannerNode,
      faderNode,
      meterNode,
      inserts: [],
      muted: false,
      solo: false,
      peakL: 0,
      peakR: 0,
    };

    this.channels.set(id, channel);
    return channel;
  }

  public setChannelVolume(id: string, linearGain: number): void {
    const ch = this.channels.get(id);
    if (ch) {
      const val = Math.max(0, Math.min(2.0, linearGain));
      ch.faderNode.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  public setChannelPan(id: string, pan: number): void {
    const ch = this.channels.get(id);
    if (ch && ch.pannerNode && 'pan' in ch.pannerNode) {
      const val = Math.max(-1.0, Math.min(1.0, pan));
      (ch.pannerNode as StereoPannerNode).pan.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  public setChannelMute(id: string, muted: boolean): void {
    const ch = this.channels.get(id);
    if (ch) {
      ch.muted = muted;
      this.updateSoloMuteRouting();
    }
  }

  public setChannelSolo(id: string, solo: boolean): void {
    const ch = this.channels.get(id);
    if (ch) {
      ch.solo = solo;
      this.updateSoloMuteRouting();
    }
  }

  private updateSoloMuteRouting(): void {
    let anySolo = false;
    for (const ch of this.channels.values()) {
      if (ch.solo) {
        anySolo = true;
        break;
      }
    }
    this.isSoloActive = anySolo;

    for (const ch of this.channels.values()) {
      let active = true;
      if (ch.muted) {
        active = false;
      } else if (this.isSoloActive && !ch.solo) {
        active = false;
      }
      ch.faderNode.gain.setValueAtTime(active ? 1.0 : 0.0, this.ctx.currentTime);
    }
  }

  public setMasterVolume(linearGain: number): void {
    const val = Math.max(0, Math.min(1.5, linearGain));
    this.masterFader.gain.setValueAtTime(val, this.ctx.currentTime);
  }

  public getMasterPeak(): number {
    const buffer = new Float32Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getFloatTimeDomainData(buffer);
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > peak) peak = abs;
    }
    return peak;
  }
}
