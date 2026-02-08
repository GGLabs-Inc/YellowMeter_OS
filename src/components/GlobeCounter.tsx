import { useEffect, useRef, useState, useCallback } from "react";

interface GlobeCounterProps {
  eventsCount: number;
  savings: number;
  activeSession: boolean;
  activeUsecase: string;
}

export default function GlobeCounter({
  eventsCount,
  savings,
  activeSession,
  activeUsecase,
}: GlobeCounterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const particlesRef = useRef<
    Array<{
      lat: number;
      lng: number;
      size: number;
      opacity: number;
      speed: number;
      life: number;
    }>
  >([]);
  const [displayCount, setDisplayCount] = useState(0);
  const targetCountRef = useRef(0);

  // Animate counter
  useEffect(() => {
    targetCountRef.current = eventsCount;
  }, [eventsCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayCount((prev) => {
        const target = targetCountRef.current;
        if (prev === target) return prev;
        const diff = target - prev;
        const step = Math.max(1, Math.floor(Math.abs(diff) * 0.1));
        return diff > 0 ? prev + step : prev - step;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const drawGlobe = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.35;

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.6);
    glowGrad.addColorStop(0, "hsla(48, 96%, 53%, 0.08)");
    glowGrad.addColorStop(0.5, "hsla(48, 96%, 53%, 0.03)");
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, size, size);

    // Globe body
    const globeGrad = ctx.createRadialGradient(
      cx - radius * 0.3,
      cy - radius * 0.3,
      0,
      cx,
      cy,
      radius
    );
    globeGrad.addColorStop(0, "hsl(220, 12%, 14%)");
    globeGrad.addColorStop(0.7, "hsl(220, 12%, 8%)");
    globeGrad.addColorStop(1, "hsl(220, 15%, 5%)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = globeGrad;
    ctx.fill();

    // Grid lines (latitude)
    ctx.strokeStyle = "hsla(48, 96%, 53%, 0.08)";
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = cy + radius * Math.sin((lat * Math.PI) / 180);
      const r = radius * Math.cos((lat * Math.PI) / 180);
      if (r > 0) {
        ctx.beginPath();
        ctx.ellipse(cx, y, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Grid lines (longitude)
    const rot = rotationRef.current;
    for (let lng = 0; lng < 360; lng += 30) {
      const angle = ((lng + rot) * Math.PI) / 180;
      ctx.beginPath();
      ctx.strokeStyle = "hsla(48, 96%, 53%, 0.06)";
      ctx.ellipse(cx, cy, radius * Math.abs(Math.cos(angle)), radius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Connection points on globe
    const connectionPoints = [
      { lat: 40, lng: -74 },   // NYC
      { lat: 51, lng: 0 },     // London
      { lat: 35, lng: 139 },   // Tokyo
      { lat: 1, lng: 103 },    // Singapore
      { lat: -33, lng: 151 },  // Sydney
      { lat: 37, lng: -122 },  // SF
      { lat: 55, lng: 37 },    // Moscow
      { lat: 22, lng: 114 },   // HK
    ];

    connectionPoints.forEach((point) => {
      const latRad = (point.lat * Math.PI) / 180;
      const lngRad = ((point.lng + rot) * Math.PI) / 180;
      const x3d = Math.cos(latRad) * Math.sin(lngRad);
      const z3d = Math.cos(latRad) * Math.cos(lngRad);
      const y3d = Math.sin(latRad);

      if (z3d > -0.2) {
        const px = cx + x3d * radius;
        const py = cy - y3d * radius;
        const opacity = Math.max(0, (z3d + 0.2) / 1.2);

        // Dot
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + opacity * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(48, 96%, 53%, ${0.3 + opacity * 0.7})`;
        ctx.fill();

        // Pulse ring
        if (activeSession) {
          const pulseSize = 4 + Math.sin(Date.now() / 500 + point.lat) * 3;
          ctx.beginPath();
          ctx.arc(px, py, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(48, 96%, 53%, ${opacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    // Connection arcs between visible points
    if (activeSession) {
      const visiblePoints: Array<{ x: number; y: number; opacity: number }> = [];
      connectionPoints.forEach((point) => {
        const latRad = (point.lat * Math.PI) / 180;
        const lngRad = ((point.lng + rot) * Math.PI) / 180;
        const x3d = Math.cos(latRad) * Math.sin(lngRad);
        const z3d = Math.cos(latRad) * Math.cos(lngRad);
        const y3d = Math.sin(latRad);

        if (z3d > 0.1) {
          visiblePoints.push({
            x: cx + x3d * radius,
            y: cy - y3d * radius,
            opacity: z3d,
          });
        }
      });

      for (let i = 0; i < visiblePoints.length - 1; i++) {
        const a = visiblePoints[i];
        const b = visiblePoints[i + 1];
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2 - 20;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(midX, midY, b.x, b.y);
        ctx.strokeStyle = `hsla(48, 96%, 53%, ${Math.min(a.opacity, b.opacity) * 0.2})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // Particles flying from globe
    if (activeSession && Math.random() > 0.7) {
      particlesRef.current.push({
        lat: Math.random() * 180 - 90,
        lng: Math.random() * 360,
        size: 1 + Math.random() * 2,
        opacity: 0.8,
        speed: 0.5 + Math.random() * 1.5,
        life: 1,
      });
    }

    particlesRef.current = particlesRef.current.filter((p) => {
      p.life -= 0.015;
      p.opacity = p.life;
      const latRad = (p.lat * Math.PI) / 180;
      const lngRad = ((p.lng + rot) * Math.PI) / 180;
      const scale = 1 + (1 - p.life) * 0.5;
      const x3d = Math.cos(latRad) * Math.sin(lngRad) * scale;
      const z3d = Math.cos(latRad) * Math.cos(lngRad);
      const y3d = Math.sin(latRad) * scale;

      if (z3d > 0 && p.life > 0) {
        const px = cx + x3d * radius;
        const py = cy - y3d * radius;
        const particleRadius = Math.max(0, p.size * p.life);
        ctx.beginPath();
        ctx.arc(px, py, particleRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(48, 96%, 53%, ${Math.max(0, p.opacity) * 0.6})`;
        ctx.fill();
      }
      return p.life > 0.01;
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "hsla(48, 96%, 53%, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Animated progress ring
    if (activeSession) {
      const progress = (Date.now() % 3000) / 3000;
      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        radius + 12,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progress
      );
      ctx.strokeStyle = "hsla(48, 96%, 53%, 0.5)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Rotation speed
    rotationRef.current += activeSession ? 0.3 : 0.1;
  }, [activeSession]);

  useEffect(() => {
    const loop = () => {
        drawGlobe();
        animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawGlobe]);

  const usecaseLabels: Record<string, string> = {
    ai: "AI API Tokens",
    gaming: "Game Actions",
    cloud: "Compute Units",
    iot: "Sensor Reads",
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Globe canvas */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
          aria-hidden="true"
        />

        {/* Center counter overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center">
            <div
              className="text-3xl md:text-4xl lg:text-5xl font-bold font-mono tabular-nums"
              style={{
                color: "hsl(48, 96%, 53%)",
                textShadow: "0 0 20px hsla(48, 96%, 53%, 0.4)",
              }}
            >
              {displayCount.toLocaleString()}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">
              {usecaseLabels[activeUsecase] || "Events"} metered
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar below globe */}
      <div className="flex items-center gap-6 mt-6">
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold font-mono" style={{ color: "hsl(142, 76%, 36%)" }}>
            ${savings.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Gas saved</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold font-mono text-primary">
            1
          </div>
          <div className="text-xs text-muted-foreground">On-chain TX</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div
            className={`text-lg md:text-xl font-bold font-mono ${
              activeSession ? "text-success" : "text-muted-foreground"
            }`}
          >
            {activeSession ? "LIVE" : "IDLE"}
          </div>
          <div className="text-xs text-muted-foreground">Session</div>
        </div>
      </div>
    </div>
  );
}
