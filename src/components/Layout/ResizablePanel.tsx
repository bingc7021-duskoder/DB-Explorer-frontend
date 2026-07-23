import React, { useState, useRef } from 'react';

interface ResizablePanelProps {
  leftComponent: React.ReactNode;
  rightComponent: React.ReactNode;
  initialLeftWidthPercent?: number;
  minLeftWidthPercent?: number;
  maxLeftWidthPercent?: number;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  leftComponent,
  rightComponent,
  initialLeftWidthPercent = 60,
  minLeftWidthPercent = 25,
  maxLeftWidthPercent = 75,
}) => {
  const [leftWidth, setLeftWidth] = useState<number>(initialLeftWidthPercent);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newPercent = (offsetX / rect.width) * 100;
    if (newPercent >= minLeftWidthPercent && newPercent <= maxLeftWidthPercent) {
      setLeftWidth(newPercent);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex overflow-hidden select-none">
      {/* Left Resizable Panel */}
      <div style={{ width: `${leftWidth}%` }} className="h-full overflow-hidden">
        {leftComponent}
      </div>

      {/* Divider Separator */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1.5 h-full bg-slate-900 hover:bg-brand-500 cursor-col-resize transition-colors flex items-center justify-center shrink-0 z-20 group"
      >
        <div className="w-0.5 h-8 bg-slate-700 group-hover:bg-white rounded-full transition-colors" />
      </div>

      {/* Right Panel */}
      <div style={{ width: `${100 - leftWidth}%` }} className="h-full overflow-hidden">
        {rightComponent}
      </div>
    </div>
  );
};
