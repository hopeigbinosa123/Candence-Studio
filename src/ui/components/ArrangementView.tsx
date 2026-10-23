import React, { useState, useEffect } from 'react';
import { Volume2, Mic, VolumeX, Headphones, Plus, Split, Scissors } from 'lucide-react';
import { Project, Track, Clip } from '../../types/project';
import { globalAudioEngine } from '../../audio/AudioEngine';

interface Props {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const ArrangementView: React.FC<Props> = ({ project, onUpdateProject }) => {
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

  const handleTrackSolo = (trackId: string) => {
    onUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t)),
    }));
  };

  const handleTrackArm = (trackId: string) => {
    onUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, armed: !t.armed } : t)),
    }));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    const targetBeat = Math.max(0, pct * totalBeats);
    globalAudioEngine.transport.currentBeat = targetBeat;
  };

  const handleAddTrack = (type: Track['type']) => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `${type.toUpperCase()} Track ${project.tracks.length + 1}`,
      type,
      color: type === 'audio' ? '#10b981' : type === 'midi' ? '#06b6d4' : '#f43f5e',
      volume: 1.0,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      mixerChannelId: `ch-${Date.now()}`,
      clips: [],
      automationLaneIds: [],
    };

    onUpdateProject((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));
  };

  return (
    <div className="flex-1 bg-[#14161c] flex flex-col overflow-hidden select-none">
      {/* Arrangement Toolbar */}
      <div className="h-10 bg-[#1a1d26] border-b border-[#292e3c] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Tracks:</span>
          <button
            onClick={() => handleAddTrack('pattern')}
            className="px-2 py-1 bg-[#252936] hover:bg-[#31374a] text-rose-300 rounded text-xs font-semibold flex items-center space-x-1"
          >
            <Plus size={12} />
            <span>+ Beat Track</span>
          </button>
          <button
            onClick={() => handleAddTrack('midi')}
            className="px-2 py-1 bg-[#252936] hover:bg-[#31374a] text-cyan-300 rounded text-xs font-semibold flex items-center space-x-1"
          >
            <Plus size={12} />
            <span>+ MIDI Track</span>
          </button>
          <button
            onClick={() => handleAddTrack('audio')}
            className="px-2 py-1 bg-[#252936] hover:bg-[#31374a] text-emerald-300 rounded text-xs font-semibold flex items-center space-x-1"
          >
            <Plus size={12} />
            <span>+ Audio Track</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-gray-400">
          Grid Snap: <span className="text-cyan-400 font-bold">1/4 Bar (1 Beat)</span>
        </div>
      </div>

      {/* Main Multitrack Canvas */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Timeline Bar Ruler */}
        <div
          onClick={handleSeek}
          className="h-7 bg-[#1c1f2a] border-b border-[#2d3244] flex pl-[240px] cursor-pointer relative hover:bg-[#202430]"
        >
          {Array.from({ length: totalBeats / 4 }).map((_, barIdx) => (
            <div
              key={barIdx}
              className="flex-1 border-r border-[#2d3244] text-[10px] font-mono text-gray-400 pl-1.5 flex items-center"
            >
              Bar {barIdx + 1}
            </div>
          ))}

          {/* Playhead Marker on Ruler */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-30 pointer-events-none"
            style={{ left: `calc(240px + ${(currentBeat / totalBeats) * (100 - 24000 / window.innerWidth)}%)` }}
          />
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto">
          {project.tracks.map((track) => (
            <div
              key={track.id}
              className="h-16 flex border-b border-[#242836] bg-[#161820] hover:bg-[#1a1d26] transition relative"
            >
              {/* Left Track Control Header */}
              <div className="w-[240px] bg-[#1a1d26] border-r border-[#2a2f3e] px-3 py-2 flex flex-col justify-between z-10 shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: track.color }} />
                    <span className="text-xs font-bold text-gray-200 truncate">{track.name}</span>
                  </div>
                  <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-[#242836] text-gray-400">
                    {track.type}
                  </span>
                </div>

                {/* Track Buttons: Mute, Solo, Arm */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleTrackMute(track.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      track.muted ? 'bg-amber-500 text-black' : 'bg-[#282d3c] text-gray-300 hover:text-white'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => handleTrackSolo(track.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      track.solo ? 'bg-emerald-500 text-black' : 'bg-[#282d3c] text-gray-300 hover:text-white'
                    }`}
                  >
                    S
                  </button>
                  <button
                    onClick={() => handleTrackArm(track.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      track.armed ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#282d3c] text-gray-300 hover:text-white'
                    }`}
                  >
                    REC
                  </button>
                </div>
              </div>

              {/* Timeline Track Lane with Clips */}
              <div
                onClick={handleSeek}
                className="flex-1 relative bg-[#13151b] overflow-hidden cursor-pointer"
              >
                {/* Beat Grid Lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: totalBeats }).map((_, b) => (
                    <div
                      key={b}
                      className={`flex-1 border-r ${b % 4 === 0 ? 'border-[#292f3f]' : 'border-[#1b1f2b]'}`}
                    />
                  ))}
                </div>

                {/* Clips */}
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
                      className="absolute top-1 bottom-1 border rounded px-2 py-1 shadow text-xs font-semibold text-white flex items-center overflow-hidden truncate z-10"
                    >
                      <div className="truncate">
                        <span className="text-[11px] font-bold drop-shadow">{clip.name}</span>
                        {clip.type === 'midi' && (
                          <span className="text-[9px] text-gray-300 block">
                            {(clip as any).notes?.length || 0} notes
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
