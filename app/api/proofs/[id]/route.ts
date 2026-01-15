import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/proofs/[id] - Obtener proof con signed URL
export async function GET({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json(
        { error: "ID de comprobante requerido" },
        { status: 400 }
      );
    }

    const { id } = resolvedParams;

    // Obtener proof usando admin client (bypasea RLS)
    const adminClient = createAdminClient();
    const { data: proof, error } = await adminClient
      .from("order_proofs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !proof) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      );
    }

    // Verificar permisos manualmente
    const { data: businessMember } = await supabase
      .from("business_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", proof.business_id)
      .eq("is_active", true)
      .maybeSingle();

    // Verificar si es el courier
    const { data: courier } = await supabase
      .from("couriers")
      .select("user_id")
      .eq("id", proof.courier_id)
      .single();

    const isCourier = courier?.user_id === user.id;

    if (!businessMember && !isCourier) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Generar signed URL usando admin client
    const { data: urlData, error: urlError } = await adminClient.storage
      .from("proofs")
      .createSignedUrl(proof.storage_path, 15 * 60); // 15 min

    if (urlError) throw urlError;

    return NextResponse.json({
      ...proof,
      signed_url: urlData.signedUrl,
    });
  } catch (error: unknown) {
    console.error("GET /api/proofs/[id] error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al obtener comprobante";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
