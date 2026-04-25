"use client";

import { useEffect, useRef } from "react";

interface LeafletMapProps {
  latitude: number | null;
  longitude: number | null;
  name?: string;
  address?: string;
  height?: string;
  zoom?: number;
}

export default function LeafletMap({
  latitude,
  longitude,
  name = "",
  address = "",
  height = "300px",
  zoom = 15,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;

    // Dynamically import Leaflet
    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!).setView([latitude, longitude], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([latitude, longitude]).addTo(map);
      if (name || address) {
        marker.bindPopup(`<b>${name}</b>${address ? `<br>${address}` : ""}`).openPopup();
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, name, address, zoom]);

  if (!latitude || !longitude) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-xl"
        style={{ height }}
      >
        <div className="text-center">
          <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs text-gray-400">No location set</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        integrity="sha512-Zcn6bjR/8RZbLEDCR/+3SWYBotEZGBdopm/H1AKkFvAKqRkEtU7mDw7e3qke1BhG0lNK1z/AQbJGQVnR8W+dA=="
        crossOrigin="anonymous"
      />
      <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-xl z-0" />
    </>
  );
}
