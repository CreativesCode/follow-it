import type { Order, OrderStatus, Courier, Customer, OrderEvent, OrderProof } from './database';

// Tipo base de la tabla
export type { Order, OrderStatus };
export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'>;
export type OrderUpdate = Partial<Omit<Order, 'id' | 'business_id' | 'created_at'>>;

// Tipo extendido con relaciones
export type OrderWithRelations = Order & {
  courier?: Pick<Courier, 'id' | 'display_name' | 'phone'> | null;
  customer?: Pick<Customer, 'id' | 'name' | 'phone'> | null;
  events?: OrderEvent[];
  proofs?: OrderProof[];
};

// Para el formulario
export type OrderFormData = {
  dropoff_address: string;
  pickup_address?: string;
  items_summary: string;
  notes?: string;
  amount_cents?: number;
  customer_name?: string;
  customer_phone?: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
};

// Para filtros
export type OrderFilters = {
  status?: OrderStatus | 'all';
  courier_id?: string | 'all';
  date_from?: string;
  date_to?: string;
  search?: string; // código, dirección, teléfono
  page?: number;
  limit?: number;
};

// Estados con metadata UI
export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;        // Tailwind color
  bgColor: string;
  icon: string;         // Lucide icon name
  allowedTransitions: OrderStatus[];
}> = {
  pending: {
    label: 'Pendiente',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'Clock',
    allowedTransitions: ['assigned', 'canceled']
  },
  assigned: {
    label: 'Asignado',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'User',
    allowedTransitions: ['en_route', 'pending', 'canceled']
  },
  en_route: {
    label: 'En Camino',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: 'Truck',
    allowedTransitions: ['delivered', 'failed']
  },
  delivered: {
    label: 'Entregado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'CheckCircle',
    allowedTransitions: []
  },
  failed: {
    label: 'Fallido',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'XCircle',
    allowedTransitions: ['assigned'] // Re-intentar
  },
  canceled: {
    label: 'Cancelado',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    icon: 'Ban',
    allowedTransitions: []
  }
};
