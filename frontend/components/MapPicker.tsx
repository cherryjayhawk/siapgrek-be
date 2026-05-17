"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  lat: number;
  lon: number;
  onChange: (lat: number, lon: number) => void;
}

function LocationMarker({ position, setPosition }: { position: L.LatLng; setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ lat, lon, onChange }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(lat || -6.920207, lon || 107.772969));

  // Sync position state to parent
  useEffect(() => {
    if (position.lat !== lat || position.lng !== lon) {
      onChange(position.lat, position.lng);
    }
  }, [position, lat, lon, onChange]);

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 z-10 relative">
      <MapContainer center={[lat || -6.920207, lon || 107.772969]} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 10 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
