"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para los iconos de Leaflet en Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// Componente para centrar el mapa cuando cambia la ubicación
function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!hasCentered.current) {
      map.setView([lat, lng], 15);
      hasCentered.current = true;
    } else {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  return null;
}

type Props = {
  lat: number;
  lng: number;
  address?: string | null;
  accuracy?: number;
  recordedAt?: string;
  className?: string;
};

export function OrderTrackingMap({
  lat,
  lng,
  address,
  accuracy,
  recordedAt,
  className = "h-64 w-full",
}: Props) {
  return (
    <div className={className}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter lat={lat} lng={lng} />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold mb-1">📍 Mensajero</p>
              {address && (
                <p className="text-gray-600 mb-1">
                  <strong>Dirección:</strong> {address}
                </p>
              )}
              {accuracy && (
                <p className="text-gray-600 mb-1">
                  <strong>Precisión:</strong> ~{Math.round(accuracy)}m
                </p>
              )}
              {recordedAt && (
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(recordedAt).toLocaleString("es-ES")}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
