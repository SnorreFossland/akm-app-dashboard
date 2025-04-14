'use client';

import { useEffect, useRef } from 'react';

interface DigitalRainProps {
  onInteraction: () => void;
  containerStyle?: React.CSSProperties;
  speed?: number; // Add speed prop
  backgroundColor?: string; // Add background color prop
}

const DigitalRain = ({ 
  onInteraction, 
  containerStyle = {},
  speed = 1, // Default speed (lower = slower)
  backgroundColor = 'rgba(0, 0, 0, 0.05)' // Default background
}: DigitalRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to container size
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix digital rain
    const characters = 'アイウエオカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    
    const drops: number[] = Array(columns).fill(1);
    
    // Counter to control drop speed
    let frameCount = 0;
    
    const draw = () => {
      // Lighter background - using rgba with higher RGB values
      // Use the passed background color or default
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#0F0'; // Green text
      ctx.font = `${fontSize}px monospace`;
      
      frameCount++;
      
      // Only update positions every N frames based on speed
      const shouldUpdatePosition = frameCount % Math.floor(4 / speed) === 0;
      
      for (let i = 0; i < drops.length; i++) {
        const char = characters[Math.floor(Math.random() * characters.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        // Only move drops down when shouldUpdatePosition is true
        if (shouldUpdatePosition) {
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i] += 0.5 * speed; // Slower increment
        }
      }
    };

    // Slower animation frame rate
    const animationId = setInterval(draw, 50); // 50ms instead of 33ms

    const handleInteraction = () => {
      onInteraction();
    };

    container.addEventListener('click', handleInteraction);
    container.addEventListener('mousemove', handleInteraction);
    container.addEventListener('keydown', handleInteraction);

    return () => {
      clearInterval(animationId);
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('click', handleInteraction);
      container.removeEventListener('mousemove', handleInteraction);
      container.removeEventListener('keydown', handleInteraction);
    };
  }, [onInteraction, speed, backgroundColor]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full" 
      style={containerStyle}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-10 bg-background bg-opacity-20"
      />
    </div>
  );
};

export default DigitalRain;