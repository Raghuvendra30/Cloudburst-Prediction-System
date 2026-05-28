import { useEffect, useRef } from "react";

export default function RainBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // 🌬 Wind angle (diagonal rain)
    const WIND_ANGLE = 12; // degrees
    const windOffset = Math.tan((WIND_ANGLE * Math.PI) / 180);

    // 🌧 Create layered rain (depth effect)
    const createDrops = (count, speedMultiplier, opacity) =>
      Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 12 + Math.random() * 22,
        speed: (4 + Math.random() * 6) * speedMultiplier,
        opacity,
      }));

    const farRain = createDrops(200, 0.6, 0.15);
    const midRain = createDrops(180, 1, 0.25);
    const nearRain = createDrops(120, 1.5, 0.4);

    const allRain = [...farRain, ...midRain, ...nearRain];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);

    let lightningFlash = 0;

    // Optional lightning brightness sync
    const triggerFlash = () => {
      lightningFlash = 1;
      setTimeout(() => (lightningFlash = 0), 180);
    };

    window.addEventListener("lightning-strike", triggerFlash);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // subtle sky glow during lightning
      if (lightningFlash > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(0, 0, w, h);
      }

      for (let d of allRain) {
        ctx.beginPath();

        ctx.strokeStyle = `rgba(255,255,255,${d.opacity})`;
        ctx.lineWidth = d.opacity > 0.3 ? 1.2 : 0.8;

        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * windOffset, d.y + d.len);
        ctx.stroke();

        d.y += d.speed;
        d.x += d.speed * windOffset * 0.2;

        if (d.y > h) {
          d.y = -d.len;
          d.x = Math.random() * w;
        }

        if (d.x > w) d.x = 0;
      }

      requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("lightning-strike", triggerFlash);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.5 }}
    />
  );
}