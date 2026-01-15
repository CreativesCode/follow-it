import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { proofUploadSchema } from "@/lib/validations/proof";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/proofs/upload-url - Obtener URL de subida
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("POST /api/proofs/upload-url: No autorizado", authError);
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log(
      "POST /api/proofs/upload-url: Usuario autenticado",
      user.id.slice(0, 8)
    );

    const body = await request.json();
    console.log("POST /api/proofs/upload-url: Body recibido", {
      order_id: body.order_id,
      type: body.type,
      hasLat: !!body.lat,
      hasLng: !!body.lng,
    });

    // Validar que order_id existe y no está vacío
    if (
      !body.order_id ||
      typeof body.order_id !== "string" ||
      body.order_id.trim() === ""
    ) {
      console.error(
        "POST /api/proofs/upload-url: order_id inválido",
        body.order_id
      );
      return NextResponse.json(
        { error: "ID de pedido requerido" },
        { status: 400 }
      );
    }

    const data = proofUploadSchema.parse(body);
    console.log("POST /api/proofs/upload-url: Validación exitosa", {
      order_id: data.order_id.slice(0, 8),
    });

    // Obtener pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, business_id, status, assigned_courier_id")
      .eq("id", data.order_id)
      .single();

    if (orderError || !order) {
      console.error("POST /api/proofs/upload-url: Pedido no encontrado", {
        order_id: data.order_id,
        error: orderError,
      });
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    console.log("POST /api/proofs/upload-url: Pedido encontrado", {
      order_id: order.id.slice(0, 8),
      business_id: order.business_id.slice(0, 8),
      status: order.status,
      assigned_courier_id: order.assigned_courier_id?.slice(0, 8),
    });

    // Obtener el courier_id del usuario autenticado para este business
    // Esto es necesario para que RLS valide correctamente
    const { data: courierData, error: courierError } = await supabase
      .from("couriers")
      .select("id, user_id")
      .eq("user_id", user.id)
      .eq("business_id", order.business_id)
      .eq("is_active", true)
      .single();

    if (courierError || !courierData) {
      console.error("POST /api/proofs/upload-url: Mensajero no encontrado", {
        user_id: user.id.slice(0, 8),
        business_id: order.business_id.slice(0, 8),
        error: courierError,
      });
      return NextResponse.json(
        { error: "Mensajero no encontrado o inactivo" },
        { status: 403 }
      );
    }

    console.log("POST /api/proofs/upload-url: Courier encontrado", {
      courier_id: courierData.id.slice(0, 8),
      user_id: courierData.user_id.slice(0, 8),
    });

    // Verificar que el courier_id coincide con el asignado al pedido
    if (courierData.id !== order.assigned_courier_id) {
      console.error("POST /api/proofs/upload-url: Courier no asignado", {
        courier_id: courierData.id.slice(0, 8),
        assigned_courier_id: order.assigned_courier_id?.slice(0, 8),
      });
      return NextResponse.json(
        { error: "No eres el mensajero asignado a este pedido" },
        { status: 403 }
      );
    }

    // Verificar estado válido para subir proof
    if (!["assigned", "en_route"].includes(order.status)) {
      console.error(
        "POST /api/proofs/upload-url: Estado inválido para subir proof",
        {
          status: order.status,
        }
      );
      return NextResponse.json(
        { error: "Solo puedes subir comprobantes en pedidos activos" },
        { status: 400 }
      );
    }

    // Generar ID y path
    const proofId = crypto.randomUUID();
    const extension = data.type === "signature" ? "png" : "jpg";
    const storagePath = `proofs/${order.business_id}/${order.id}/${proofId}.${extension}`;

    // Crear admin client para operaciones que requieren bypasear RLS
    // Ya verificamos manualmente todos los permisos arriba
    const adminClient = createAdminClient();

    // Crear registro preliminar en BD
    const insertData = {
      id: proofId,
      business_id: order.business_id,
      order_id: order.id,
      courier_id: courierData.id, // Ya verificamos que es el courier asignado
      type: data.type,
      storage_path: storagePath,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      captured_at: new Date().toISOString(),
    };

    console.log("POST /api/proofs/upload-url: Insertando proof", {
      proof_id: proofId.slice(0, 8),
      courier_id: insertData.courier_id.slice(0, 8),
      order_id: insertData.order_id.slice(0, 8),
      business_id: insertData.business_id.slice(0, 8),
    });

    // Usar admin client para insertar (bypasea RLS)
    const { error: insertError } = await adminClient
      .from("order_proofs")
      .insert(insertData);

    if (insertError) {
      console.error("POST /api/proofs/upload-url: Error al insertar proof", {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
      });
      throw insertError;
    }

    console.log("POST /api/proofs/upload-url: Proof insertado exitosamente");

    // Generar signed upload URL usando admin client para bypasear RLS del storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("proofs")
      .createSignedUploadUrl(storagePath, {
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "POST /api/proofs/upload-url: Error creando signed URL",
        uploadError
      );
      // Rollback: eliminar registro usando admin client
      await adminClient.from("order_proofs").delete().eq("id", proofId);
      throw uploadError;
    }

    console.log("POST /api/proofs/upload-url: Signed URL creada exitosamente");

    return NextResponse.json({
      proof_id: proofId,
      upload_url: uploadData.signedUrl,
      storage_path: storagePath,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min
    });
  } catch (error: unknown) {
    console.error("POST /api/proofs/upload-url error completo:", {
      error,
      message: error instanceof Error ? error.message : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: "errors" in error ? error.errors : [],
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error al generar URL de subida";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
