import React, { useState, useEffect } from 'react';
import { FLHeader } from './components/FLHeader';
import { WindowFrame } from './components/WindowFrame';
import { FLChannelRack } from './components/FLChannelRack';
import { FLMixer } from './components/FLMixer';
import { FLEqualizer } from './components/FLEqualizer';
import { FLPianoRoll } from './components/FLPianoRoll';
import { FLPlaylist } from './components/FLPlaylist';
import { InstrumentPanel } from './components/InstrumentPanel';
import { AudioEditorView } from './components/AudioEditorView';
import { ExportDialog } from './components/ExportDialog';
import { AIAssistantModal } from './components/AIAssistantModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { ProjectManager } from '../storage/ProjectManager';
import { Project, AudioClip } from '../types/project';
import { globalAudioEngine } from '../audio/AudioEngine';
import {
  Grid,
  Sliders,
  Activity,
  Piano,
  LayoutGrid,
  Cpu,
  AudioWaveform,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  const [projectManager] = useState(() => new ProjectManager());
  const [project, setProject] = useState<Project>(() => projectManager.project);

  // FL Studio Multi-Window System State
  const [openWindows, setOpenWindows] = useState<Record<string, boolean>>({
    channelrack: true,
    mixer: true,
    eq: true,
    playlist: true,
    pianoroll: false,
    synth: false,
    audioeditor: false,
    ai: false,
  });

  const [topWindowId, setTopWindowId] = useState<string>('channelrack');
  const [windowZIndices, setWindowZIndices] = useState<Record<string, number>>({
    playlist: 10,
    channelrack: 25,
    mixer: 20,
    eq: 30,
    pianoroll: 15,
    synth: 12,
    audioeditor: 14,
    ai: 50,
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [zCounter, setZCounter] = useState(60);

  const bringToFront = (id: string) => {
    setTopWindowId(id);
    setZCounter((prev) => {
      const next = prev + 1;
      setWindowZIndices((indices) => ({ ...indices, [id]: next }));
      return next;
    });
  };

  const toggleWindow = (id: string) => {
    setOpenWindows((prev) => {
      const nextOpen = !prev[id];
      if (nextOpen) bringToFront(id);
      return { ...prev, [id]: nextOpen };
    });
  };

  // Keyboard Shortcuts (FL Studio style: Space, F5, F6, F7, F9, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        await globalAudioEngine.init();
        await globalAudioEngine.resume();
        if (globalAudioEngine.transport.state === 'playing') {
          globalAudioEngine.transport.pause();
        } else {
          globalAudioEngine.transport.play();
        }
      } else if (e.code === 'KeyR' && !e.ctrlKey) {
        e.preventDefault();
        if (globalAudioEngine.transport.state === 'recording') {
          globalAudioEngine.transport.stop();
        } else {
          globalAudioEngine.transport.record();
        }
      } else if (e.code === 'F5') {
        e.preventDefault();
        toggleWindow('playlist');
      } else if (e.code === 'F6') {
        e.preventDefault();
        toggleWindow('channelrack');
      } else if (e.code === 'F7') {
        e.preventDefault();
        toggleWindow('pianoroll');
      } else if (e.code === 'F9') {
        e.preventDefault();
        toggleWindow('mixer');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectManager]);

  const handleBpmChange = (newBpm: number) => {
    globalAudioEngine.transport.bpm = newBpm;
    setProject((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, bpm: newBpm },
    }));
  };

  const handleSaveProject = () => {
    const json = projectManager.serialize();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.title.replace(/\s+/g, '_')}.cadence`;
    a.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#101218] text-[#e0e2ec] font-sans select-none">
      {/* 1. FL Studio Top Navigation & Transport Header */}
      <FLHeader
        bpm={project.metadata.bpm}
        onBpmChange={handleBpmChange}
        openWindows={openWindows}
        onToggleWindow={toggleWindow}
        onExport={() => setShowExportModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* 2. FL Studio Multi-Window Desktop Workspace */}
      <main className="flex-1 relative overflow-hidden bg-[radial-gradient(#1e2433_1px,transparent_1px)] [background-size:20px_20px] bg-[#0e1017]">
        {/* Window A: Playlist / Arrangement (Background Left/Top) */}
        <WindowFrame
          id="playlist"
          title="Playlist - Tracks & Arrangement"
          icon={<LayoutGrid size={13} />}
          initialX={30}
          initialY={15}
          width={680}
          height={260}
          isOpen={openWindows.playlist}
          zIndex={windowZIndices.playlist}
          onClose={() => toggleWindow('playlist')}
          onFocus={() => bringToFront('playlist')}
        >
          <FLPlaylist
            project={project}
            onUpdateProject={(updater) => {
              setProject((prev) => {
                const next = updater(prev);
                projectManager.pushState();
                return next;
              });
            }}
          />
        </WindowFrame>

        {/* Window B: Channel Rack / Step Sequencer (Center Top) */}
        <WindowFrame
          id="channelrack"
          title="Channel Rack - 808 / 909 Beat Sequencer"
          icon={<Grid size={13} />}
          initialX={280}
          initialY={20}
          width={640}
          height={320}
          isOpen={openWindows.channelrack}
          zIndex={windowZIndices.channelrack}
          onClose={() => toggleWindow('channelrack')}
          onFocus={() => bringToFront('channelrack')}
        >
          <FLChannelRack onOpenAI={() => toggleWindow('ai')} />
        </WindowFrame>

        {/* Window C: Studio Mixer (Bottom Left) */}
        <WindowFrame
          id="mixer"
          title="Mixer - Master & Inserts Routing"
          icon={<Sliders size={13} />}
          initialX={20}
          initialY={290}
          width={760}
          height={330}
          isOpen={openWindows.mixer}
          zIndex={windowZIndices.mixer}
          onClose={() => toggleWindow('mixer')}
          onFocus={() => bringToFront('mixer')}
        >
          <FLMixer />
        </WindowFrame>

        {/* Window D: Fruity Parametric EQ 2 (Bottom Right) */}
        <WindowFrame
          id="eq"
          title="Fruity Parametric EQ 2 - Spectrum Visualizer"
          icon={<Activity size={13} />}
          initialX={790}
          initialY={260}
          width={580}
          height={350}
          isOpen={openWindows.eq}
          zIndex={windowZIndices.eq}
          onClose={() => toggleWindow('eq')}
          onFocus={() => bringToFront('eq')}
        >
          <FLEqualizer />
        </WindowFrame>

        {/* Window E: Piano Roll (Floating) */}
        <WindowFrame
          id="pianoroll"
          title="Piano Roll - Notes & Scale Editor"
          icon={<Piano size={13} />}
          initialX={200}
          initialY={60}
          width={720}
          height={380}
          isOpen={openWindows.pianoroll}
          zIndex={windowZIndices.pianoroll}
          onClose={() => toggleWindow('pianoroll')}
          onFocus={() => bringToFront('pianoroll')}
        >
          <FLPianoRoll onOpenAI={() => toggleWindow('ai')} />
        </WindowFrame>

        {/* Window F: Analog Subtractive Synthesizer */}
        <WindowFrame
          id="synth"
          title="Analog Subtractive Synth - Dual Osc & Ladder Filter"
          icon={<Cpu size={13} />}
          initialX={150}
          initialY={50}
          width={780}
          height={400}
          isOpen={openWindows.synth}
          zIndex={windowZIndices.synth}
          onClose={() => toggleWindow('synth')}
          onFocus={() => bringToFront('synth')}
        >
          <InstrumentPanel />
        </WindowFrame>

        {/* Window G: Dedicated Audio Editor */}
        <WindowFrame
          id="audioeditor"
          title="Audio Editor - Waveform Trim & Normalize"
          icon={<AudioWaveform size={13} />}
          initialX={180}
          initialY={80}
          width={740}
          height={360}
          isOpen={openWindows.audioeditor}
          zIndex={windowZIndices.audioeditor}
          onClose={() => toggleWindow('audioeditor')}
          onFocus={() => bringToFront('audioeditor')}
        >
          <AudioEditorView />
        </WindowFrame>
      </main>

      {/* Modals */}
      <ExportDialog
        project={project}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <AIAssistantModal
        project={project}
        isOpen={openWindows.ai}
        onClose={() => toggleWindow('ai')}
        onApplyMelody={(notes) => {
          setProject((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t, idx) =>
              idx === 1
                ? {
                    ...t,
                    clips: [
                      {
                        id: `clip-ai-${Date.now()}`,
                        name: 'AI Melodic Motif',
                        type: 'midi',
                        startTime: 0,
                        duration: 16,
                        offset: 0,
                        color: '#06b6d4',
                        notes,
                      },
                    ],
                  }
                : t
            ),
          }));
          // Auto-open and focus the Piano Roll so user sees the newly populated notes!
          setOpenWindows((prev) => ({ ...prev, pianoroll: true }));
          bringToFront('pianoroll');
        }}
        onApplyDrums={(lanes, swing) => {
          // Force Channel Rack re-render and focus
          setOpenWindows((prev) => ({ ...prev, channelrack: true }));
          bringToFront('channelrack');
        }}
      />

      <HelpGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};
