import React, { useState, useRef, useEffect } from 'react';

interface RotaryKnobProps {
  value: number; // e.g. 0 to 100 or -100 to 100
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  size?: number; // diameter in px
  label?: string;
  unit?: string;
  color?: string; // arc highlight color
  onChange: (val: number) => void;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  size = 36,
  label,
  unit = '',
  color = '#22d3ee', // Cyan default
  onChange,
}) => {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(value);

  // Angle range: -135deg (min) to +135deg (max) => 270deg total
  const clampedVal = Math.max(min, Math.min(max, value));
  const pct = (clampedVal - min) / (max - min);
  const angle = -135 + pct * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startVal.current = clampedVal;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaY = startY.current - moveEvent.clientY; // Up increases
      const range = max - min;
      const sensitivity = 0.007; // Smooth control
      let newVal = startVal.current + deltaY * range * sensitivity;
      newVal = Math.round(newVal / step) * step;
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(newVal);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  return (
    <div className="flex flex-col items-center justify-center select-none group">
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{ width: size, height: size }}
        className="relative rounded-full cursor-ns-resize shadow-md flex items-center justify-center transition-transform hover:scale-105"
        title={`${label || 'Control'}: ${clampedVal}${unit} (Double click to reset)`}
      >
        {/* Background track circle */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 40 40"
          className="absolute inset-0 pointer-events-none"
        >
          {/* Outer Ring */}
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="#1e222b"
            stroke="#13161c"
            strokeWidth="2"
          />
          {/* Unfilled Arc (-135 to 135 deg) */}
          <circle
            cx="20"
            cy="20"
            r="14"
            fill="none"
            stroke="#2a303e"
            strokeWidth="2.5"
            strokeDasharray="66 100"
            strokeDashoffset="-16"
            strokeLinecap="round"
          />
          {/* Filled Colored Value Arc */}
          <circle
            cx="20"
            cy="20"
            r="14"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={`${pct * 66} 100`}
            strokeDashoffset="-16"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]"
          />
        </svg>

        {/* Center Knob Body (Beveled 3D look) */}
        <div
          style={{
            width: size - 12,
            height: size - 12,
            transform: `rotate(${angle}deg)`,
          }}
          className="rounded-full bg-gradient-to-b from-[#3a4152] via-[#242936] to-[#181c24] border border-[#4a5368] shadow-inner flex items-center justify-center relative"
        >
          {/* Pointer Indicator Line */}
          <div
            style={{ backgroundColor: color }}
            className="absolute top-1 w-1 h-2 rounded-full shadow-[0_0_3px_currentColor]"
          />
        </div>
      </div>

      {label && (
        <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight text-center truncate max-w-[55px]">
          {label}
        </span>
      )}
    </div>
  );
};
