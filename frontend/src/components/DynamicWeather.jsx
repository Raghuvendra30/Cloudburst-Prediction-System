import RainBackground from "./RainBackground";
import LightningOverlay from "./LightningOverlay";
import FogOverlay from "./FogOverlay";

export default function DynamicWeather({ prediction }) {

  const prob = prediction?.probability || 0;

  return (
    <>
      {prob > 0.3 && <RainBackground />}
      {prob > 0.7 && <LightningOverlay />}
      {prob > 0.85 && <FogOverlay />}
    </>
  );
}