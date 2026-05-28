export default function ExplainabilityPanel({ factors }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <h3 className="text-sm font-bold mb-3 text-cyan-300">
        AI Explainability
      </h3>

      {factors?.map((f, i) => (
        <div key={i} className="mb-3">
          <div className="flex justify-between text-xs">
            <span>{f.name}</span>
            <span>{f.impact}%</span>
          </div>

          <div className="h-2 bg-white/10 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${f.impact}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}