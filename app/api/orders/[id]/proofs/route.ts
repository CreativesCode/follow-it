import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { getUserRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/orders/[id]/proofs - Listar proofs de un pedido
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación sin redirect
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("GET /api/orders/[id]/proofs: No autorizado", authError);
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const role = await getUserRole(user.id);

    if (!role.type) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    console.log("GET /api/orders/[id]/proofs: Params recibidos", {
      resolvedParams,
      hasId: !!resolvedParams?.id,
      id: resolvedParams?.id,
    });

    if (!resolvedParams || !resolvedParams.id) {
      console.error(
        "GET /api/orders/[id]/proofs: ID de pedido no encontrado en params",
        {
          resolvedParams,
          isNull: resolvedParams === null,
          isUndefined: resolvedParams === undefined,
          hasId: resolvedParams?.id,
        }
      );
      return NextResponse.json(
        { error: "ID de pedido requerido" },
        { status: 400 }
      );
    }

    const { id: orderId } = resolvedParams;
    console.log(
      "GET /api/orders/[id]/proofs: Order ID extraído",
      orderId.slice(0, 8)
    );

    // Obtener pedido para verificar permisos
    // Usar RLS para filtrar automáticamente según el rol del usuario
    let query = supabase
      .from("orders")
      .select("id, business_id, assigned_courier_id")
      .eq("id", orderId);

    // Si es business member, filtrar por business_id
    if (role.type === "business") {
      const businessMember = role.data as { business_id: string };
      query = query.eq("business_id", businessMember.business_id);
    }
    // Si es courier, RLS automáticamente filtra por assigned_courier_id

    const { data: order, error: orderError } = await query.single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Verificar permisos: debe ser business member o courier asignado
    let hasAccess = false;

    if (role.type === "business") {
      const businessMember = role.data as { business_id: string };
      hasAccess = businessMember.business_id === order.business_id;
    } else if (role.type === "courier") {
      const courier = role.data as { id: string; user_id: string };
      hasAccess = order.assigned_courier_id === courier.id;
    }

    console.log("GET /api/orders/[id]/proofs: Permission check result", {
      roleType: role.type,
      hasAccess,
      orderBusinessId: order.business_id.slice(0, 8),
      orderAssignedCourierId: order.assigned_courier_id?.slice(0, 8),
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener proofs
    const { data: proofs, error: proofsError } = await supabase
      .from("order_proofs")
      .select("*")
      .eq("order_id", orderId)
      .order("captured_at", { ascending: false });

    if (proofsError) throw proofsError;

    console.log(
      `GET /api/orders/[id]/proofs: ${proofs?.length || 0} proofs encontrados`
    );

    // Generar signed URLs para cada proof usando admin client
    // El storage también tiene políticas RLS
    const adminClient = createAdminClient();
    const proofsWithUrls = await Promise.all(
      (proofs || []).map(async (proof) => {
        const { data: urlData, error: urlError } = await adminClient.storage
          .from("proofs")
          .createSignedUrl(proof.storage_path, 15 * 60); // 15 min

        if (urlError) {
          console.error(
            "Error creando signed URL para proof",
            proof.id.slice(0, 8),
            urlError
          );
        }

        return {
          ...proof,
          signed_url: urlData?.signedUrl || null,
        };
      })
    );

    console.log(
      `GET /api/orders/[id]/proofs: ${
        proofsWithUrls.filter((p) => p.signed_url).length
      } URLs firmadas creadas`
    );

    return NextResponse.json({
      proofs: proofsWithUrls,
    });
  } catch (error: unknown) {
    console.error("GET /api/orders/[id]/proofs error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al obtener comprobantes";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
