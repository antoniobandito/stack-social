import React, { useEffect, useRef, useState } from 'react';

interface WaveformProps {
  isPlaying: boolean;
  className?: string;
  barCount?: number;
  color?: string;
  height?: number;
  width?: number;
  mini?: boolean;
}

const Waveform: React.FC<WaveformProps> = ({
  isPlaying,
  className = '',
  barCount = 20,
  color = '#6b7280',
  height = 40,
  width,
  mini = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);
  const targetHeightsRef = useRef<number[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: width || 200, height });

  // Initialize bar heights
  useEffect(() => {
    barsRef.current = Array(barCount).fill(0).map(() => Math.random() * 0.3 + 0.1);
    targetHeightsRef.current = Array(barCount).fill(0).map(() => Math.random() * 0.8 + 0.2);
  }, [barCount]);

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const actualWidth = width || rect.width || 200;
      setCanvasSize({ width: actualWidth, height });
      
      // Set actual canvas size for high DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = actualWidth * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${actualWidth}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [width, height]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      const barWidth = (canvasSize.width - (barCount - 1) * 2) / barCount;
      const maxBarHeight = canvasSize.height * 0.8;

      barsRef.current.forEach((currentHeight, index) => {
        const x = index * (barWidth + 2);
        
        if (isPlaying) {
          // Generate new target height occasionally for variation
          if (Math.random() < 0.05) {
            targetHeightsRef.current[index] = Math.random() * 0.8 + 0.2;
          }
          
          // Smoothly animate towards target height
          const target = targetHeightsRef.current[index];
          const diff = target - currentHeight;
          barsRef.current[index] += diff * 0.1;
          
          // Add some randomness for more natural movement
          barsRef.current[index] += (Math.random() - 0.5) * 0.02;
          
          // Keep within bounds
          barsRef.current[index] = Math.max(0.1, Math.min(1, barsRef.current[index]));
        } else {
          // Gradually reduce to minimum height when not playing
          barsRef.current[index] = Math.max(0.1, barsRef.current[index] * 0.95);
        }

        const barHeight = barsRef.current[index] * maxBarHeight;
        const y = (canvasSize.height - barHeight) / 2;

        // Set bar color with gradient for better visual appeal
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80'); // Add transparency to bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      });

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animate();
    } else {
      // Draw static state
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, canvasSize, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`waveform ${className}`}
      style={{
        width: width || '100%',
        height: `${height}px`,
        maxWidth: '100%'
      }}
    />
  );
};

export default Waveform;