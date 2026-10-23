/**
 * Analog Modeling Drum Synthesizer for Cadence Studio
 * Generates Kick 808, Snare 909, Clap, Closed/Open HiHats, Toms, and Percussion.
 */

export class DrumSynth {
  public outputNode: GainNode;

  constructor(private ctx: BaseAudioContext) {
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(1.0, ctx.currentTime);
  }

  /**
   * 808-Style Sub Kick with punch transient and pitch drop
   */
  public triggerKick(time: number = this.ctx.currentTime, velocity: number = 0.9): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Punch transient sweep: 160Hz -> 50Hz in 0.04s, then decay to 35Hz
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(52, time + 0.045);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.4);

    const amp = Math.max(0.001, velocity * 0.95);
    gain.gain.setValueAtTime(amp, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

    osc.connect(gain);
    gain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  /**
   * 909-Style Snare: Tonal body oscillator + noise burst
   */
  public triggerSnare(time: number = this.ctx.currentTime, velocity: number = 0.85): void {
    // 1. Tonal body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.08);

    oscGain.gain.setValueAtTime(velocity * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    osc.connect(oscGain);
    oscGain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.2);

    // 2. White noise snare wires
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * 0.25));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.65, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.outputNode);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.25);
  }

  /**
   * Hand Clap: 3 rapid impulse bursts + noise reverb tail
   */
  public triggerClap(time: number = this.ctx.currentTime, velocity: number = 0.8): void {
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * 0.3));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.setValueAtTime(2.5, time);

    const gain = this.ctx.createGain();
    // Burst 1
    gain.gain.setValueAtTime(velocity * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.01);
    // Burst 2
    gain.gain.setValueAtTime(velocity * 0.7, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.022);
    // Burst 3 + tail
    gain.gain.setValueAtTime(velocity * 0.85, time + 0.024);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    noise.start(time);
    noise.stop(time + 0.3);
  }

  /**
   * Hi-Hat: Metallic square cluster through highpass filter
   */
  public triggerHiHat(
    time: number = this.ctx.currentTime,
    open: boolean = false,
    velocity: number = 0.75
  ): void {
    // 6 metallic ratios (TR-808 fundamental frequencies)
    const ratios = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0];
    const decay = open ? 0.42 : 0.055;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(8000, time);
    bandpass.Q.setValueAtTime(1.5, time);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.outputNode);

    ratios.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(bandpass);
      osc.start(time);
      osc.stop(time + decay + 0.05);
    });
  }

  /**
   * Resonant Tom / Percussion
   */
  public triggerTom(time: number = this.ctx.currentTime, pitch: number = 110, velocity: number = 0.8): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(pitch, time + 0.07);

    gain.gain.setValueAtTime(velocity * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  /**
   * Dispatcher method to trigger by voice id
   */
  public triggerVoice(voiceId: string, time: number = this.ctx.currentTime, velocity: number = 0.8): void {
    switch (voiceId) {
      case 'kick':
        this.triggerKick(time, velocity);
        break;
      case 'snare':
        this.triggerSnare(time, velocity);
        break;
      case 'clap':
        this.triggerClap(time, velocity);
        break;
      case 'closed_hat':
        this.triggerHiHat(time, false, velocity);
        break;
      case 'open_hat':
        this.triggerHiHat(time, true, velocity);
        break;
      case 'tom':
        this.triggerTom(time, 110, velocity);
        break;
      case 'perc':
        this.triggerTom(time, 240, velocity);
        break;
      case 'crash':
        this.triggerHiHat(time, true, velocity * 1.1);
        break;
      default:
        this.triggerKick(time, velocity);
        break;
    }
  }
}
