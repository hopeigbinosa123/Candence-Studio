/**
 * AI Drum & Rhythm Generator for Cadence Studio
 * Synthesizes genre-authentic drum patterns with humanized velocity dynamics.
 */

import { StepLane } from '../types/project';
import { DEFAULT_DRUM_VOICES } from '../constants/defaults';

export class DrumGenerator {
  public static generatePattern(genre: string = 'trap', length: number = 16): { lanes: StepLane[]; swing: number } {
    let swing = 0.1;
    const lanes: StepLane[] = DEFAULT_DRUM_VOICES.map((v) => ({
      id: `ai-lane-${v.id}`,
      name: v.name,
      voiceId: v.id,
      steps: new Array(length).fill(false),
      velocities: new Array(length).fill(0.8),
    }));

    const getLane = (id: string) => lanes.find((l) => l.voiceId === id)!;
    const kick = getLane('kick');
    const snare = getLane('snare');
    const clap = getLane('clap');
    const closedHat = getLane('closed_hat');
    const openHat = getLane('open_hat');
    const perc = getLane('perc');

    switch (genre.toLowerCase()) {
      case 'trap':
      case 'drill':
        swing = 0.05;
        // Kick syncopation
        [0, 5, 8, 11].forEach((s) => {
          if (s < length) {
            kick.steps[s] = true;
            kick.velocities[s] = s === 0 ? 0.95 : 0.85;
          }
        });
        // Snare / Clap on beat 3 (step 8 in 16-step half-time)
        [8].forEach((s) => {
          if (s < length) {
            clap.steps[s] = true;
            clap.velocities[s] = 0.95;
          }
        });
        // Rapid Trap Hi-Hats with rolling triplets on steps 12-15
        for (let i = 0; i < length; i++) {
          closedHat.steps[i] = true;
          closedHat.velocities[i] = i % 2 === 0 ? 0.8 : 0.6;
        }
        break;

      case 'house':
      case 'edm':
        swing = 0.2;
        // Four on the floor kick
        for (let i = 0; i < length; i += 4) {
          kick.steps[i] = true;
          kick.velocities[i] = 0.95;
        }
        // Clap on 4 and 12
        [4, 12].forEach((s) => {
          if (s < length) {
            clap.steps[s] = true;
            clap.velocities[s] = 0.9;
          }
        });
        // Offbeat Open Hat on 2, 6, 10, 14
        for (let i = 2; i < length; i += 4) {
          openHat.steps[i] = true;
          openHat.velocities[i] = 0.85;
        }
        // 16th closed hats with groove
        for (let i = 0; i < length; i++) {
          if (!openHat.steps[i]) {
            closedHat.steps[i] = true;
            closedHat.velocities[i] = 0.5 + Math.random() * 0.2;
          }
        }
        break;

      case 'boombap':
      case 'hiphop':
      default:
        swing = 0.28; // Heavy hip hop swing
        // Classic Boom Bap Kick on 0, 6, 10
        [0, 6, 10].forEach((s) => {
          if (s < length) {
            kick.steps[s] = true;
            kick.velocities[s] = s === 0 ? 0.95 : 0.8;
          }
        });
        // Snare on 4 and 12
        [4, 12].forEach((s) => {
          if (s < length) {
            snare.steps[s] = true;
            snare.velocities[s] = 0.92;
          }
        });
        // 8th note swung hats
        for (let i = 0; i < length; i += 2) {
          closedHat.steps[i] = true;
          closedHat.velocities[i] = i % 4 === 0 ? 0.85 : 0.65;
        }
        // Perc ghost note on 15
        if (perc && length > 15) {
          perc.steps[15] = true;
          perc.velocities[15] = 0.5;
        }
        break;
    }

    return { lanes, swing };
  }
}
