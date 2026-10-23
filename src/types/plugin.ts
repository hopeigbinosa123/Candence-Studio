/**
 * Cadence Plugin Interface (CLAP & WebAudio Extension Architecture)
 */

export type PluginCategory = 'instrument' | 'effect' | 'analyzer' | 'utility';

export interface PluginParameterDescriptor {
  id: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
  step?: number;
  unit?: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  vendor: string;
  category: PluginCategory;
  description: string;
  parameters: PluginParameterDescriptor[];
}

export interface CadencePluginInstance {
  manifest: PluginManifest;
  node: AudioNode;
  setParameter: (paramId: string, value: number) => void;
  getParameter: (paramId: string) => number;
  getState: () => Record<string, number | string | boolean>;
  setState: (state: Record<string, number | string | boolean>) => void;
  destroy: () => void;
}
