/**
 * Vintage Electric Piano (FM Tine Synth) for Cadence Studio
 * Recreates classic Rhodes / Wurlitzer electric piano sounds using frequency modulation.
 */

export class ElectricPianoVoice {
  private carrier: OscillatorNode;
  private modulator: OscillatorNode;
  private modGain: GainNode;
  private ampGain: GainNode;

  constructor(
    private ctx: BaseAudioContext,
    public readonly pitch: number,
    outputNode: AudioNode,
    startTime: number = ctx.currentTime,
    velocity: number = 0.8
  ) {
    const baseFreq = 440 * Math.pow(2, (pitch - 69) / 12);

    // Modulator (harmonic ratio 14:1 for tine chime + 1:1 body)
    this.modulator = ctx.createOscillator();
    this.modulator.type = 'sine';
    this.modulator.frequency.setValueAtTime(baseFreq * 14.0, startTime);

    this.modGain = ctx.createGain();
    const modDepth = baseFreq * 2.5 * velocity;
    this.modGain.gain.setValueAtTime(modDepth, startTime);
    this.modGain.gain.exponentialRampToValueAtTime(0.1, startTime + 0.15); // Chime decays rapidly

    this.modulator.connect(this.modGain);

    // Carrier
    this.carrier = ctx.createOscillator();
    this.carrier.type = 'sine';
    this.carrier.frequency.setValueAtTime(baseFreq, startTime);
    this.modGain.connect(this.carrier.frequency);

    // Amplitude
    this.ampGain = ctx.createGain();
    this.ampGain.gain.setValueAtTime(0.0001, startTime);
    this.ampGain.gain.linearRampToValueAtTime(velocity * 0.8, startTime + 0.008);
    this.ampGain.gain.exponentialRampToValueAtTime(velocity * 0.25, startTime + 0.8);
    this.ampGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.5);

    this.carrier.connect(this.ampGain);
    this.ampGain.connect(outputNode);

    this.modulator.start(startTime);
    this.carrier.start(startTime);
  }

  public noteOff(stopTime: number = this.ctx.currentTime): void {
    this.ampGain.gain.cancelScheduledValues(stopTime);
    this.ampGain.gain.setValueAtTime(Math.max(0.0001, this.ampGain.gain.value), stopTime);
    this.ampGain.gain.exponentialRampToValueAtTime(0.00001, stopTime + 0.12);

    this.carrier.stop(stopTime + 0.15);
    this.modulator.stop(stopTime + 0.15);
  }
}

export class ElectricPiano {
  public outputNode: GainNode;
  private activeVoices: Map<number, ElectricPianoVoice> = new Map();

  constructor(private ctx: BaseAudioContext) {
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(0.9, ctx.currentTime);
  }

  public noteOn(pitch: number, velocity: number = 0.8, time: number = this.ctx.currentTime): void {
    this.noteOff(pitch, time);
    const voice = new ElectricPianoVoice(this.ctx, pitch, this.outputNode, time, velocity);
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
