/**
 * Utilidades para enviar notificaciones por WhatsApp
 */

type WhatsAppMessage = {
  phone_number: string;
  message: string;
  order_code?: string;
  tracking_url?: string;
};

type WhatsAppResponse = {
  success: boolean;
  method: "twilio" | "whatsapp_business" | "web";
  message_id?: string;
  whatsapp_url?: string;
  error?: string;
};

/**
 * Envía un mensaje por WhatsApp usando la API configurada
 */
export async function sendWhatsAppMessage(
  data: WhatsAppMessage
): Promise<WhatsAppResponse> {
  const { phone_number, message } = data;

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
  const whatsappApiType = process.env.WHATSAPP_API_TYPE || "web";

  if (whatsappApiType === "twilio") {
    return sendViaTwilio(formattedPhone, message);
  } else if (whatsappApiType === "whatsapp_business") {
    return sendViaWhatsAppBusiness(formattedPhone, message);
  } else {
    // Fallback: generar link de WhatsApp Web
    return sendViaWeb(formattedPhone, message);
  }
}

/**
 * Envía mensaje usando Twilio WhatsApp API
 */
async function sendViaTwilio(
  phone: string,
  message: string
): Promise<WhatsAppResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

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
        Authorization: `Basic ${Buffer.from(
          `${accountSid}:${authToken}`
        ).toString("base64")}`,
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

/**
 * Envía mensaje usando WhatsApp Business API oficial
 */
async function sendViaWhatsAppBusiness(
  phone: string,
  message: string
): Promise<WhatsAppResponse> {
  const apiUrl = process.env.WHATSAPP_BUSINESS_API_URL;
  const apiToken = process.env.WHATSAPP_BUSINESS_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;

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

/**
 * Genera link de WhatsApp Web (fallback)
 */
function sendViaWeb(phone: string, message: string): WhatsAppResponse {
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

/**
 * Genera mensaje de notificación para asignación de pedido
 */
export function formatAssignmentMessage(
  orderCode: string,
  dropoffAddress: string,
  trackingUrl?: string
): string {
  let message = `🚚 *Nuevo Pedido Asignado*\n\n`;
  message += `Pedido: *${orderCode}*\n`;
  message += `Dirección: ${dropoffAddress}\n\n`;
  message += `Por favor, revisa la app para más detalles.`;

  if (trackingUrl) {
    message += `\n\nLink de seguimiento: ${trackingUrl}`;
  }

  return message;
}

/**
 * Genera mensaje de notificación para cambio de estado
 */
export function formatStatusChangeMessage(
  orderCode: string,
  status: string,
  trackingUrl?: string
): string {
  const statusMessages: Record<string, string> = {
    en_route: "🚛 Tu pedido está en camino",
    delivered: "✅ Tu pedido ha sido entregado",
    failed: "❌ Hubo un problema con tu pedido",
    canceled: "🚫 Tu pedido ha sido cancelado",
  };

  const emoji = statusMessages[status]?.split(" ")[0] || "📦";
  const title =
    statusMessages[status]?.split(" ").slice(1).join(" ") ||
    `Tu pedido cambió a: ${status}`;

  let message = `${emoji} *${title}*\n\n`;
  message += `Pedido: *${orderCode}*\n\n`;

  if (status === "en_route") {
    message += `El mensajero ya está en camino a tu dirección.`;
  } else if (status === "delivered") {
    message += `¡Gracias por tu compra! Esperamos que todo esté en orden.`;
  } else if (status === "failed") {
    message += `Lamentamos las molestias. Por favor, contacta con nosotros para resolver el problema.`;
  }

  if (trackingUrl) {
    message += `\n\nSeguimiento en tiempo real: ${trackingUrl}`;
  }

  return message;
}
