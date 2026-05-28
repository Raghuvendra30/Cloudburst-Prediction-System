import { useEffect, useMemo, useState } from "react";

export default function FogOverlay() {
  const clouds = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      top: Math.random() * 75,
      size: 260 + Math.random() * 420,
      delay: Math.random() * 12,
      duration: 26 + Math.random() * 26,
      opacity: 0.06 + Math.random() * 0.14,
      blur: 35 + Math.random() * 55,
      drift: 40 + Math.random() * 90,
      scale: 0.95 + Math.random() * 0.35,
    }));
  }, []);

  // Random fog visibility
  const [fogOn, setFogOn] = useState(true);

  useEffect(() => {
    let timer;

    const loop = () => {
      // fog ON for 6–14 sec
      const onTime = Math.floor(Math.random() * (14000 - 6000 + 1)) + 6000;
      setFogOn(true);

      timer = setTimeout(() => {
        // fog OFF for 4–10 sec
        const offTime = Math.floor(Math.random() * (10000 - 4000 + 1)) + 4000;
        setFogOn(false);

        timer = setTimeout(loop, offTime);
      }, onTime);
    };

    loop();

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-10 overflow-hidden transition-opacity duration-1000 ${
        fogOn ? "opacity-100" : "opacity-0"
      }`}
    >
      {clouds.map((c) => (
        <div
          key={c.id}
          className="fog-cloud"
          style={{
            top: `${c.top}%`,
            width: `${c.size}px`,
            height: `${c.size * 0.62}px`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            opacity: c.opacity,
            filter: `blur(${c.blur}px)`,
            transform: `scale(${c.scale})`,
            "--drift": `${c.drift}px`,
          }}
        >
          {/* Extra blobs */}
          <span className="fog-blob blob-1" />
          <span className="fog-blob blob-2" />
          <span className="fog-blob blob-3" />
        </div>
      ))}

      <style>
        {`
          .fog-cloud {
            position: absolute;
            left: -55%;
            border-radius: 999px;
            animation: fogFloat linear infinite;
            transform: translateZ(0);
            will-change: transform, opacity;
            background: radial-gradient(
              circle at 40% 40%,
              rgba(255,255,255,0.45),
              rgba(255,255,255,0.0) 70%
            );
          }

          .fog-blob {
            position: absolute;
            border-radius: 999px;
            background: radial-gradient(
              circle at 35% 35%,
              rgba(255,255,255,0.55),
              rgba(255,255,255,0.0) 70%
            );
            opacity: 0.9;
          }

          .blob-1 {
            width: 55%;
            height: 65%;
            top: 10%;
            left: 5%;
          }

          .blob-2 {
            width: 50%;
            height: 55%;
            top: 20%;
            left: 35%;
          }

          .blob-3 {
            width: 45%;
            height: 50%;
            top: 5%;
            left: 60%;
          }

          @keyframes fogFloat {
            0% {
              transform: translateX(-30%) translateY(0px) scale(1);
            }
            40% {
              transform: translateX(55vw) translateY(calc(var(--drift) * -0.25)) scale(1.08);
            }
            70% {
              transform: translateX(95vw) translateY(calc(var(--drift) * 0.2)) scale(1.12);
            }
            100% {
              transform: translateX(150vw) translateY(0px) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}