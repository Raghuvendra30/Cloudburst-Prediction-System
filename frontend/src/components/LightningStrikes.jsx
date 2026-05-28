export default function LightningStrikes({ probability }) {

  if (!probability || probability < 0.8) return null;

  return (

    <div className="fixed inset-0 pointer-events-none z-20">

      <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay" />

    </div>

  );

}