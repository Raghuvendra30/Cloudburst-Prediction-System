import { MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function WeatherRadar({ prediction }) {

  const [overlayUrl, setOverlayUrl] = useState("");

  useEffect(() => {

    // RainViewer radar API
    const url =
      "https://tilecache.rainviewer.com/v2/radar/latest/256/{z}/{x}/{y}/2/1_1.png";

    setOverlayUrl(url);

  }, []);

  return (

    <div className="h-[420px] w-full rounded-xl overflow-hidden">

      <MapContainer
        center={[28.61, 77.20]}
        zoom={4}
        scrollWheelZoom={false}
        className="h-full w-full"
      >

        {/* Base Map */}
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Rain Radar */}
        {overlayUrl && (
          <TileLayer
            url={overlayUrl}
            opacity={0.6}
          />
        )}

      </MapContainer>

    </div>

  );
}