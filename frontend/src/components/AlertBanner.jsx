export default function AlertBanner({ prediction }) {
  if (!prediction?.cloudburst) return null;

  return (
    <div className="bg-red-600 p-3 text-center font-bold">
      CLOUD BURST ALERT ACTIVE — CHECK SMS / EMAIL PANEL
    </div>
  );
}