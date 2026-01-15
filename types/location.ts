// Tipos específicos para el módulo de tracking GPS
// Nota: CourierLocation ya está definido en database.ts

export type LocationPing = {
  lat: number;
  lng: number;
  accuracy_m?: number;
  speed_mps?: number;
  heading?: number;
  recorded_at?: string; // ISO string, para offline
};

export type CourierWithLocation = {
  id: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
  last_location?: {
    lat: number;
    lng: number;
    recorded_at: string;
    accuracy_m?: number;
  } | null;
  active_orders_count: number;
};
