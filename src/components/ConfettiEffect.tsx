import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface ConfettiRef {
  burst: (x?: number, y?: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'circle' | 'heart' | 'ribbon';
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  gravity: number;
  decay: number;
}

const COLORS = [
  '#FF2E93', // Deep Pink
  '#FF8A00', // Orange
  '#FF007A', // Neon pink
  '#EC4899', // Pink-500
  '#F43F5E', // Rose-500
  '#D946EF', // Fuchsia-500
  '#A855F7', // Purple-500
  '#6366F1', // Indigo-500
];

export const ConfettiEffect = forwardRef<ConfettiRef, {}>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useImperativeHandle(ref, () => ({
    burst(x?: number, y?: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const burstX = x ?? canvas.width / 2;
      const burstY = y ?? canvas.height / 2;

      // Spawn 150 particles
      for (let i = 0; i < 150; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 15 + 5;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const shapes: ('circle' | 'heart' | 'ribbon')[] = ['circle', 'heart', 'ribbon'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        particlesRef.current.push({
          x: burstX,
          y: burstY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - Math.random() * 6, // Biased upwards
          size: Math.random() * 14 + 6,
          color,
          shape,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          opacity: 1,
          gravity: 0.2,
          decay: Math.random() * 0.015 + 0.008,
        });
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawHeart = (context: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      context.beginPath();
      context.moveTo(x, y + size / 4);
      context.quadraticCurveTo(x, y, x + size / 2, y);
      context.quadraticCurveTo(x + size, y, x + size, y + size / 3);
      context.quadraticCurveTo(x + size, y + (size * 2) / 3, x + size / 2, y + size);
      context.quadraticCurveTo(x, y + (size * 2) / 3, x, y + size / 3);
      context.quadraticCurveTo(x, y, x, y + size / 4);
      context.closePath();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'heart') {
          drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
          ctx.fill();
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // ribbon
          ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      id="confetti-canvas"
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
});

ConfettiEffect.displayName = 'ConfettiEffect';
