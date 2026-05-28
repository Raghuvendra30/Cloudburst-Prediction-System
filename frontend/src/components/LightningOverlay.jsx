import { useEffect, useState } from "react";

export default function LightningOverlay({ trigger }) {

  const [bolts, setBolts] = useState([]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {

    if (!trigger) return;

    const createBolt = () => {

      const segments = 10;
      const startX = Math.random() * window.innerWidth;

      let x = startX;
      let y = 0;

      let path = `M ${x} ${y}`;

      for (let i = 0; i < segments; i++) {

        y += 40;
        x += Math.random() * 120 - 60;

        path += ` L ${x} ${y}`;

      }

      return path;
    };


    const strike = () => {

      const newBolts = [createBolt(), createBolt()];

      setBolts(newBolts);

      setFlash(true);

      setTimeout(() => {
        setBolts([]);
        setFlash(false);
      }, 350);

    };


    strike();

  }, [trigger]);


  if (!bolts.length) return null;


  return (

    <div className="fixed inset-0 pointer-events-none z-50">

      {/* FLASH */}

      {flash && (
        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
      )}

      <svg className="absolute inset-0 w-full h-full">

        {bolts.map((bolt, i) => (

          <path
            key={i}
            d={bolt}
            stroke="white"
            strokeWidth="3"
            fill="none"
            style={{
              filter: "drop-shadow(0 0 10px white) drop-shadow(0 0 20px cyan)"
            }}
          />

        ))}

      </svg>

    </div>

  );

}