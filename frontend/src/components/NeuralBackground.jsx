import { useEffect } from "react";

export default function NeuralBackground() {
  useEffect(() => {
    const canvas = document.getElementById("neuralCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((node, i) => {
        node.x += node.dx;
        node.y += node.dy;

        if (node.x < 0 || node.x > canvas.width) node.dx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.dy *= -1;

        ctx.fillStyle = "rgba(34,211,238,0.6)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();

        nodes.forEach((other) => {
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist < 120) {
            ctx.strokeStyle = "rgba(34,211,238,0.1)";
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  return (
    <canvas
      id="neuralCanvas"
      className="absolute inset-0 z-0 opacity-10"
    />
  );
}