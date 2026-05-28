import { useEffect, useRef, useState } from "react";

export default function AmbientWeatherSound() {

  const rainRef = useRef(null);
  const thunderRef = useRef(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataRef = useRef(null);
  const rafRef = useRef(null);

  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(false);

  const [bolt, setBolt] = useState(null);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [stormDim, setStormDim] = useState(false);

  const RAIN_SRC = "/sounds/rain.mp3";
  const THUNDER_SRC = "/sounds/thunder.mp3";

  const RAIN_VOL = 0.5;
  const THUNDER_VOL = 0.85;

  const COOLDOWN_MS = 900;

  const lastStrikeRef = useRef(0);

  const baselineRef = useRef(0.08);
  const prevEnergyRef = useRef(0);

  /* ---------------- Lightning Bolt ---------------- */

  const generateBoltPath = (startX, height) => {

    let x = startX;
    let y = 0;

    const points = [`M ${x} ${y}`];

    const segments = 10 + Math.floor(Math.random() * 6);
    const step = height / segments;

    for (let i = 0; i < segments; i++) {

      y += step;
      x += Math.random() * 100 - 50;

      points.push(`L ${x} ${y}`);
    }

    return points.join(" ");
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 380);
  };

  const triggerFlash = () => {

    setFlash(true);
    setStormDim(true);

    setTimeout(() => setFlash(false), 150);
    setTimeout(() => setStormDim(false), 700);

  };

  const triggerBolt = () => {

    const x = 120 + Math.random() * (window.innerWidth - 240);
    const height = 260 + Math.random() * 420;

    setBolt({ x, height, id: Date.now() });

    setTimeout(() => setBolt(null), 500);
  };

  const triggerLightningStrike = (intensity) => {

    triggerFlash();

    if (intensity > 0.4) triggerShake();

    if (intensity > 0.2) triggerBolt();
  };

  /* ---------------- Enable Audio ---------------- */

  useEffect(() => {

    const unlock = async () => {

      try {

        const rain = rainRef.current;
        const thunder = thunderRef.current;

        if (!rain || !thunder) return;

        rain.loop = true;
        rain.volume = RAIN_VOL;

        thunder.loop = true;
        thunder.volume = THUNDER_VOL;

        await rain.play();
        await thunder.play();

        setEnabled(true);

        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);

      } catch (err) {
        console.log("Audio blocked:", err);
      }
    };

    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };

  }, []);

  /* ---------------- Thunder Detection ---------------- */

  useEffect(() => {

    if (!enabled) return;

    const thunder = thunderRef.current;

    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();

    const ctx = audioCtxRef.current;
    ctx.resume().catch(() => {});

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;

    const source = ctx.createMediaElementSource(thunder);

    source.connect(analyser);
    analyser.connect(ctx.destination);

    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    const detect = () => {

      analyser.getByteFrequencyData(dataRef.current);

      let bass = 0;

      for (let i = 2; i < 25; i++) bass += dataRef.current[i];

      const energy = (bass / 23) / 255;

      baselineRef.current = baselineRef.current * 0.99 + energy * 0.01;

      const spike = energy - prevEnergyRef.current;
      prevEnergyRef.current = energy;

      const now = Date.now();

      if (
        energy > baselineRef.current + 0.1 &&
        spike > 0.02 &&
        now - lastStrikeRef.current > COOLDOWN_MS
      ) {

        lastStrikeRef.current = now;

        const intensity = Math.min(1, (energy - baselineRef.current) / 0.35);

        triggerLightningStrike(intensity);
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(rafRef.current);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {}
    };

  }, [enabled]);

  /* ---------------- Mute ---------------- */

  useEffect(() => {

    if (!rainRef.current || !thunderRef.current) return;

    rainRef.current.muted = muted;
    thunderRef.current.muted = muted;

  }, [muted]);

  return (
    <>
      {/* Dim storm overlay */}
      <div
        className={`fixed inset-0 z-20 pointer-events-none transition-opacity duration-700 ${
          stormDim ? "opacity-40" : "opacity-0"
        }`}
        style={{ background: "rgba(0,0,0,0.55)" }}
      />

      {/* Lightning flash */}
      {flash && (
        <div className="fixed inset-0 z-40 pointer-events-none lightning-flash"/>
      )}

      {/* Shake */}
      <div
        className={`fixed inset-0 z-30 pointer-events-none ${
          shake ? "animate-[stormShake_0.38s_ease-in-out]" : ""
        }`}
      />

      {/* Rain */}
      <audio ref={rainRef} preload="auto" playsInline>
        <source src={RAIN_SRC} type="audio/mpeg" />
      </audio>

      {/* Thunder */}
      <audio ref={thunderRef} preload="auto" playsInline>
        <source src={THUNDER_SRC} type="audio/mpeg" />
      </audio>

      {/* Lightning bolt */}
      {bolt && (
        <svg className="fixed top-0 left-0 w-full h-full z-50 pointer-events-none">
          <path
            d={generateBoltPath(bolt.x, bolt.height)}
            className="lightning-bolt"
          />
        </svg>
      )}

      {/* Enable sound */}
      {!enabled && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-200 backdrop-blur-md">
          Click anywhere to enable rain + thunder
        </div>
      )}

      {/* Mute button */}
      {enabled && (
        <button
          onClick={() => setMuted(!muted)}
          className="fixed bottom-4 left-4 z-50 px-3 py-1 rounded-lg bg-black/40 text-xs border border-white/10"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      )}

      <style>{`

        @keyframes stormShake {
          0% { transform: translate(0,0); }
          20% { transform: translate(-4px,2px); }
          40% { transform: translate(4px,-2px); }
          60% { transform: translate(-3px,-1px); }
          80% { transform: translate(3px,2px); }
          100% { transform: translate(0,0); }
        }

        .lightning-flash {
          background: rgba(255,255,255,0.75);
          animation: flash 0.2s ease-in-out;
        }

        @keyframes flash {
          0% {opacity:0;}
          50% {opacity:1;}
          100% {opacity:0;}
        }

        .lightning-bolt {
          fill:none;
          stroke:white;
          stroke-width:3;
          filter:drop-shadow(0 0 10px white);
          animation: boltFade 0.5s ease-in-out;
        }

        @keyframes boltFade {
          0% {opacity:0;}
          20% {opacity:1;}
          100% {opacity:0;}
        }

      `}</style>
    </>
  );
}