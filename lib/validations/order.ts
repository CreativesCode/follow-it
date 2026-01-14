import { z } from 'zod';

// Schema para crear pedido
export const createOrderSchema = z.object({
  dropoff_address: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(500, 'La dirección es muy larga'),
  
  pickup_address: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  
  items_summary: z
    .string()
    .min(2, 'Describe los items')
    .max(1000),
  
  notes: z
    .string()
    .max(2000)
    .optional()
    .nullable(),
  
  amount_cents: z
    .number()
    .int()
    .min(0)
    .optional()
    .nullable(),
  
  dropoff_lat: z.number().min(-90).max(90).optional().nullable(),
  dropoff_lng: z.number().min(-180).max(180).optional().nullable(),
  
  // Cliente inline (opcional)
  customer_name: z.string().max(200).optional().nullable(),
  customer_phone: z.string().max(50).optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Schema para actualizar pedido
export const updateOrderSchema = createOrderSchema.partial();

// Schema para asignar mensajero
export const assignOrderSchema = z.object({
  order_id: z.string().uuid('ID de pedido inválido'),
  courier_id: z.string().uuid('ID de mensajero inválido'),
});

// Schema para cambiar estado
export const changeStatusSchema = z.object({
  order_id: z.string().uuid(),
  to_status: z.enum(['pending', 'assigned', 'en_route', 'delivered', 'failed', 'canceled']),
  note: z.string().max(1000).optional().nullable(),
  proof_id: z.string().uuid().optional().nullable(),
});

// Schema para filtros de búsqueda
export const orderFiltersSchema = z.object({
  status: z.enum(['pending', 'assigned', 'en_route', 'delivered', 'failed', 'canceled', 'all']).optional(),
  courier_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
