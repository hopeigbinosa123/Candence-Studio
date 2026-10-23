import React from 'react';
import { LayoutGrid, Grid, Piano, Sliders, AudioWaveform, Cpu } from 'lucide-react';

export type ActiveTab = 'arrangement' | 'sequencer' | 'pianoroll' | 'mixer' | 'audioeditor' | 'synth';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const NavigationBar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'arrangement', label: 'Arrangement', icon: <LayoutGrid size={15} /> },
    { id: 'sequencer', label: 'Beat Sequencer', icon: <Grid size={15} /> },
    { id: 'pianoroll', label: 'Piano Roll', icon: <Piano size={15} /> },
    { id: 'mixer', label: 'Mixer Console', icon: <Sliders size={15} /> },
    { id: 'audioeditor', label: 'Audio Editor', icon: <AudioWaveform size={15} /> },
    { id: 'synth', label: 'Synth Controls', icon: <Cpu size={15} /> },
  ];

  return (
    <nav className="h-10 bg-[#16181f] border-b border-[#252834] px-4 flex items-center space-x-1 select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-2 transition ${
              isActive
                ? 'bg-[#2b303e] text-cyan-300 shadow-sm border border-cyan-800/40'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f222b]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
