import { useEffect, useRef } from "react";
import useTheme from "../../hooks/useTheme";

const PARTICLE_COUNT = 150;
const MAX_SPEED = 0.6;
const LINK_DISTANCE = 170;
const MOUSE_RADIUS = 220;

// Colores por lado (izquierdo = hero, derecho = panel de auth), según el
// tema activo. En oscuro se mantiene el cian brillante/apagado de siempre;
// en claro el hero ahora es marino, así que el lado izquierdo pasa a blanco
// (atenuado, para que no sea demasiado brillante) y el derecho a azul.
const THEME_COLORS = {
  dark: {
    left: { rgb: "16, 216, 242", alpha: 1 },
    right: { rgb: "13, 84, 102", alpha: 1 },
  },
  light: {
    left: { rgb: "255, 255, 255", alpha: 0.7 },
    right: { rgb: "29, 78, 216", alpha: 1 },
  },
};

function createParticle(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * MAX_SPEED,
    vy: (Math.random() - 0.5) * MAX_SPEED,
    radius: Math.random() * 2.3 + 1,
    phase: Math.random() * Math.PI * 2,
  };
}

/**
 * Fondo de canvas con partículas que cubre TODA la pantalla del layout
 * público (hero + panel de auth), no solo un lado. Las partículas que
 * caen del lado derecho (detrás de la tarjeta de login) se pintan en un
 * tono más oscuro/apagado que las del lado izquierdo, marcando la
 * división entre ambos paneles sin necesidad de una línea separadora.
 *
 * splitRatio: fracción del ancho (0-1) que ocupa el lado "claro"
 * (el hero). Debe coincidir con grid-template-columns del layout.
 */
function ParticlesBackground({ className = "", splitRatio = 0.6 }) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

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
    let boundaryX = 0;
    let particles = [];
    let animationFrameId = null;
    const mouse = { x: null, y: null };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      boundaryX = width * splitRatio;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.min(
        PARTICLE_COUNT,
        Math.round((width * height) / 8500),
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

    const palette = THEME_COLORS[theme] || THEME_COLORS.dark;
    const colorFor = (x) => (x >= boundaryX ? palette.right : palette.left);

    const step = (timestamp) => {
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
            particle.x += (dx / distance) * force * 2.4;
            particle.y += (dy / distance) * force * 2.4;
          }
        }

        // Parpadeo sutil de tamaño, para que se sientan "vivas".
        const pulse = prefersReducedMotion
          ? 1
          : 1 + Math.sin(timestamp / 500 + particle.phase) * 0.25;
        const color = colorFor(particle.x);

        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          particle.radius * pulse,
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(${color.rgb}, ${color.alpha})`;
        context.shadowColor = `rgba(${color.rgb}, ${color.alpha})`;
        context.shadowBlur = 8;
        context.fill();
      }

      context.shadowBlur = 0;

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);

          if (distance < LINK_DISTANCE) {
            const midX = (a.x + b.x) / 2;
            const color = colorFor(midX);

            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.strokeStyle = `rgba(${color.rgb}, ${
              0.35 * color.alpha * (1 - distance / LINK_DISTANCE)
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
      step(0);
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
  }, [splitRatio, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`particles-background ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export default ParticlesBackground;
