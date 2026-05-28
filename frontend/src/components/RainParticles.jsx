import { useEffect, useRef } from "react";

export default function RainParticles() {

  const canvasRef = useRef();

  useEffect(() => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rain = [];

    for (let i = 0; i < 300; i++) {
      rain.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: Math.random() * 20,
        speed: Math.random() * 4 + 2
      });
    }

    const draw = () => {

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(180,220,255,0.4)";
      ctx.lineWidth = 1;

      rain.forEach((drop) => {

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.len);
        ctx.stroke();

        drop.y += drop.speed;

        if (drop.y > canvas.height) {
          drop.y = -20;
        }

      });

      requestAnimationFrame(draw);

    };

    draw();

  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}