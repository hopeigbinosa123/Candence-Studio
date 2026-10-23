/**
 * MIDI Hardware & Device Subsystem for Cadence Studio
 * Web MIDI API integration with hotplug detection, controller mapping, and virtual loopback.
 */

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export type MidiNoteListener = (pitch: number, velocity: number, isNoteOn: boolean) => void;

export class MidiManager {
  private access: any = null;
  private inputDevices: MidiDevice[] = [];
  private listeners: Set<MidiNoteListener> = new Set();
  public isSupported: boolean = false;

  constructor() {
    this.initMidi();
  }

  private async initMidi(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      try {
        this.access = await (navigator as any).requestMIDIAccess({ sysex: false });
        this.isSupported = true;
        this.scanDevices();

        this.access.onstatechange = () => {
          this.scanDevices();
        };
      } catch (err) {
        console.warn('Web MIDI Access not granted or unsupported:', err);
      }
    }
  }

  public scanDevices(): MidiDevice[] {
    this.inputDevices = [];
    if (!this.access) return this.inputDevices;

    const inputs = this.access.inputs.values();
    for (const input of inputs) {
      const dev: MidiDevice = {
        id: input.id,
        name: input.name || 'External MIDI Device',
        manufacturer: input.manufacturer || 'Generic',
        state: input.state,
      };
      this.inputDevices.push(dev);

      // Attach message handler
      input.onmidimessage = (event: any) => {
        this.handleMidiMessage(event.data);
      };
    }
    return this.inputDevices;
  }

  public getDevices(): MidiDevice[] {
    return [...this.inputDevices];
  }

  public handleMidiMessage(data: Uint8Array): void {
    if (data.length < 3) return;

    const status = data[0] & 0xf0;
    const pitch = data[1];
    const velocity = data[2] / 127.0;

    if (status === 0x90 && data[2] > 0) {
      // Note On
      this.notify(pitch, velocity, true);
    } else if (status === 0x80 || (status === 0x90 && data[2] === 0)) {
      // Note Off
      this.notify(pitch, 0, false);
    }
  }

  /**
   * Virtual test trigger for unit tests or computer keyboard note input
   */
  public triggerVirtualNote(pitch: number, velocity: number, isNoteOn: boolean): void {
    this.notify(pitch, velocity, isNoteOn);
  }

  public subscribe(listener: MidiNoteListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(pitch: number, velocity: number, isNoteOn: boolean): void {
    for (const listener of this.listeners) {
      listener(pitch, velocity, isNoteOn);
    }
  }
}
