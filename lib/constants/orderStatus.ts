import type { OrderStatus } from '@/types/database';

// Transiciones permitidas por estado actual
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['assigned', 'canceled'],
  assigned: ['en_route', 'pending', 'canceled'],
  en_route: ['delivered', 'failed'],
  delivered: [], // Estado final
  failed: ['assigned'], // Se puede reintentar
  canceled: [], // Estado final
};

// Transiciones que requieren ser del panel (business member)
export const PANEL_ONLY_TRANSITIONS: Array<{ from: OrderStatus; to: OrderStatus }> = [
  { from: 'pending', to: 'assigned' },
  { from: 'assigned', to: 'pending' },
  { from: 'failed', to: 'assigned' },
  // Cancelar desde cualquier estado
  { from: 'pending', to: 'canceled' },
  { from: 'assigned', to: 'canceled' },
];

// Transiciones que requieren ser mensajero asignado
export const COURIER_ONLY_TRANSITIONS: Array<{ from: OrderStatus; to: OrderStatus }> = [
  { from: 'assigned', to: 'en_route' },
  { from: 'en_route', to: 'delivered' },
  { from: 'en_route', to: 'failed' },
];

// Validar si una transición es válida
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// Obtener quién puede hacer la transición
export function getTransitionRole(from: OrderStatus, to: OrderStatus): 'business' | 'courier' | 'both' | null {
  if (!isValidTransition(from, to)) return null;
  
  const isPanelOnly = PANEL_ONLY_TRANSITIONS.some(
    t => t.from === from && t.to === to
  );
  
  const isCourierOnly = COURIER_ONLY_TRANSITIONS.some(
    t => t.from === from && t.to === to
  );
  
  if (isPanelOnly) return 'business';
  if (isCourierOnly) return 'courier';
  return 'both';
}

// Transiciones que requieren nota obligatoria
export const TRANSITIONS_REQUIRING_NOTE: Array<{ from: OrderStatus; to: OrderStatus }> = [
  { from: 'en_route', to: 'failed' },
];

// Transiciones que recomiendan proof
export const TRANSITIONS_RECOMMENDING_PROOF: Array<{ from: OrderStatus; to: OrderStatus }> = [
  { from: 'en_route', to: 'delivered' },
];

export function requiresNote(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS_REQUIRING_NOTE.some(
    t => t.from === from && t.to === to
  );
}

export function recommendsProof(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS_RECOMMENDING_PROOF.some(
    t => t.from === from && t.to === to
  );
}
