import React, { useEffect, useRef } from 'react';

interface Heart {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export default function FloatingHearts() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let hearts: Heart[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const createHeart = (xPosition?: number): Heart => {
      return {
        x: xPosition ?? Math.random() * canvas.width,
        y: canvas.height + 20,
        size: Math.random() * 15 + 8,
        speed: Math.random() * 1.2 + 0.6,
        opacity: Math.random() * 0.4 + 0.15,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      };
    };

    // Populate initially
    for (let i = 0; i < 20; i++) {
      hearts.push({
        ...createHeart(),
        y: Math.random() * canvas.height,
      });
    }

    const drawHeartPath = (context: CanvasRenderingContext2D, x: number, y: number, size: number) => {
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

      // Draw each heart
      hearts.forEach((heart, index) => {
        heart.y -= heart.speed;
        heart.rotation += heart.rotationSpeed;
        
        ctx.save();
        ctx.translate(heart.x, heart.y);
        ctx.rotate(heart.rotation);
        
        ctx.fillStyle = `rgba(244, 63, 94, ${heart.opacity})`; // Soft rose pink
        ctx.strokeStyle = `rgba(244, 63, 94, ${heart.opacity * 1.5})`;
        ctx.lineWidth = 1;

        // Render solid or outline heart
        drawHeartPath(ctx, -heart.size / 2, -heart.size / 2, heart.size);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();

        // Recycle if goes off-screen
        if (heart.y < -20) {
          hearts[index] = createHeart();
        }
      });

      // Spawn new heart occasionally
      if (hearts.length < 35 && Math.random() < 0.03) {
        hearts.push(createHeart());
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
      id="floating-hearts-canvas"
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
