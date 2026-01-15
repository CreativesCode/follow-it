"use client";

import { ProofCapture } from "@/components/proofs/ProofCapture";
import { ProofGallery } from "@/components/proofs/ProofGallery";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useOrder } from "@/lib/hooks/useOrder";
import { useUserRole } from "@/lib/hooks/useUserRole";
import type { OrderFormData } from "@/types/orders";
import {
  Check,
  Copy,
  Edit,
  Link as LinkIcon,
  MessageCircle,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { AssignOrderModal } from "./AssignOrderModal";
import { OrderActions, hasCourierActions } from "./OrderActions";
import { OrderForm } from "./OrderForm";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderTimeline } from "./OrderTimeline";

type Props = {
  orderId: string | null;
  businessId: string;
  onClose: () => void;
  onOrderUpdate?: () => void;
};

export function OrderDetailModal({
  orderId,
  businessId,
  onClose,
  onOrderUpdate,
}: Props) {
  const { order, loading, error, updateOrder, refetch } = useOrder(
    orderId || ""
  );
  const { type: userRoleType, courier } = useUserRole();
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [trackingLink, setTrackingLink] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [showProofCapture, setShowProofCapture] = useState(false);

  // Verificar si el usuario es el mensajero asignado
  const isCourier =
    userRoleType === "courier" &&
    order &&
    courier &&
    order.assigned_courier_id === courier.id;

  // Verificar si el usuario es un business member
  const isBusiness = userRoleType === "business";

  const handleUpdate = async (data: OrderFormData) => {
    setSaveError(null);
    const result = await updateOrder(data);
    if (result.order) {
      setIsEditing(false);
      onOrderUpdate?.();
      // Opcional: cerrar modal después de guardar exitosamente
      // onClose();
    } else {
      setSaveError(result.error || "Error al actualizar pedido");
    }
    return result;
  };

  const handleAssignSuccess = async () => {
    await refetch();
    onOrderUpdate?.();
    setShowAssignModal(false);
  };

  const handleGenerateTrackingLink = async () => {
    if (!order) return;

    setTrackingLoading(true);
    setTrackingError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          expires_in_hours: 168, // 7 días por defecto
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar link");
      }

      setTrackingLink(data.tracking_url);
      setTrackingToken(data.token);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al generar link";
      setTrackingError(errorMessage);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!trackingLink) return;

    try {
      await navigator.clipboard.writeText(trackingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!trackingLink || !trackingToken || !order) return;

    const customerPhone = order.customer?.phone;
    if (!customerPhone) {
      setWhatsappError("No hay número de teléfono del cliente disponible");
      return;
    }

    setWhatsappLoading(true);
    setWhatsappError(null);

    try {
      const response = await fetch(
        `/api/tracking/${trackingToken}/send-whatsapp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone_number: customerPhone,
            tracking_url: trackingLink,
            order_code: order.code || `#${order.id.slice(0, 8)}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar por WhatsApp");
      }

      // Si el método es "web", abrir el link en una nueva ventana
      if (data.method === "web" && data.whatsapp_url) {
        window.open(data.whatsapp_url, "_blank");
      } else {
        // Si se envió por API, mostrar mensaje de éxito
        alert("Mensaje enviado por WhatsApp exitosamente");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al enviar por WhatsApp";
      setWhatsappError(errorMessage);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleProofCaptureSuccess = async () => {
    setShowProofCapture(false);
    await refetch();
    onOrderUpdate?.();
  };

  if (!orderId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm safe-area-inset">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <span className="text-gray-600">Cargando pedido...</span>
              </div>
            ) : error || !order ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Error</h2>
                <p className="text-sm text-gray-500">
                  {error || "Pedido no encontrado"}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Pedido {order.code || `#${order.id.slice(0, 8)}`}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Creado{" "}
                  {new Date(order.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>

          {order && !isEditing && isBusiness && (
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} size="md" />
              {!["delivered", "canceled"].includes(order.status) && (
                <>
                  {(order.status === "pending" ||
                    order.status === "assigned") && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignModal(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {order.status === "assigned" ? "Cambiar" : "Asignar"}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </>
              )}
            </div>
          )}
          {order && !isEditing && isCourier && (
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} size="md" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-8 safe-area-bottom">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando pedido...</p>
              </div>
            </div>
          ) : error || !order ? (
            <div className="text-center py-12">
              <Alert variant="error">{error || "Pedido no encontrado"}</Alert>
            </div>
          ) : isEditing ? (
            <div className="space-y-4 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Editar Pedido
              </h3>
              {saveError && <Alert variant="error">{saveError}</Alert>}
              <OrderForm
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
                mode="edit"
                initialData={{
                  dropoff_address: order.dropoff_address,
                  pickup_address: order.pickup_address || undefined,
                  items_summary: order.items_summary || "",
                  notes: order.notes || undefined,
                  amount_cents: order.amount_cents
                    ? order.amount_cents / 100
                    : undefined,
                  customer_name: order.customer?.name || undefined,
                  customer_phone: order.customer?.phone || undefined,
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información básica */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Información del Pedido
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Dirección de Entrega
                    </p>
                    <p className="text-gray-900">{order.dropoff_address}</p>
                  </div>
                  {order.pickup_address && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Dirección de Recogida
                      </p>
                      <p className="text-gray-900">{order.pickup_address}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Items</p>
                    <p className="text-gray-900">
                      {order.items_summary || "Sin descripción"}
                    </p>
                  </div>
                  {order.amount_cents && order.amount_cents > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Monto</p>
                      <p className="text-gray-900 font-semibold">
                        ${(order.amount_cents / 100).toFixed(2)}{" "}
                        {order.currency}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cliente */}
              {order.customer && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.customer.name && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Nombre</p>
                        <p className="text-gray-900">{order.customer.name}</p>
                      </div>
                    )}
                    {order.customer.phone && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                        <p className="text-gray-900">{order.customer.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mensajero asignado (solo para business members) */}
              {order.courier && isBusiness && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    Mensajero
                  </h3>
                  <p className="text-gray-900">{order.courier.display_name}</p>
                  {order.courier.phone && (
                    <p className="text-sm text-gray-500 mt-1">
                      {order.courier.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Notas */}
              {order.notes && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    Notas
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {order.notes}
                  </p>
                </div>
              )}

              {/* Link de tracking (solo para business members) */}
              {isBusiness && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">
                    Link de Seguimiento
                  </h3>
                  <div className="space-y-3">
                    {!trackingLink ? (
                      <Button
                        variant="outline"
                        onClick={handleGenerateTrackingLink}
                        disabled={trackingLoading}
                        className="w-full"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {trackingLoading
                          ? "Generando..."
                          : "Generar Link de Seguimiento"}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <input
                            type="text"
                            value={trackingLink}
                            readOnly
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                          />
                          <button
                            onClick={handleCopyLink}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar link"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                        {order.customer?.phone && (
                          <Button
                            variant="outline"
                            onClick={handleSendWhatsApp}
                            disabled={whatsappLoading}
                            className="w-full"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {whatsappLoading
                              ? "Enviando..."
                              : "Enviar por WhatsApp"}
                          </Button>
                        )}
                        {whatsappError && (
                          <Alert variant="error">{whatsappError}</Alert>
                        )}
                        <p className="text-xs text-gray-500">
                          Comparte este link con tu cliente para que pueda
                          seguir el estado de su pedido sin necesidad de
                          registrarse.
                        </p>
                      </div>
                    )}
                    {trackingError && (
                      <Alert variant="error">{trackingError}</Alert>
                    )}
                  </div>
                </div>
              )}

              {/* Comprobantes de entrega */}
              {(isBusiness || isCourier) && order?.id && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">
                    Comprobantes de Entrega
                  </h3>
                  <ProofGallery orderId={order.id} />
                </div>
              )}

              {/* Acciones del mensajero */}
              {isCourier &&
                order &&
                order.id &&
                hasCourierActions(order.status, true) && (
                  <div className="border-t pt-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">
                      Acciones
                    </h3>
                    <OrderActions
                      orderId={order.id}
                      currentStatus={order.status}
                      onStatusChange={async () => {
                        await refetch();
                        onOrderUpdate?.();
                      }}
                      isCourier={true}
                      onCaptureProof={() => {
                        if (order?.id) {
                          setShowProofCapture(true);
                        }
                      }}
                    />
                  </div>
                )}

              {/* Timeline de eventos */}
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  Historial de Eventos
                </h3>
                <OrderTimeline orderId={order.id} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de asignación */}
      {order && showAssignModal && (
        <AssignOrderModal
          order={order}
          businessId={businessId}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Modal de captura de proof */}
      {order && order.id && showProofCapture && (
        <ProofCapture
          orderId={order.id}
          onSuccess={handleProofCaptureSuccess}
          onCancel={() => setShowProofCapture(false)}
        />
      )}
    </div>
  );
}
