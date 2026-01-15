import { z } from "zod";

// Schema para obtener URL de subida
export const proofUploadSchema = z.object({
  order_id: z.string().uuid("ID de pedido inválido"),
  type: z.enum(["photo", "signature"]),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
});

export type ProofUploadInput = z.infer<typeof proofUploadSchema>;

// Schema para confirmar subida
export const proofConfirmSchema = z.object({
  proof_id: z.string().uuid("ID de proof inválido"),
  captured_at: z.string().datetime().optional(),
});

export type ProofConfirmInput = z.infer<typeof proofConfirmSchema>;
