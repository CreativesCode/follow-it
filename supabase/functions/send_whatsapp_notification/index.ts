// supabase/functions/send_whatsapp_notification/index.ts
import { badRequest, json, ok, unauthorized } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // Verificar autorización (service role key o internal secret)
  const authHeader = req.headers.get("Authorization");
  const internalSecret = req.headers.get("x-internal-secret");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const expectedSecret = Deno.env.get("INTERNAL_API_SECRET");

  let isAuthorized = false;

  if (authHeader) {
    const providedKey = authHeader.replace("Bearer ", "");
    if (providedKey === serviceKey) {
      isAuthorized = true;
    }
  }

  if (internalSecret && internalSecret === expectedSecret) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return unauthorized("Authorization required");
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { phone_number, message } = payload ?? ({} as Payload);
  if (!phone_number || typeof phone_number !== "string") {
    return badRequest("phone_number is required");
  }
  if (!message || typeof message !== "string") {
    return badRequest("message is required");
  }

  // Limpiar número de teléfono
  const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, "");

  // Asegurar formato internacional
  let formattedPhone = cleanPhone;
  if (!formattedPhone.startsWith("+")) {
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    }
  }

  // Obtener tipo de API configurada
  const whatsappApiType = Deno.env.get("WHATSAPP_API_TYPE") || "web";

  let result: {
    success: boolean;
    method: string;
    message_id?: string;
    whatsapp_url?: string;
    error?: string;
  };

  if (whatsappApiType === "twilio") {
    result = await sendViaTwilio(formattedPhone, message);
  } else if (whatsappApiType === "whatsapp_business") {
    result = await sendViaWhatsAppBusiness(formattedPhone, message);
  } else {
    // Fallback: generar link de WhatsApp Web
    result = sendViaWeb(formattedPhone, message);
  }

  if (!result.success) {
    return json(500, {
      error: result.error || "Error al enviar por WhatsApp",
      method: result.method,
    });
  }

  return ok({
    success: true,
    method: result.method,
    message_id: result.message_id,
    whatsapp_url: result.whatsapp_url,
  });
});

async function sendViaTwilio(
  phone: string,
  message: string
): Promise<{
  success: boolean;
  method: string;
  message_id?: string;
  error?: string;
}> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      method: "twilio",
      error: "Configuración de Twilio incompleta",
    };
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${phone}`,
        Body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        method: "twilio",
        error: data.message || "Error al enviar por WhatsApp",
      };
    }

    return {
      success: true,
      method: "twilio",
      message_id: data.sid,
    };
  } catch (error) {
    console.error("Twilio API error:", error);
    return {
      success: false,
      method: "twilio",
      error: "Error al comunicarse con Twilio",
    };
  }
}

async function sendViaWhatsAppBusiness(
  phone: string,
  message: string
): Promise<{
  success: boolean;
  method: string;
  message_id?: string;
  error?: string;
}> {
  const apiUrl = Deno.env.get("WHATSAPP_BUSINESS_API_URL");
  const apiToken = Deno.env.get("WHATSAPP_BUSINESS_API_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_BUSINESS_PHONE_NUMBER_ID");

  if (!apiUrl || !apiToken || !phoneNumberId) {
    return {
      success: false,
      method: "whatsapp_business",
      error: "Configuración de WhatsApp Business API incompleta",
    };
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
        to: phone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        method: "whatsapp_business",
        error: data.error?.message || "Error al enviar por WhatsApp",
      };
    }

    return {
      success: true,
      method: "whatsapp_business",
      message_id: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp Business API error:", error);
    return {
      success: false,
      method: "whatsapp_business",
      error: "Error al comunicarse con WhatsApp Business API",
    };
  }
}

function sendViaWeb(
  phone: string,
  message: string
): {
  success: boolean;
  method: string;
  whatsapp_url?: string;
} {
  const encodedMessage = encodeURIComponent(message);
  const whatsappWebUrl = `https://wa.me/${phone.replace(
    /\+/g,
    ""
  )}?text=${encodedMessage}`;

  return {
    success: true,
    method: "web",
    whatsapp_url: whatsappWebUrl,
  };
}
