"use client";

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  height?: string;
}

export default function LeafletMap({ latitude, longitude, name, address, height = "300px" }: LeafletMapProps) {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height, width: "100%" }}>
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Hostel Location"
      />
    </div>
  );
}
