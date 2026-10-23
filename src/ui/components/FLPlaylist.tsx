import React, { useState, useEffect } from 'react';
import { Plus, Mic, Volume2 } from 'lucide-react';
import { Project, Track, Clip } from '../../types/project';
import { globalAudioEngine } from '../../audio/AudioEngine';

interface FLPlaylistProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const FLPlaylist: React.FC<FLPlaylistProps> = ({ project, onUpdateProject }) => {
  const [currentBeat, setCurrentBeat] = useState(0);
  const totalBeats = 32;

  useEffect(() => {
    const unsub = globalAudioEngine.transport.subscribe((state, beat) => {
      setCurrentBeat(beat);
    });
    return unsub;
  }, []);

  const handleTrackMute = (trackId: string) => {
    onUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
    }));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    globalAudioEngine.transport.currentBeat = Math.max(0, pct * totalBeats);
  };

  return (
    <div className="flex-1 bg-[#13151d] flex flex-col overflow-hidden text-gray-200 select-none">
      {/* Playlist Header */}
      <div className="h-8 bg-gradient-to-b from-[#262b38] to-[#1c202a] border-b border-[#353c4e] px-3 flex items-center justify-between text-xs">
        <span className="font-extrabold uppercase text-indigo-400 text-[10px]">
          PLAYLIST - ARRANGEMENT
        </span>
        <span className="text-[10px] text-gray-400 font-mono">SNAP: BAR / 1 BEAT</span>
      </div>

      {/* Timeline Ruler */}
      <div
        onClick={handleSeek}
        className="h-6 bg-[#1a1c26] border-b border-[#2d3344] flex pl-32 cursor-pointer relative"
      >
        {Array.from({ length: totalBeats / 4 }).map((_, barIdx) => (
          <div
            key={barIdx}
            className="flex-1 border-r border-[#2d3344] text-[9px] font-mono text-gray-400 pl-1 flex items-center"
          >
            {barIdx + 1}
          </div>
        ))}

        {/* Playhead Marker */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.9)]"
          style={{ left: `calc(128px + ${(currentBeat / totalBeats) * (100 - 12800 / (window.innerWidth || 1000))}%)` }}
        />
      </div>

      {/* Tracks Container */}
      <div className="flex-1 overflow-y-auto">
        {project.tracks.map((track) => (
          <div
            key={track.id}
            className="h-12 flex border-b border-[#212532] bg-[#151722] hover:bg-[#1a1d2a] transition"
          >
            {/* Track Header */}
            <div className="w-32 bg-[#1b1e2a] border-r border-[#2b3142] px-2 flex items-center justify-between z-10 shadow">
              <div className="flex items-center space-x-1.5 truncate">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: track.color }} />
                <span className="text-[11px] font-bold text-gray-200 truncate">{track.name}</span>
              </div>

              <button
                onClick={() => handleTrackMute(track.id)}
                className={`w-4 h-4 rounded-full border text-[8px] font-black flex items-center justify-center ${
                  track.muted
                    ? 'bg-transparent border-gray-600 text-gray-600'
                    : 'bg-emerald-400 border-emerald-300 text-black shadow-[0_0_5px_rgba(52,211,153,0.8)]'
                }`}
              >
                M
              </button>
            </div>

            {/* Clips Area */}
            <div
              onClick={handleSeek}
              className="flex-1 relative bg-[#11131a] overflow-hidden cursor-pointer"
            >
              {/* Beat Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: totalBeats }).map((_, b) => (
                  <div
                    key={b}
                    className={`flex-1 border-r ${b % 4 === 0 ? 'border-[#262c3e]' : 'border-[#181b24]'}`}
                  />
                ))}
              </div>

              {/* Rendered Clips */}
              {track.clips.map((clip) => {
                const leftPct = (clip.startTime / totalBeats) * 100;
                const widthPct = (clip.duration / totalBeats) * 100;

                return (
                  <div
                    key={clip.id}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: `${clip.color}33`,
                      borderColor: clip.color,
                    }}
                    className="absolute top-1 bottom-1 border rounded px-1.5 py-0.5 shadow text-[10px] font-bold text-white flex items-center truncate z-10"
                  >
                    <span className="truncate">{clip.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
