export default function LightningFlash({ probability }) {

  if (!probability || probability < 0.8) return null;

  return (

    <div className="fixed inset-0 pointer-events-none animate-pulse bg-white/10 mix-blend-overlay z-10" />

  );

}