import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* Fix marker issue */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ data, latitude, longitude, rainfall, risk }) {

  const mapRef = useRef(null);
  const [mapMode, setMapMode] = useState("map");

  /* ================= DATA SOURCE ================= */

  const lat =
    latitude ||
    data?.location?.lat ||
    data?.sensor?.latitude ||
    28.6139;

  const lon =
    longitude ||
    data?.location?.lng ||
    data?.sensor?.longitude ||
    77.2090;

  const probability =
    data?.prediction?.risk_score ||
    data?.probability ||
    (risk === "HIGH" ? 0.9 : risk === "MODERATE" ? 0.6 : 0.2) ||
    0;

  /* ================= AUTO CENTER ================= */

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([lat, lon], 8, { duration: 1.5 });
  }, [lat, lon]);

  /* ================= RISK LOGIC ================= */

  const isHigh = probability > 0.75;
  const isMedium = probability > 0.5;

  const riskColor = isHigh
    ? "#ef4444"
    : isMedium
    ? "#f59e0b"
    : "#22c55e";

  const markerIcon = new L.Icon({
    iconUrl: isHigh
      ? "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"
      : isMedium
      ? "https://maps.gstatic.com/mapfiles/ms2/micons/orange-dot.png"
      : "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png",
    iconSize: [32, 32],
  });

  const radius = isHigh ? 25000 : isMedium ? 18000 : 12000;

  /* ================= UI GLOW ================= */

  const glowClass = isHigh
    ? "ring-2 ring-red-500 animate-pulse"
    : isMedium
    ? "ring-2 ring-yellow-400"
    : "ring-2 ring-green-500/40";

  return (

    <div className="bg-[#0f172a]/90 border border-emerald-500/30 rounded-3xl overflow-hidden h-[700px] flex flex-col">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">

        <h2 className="text-2xl font-bold text-white flex items-center gap-3">

          Cloudburst Risk Monitor

        </h2>

        <div className="flex gap-2">

          <button className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-lg text-white font-semibold">

            Map

          </button>

          <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white font-semibold">

            Satellite

          </button>

        </div>

      </div>

      {/* FULLSCREEN MAP */}
      <div className="flex-1 relative">

        <MapContainer
          center={[latitude || 28.6139, longitude || 77.2090]}
          zoom={8}
          scrollWheelZoom={true}
          className="w-full h-[570px]"
          ref={mapRef}
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={[
            latitude || 28.6139,
            longitude || 77.2090
          ]}
        >
          <Popup>

            <div className="text-black">

              <b>Cloudburst Risk Area</b>

              <br />

              Risk: {risk || "LOW"}

              <br />

              Rainfall: {rainfall || 0} mm

            </div>

          </Popup>

        </Marker>

        <Circle
          center={[
            latitude || 28.6139,
            longitude || 77.2090
          ]}
          radius={12000}
          pathOptions={{
            color:
              risk === "HIGH"
                ? "red"
                : "lime",
            fillOpacity: 0.2
          }}
        />

      </MapContainer>

    </div>

    {/* FOOTER */}
    <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center text-lg">

      <div>

        Risk:{" "}

        <span className="text-emerald-400 font-bold">

          {risk || "LOW"}

        </span>

      </div>

      <div className="text-slate-400">

        Radius: <b>12 km</b>

      </div>

    </div>

  </div>
  );
}