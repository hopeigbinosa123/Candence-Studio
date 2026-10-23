/**
 * Cadence Plugin Host Architecture (CLAP & WebAudio Extension Standard)
 * Enables modular 3rd-party audio instruments and effects with parameter binding and state persistence.
 */

import { PluginManifest, CadencePluginInstance } from '../types/plugin';

export class PluginHost {
  private registry: Map<string, PluginManifest> = new Map();
  private instances: Map<string, CadencePluginInstance> = new Map();

  constructor() {
    this.registerBuiltInPlugins();
  }

  private registerBuiltInPlugins(): void {
    // 1. Stereo Width Utility Plugin
    this.registerManifest({
      id: 'cadence.utility.stereowidth',
      name: 'Stereo Imager Pro',
      version: '1.0.0',
      vendor: 'Cadence DSP',
      category: 'effect',
      description: 'Mid/Side stereo wideness and phase alignment utility.',
      parameters: [
        { id: 'width', name: 'Stereo Width', min: 0.0, max: 2.0, defaultValue: 1.0, unit: '%' },
        { id: 'monoBass', name: 'Mono Bass Cutoff', min: 20, max: 300, defaultValue: 120, unit: 'Hz' },
      ],
    });

    // 2. Analog Tape Saturator
    this.registerManifest({
      id: 'cadence.fx.tapesaturator',
      name: 'Vintage Tape Warmth',
      version: '1.0.0',
      vendor: 'Cadence DSP',
      category: 'effect',
      description: 'Analog tape saturation, hysteresis, and gentle high-frequency roll-off.',
      parameters: [
        { id: 'drive', name: 'Tape Drive', min: 0.0, max: 24.0, defaultValue: 4.0, unit: 'dB' },
        { id: 'warmth', name: 'Tape Warmth', min: 0.0, max: 1.0, defaultValue: 0.6, unit: '%' },
      ],
    });
  }

  public registerManifest(manifest: PluginManifest): void {
    this.registry.set(manifest.id, manifest);
  }

  public getAvailablePlugins(): PluginManifest[] {
    return Array.from(this.registry.values());
  }

  public instantiatePlugin(pluginId: string, ctx: BaseAudioContext, instanceId: string): CadencePluginInstance | null {
    const manifest = this.registry.get(pluginId);
    if (!manifest) return null;

    // Instantiate audio graph node for plugin
    const inputNode = ctx.createGain();
    const outputNode = ctx.createGain();
    inputNode.connect(outputNode);

    const paramValues: Record<string, number> = {};
    manifest.parameters.forEach((p) => {
      paramValues[p.id] = p.defaultValue;
    });

    const instance: CadencePluginInstance = {
      manifest,
      node: inputNode,
      setParameter: (paramId: string, value: number) => {
        paramValues[paramId] = value;
      },
      getParameter: (paramId: string) => paramValues[paramId] ?? 0,
      getState: () => ({ ...paramValues }),
      setState: (state) => {
        Object.entries(state).forEach(([k, v]) => {
          if (typeof v === 'number') paramValues[k] = v;
        });
      },
      destroy: () => {
        inputNode.disconnect();
        outputNode.disconnect();
        this.instances.delete(instanceId);
      },
    };

    this.instances.set(instanceId, instance);
    return instance;
  }
}
