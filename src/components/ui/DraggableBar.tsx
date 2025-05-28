import React from 'react';

interface DraggableBarProps {
  onResize: (newWidth: number) => void;
  initialWidth: number;
  minWidth?: number;
  maxWidth?: () => number;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const DraggableBar: React.FC<DraggableBarProps> = ({
  onResize,
  initialWidth,
  minWidth = 80,
  maxWidth = () => window.innerWidth - 320,
  orientation = 'vertical',
  className = '',
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = initialWidth;

    const onMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth(), startWidth + deltaX));
      onResize(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      className={`${orientation === 'vertical' ? 'w-2 sm:w-3' : 'h-2 sm:h-3'} bg-gray-700 cursor-col-resize relative min-w-[8px] ${className}`}
      onMouseDown={handleMouseDown}
    >
      <div className={`absolute ${orientation === 'vertical' ? 'top-1/2 -translate-y-1/2 h-8 sm:h-12 w-1.5 sm:w-2' : 'left-1/2 -translate-x-1/2 w-8 sm:w-12 h-1.5 sm:h-2'} bg-gray-500 mx-auto max-w-full`}></div>
    </div>
  );
};

export default DraggableBar;