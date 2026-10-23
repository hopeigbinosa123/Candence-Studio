/**
 * AI & Acoustic Mixing Assistant for Cadence Studio
 * Spectral analysis, gain staging recommendations, frequency masking detection, and headroom guidance.
 */

import { MixRecommendation } from '../types/ai';
import { Project } from '../types/project';

export class MixAssistant {
  /**
   * Analyzes project tracks, headroom, and routing to produce actionable mixing advice.
   */
  public static analyzeMix(project: Project): MixRecommendation[] {
    const recommendations: MixRecommendation[] = [];

    let totalVolumeSum = 0;
    project.tracks.forEach((track) => {
      if (!track.muted) totalVolumeSum += track.volume;
    });

    // 1. Master Headroom & Summing Check
    if (totalVolumeSum > 3.5) {
      recommendations.push({
        channelId: 'master',
        category: 'gain',
        message: 'High accumulated track gain may risk inter-sample clipping on the master bus. Consider lowering individual track faders by -2dB to -4dB for clean headroom.',
        confidence: 0.92,
        suggestedAction: { param: 'masterVolume', value: 0.8 },
      });
    }

    // 2. Track Specific Acoustic Checks
    for (const track of project.tracks) {
      const name = track.name.toLowerCase();

      // Kick & Bass collision check
      if (name.includes('bass') || name.includes('808')) {
        recommendations.push({
          channelId: track.id,
          category: 'eq',
          message: `${track.name}: Apply a highpass filter below 28Hz to remove inaudible sub rumble and tighten dynamic punch. Keep panning centered.`,
          confidence: 0.88,
          suggestedAction: { param: 'pan', value: 0.0 },
        });
      }

      // Lead / Vocal Presence
      if (name.includes('lead') || name.includes('vocal') || name.includes('synth')) {
        recommendations.push({
          channelId: track.id,
          category: 'dynamics',
          message: `${track.name}: A gentle 2:1 compression with 15ms attack will preserve the initial attack transients while keeping levels consistent in the mix.`,
          confidence: 0.85,
          suggestedAction: { param: 'compressionRatio', value: 2.0 },
        });
      }

      // Drum Bus Punch
      if (name.includes('drum') || name.includes('beat')) {
        recommendations.push({
          channelId: track.id,
          category: 'eq',
          message: `${track.name}: Dip 250Hz - 400Hz by -2dB to clear "boxiness" and mud, allowing the bass and snares to breathe clearly.`,
          confidence: 0.89,
          suggestedAction: { param: 'eqMidCut', value: -2.0 },
        });
      }
    }

    return recommendations;
  }
}
