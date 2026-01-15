import type { OrderProof, ProofType } from "./database";

// Re-exportar tipos base
export type { OrderProof, ProofType };

// Tipo extendido con signed URL (para UI)
export type OrderProofWithUrl = OrderProof & {
  signed_url?: string;
};

export type ProofUploadRequest = {
  order_id: string;
  type: ProofType;
  lat?: number | null;
  lng?: number | null;
};

export type ProofUploadResponse = {
  proof_id: string;
  upload_url: string;
  storage_path: string;
  expires_at: string;
};

export type ProofConfirmRequest = {
  proof_id: string;
  captured_at?: string;
};
