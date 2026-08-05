import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 140;
const DURATION_MS = 2600;
const COLORS = [
  "16, 216, 242", // cyan
  "34, 208, 155", // green
  "167, 124, 255", // violet
  "246, 164, 0", // amber
  "238, 112, 185", // pink
];

function createConfetti(width) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  return {
    x: Math.random() * width,
    y: -20 - Math.random() * 200,
    size: Math.random() * 7 + 5,
    color,
    vx: (Math.random() - 0.5) * 2.4,
    vy: Math.random() * 2 + 2.2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 12,
    swayPhase: Math.random() * Math.PI * 2,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  };
}

/**
 * Ráfaga de confeti a pantalla completa, para celebrar cuando el
 * estudiante termina el 100% de su ruta. Se dibuja sola con canvas
 * (sin librerías nuevas) y se desmonta automáticamente al terminar.
 */
function ConfettiBurst({ onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete?.();
      return undefined;
    }

    const context = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: PARTICLE_COUNT }, () =>
      createConfetti(width),
    );

    const startTime = performance.now();
    let animationFrameId = null;

    const step = (timestamp) => {
      const elapsed = timestamp - startTime;
      const fadeStart = DURATION_MS * 0.7;
      const globalAlpha =
        elapsed > fadeStart
          ? Math.max(0, 1 - (elapsed - fadeStart) / (DURATION_MS - fadeStart))
          : 1;

      context.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.y += particle.vy;
        particle.x += particle.vx + Math.sin(elapsed / 250 + particle.swayPhase) * 0.6;
        particle.rotation += particle.rotationSpeed;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate((particle.rotation * Math.PI) / 180);
        context.fillStyle = `rgba(${particle.color}, ${globalAlpha})`;

        if (particle.shape === "rect") {
          context.fillRect(
            -particle.size / 2,
            -particle.size / 3,
            particle.size,
            particle.size * 0.65,
          );
        } else {
          context.beginPath();
          context.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          context.fill();
        }

        context.restore();
      });

      if (elapsed < DURATION_MS) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        onComplete?.();
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete]);

  return <canvas ref={canvasRef} className="confetti-burst" aria-hidden="true" />;
}

export default ConfettiBurst;