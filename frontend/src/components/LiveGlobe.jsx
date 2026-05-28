import { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { ref, onValue } from "firebase/database";
import { db } from "../services/firebase";

export default function LiveGlobe() {

  const globeRef = useRef();
  const [points, setPoints] = useState([]);

  useEffect(() => {

    const sensorRef = ref(db, "sensor_data");

    const unsubscribe = onValue(sensorRef, (snapshot) => {

      const data = snapshot.val();

      if (!data) return;

      const arr = Object.values(data).map((d) => {

        const risk = d?.prediction?.probability || 0;

        return {
          lat: d.lat || 28.61,
          lng: d.lng || 77.20,
          size: 0.4,
          color:
            risk > 0.75
              ? "red"
              : risk > 0.5
              ? "yellow"
              : "lime"
        };

      });

      setPoints(arr);

    });

    return () => unsubscribe();

  }, []);

  useEffect(() => {

    if (!globeRef.current) return;

    globeRef.current.controls().autoRotate = true;
    globeRef.current.controls().autoRotateSpeed = 0.4;

  }, []);

  return (

    <div className="h-[450px] w-full">

      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"
        pointsData={points}
        pointAltitude="size"
        pointColor="color"
      />

    </div>

  );
}