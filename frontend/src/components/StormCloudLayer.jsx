export default function StormCloudLayer({ probability }) {

  if (!probability || probability < 0.7) return null;

  return (

    <div className="absolute inset-0 pointer-events-none">

      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent)] animate-pulse"></div>

    </div>

  );
}