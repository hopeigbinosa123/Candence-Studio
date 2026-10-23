import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NavigationBar, ActiveTab } from './components/NavigationBar';
import { ArrangementView } from './components/ArrangementView';
import { StepSequencerView } from './components/StepSequencerView';
import { PianoRollView } from './components/PianoRollView';
import { MixerView } from './components/MixerView';
import { AudioEditorView } from './components/AudioEditorView';
import { InstrumentPanel } from './components/InstrumentPanel';
import { ExportDialog } from './components/ExportDialog';
import { AIAssistantModal } from './components/AIAssistantModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { ProjectManager } from '../storage/ProjectManager';
import { Project, AudioClip } from '../types/project';
import { globalAudioEngine } from '../audio/AudioEngine';

export const App: React.FC = () => {
  const [projectManager] = useState(() => new ProjectManager());
  const [project, setProject] = useState<Project>(() => projectManager.project);
  const [activeTab, setActiveTab] = useState<ActiveTab>('arrangement');
  const [isRecording, setIsRecording] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or select
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
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleToggleRecord();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (projectManager.undo()) {
          setProject({ ...projectManager.project });
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (projectManager.redo()) {
          setProject({ ...projectManager.project });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectManager, isRecording]);

  // Audio Recording Toggle
  const handleToggleRecord = async () => {
    await globalAudioEngine.init();
    await globalAudioEngine.resume();

    if (!isRecording) {
      // Find armed track or default to audio track
      const armedTrack = project.tracks.find((t) => t.armed) || project.tracks.find((t) => t.type === 'audio');
      const trackId = armedTrack ? armedTrack.id : 'track-4';

      if (globalAudioEngine.recorder) {
        const success = await globalAudioEngine.recorder.requestPermissionAndStart(
          trackId,
          globalAudioEngine.transport.currentBeat
        );
        if (success) {
          setIsRecording(true);
          globalAudioEngine.transport.record();
        }
      }
    } else {
      setIsRecording(false);
      globalAudioEngine.transport.stop();

      if (globalAudioEngine.recorder) {
        const take = globalAudioEngine.recorder.stopRecording(globalAudioEngine.transport.currentBeat);
        if (take) {
          // Append recorded audio clip to armed track
          const newClip: AudioClip = {
            id: `clip-rec-${Date.now()}`,
            name: `Take ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            type: 'audio',
            audioBufferId: take.id,
            startTime: take.startBeat,
            duration: take.durationBeats,
            offset: 0,
            gain: 1.0,
            fadeIn: 0.05,
            fadeOut: 0.05,
            color: '#10b981',
          };

          setProject((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) =>
              t.id === take.trackId ? { ...t, clips: [...t.clips, newClip] } : t
            ),
          }));
        }
      }
    }
  };

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

  const handleOpenProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cadence,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        const content = re.target?.result as string;
        if (projectManager.deserialize(content)) {
          setProject({ ...projectManager.project });
          globalAudioEngine.transport.bpm = projectManager.project.metadata.bpm;
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121316] text-[#e0e2ec]">
      {/* Studio Top Header */}
      <Header
        projectTitle={project.metadata.title}
        bpm={project.metadata.bpm}
        onBpmChange={handleBpmChange}
        onSave={handleSaveProject}
        onOpen={handleOpenProject}
        onExport={() => setShowExportModal(true)}
        onOpenAIModal={() => setShowAIModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        onRecordToggle={handleToggleRecord}
        isRecording={isRecording}
      />

      {/* Navigation Workspace Selector */}
      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Workspace Display */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'arrangement' && (
          <ArrangementView
            project={project}
            onUpdateProject={(updater) => {
              setProject((prev) => {
                const next = updater(prev);
                projectManager.pushState();
                return next;
              });
            }}
          />
        )}

        {activeTab === 'sequencer' && (
          <StepSequencerView onOpenAI={() => setShowAIModal(true)} />
        )}

        {activeTab === 'pianoroll' && (
          <PianoRollView onOpenAI={() => setShowAIModal(true)} />
        )}

        {activeTab === 'mixer' && <MixerView />}

        {activeTab === 'audioeditor' && <AudioEditorView />}

        {activeTab === 'synth' && <InstrumentPanel />}
      </main>

      {/* Modals & Dialogs */}
      <ExportDialog
        project={project}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <AIAssistantModal
        project={project}
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplyMelody={(notes) => {
          // Put generated notes in track 2 (Synth Lead)
          setProject((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t, idx) =>
              idx === 1
                ? {
                    ...t,
                    clips: [
                      {
                        id: `clip-ai-${Date.now()}`,
                        name: 'AI Motif',
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
        }}
        onApplyDrums={(lanes, swing) => {
          // Re-render
        }}
      />

      <HelpGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};
