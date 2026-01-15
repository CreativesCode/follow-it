// types/index.ts
// Tipos compartidos del proyecto

import { OrderStatus, ProofType } from "./database";

export * from "./database";
// Exportar tipos específicos de location (CourierLocation ya está en database)
export type { CourierWithLocation, LocationPing } from "./location";

// Tipos de utilidad
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page?: number;
  pageSize?: number;
}

// Tipos para Edge Functions
export interface ChangeOrderStatusPayload {
  order_id: string;
  to_status: OrderStatus;
  note?: string | null;
  proof_id?: string | null;
}

export interface AssignOrderPayload {
  order_id: string;
  courier_id: string;
}

export interface CreateTrackingLinkPayload {
  order_id: string;
  expires_in_minutes?: number;
}

export interface CreateProofUploadPayload {
  order_id: string;
  proof_type: ProofType;
}

export interface TrackingSnapshot {
  order: {
    id: string;
    status: string;
    code: string | null;
    dropoff_address: string | null;
    updated_at: string;
  };
  courier?: {
    lat: number;
    lng: number;
    recorded_at: string;
    accuracy_m?: number | null;
  } | null;
}
