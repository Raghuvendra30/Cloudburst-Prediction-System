import { useEffect } from "react";

export default function ParallaxWrapper({ children }) {
  useEffect(() => {
    const handleMove = (e) => {
      const x = (window.innerWidth / 2 - e.clientX) / 40;
      const y = (window.innerHeight / 2 - e.clientY) / 40;

      document.documentElement.style.setProperty("--px", `${x}px`);
      document.documentElement.style.setProperty("--py", `${y}px`);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      style={{
        transform: "translate(var(--px), var(--py))",
        transition: "transform 0.1s linear",
      }}
    >
      {children}
    </div>
  );
}