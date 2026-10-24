import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Pencil,
  Paintbrush,
  Eraser,
  Scissors,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Play,
  Volume2,
  Trash2,
  Layers,
  Music,
  Grid,
} from 'lucide-react';
import { Project, Track, Clip, Pattern } from '../../types/project';
import { globalAudioEngine } from '../../audio/AudioEngine';

interface FLPlaylistProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onOpenChannelRack?: () => void;
  onOpenPianoRoll?: () => void;
}

export type PlaylistTool = 'pencil' | 'brush' | 'eraser' | 'select' | 'slice';

export const FLPlaylist: React.FC<FLPlaylistProps> = ({
  project,
  onUpdateProject,
  onOpenChannelRack,
  onOpenPianoRoll,
}) => {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [activeTool, setActiveTool] = useState<PlaylistTool>('pencil');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('pattern-1');
  const [snapBeats, setSnapBeats] = useState<number>(4); // Default 1 Bar (4 beats)
  const [totalBars, setTotalBars] = useState<number>(32);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // Pixels per beat multiplier

  const draggingClipRef = useRef<{
    clipId: string;
    sourceTrackId: string;
    initialStartTime: number;
    startX: number;
  } | null>(null);

  // Available patterns list
  const patterns: { id: string; name: string; color: string; type: 'drums' | 'synth' | 'bass' }[] = [
    { id: 'pattern-1', name: 'Pattern 1: 808 Trap Groove', color: '#f97316', type: 'drums' },
    { id: 'pattern-2', name: 'Pattern 2: Neo-Soul Chords', color: '#06b6d4', type: 'synth' },
    { id: 'pattern-3', name: 'Pattern 3: Lead Motif', color: '#a855f7', type: 'synth' },
    { id: 'pattern-4', name: 'Pattern 4: Sub Bassline', color: '#10b981', type: 'bass' },
    { id: 'pattern-5', name: 'Pattern 5: Rolling Hi-Hats', color: '#eab308', type: 'drums' },
  ];

  useEffect(() => {
    const unsub = globalAudioEngine.transport.subscribe((state, beat) => {
      setCurrentBeat(beat);
    });
    return unsub;
  }, []);

  const totalBeats = totalBars * 4;
  const pixelsPerBeat = 28 * zoomLevel;
  const gridWidth = totalBeats * pixelsPerBeat;

  // Handle Scrubbing Playhead on Ruler
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetBeat = Math.max(0, Math.floor(clickX / pixelsPerBeat));
    globalAudioEngine.transport.currentBeat = targetBeat;
  };

  // Handle Clicking on Track Lane to Paint / Delete Clips
  const handleTrackLaneClick = (trackId: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const rawBeat = clickX / pixelsPerBeat;
    const snappedBeat = Math.max(0, Math.floor(rawBeat / snapBeats) * snapBeats);

    // If active tool is eraser, clicking handles clip delete inside clip onClick
    if (activeTool === 'eraser') return;

    // Check if a clip already occupies this beat
    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) return;

    const existingClip = track.clips.find(
      (c) => snappedBeat >= c.startTime && snappedBeat < c.startTime + c.duration
    );

    if (existingClip) {
      if (activeTool === 'pencil' || activeTool === 'select') {
        // Double click opens editor
        return;
      }
    } else {
      // Paint active pattern clip
      const activePat = patterns.find((p) => p.id === selectedPatternId) || patterns[0];
      const newClip: Clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: activePat.name,
        type: 'pattern',
        patternId: activePat.id,
        startTime: snappedBeat,
        duration: snapBeats >= 4 ? snapBeats : 4, // Minimum 1 bar
        offset: 0,
        color: activePat.color,
      };

      onUpdateProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
        ),
      }));
    }
  };

  // Delete clip on click with eraser or right-click
  const handleDeleteClip = (trackId: string, clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t
      ),
    }));
  };

  // Split / Slice Clip
  const handleSliceClip = (trackId: string, clip: Clip, e: React.MouseEvent) => {
    e.stopPropagation();
    if (clip.duration <= 2) return;

    const half = clip.duration / 2;
    const clip1: Clip = { ...clip, duration: half };
    const clip2: Clip = {
      ...clip,
      id: `clip-split-${Date.now()}`,
      startTime: clip.startTime + half,
      duration: half,
    };

    onUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.map((c) => (c.id === clip.id ? clip1 : c)).concat(clip2) }
          : t
      ),
    }));
  };

  // Track Mute Toggle
  const handleToggleMute = (trackId: string) => {
    onUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
    }));
  };

  // Track Solo Toggle
  const handleToggleSolo = (trackId: string) => {
    onUpdateProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t)),
    }));
  };

  // Add New Track
  const handleAddTrack = () => {
    const num = project.tracks.length + 1;
    const colors = ['#f97316', '#06b6d4', '#a855f7', '#10b981', '#ec4899', '#eab308'];
    const color = colors[(num - 1) % colors.length];

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `Track ${num}`,
      type: 'pattern',
      color,
      volume: 1.0,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      mixerChannelId: `ch-${num}`,
      clips: [],
      automationLaneIds: [],
    };

    onUpdateProject((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));
  };

  return (
    <div className="flex-1 bg-[#13151f] flex flex-col overflow-hidden text-gray-200 select-none">
      {/* 1. FL Studio Top Playlist Control & Tool Bar */}
      <div className="h-10 bg-gradient-to-b from-[#262b3a] to-[#1c202c] border-b border-[#353d52] px-3 flex items-center justify-between">
        {/* Left: Tools & Stamp Palette */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center space-x-1 bg-[#12141c] p-1 rounded-md border border-[#2e3548]">
            <button
              onClick={() => setActiveTool('pencil')}
              className={`p-1.5 rounded transition ${
                activeTool === 'pencil'
                  ? 'bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Draw Tool: Click to place clip"
            >
              <Pencil size={14} />
            </button>

            <button
              onClick={() => setActiveTool('brush')}
              className={`p-1.5 rounded transition ${
                activeTool === 'brush'
                  ? 'bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Paint Tool: Drag to paint pattern across bars"
            >
              <Paintbrush size={14} />
            </button>

            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-1.5 rounded transition ${
                activeTool === 'eraser'
                  ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Erase Tool: Click clip to delete"
            >
              <Eraser size={14} />
            </button>

            <button
              onClick={() => setActiveTool('slice')}
              className={`p-1.5 rounded transition ${
                activeTool === 'slice'
                  ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Slice Tool: Click to cut clip"
            >
              <Scissors size={14} />
            </button>

            <button
              onClick={() => setActiveTool('select')}
              className={`p-1.5 rounded transition ${
                activeTool === 'select'
                  ? 'bg-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Select / Move Tool"
            >
              <MousePointer size={14} />
            </button>
          </div>

          {/* Snap Selector */}
          <div className="flex items-center space-x-1.5 bg-[#12141c] px-2.5 py-1 rounded-md border border-[#2e3548] text-xs">
            <span className="text-gray-400 font-bold text-[10px] uppercase">Snap:</span>
            <select
              value={snapBeats}
              onChange={(e) => setSnapBeats(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value={4} className="bg-[#181a24]">1 Bar (4 Beats)</option>
              <option value={2} className="bg-[#181a24]">1/2 Bar (2 Beats)</option>
              <option value={1} className="bg-[#181a24]">1 Beat (1/4 Note)</option>
              <option value={0.5} className="bg-[#181a24]">1/2 Beat (1/8 Note)</option>
            </select>
          </div>

          <button
            onClick={handleAddTrack}
            className="px-2.5 py-1 bg-[#252b3b] hover:bg-[#343d54] text-gray-200 border border-[#39435c] rounded text-xs font-bold flex items-center space-x-1 transition shadow"
          >
            <Plus size={13} />
            <span>Add Track</span>
          </button>
        </div>

        {/* Right: Zoom & Song Status */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-[10px] bg-orange-950/60 text-orange-400 border border-orange-700/60 px-2 py-0.5 rounded font-mono font-bold">
            SONG ARRANGEMENT
          </span>

          <div className="flex items-center space-x-1 bg-[#12141c] p-1 rounded border border-[#2e3548]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="p-1 text-gray-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-mono font-bold px-1 text-gray-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
              className="p-1 text-gray-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Body: Left Picker + Right Multi-Track Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: FL Studio Pattern & Clip Picker Panel */}
        <div className="w-56 bg-[#161924] border-r-2 border-[#2b3244] flex flex-col shadow-xl z-20">
          <div className="p-2.5 border-b border-[#292f40] flex items-center justify-between bg-[#1b1f2d]">
            <div className="flex items-center space-x-1.5">
              <Grid size={13} className="text-orange-400" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
                PATTERN PICKER
              </span>
            </div>
            <span className="text-[9px] text-gray-400 font-mono">{patterns.length} PATTERNS</span>
          </div>

          <div className="p-2 text-[10px] text-gray-400 font-semibold bg-[#12141c] border-b border-[#252a3a]">
            Select pattern to stamp on timeline:
          </div>

          {/* Patterns List Cards */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {patterns.map((pat) => {
              const isSelected = selectedPatternId === pat.id;

              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatternId(pat.id)}
                  style={{
                    borderColor: isSelected ? pat.color : '#282f40',
                    backgroundColor: isSelected ? `${pat.color}22` : '#1a1d28',
                  }}
                  className={`p-2 rounded-lg border cursor-pointer transition hover:border-gray-500 flex flex-col space-y-1.5 ${
                    isSelected ? 'shadow-[0_0_8px_rgba(249,115,22,0.3)]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: pat.color }}
                      />
                      <span className="text-xs font-bold text-gray-200 truncate">{pat.name}</span>
                    </div>
                  </div>

                  {/* Mini Visual Pattern Rhythm Dots (Like FL Studio Picker) */}
                  <div className="flex space-x-0.5 opacity-70">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-[1px] ${
                          i % 4 === 0
                            ? 'bg-orange-400'
                            : i % 2 === 0
                            ? 'bg-gray-400'
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Buttons at bottom of Picker */}
          <div className="p-2 bg-[#1b1f2d] border-t border-[#292f40] space-y-1.5">
            <button
              onClick={() => {
                if (onOpenChannelRack) onOpenChannelRack();
              }}
              className="w-full py-1.5 bg-[#252b3b] hover:bg-[#343e54] text-cyan-300 rounded text-xs font-bold transition flex items-center justify-center space-x-1"
            >
              <Grid size={12} />
              <span>Edit in Channel Rack</span>
            </button>

            <button
              onClick={() => {
                if (onOpenPianoRoll) onOpenPianoRoll();
              }}
              className="w-full py-1.5 bg-[#252b3b] hover:bg-[#343e54] text-purple-300 rounded text-xs font-bold transition flex items-center justify-center space-x-1"
            >
              <Music size={12} />
              <span>Edit in Piano Roll</span>
            </button>
          </div>
        </div>

        {/* Right: Multi-Track Grid Timeline (Cubase & FL Studio Hybrid) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#10121a]">
          {/* Timeline Bar Ruler */}
          <div
            onClick={handleRulerClick}
            className="h-8 bg-[#181b26] border-b-2 border-[#2b3244] flex relative cursor-pointer overflow-hidden shadow"
          >
            {/* Playhead Vertical Line */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-30 pointer-events-none shadow-[0_0_10px_rgba(6,182,212,1)]"
              style={{ left: `${currentBeat * pixelsPerBeat}px` }}
            >
              <div className="w-3 h-3 bg-cyan-400 -ml-1.5 transform rotate-45 shadow" />
            </div>

            {/* Bars Marks */}
            <div style={{ width: `${gridWidth}px` }} className="flex h-full">
              {Array.from({ length: totalBars }).map((_, barIdx) => (
                <div
                  key={barIdx}
                  style={{ width: `${4 * pixelsPerBeat}px` }}
                  className="border-r border-[#2d3448] h-full flex items-center px-1.5 text-[10px] font-mono font-bold text-gray-400 hover:text-white"
                >
                  Bar {barIdx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Tracks and Canvas Container */}
          <div className="flex-1 overflow-auto flex">
            {/* Tracks List Canvas */}
            <div style={{ width: `${gridWidth}px` }} className="flex flex-col relative min-w-full">
              {/* Playhead Gliding Over Entire Grid */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-20 pointer-events-none opacity-80"
                style={{ left: `${currentBeat * pixelsPerBeat}px` }}
              />

              {project.tracks.map((track, trackIdx) => (
                <div
                  key={track.id}
                  className="h-16 flex border-b border-[#212635] bg-[#141620] hover:bg-[#181b26] transition relative"
                >
                  {/* Sticky Track Header on Left */}
                  <div className="w-44 bg-[#1b1e2b] border-r-2 border-[#2a3142] px-2.5 py-1.5 flex flex-col justify-between sticky left-0 z-10 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: track.color }}
                        />
                        <span className="text-xs font-extrabold text-gray-200 truncate">
                          {track.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase">
                        {track.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleMute(track.id)}
                          className={`w-5 h-4 rounded text-[9px] font-black border transition flex items-center justify-center ${
                            track.muted
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                              : 'bg-[#252b3a] text-gray-400 border-[#384156] hover:text-white'
                          }`}
                          title="Mute Track"
                        >
                          M
                        </button>

                        <button
                          onClick={() => handleToggleSolo(track.id)}
                          className={`w-5 h-4 rounded text-[9px] font-black border transition flex items-center justify-center ${
                            track.solo
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                              : 'bg-[#252b3a] text-gray-400 border-[#384156] hover:text-white'
                          }`}
                          title="Solo Track"
                        >
                          S
                        </button>
                      </div>

                      <span className="text-[10px] font-mono text-gray-400">
                        {track.clips.length} clips
                      </span>
                    </div>
                  </div>

                  {/* Grid Lane for Painting & Displaying Clips */}
                  <div
                    onClick={(e) => handleTrackLaneClick(track.id, e)}
                    style={{ width: `${gridWidth}px` }}
                    className="flex-1 h-full relative cursor-crosshair overflow-hidden"
                  >
                    {/* Background Bar Lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {Array.from({ length: totalBars }).map((_, b) => (
                        <div
                          key={b}
                          style={{ width: `${4 * pixelsPerBeat}px` }}
                          className={`h-full border-r ${
                            b % 2 === 0 ? 'border-[#232938] bg-transparent' : 'border-[#1c212e] bg-[#0f1118]/40'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Placed Pattern & Audio Clips */}
                    {track.clips.map((clip) => {
                      const leftPx = clip.startTime * pixelsPerBeat;
                      const widthPx = clip.duration * pixelsPerBeat;

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            if (activeTool === 'eraser') {
                              handleDeleteClip(track.id, clip.id, e);
                            } else if (activeTool === 'slice') {
                              handleSliceClip(track.id, clip, e);
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleDeleteClip(track.id, clip.id, e);
                          }}
                          style={{
                            left: `${leftPx}px`,
                            width: `${Math.max(20, widthPx)}px`,
                            backgroundColor: `${clip.color}35`,
                            borderColor: clip.color,
                          }}
                          className="absolute top-1 bottom-1 rounded-md border-2 shadow-lg flex flex-col justify-between px-2 py-1 text-white overflow-hidden group hover:brightness-125 transition cursor-move"
                          title={`${clip.name} (Bars ${clip.startTime / 4 + 1} - ${(clip.startTime + clip.duration) / 4 + 1})\nRight-click to delete`}
                        >
                          {/* Clip Header Label */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold truncate drop-shadow">
                              {clip.name}
                            </span>
                            <button
                              onClick={(e) => handleDeleteClip(track.id, clip.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-rose-400 transition"
                              title="Delete clip"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>

                          {/* Visual Step Dots / Note Stems Inside Clip Block (FL Studio signature look) */}
                          <div className="flex space-x-1 items-end h-4 pb-0.5 opacity-80 pointer-events-none">
                            {Array.from({ length: Math.min(16, Math.floor(clip.duration * 4)) }).map(
                              (_, stepIdx) => (
                                <div
                                  key={stepIdx}
                                  style={{ backgroundColor: clip.color }}
                                  className={`w-1 rounded-xs ${
                                    stepIdx % 4 === 0 ? 'h-3.5' : stepIdx % 2 === 0 ? 'h-2.5' : 'h-1.5'
                                  }`}
                                />
                              )
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
      </div>
    </div>
  );
};
