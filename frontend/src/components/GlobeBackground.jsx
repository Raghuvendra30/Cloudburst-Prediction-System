import { useEffect, useRef } from "react";

export default function GlobeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    let rotation = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const radius = 250;

      ctx.strokeStyle = "rgba(34,211,238,0.15)";
      ctx.lineWidth = 1;

      for (let lat = -90; lat <= 90; lat += 15) {
        ctx.beginPath();
        for (let lon = 0; lon <= 360; lon += 5) {
          const x =
            centerX +
            radius *
              Math.cos((lat * Math.PI) / 180) *
              Math.cos((lon + rotation) * (Math.PI / 180));
          const y =
            centerY +
            radius *
              Math.sin((lat * Math.PI) / 180);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      rotation += 0.4;
      requestAnimationFrame(draw);
    };

    draw();
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-10"
    />
  );
}