import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 60;
const MAX_SPEED = 0.25;
const LINK_DISTANCE = 130;
const MOUSE_RADIUS = 150;
const PARTICLE_COLOR = "16, 216, 242";

function createParticle(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * MAX_SPEED,
    vy: (Math.random() - 0.5) * MAX_SPEED,
    radius: Math.random() * 1.6 + 0.6,
  };
}

/**
 * Fondo de canvas con partículas que se conectan entre sí y reaccionan
 * suavemente al mouse. Pensado para montarse detrás de contenido con
 * position: relative (ver .public-hero en Layout.css).
 */
function ParticlesBackground({ className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const context = canvas.getContext("2d");
    const container = canvas.parentElement;
    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrameId = null;
    const mouse = { x: null, y: null };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.min(
        PARTICLE_COUNT,
        Math.round((width * height) / 18000),
      );
      particles = Array.from({ length: targetCount }, () =>
        createParticle(width, height),
      );
    };

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const step = () => {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > width) {
          particle.vx *= -1;
        }
        if (particle.y < 0 || particle.y > height) {
          particle.vy *= -1;
        }

        if (mouse.x !== null) {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.hypot(dx, dy);

          if (distance < MOUSE_RADIUS && distance > 0) {
            const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
            particle.x += (dx / distance) * force * 1.4;
            particle.y += (dy / distance) * force * 1.4;
          }
        }

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${PARTICLE_COLOR}, 0.75)`;
        context.fill();
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);

          if (distance < LINK_DISTANCE) {
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.strokeStyle = `rgba(${PARTICLE_COLOR}, ${
              0.16 * (1 - distance / LINK_DISTANCE)
            })`;
            context.lineWidth = 1;
            context.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    resize();

    if (prefersReducedMotion) {
      // Dibuja un solo cuadro estático y no anima ni escucha el mouse.
      step();
      cancelAnimationFrame(animationFrameId);
    } else {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
      animationFrameId = requestAnimationFrame(step);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`particles-background ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export default ParticlesBackground;
