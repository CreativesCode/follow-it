import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { proofConfirmSchema } from "@/lib/validations/proof";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/proofs/confirm - Confirmar que el archivo se subió
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("POST /api/proofs/confirm: No autorizado", authError);
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    console.log("POST /api/proofs/confirm: Body recibido", {
      proof_id: body.proof_id?.slice(0, 8),
    });

    const data = proofConfirmSchema.parse(body);

    // Usar admin client para obtener el proof (bypasea RLS)
    const adminClient = createAdminClient();
    const { data: proof, error: proofError } = await adminClient
      .from("order_proofs")
      .select("*, courier:couriers!courier_id(user_id)")
      .eq("id", data.proof_id)
      .single();

    if (proofError || !proof) {
      console.error("POST /api/proofs/confirm: Proof no encontrado", {
        proof_id: data.proof_id,
        error: proofError,
      });
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      );
    }

    console.log("POST /api/proofs/confirm: Proof encontrado", {
      proof_id: proof.id.slice(0, 8),
      courier_user_id: proof.courier?.user_id?.slice(0, 8),
      storage_path: proof.storage_path,
    });

    // Verificar que es el courier
    if (proof.courier?.user_id !== user.id) {
      console.error("POST /api/proofs/confirm: Usuario no autorizado", {
        courier_user_id: proof.courier?.user_id?.slice(0, 8),
        current_user_id: user.id.slice(0, 8),
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el archivo existe en storage usando admin client
    const pathParts = proof.storage_path.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const folderPath = pathParts.slice(0, -1).join("/");

    console.log("POST /api/proofs/confirm: Verificando archivo", {
      folderPath,
      fileName,
    });

    const { data: fileData, error: fileError } = await adminClient.storage
      .from("proofs")
      .list(folderPath, {
        search: fileName,
      });

    console.log("POST /api/proofs/confirm: Resultado de búsqueda", {
      found: fileData?.length || 0,
      error: fileError,
      files: fileData?.map((f) => f.name),
    });

    if (fileError || !fileData || fileData.length === 0) {
      console.error("POST /api/proofs/confirm: Archivo no encontrado", {
        fileError,
        fileDataLength: fileData?.length,
      });
      return NextResponse.json(
        { error: "El archivo no se subió correctamente" },
        { status: 400 }
      );
    }

    console.log("POST /api/proofs/confirm: Archivo verificado exitosamente");

    // Actualizar captured_at si se proporcionó, usando admin client
    if (data.captured_at) {
      await adminClient
        .from("order_proofs")
        .update({ captured_at: data.captured_at })
        .eq("id", data.proof_id);
    }

    // Crear evento usando admin client
    const { error: eventError } = await adminClient
      .from("order_events")
      .insert({
        business_id: proof.business_id,
        order_id: proof.order_id,
        type: "proof_uploaded",
        courier_id: proof.courier_id,
        created_by: user.id,
        meta: {
          proof_id: proof.id,
          proof_type: proof.type,
        },
      });

    if (eventError) {
      console.error(
        "POST /api/proofs/confirm: Error creando evento",
        eventError
      );
      // No lanzar error, el proof ya está confirmado
    }

    console.log("POST /api/proofs/confirm: Proof confirmado exitosamente");

    return NextResponse.json({
      success: true,
      proof_id: proof.id,
    });
  } catch (error: unknown) {
    console.error("POST /api/proofs/confirm error completo:", {
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
      error instanceof Error ? error.message : "Error al confirmar comprobante";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
