export default function SensorPanel({ sensor }) {

  if (!sensor) return null;

  return (

    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-xl">

      <h2 className="text-lg font-bold mb-3">
        Sensor Data
      </h2>

      <div className="grid grid-cols-2 gap-2 text-sm">

        <p className="temp-min">Temp Min: {sensor.temp_min}°C</p>
        <p className="temp-max">Temp Max: {sensor.temp_max}°C</p>

        <p className="humidity">Humidity: {sensor.humidity}%</p>
        <p className="rain">Rainfall: {sensor.rain}</p>

        <p className="wind">Wind Speed: {sensor.wind_speed}</p>
        <p className="gust">Wind Gust: {sensor.wind_gust}</p>

        <p className="clouds">Clouds: {sensor.clouds}</p>
        <p className="pressure">Pressure: {sensor.pressure}</p>

      </div>

    </div>

  );

}