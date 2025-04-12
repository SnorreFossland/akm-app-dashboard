import React, { useCallback, useEffect, useState } from 'react';

interface DraggableDividerProps {
    direction?: 'horizontal' | 'vertical';
    onResize?: (newSize: number) => void;
    initialPosition?: number;
    minSize?: number;
    maxSize?: number;
}

const DraggableDivider: React.FC<DraggableDividerProps> = ({
    direction = 'vertical',
    onResize,
    initialPosition = 300,
    minSize = 100,
    maxSize = 800,
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const startDragging = useCallback(() => {
        setIsDragging(true);
    }, []);

    const stopDragging = useCallback(() => {
        setIsDragging(false);
    }, []);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const newSize = direction === 'vertical'
            ? e.clientX
            : e.clientY;

        if (newSize >= minSize && newSize <= maxSize) {
            onResize?.(newSize);
        }
    }, [isDragging, direction, minSize, maxSize, onResize]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', stopDragging);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', stopDragging);
        };
    }, [isDragging, onMouseMove, stopDragging]);

    return (
        <div
            className={`divider-handle ${direction} ${isDragging ? 'dragging' : ''}`}
            onMouseDown={startDragging}
            style={{
                cursor: direction === 'vertical' ? 'col-resize' : 'row-resize',
                width: direction === 'vertical' ? '6px' : '100%',
                height: direction === 'vertical' ? '100%' : '6px',
            }}
        />
    );
};

export default DraggableDivider;