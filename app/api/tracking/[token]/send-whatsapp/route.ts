import { createClient } from "@/lib/supabase/server";
import { requireBusinessRole } from "@/lib/utils/auth";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Función para hashear el token con SHA-256 (igual que en las Edge Functions)
function sha256Hex(input: string): string {
  return createHash("sha256").update(input.trim()).digest("hex");
}

// POST /api/tracking/[token]/send-whatsapp - Enviar link de tracking por WhatsApp
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { businessMember } = await requireBusinessRole();
    const supabase = await createClient();
    const { token } = await params;

    const body = await request.json();
    const { phone_number, tracking_url, order_code } = body;

    if (!phone_number) {
      return NextResponse.json(
        { error: "phone_number es requerido" },
        { status: 400 }
      );
    }

    if (!tracking_url) {
      return NextResponse.json(
        { error: "tracking_url es requerido" },
        { status: 400 }
      );
    }

    // Validar que el token pertenece a una orden del negocio
    const token_hash = sha256Hex(token);
    const { data: link, error: linkError } = await supabase
      .from("order_tracking_links")
      .select("order_id, business_id, expires_at, is_revoked")
      .eq("token_hash", token_hash)
      .eq("business_id", businessMember.business_id)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: "Link de tracking no encontrado o no autorizado" },
        { status: 404 }
      );
    }

    // Validar que el link no esté revocado o expirado
    if (link.is_revoked) {
      return NextResponse.json(
        { error: "Link de tracking revocado" },
        { status: 403 }
      );
    }

    if (new Date(link.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Link de tracking expirado" },
        { status: 403 }
      );
    }

    // Limpiar número de teléfono (remover espacios, guiones, etc.)
    const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, "");

    // Asegurar formato internacional (agregar código de país si no está)
    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith("+")) {
      // Si no tiene código de país, asumir que es necesario agregarlo
      // Por defecto, si empieza con 0, removerlo y agregar código de país
      if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.substring(1);
      }
      // Nota: El usuario debería proporcionar el número completo con código de país
      // Por ahora, asumimos que viene con código de país o lo agregamos según configuración
    }

    // Mensaje personalizado
    const orderText = order_code ? ` para el pedido ${order_code}` : "";
    const message = `Hola! Te comparto el link de seguimiento${orderText}:\n\n${tracking_url}\n\nPuedes usarlo para ver el estado de tu pedido en tiempo real.`;

    // Intentar usar API de WhatsApp si está configurada
    const whatsappApiType = process.env.WHATSAPP_API_TYPE; // 'twilio', 'whatsapp_business', 'evolution', o 'web'

    if (whatsappApiType === "twilio") {
      // Usar Twilio WhatsApp API
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

      if (!accountSid || !authToken || !fromNumber) {
        return NextResponse.json(
          { error: "Configuración de Twilio incompleta" },
          { status: 500 }
        );
      }

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${accountSid}:${authToken}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            From: `whatsapp:${fromNumber}`,
            To: `whatsapp:${formattedPhone}`,
            Body: message,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Twilio error:", data);
          return NextResponse.json(
            { error: data.message || "Error al enviar por WhatsApp" },
            { status: response.status }
          );
        }

        return NextResponse.json({
          success: true,
          message_sid: data.sid,
          method: "twilio",
        });
      } catch (error) {
        console.error("Twilio API error:", error);
        return NextResponse.json(
          { error: "Error al comunicarse con Twilio" },
          { status: 500 }
        );
      }
    } else if (whatsappApiType === "whatsapp_business") {
      // Usar WhatsApp Business API oficial
      const apiUrl = process.env.WHATSAPP_BUSINESS_API_URL;
      const apiToken = process.env.WHATSAPP_BUSINESS_API_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;

      if (!apiUrl || !apiToken || !phoneNumberId) {
        return NextResponse.json(
          { error: "Configuración de WhatsApp Business API incompleta" },
          { status: 500 }
        );
      }

      try {
        const response = await fetch(`${apiUrl}/v1/${phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "text",
            text: { body: message },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("WhatsApp Business API error:", data);
          return NextResponse.json(
            { error: data.error?.message || "Error al enviar por WhatsApp" },
            { status: response.status }
          );
        }

        return NextResponse.json({
          success: true,
          message_id: data.messages?.[0]?.id,
          method: "whatsapp_business",
        });
      } catch (error) {
        console.error("WhatsApp Business API error:", error);
        return NextResponse.json(
          { error: "Error al comunicarse con WhatsApp Business API" },
          { status: 500 }
        );
      }
    } else {
      // Fallback: Generar link de WhatsApp Web
      const encodedMessage = encodeURIComponent(message);
      const whatsappWebUrl = `https://wa.me/${formattedPhone.replace(
        /\+/g,
        ""
      )}?text=${encodedMessage}`;

      return NextResponse.json({
        success: true,
        whatsapp_url: whatsappWebUrl,
        method: "web",
        message:
          "Link de WhatsApp generado. Abre el link para enviar el mensaje.",
      });
    }
  } catch (error: unknown) {
    console.error("POST /api/tracking/[token]/send-whatsapp error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al enviar por WhatsApp";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
