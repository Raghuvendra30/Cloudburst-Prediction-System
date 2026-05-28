import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet.heat";

export default function RainHeatLayer({ points }) {

  const map = useMap();

  useEffect(() => {

    if (!points || points.length === 0) return;

    const heat = window.L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 6
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };

  }, [points]);

  return null;
}