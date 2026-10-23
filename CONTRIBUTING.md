# Contributing to Cadence Studio

Thank you for your interest in contributing to **Cadence Studio**, the next-generation open-source all-in-one digital audio workstation!

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cadence-audio/cadence-studio.git
   cd cadence-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Launch the desktop application:**
   ```bash
   npm run app
   ```

5. **Run the automated test suite:**
   ```bash
   npm test
   ```

## Architectural Guidelines

- **Real-Time Audio Safety:** All DSP nodes, synth voices, and filters must run without blocking heap allocations or network calls in time-critical audio callbacks.
- **Pure Math & DSP Tests:** Any new synthesizer, filter algorithm, or audio format encoder must include comprehensive unit tests in `tests/`.
- **Modularity:** Keep UI components in `src/ui/components/`, audio DSP in `src/audio/`, and persistence in `src/storage/`.
- **Authenticity:** Every UI control must map to an active audio parameter or data structure. Avoid decorative nonfunctional controls.

## Pull Request Guidelines

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-new-audio-effect
   ```
2. Verify all tests pass and the build succeeds:
   ```bash
   npm test
   npm run build
   ```
3. Submit a clean Pull Request with a clear description of your DSP additions or UX enhancements.
