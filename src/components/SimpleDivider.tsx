import React, { useRef } from 'react';

interface SimpleDividerProps {
    onResize: (newSize: number) => void;
    currentSize: number;
}

const SimpleDivider: React.FC<SimpleDividerProps> = ({ onResize, currentSize }) => {
    // Track initial position during drag
    const startPosRef = useRef(0);
    const startSizeRef = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Capture starting position
        startPosRef.current = e.clientY;
        startSizeRef.current = currentSize;

        // Add window-level handlers that will track the drag
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // Prevent text selection during drag
        e.preventDefault();

        console.log('Drag started at', e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
        // Calculate how far we've moved from the starting point
        const delta = e.clientY - startPosRef.current;
        const newSize = startSizeRef.current + delta;

        // Update the size
        onResize(Math.max(100, Math.min(800, newSize)));
        console.log('Dragging to', e.clientY, 'new size:', newSize);
    };

    const handleMouseUp = () => {
        // Clean up event listeners when done
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        console.log('Drag ended');
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                height: '10px',
                backgroundColor: 'gray', // Bright color to ensure visibility
                cursor: 'row-resize',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div style={{ width: '50px', height: '8px', backgroundColor: 'lightgray' }} />
        </div>
    );
};

export default SimpleDivider;