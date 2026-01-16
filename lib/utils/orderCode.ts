import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generar código único de pedido
 * Formato: #YYYYMMDD-####
 * Ejemplo: #20240115-0001
 * 
 * TODO: Mover a database function/trigger para mejor consistencia
 */
export async function generateOrderCode(
  supabase: SupabaseClient,
  businessId: string
): Promise<string> {
  const today = new Date();
  const prefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(today.getDate()).padStart(2, "0")}`;

  // Contar pedidos de hoy
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", today.toISOString().split("T")[0]);

  const sequence = String((count || 0) + 1).padStart(4, "0");
  return `#${prefix}-${sequence}`;
}
