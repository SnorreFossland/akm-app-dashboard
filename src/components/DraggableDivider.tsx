import React, { useRef, useEffect } from 'react';
import styles from './DraggableDivider.module.css';

interface DraggableDividerProps {
    direction?: 'horizontal' | 'vertical';
    onResize: (newSize: number) => void;
    initialPosition?: number;
    minSize?: number;
    maxSize?: number;
    className?: string;
}

const DraggableDivider: React.FC<DraggableDividerProps> = ({
    direction = 'horizontal',
    onResize,
    initialPosition = 300,
    minSize = 100,
    maxSize = 800,
    className = '',
}) => {
    const dividerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const divider = dividerRef.current;
        if (!divider) return;

        let isDragging = false;
        let startPosition = 0;
        let startSize = initialPosition;

        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            isDragging = true;
            startPosition = direction === 'vertical' ? e.clientX : e.clientY;
            startSize = initialPosition;
            document.body.classList.add(styles.resizing);
            console.log('Drag started');
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const currentPosition = direction === 'vertical' ? e.clientX : e.clientY;
            const delta = currentPosition - startPosition;
            const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));

            onResize(newSize);
            console.log('Dragging', newSize);
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            document.body.classList.remove(styles.resizing);
            console.log('Drag ended');
        };

        divider.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            divider.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove(styles.resizing);
        };
    }, [direction, initialPosition, maxSize, minSize, onResize]);

    return (
        <div
            ref={dividerRef}
            className={`${styles.divider} ${styles[direction]} ${className}`}
        >
            <div className={styles.indicator}>
                <div className={styles.handle} />
            </div>
        </div>
    );
};

export default DraggableDivider;