import { useEffect, useRef } from "react";

export default function WindFlow() {

  const canvasRef = useRef();

  useEffect(() => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 1.5 + 0.5
      });
    }

    const animate = () => {

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(150,200,255,0.25)";
      ctx.lineWidth = 1;

      particles.forEach((p) => {

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 20, p.y);
        ctx.stroke();

        p.x += p.speed;

        if (p.x > canvas.width) {
          p.x = 0;
        }

      });

      requestAnimationFrame(animate);

    };

    animate();

  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}