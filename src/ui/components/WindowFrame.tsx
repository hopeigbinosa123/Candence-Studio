import React, { useState, useRef } from 'react';
import { X, Minus, Square, ExternalLink } from 'lucide-react';

interface WindowFrameProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  initialX?: number;
  initialY?: number;
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  isOpen: boolean;
  zIndex: number;
  onClose: () => void;
  onFocus: () => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  id,
  title,
  icon,
  initialX = 40,
  initialY = 40,
  width = 650,
  height = 420,
  minWidth = 320,
  minHeight = 200,
  isOpen,
  zIndex,
  onClose,
  onFocus,
  children,
  headerRight,
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isMaximized, setIsMaximized] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  if (!isOpen) return null;

  const handleMouseDownHeader = (e: React.MouseEvent) => {
    onFocus();
    // Don't start drag if clicking a button
    if ((e.target as HTMLElement).closest('button')) return;

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(0, dragRef.current.startPosX + dx),
        y: Math.max(0, dragRef.current.startPosY + dy),
      });
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const style: React.CSSProperties = isMaximized
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex,
      }
    : {
        position: 'absolute',
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        zIndex,
      };

  return (
    <div
      onMouseDown={onFocus}
      style={style}
      className="bg-[#1c1f28] border-2 border-[#384054] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* FL Studio Style Window Titlebar */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="h-8 bg-gradient-to-r from-[#292e3c] via-[#222733] to-[#1c202a] border-b border-[#353c4e] px-2.5 flex items-center justify-between cursor-move"
      >
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-200 tracking-wide truncate">
          {icon && <span className="text-cyan-400">{icon}</span>}
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center space-x-2">
          {headerRight}

          {/* Window Control Buttons */}
          <div className="flex items-center space-x-1 pl-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-[#3d465c] text-gray-400 hover:text-white rounded transition"
              title="Maximize / Restore"
            >
              <Square size={11} />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-rose-600 text-gray-400 hover:text-white rounded transition"
              title="Close Window"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-auto bg-[#161820] relative flex flex-col">
        {children}
      </div>
    </div>
  );
};
