export default function FeatureCards() {

  const features = [
    {
      title: "Real-Time Sensor Network",
      desc: "Live environmental data streaming from IoT stations."
    },
    {
      title: "AI Cloudburst Prediction",
      desc: "Hybrid LSTM + ML model predicting rainfall anomalies."
    },
    {
      title: "Risk Visualization",
      desc: "Interactive dashboard showing atmospheric trends."
    }
  ];

  return (

    <div className="grid md:grid-cols-3 gap-6 mt-16">

      {features.map((f, i) => (

        <div
          key={i}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6"
        >

          <h3 className="font-bold text-lg text-cyan-300">
            {f.title}
          </h3>

          <p className="text-slate-400 mt-2 text-sm">
            {f.desc}
          </p>

        </div>

      ))}

    </div>

  );
}