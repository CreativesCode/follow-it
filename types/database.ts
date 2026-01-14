// types/database.ts
// Tipos TypeScript para la base de datos de Supabase
// Estos tipos se pueden generar automáticamente con: npx supabase gen types typescript --project-id <project-id> > types/database.ts

export type OrderStatus =
  | "pending"
  | "assigned"
  | "en_route"
  | "delivered"
  | "failed"
  | "canceled";

export type OrderEventType =
  | "order_created"
  | "order_assigned"
  | "order_unassigned"
  | "courier_accepted"
  | "status_changed"
  | "proof_uploaded"
  | "note_added"
  | "order_canceled"
  | "order_failed";

export type ProofType = "photo" | "signature";

export type BusinessMemberRole = "owner" | "admin" | "operator";

export interface Business {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
}

export interface BusinessMember {
  business_id: string;
  user_id: string;
  role: BusinessMemberRole;
  is_active: boolean;
  created_at: string;
}

export interface Courier {
  id: string;
  business_id: string;
  user_id: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  code: string | null;
  customer_id: string | null;
  pickup_address: string | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  notes: string | null;
  items_summary: string | null;
  amount_cents: number | null;
  currency: string;
  status: OrderStatus;
  assigned_courier_id: string | null;
  assigned_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: string;
  business_id: string;
  order_id: string;
  type: OrderEventType;
  from_status: OrderStatus | null;
  to_status: OrderStatus | null;
  courier_id: string | null;
  note: string | null;
  meta: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface OrderProof {
  id: string;
  business_id: string;
  order_id: string;
  courier_id: string | null;
  type: ProofType;
  storage_path: string;
  captured_at: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface CourierLocation {
  id: number;
  business_id: string;
  courier_id: string;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  speed_mps: number | null;
  heading: number | null;
  recorded_at: string;
}

export interface OrderTrackingLink {
  id: string;
  business_id: string;
  order_id: string;
  token_hash: string;
  expires_at: string;
  is_revoked: boolean;
  created_by: string | null;
  created_at: string;
}
