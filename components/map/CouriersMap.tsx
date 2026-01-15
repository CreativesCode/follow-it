"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CourierWithLocation } from "@/types/location";
import { Truck } from "lucide-react";

// Icono personalizado para mensajeros
const courierIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div style="
      background-color: #3b82f6;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 16px;
        font-weight: bold;
      ">🚚</div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Componente para ajustar el viewport del mapa
function MapBounds({ couriers }: { couriers: CourierWithLocation[] }) {
  const map = useMap();
  const hasSetBounds = useRef(false);

  useEffect(() => {
    const validCouriers = couriers.filter(
      (c) => c.last_location?.lat && c.last_location?.lng
    );

    if (validCouriers.length === 0) return;

    if (validCouriers.length === 1) {
      // Si solo hay un mensajero, centrar en él
      const courier = validCouriers[0];
      if (courier.last_location) {
        map.setView(
          [courier.last_location.lat, courier.last_location.lng],
          15
        );
      }
    } else {
      // Si hay múltiples, ajustar bounds para verlos todos
      const bounds = L.latLngBounds(
        validCouriers.map((c) => [
          c.last_location!.lat,
          c.last_location!.lng,
        ])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    hasSetBounds.current = true;
  }, [couriers, map]);

  return null;
}

type Props = {
  couriers: CourierWithLocation[];
  className?: string;
  height?: string;
};

export function CouriersMap({
  couriers,
  className = "w-full",
  height = "500px",
}: Props) {
  const validCouriers = couriers.filter(
    (c) => c.last_location?.lat && c.last_location?.lng
  );

  if (validCouriers.length === 0) {
    return (
      <div
        className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay mensajeros con ubicación disponible</p>
        </div>
      </div>
    );
  }

  // Calcular centro inicial
  const centerLat =
    validCouriers.reduce(
      (sum, c) => sum + (c.last_location?.lat || 0),
      0
    ) / validCouriers.length;
  const centerLng =
    validCouriers.reduce(
      (sum, c) => sum + (c.last_location?.lng || 0),
      0
    ) / validCouriers.length;

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds couriers={couriers} />
        {validCouriers.map((courier) => {
          if (!courier.last_location) return null;

          return (
            <Marker
              key={courier.id}
              position={[
                courier.last_location.lat,
                courier.last_location.lng,
              ]}
              icon={courierIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold mb-1">{courier.display_name}</p>
                  {courier.phone && (
                    <p className="text-gray-600 mb-1">
                      <strong>Tel:</strong> {courier.phone}
                    </p>
                  )}
                  <p className="text-gray-600 mb-1">
                    <strong>Pedidos activos:</strong>{" "}
                    {courier.active_orders_count}
                  </p>
                  {courier.last_location.accuracy_m && (
                    <p className="text-gray-600 mb-1">
                      <strong>Precisión:</strong> ~
                      {Math.round(courier.last_location.accuracy_m)}m
                    </p>
                  )}
                  {courier.last_location.recorded_at && (
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(
                        courier.last_location.recorded_at
                      ).toLocaleString("es-ES")}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
