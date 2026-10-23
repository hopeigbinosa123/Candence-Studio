# Cadence Studio

> **Next-Generation Open-Source All-in-One Digital Audio Workstation**  
> Uniting the accessible beat-making, step sequencing, and piano roll experience of FL Studio with the professional multitrack recording, audio editing, and precision mixing workflow of Cubase.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-25%20passed-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)]()
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)]()

---

## 🎹 Product Vision

**Cadence Studio** was created from the ground up to solve the fragmentation in modern digital music creation:
* Traditional DAWs like Cubase, Pro Tools, and Logic excel at linear recording, multitrack audio editing, and complex bus routing, but make fast beat-making and pattern sketching tedious.
* Beat-oriented DAWs like FL Studio excel at rapid drum programming and piano roll sketching, but can become disorganized when handling extensive vocal takes, multitrack audio recordings, and traditional mixing workflows.

**Cadence Studio bridges both worlds into one unified, elegant workspace.**

---

## 🌟 Key Features & Subsystems

### 1. Real-Time Audio Engine & Transport
* **Interactive Low-Latency Engine:** Built on Web Audio API and AudioWorklet standards with dedicated real-time audio thread scheduling.
* **Master Clock & Transport:** Sample-accurate clock converting seamlessly between musical bars, beats, 16th subdivisions, and floating-point audio samples.
* **Metronome & Loop Cycle:** High/low pitch click tones with seamless timeline looping and pre-count.

### 2. Beat-Making & Step Sequencer (FL Studio Workflow)
* **Classic Drum Lane Matrix:** Kick 808, Snare 909, Clap, Closed Hat, Open Hat, Toms, Percussion.
* **Groove & Swing Controls:** Configurable swing percentage delaying offbeat 16ths for authentic hip-hop, house, and funk feel.
* **Per-Step Velocity & Accents:** Dynamic velocity adjustments and instant sound auditioning without lag.

### 3. Piano Roll & MIDI Editing (Cubase Workflow)
* **Note Pitch-and-Time Canvas:** Full 88-key pitch span with snapping to 1/4, 1/8, 1/16, or 1/32 grid.
* **Musical Scale Highlighting:** Dimming out-of-scale notes for Major, Natural Minor, Harmonic Minor, Dorian, Pentatonic, and Blues scales.
* **Chord Assistant:** One-click insertion of Major, Minor, Dominant 7th, Minor 7th, and Suspended chords.
* **Standard MIDI File (SMF Format 0) Export:** Export your melodies and chord progressions directly to standard `.mid` files.

### 4. Multitrack Arrangement Timeline
* **Track Types:** Pattern tracks, MIDI/Instrument tracks, Audio tracks, and Group buses.
* **Timeline Controls:** Zooming, grid snapping, playhead scrubbing, track mute, solo, and record arming.
* **Clip Management:** Multi-clip movement, duplication, trimming, and color-coded organization.

### 5. Multitrack Audio Recording
* **Direct Hardware Capture:** Real microphone and audio interface input capture via `navigator.mediaDevices.getUserMedia`.
* **Zero Latency Monitoring:** Real-time peak level monitoring during recording.
* **Non-Destructive Takes:** Captured PCM audio buffers automatically populate audio clips on the timeline.

### 6. Dedicated Audio Editor
* **Waveform Visualization:** Interactive high-resolution sample canvas with region selection.
* **Destructive & Non-Destructive Editing:** Sample trimming, split, phase invert, and gain adjustment (-18dB to +18dB).
* **Peak Normalization:** 1-click normalization to -0.1 dB True Peak.
* **Reverse & Fades:** Offline buffer reversal, exponential fade-ins, and fade-outs.

### 7. Studio Mixing Console & Routing
* **Channel Strips:** Volume faders, rotary stereo pan, mute, solo, and live animated peak LED meters.
* **Effect Inserts Rack:** Multi-slot serial effect processing on every channel.
* **Master Safety Limiter:** Brickwall lookahead compressor preventing digital clipping on the master output.

### 8. Built-in Synthesizers & Instruments
* **Subtractive Synthesizer:** Dual multi-waveform anti-aliased oscillators (Saw, Square, Triangle, Sine), detune (cents), octave shift, 24dB resonant Moog-style ladder filter, filter envelope, and amp ADSR.
* **Drum Synthesizer:** Physical analog modeling of 808 and 909 drum voices (pitch-swept sub kicks, dual-tone snare body with noise burst, 6-oscillator metallic hi-hats, and multi-pulse claps).
* **Electric Piano:** 2-operator FM chime tine piano reproducing vintage Rhodes/Wurlitzer instruments.
* **Multi-Zone Sampler:** Sample playback, root pitch mapping, transposition, trimming, and ADSR envelope.

### 9. Studio DSP Effects Suite
* **4-Band Parametric EQ:** Low shelf, dual parametric peaking bands, high shelf with variable Q and frequency.
* **Studio Compressor:** Threshold (-60dB to 0dB), ratio (1:1 to 30:1), attack, release, knee, and makeup gain.
* **Ping-Pong Delay:** Independent L/R delay times, feedback, damping filter, and tempo sync.
* **Algorithmic Reverb:** Schroeder-Moorer matrix generating natural spatial diffusion with damping.
* **Tube Distortion:** Wave-shaping saturation curve with tone control and dry/wet blend.

### 10. Offline Audio Rendering & WAV Export
* **High-Fidelity Render Engine:** Non-blocking offline bouncing via `OfflineAudioContext`.
* **Format Flexibility:** 16-bit PCM, 24-bit PCM, and 32-bit Float WAV.
* **Sample Rates:** 44.1 kHz, 48 kHz, and 96 kHz.
* **Audiophile Dithering:** Triangular Probability Density Function (TPDF) noise shaping.

### 11. AI-Powered Studio Tools (100% Offline & Local)
* **Harmonic Progression Generator:** Generates genre-authentic chord progressions (Neo-Soul, Trap, Pop, EDM).
* **Melodic Motif Generator:** Generates contour-aware melodic phrases adhering to chosen musical scale.
* **Drum Rhythm Generator:** Generates style-authentic drum patterns with humanized velocity dynamics.
* **Acoustic Mix Diagnostic:** Analyzes low-end clash, headroom, and frequency masking to provide mixing advice.

### 12. Extensible Plugin Host Architecture
* Inspired by CLAP and WebAudio extension standards with parameter descriptor schema, presets, and state serialization.

---

## 🚀 Quickstart & Installation

### Prerequisites
* **Node.js** v20.0.0 or higher
* **npm** v10.0.0 or higher

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/cadence-audio/cadence-studio.git
cd cadence-studio

# Install dependencies
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Launch Desktop Application (Electron)
```bash
npm run app
```

### 4. Build Production Bundle
```bash
npm run build
```

### 5. Run Automated Tests
```bash
npm test
```

---

## ⌨️ Studio Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause Playback |
| <kbd>Esc</kbd> or <kbd>Home</kbd> | Stop Playback & Return to Beat 0 |
| <kbd>R</kbd> | Toggle Multitrack Recording |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save Project (`.cadence` format) |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | Open Existing Project |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo Edit |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo Edit |

---

## 📁 Project Structure

```
daw/
├── electron/
│   ├── main.cjs               # Native Electron desktop window & IPC
│   └── preload.cjs            # Secure Electron preload bridge
├── src/
│   ├── ai/
│   │   ├── ChordGenerator.ts  # Harmonic chord engine
│   │   ├── MelodyGenerator.ts # Contour-aware melodic engine
│   │   ├── DrumGenerator.ts   # Style-aware rhythmic pattern generator
│   │   └── MixAssistant.ts    # Acoustic analysis & mix diagnostic
│   ├── audio/
│   │   ├── AudioEngine.ts     # Core audio coordinator & lookahead scheduler
│   │   ├── Transport.ts       # Clock, BPM, timecode, loop, and metronome
│   │   ├── WavEncoder.ts      # 16/24/32-bit WAV binary encoder with TPDF dither
│   │   ├── OfflineRenderer.ts # Offline audio bouncing engine
│   │   ├── AudioRecorder.ts   # Hardware mic/line audio capture
│   │   ├── MidiManager.ts     # Web MIDI API integration
│   │   ├── instruments/
│   │   │   ├── SubtractiveSynth.ts # Dual osc, 24dB ladder filter, ADSR
│   │   │   ├── DrumSynth.ts        # 808/909 analog modeling drum synthesizer
│   │   │   ├── Sampler.ts          # Multi-zone sampler & pitch shifter
│   │   │   └── ElectricPiano.ts    # FM tine chime synthesizer
│   │   └── effects/
│   │       └── DSP_Effects.ts      # 4-band EQ, Compressor, Delay, Reverb, Distortion
│   ├── mixer/
│   │   └── MixerGraph.ts      # Multi-channel routing, faders, meters, master limiter
│   ├── sequencer/
│   │   ├── StepSequencer.ts   # FL Studio style step sequencer engine
│   │   └── PianoRollEngine.ts # Cubase style note scheduler & MIDI export
│   ├── automation/
│   │   └── AutomationEngine.ts# Multi-lane breakpoint envelopes & interpolation
│   ├── storage/
│   │   └── ProjectManager.ts  # Native .cadence JSON persistence & undo/redo stack
│   ├── plugins/
│   │   └── PluginHost.ts      # CLAP/WebAudio plugin extension architecture
│   ├── constants/
│   │   ├── branding.ts        # Identity & candidate names
│   │   └── defaults.ts        # Musical scales, drum voices, audio defaults
│   ├── types/                 # Strict TypeScript type definitions
│   └── ui/
│       ├── App.tsx            # Main application shell
│       ├── components/        # View modules (Arrangement, Sequencer, Piano Roll, Mixer, etc.)
│       └── styles/            # High-performance dark studio CSS design system
├── tests/                     # 25 Vitest unit & integration test suites
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## 📄 License & Open-Source Compliance

Cadence Studio is free and open-source software licensed under the **[MIT License](LICENSE)**.
All audio synthesis algorithms, drum models, and DSP effects are original implementations created for Cadence Studio.
