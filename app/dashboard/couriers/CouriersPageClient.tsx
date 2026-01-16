"use client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRealtimeLocations } from "@/lib/hooks/useRealtimeLocations";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

// Dynamic import para evitar errores de SSR con react-leaflet
const CouriersMap = dynamic(
  () =>
    import("@/components/map/CouriersMap").then((mod) => ({
      default: mod.CouriersMap,
    })),
  { ssr: false }
);

interface Courier {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  invitation_code: string;
  courier_email: string | null;
  courier_name: string | null;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

interface CouriersPageClientProps {
  user: any;
  businessId: string;
  businessName: string;
  initialCouriers: Courier[];
  initialInvitations: Invitation[];
}

export default function CouriersPageClient({
  businessId,
  initialCouriers,
  initialInvitations,
}: CouriersPageClientProps) {
  const [couriers] = useState<Courier[]>(initialCouriers);
  const [invitations, setInvitations] =
    useState<Invitation[]>(initialInvitations);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courierName, setCourierName] = useState("");
  const [courierEmail, setCourierEmail] = useState("");

  // Memoizar cliente de Supabase
  const supabase = useMemo(() => createClient(), []);

  // Usar businessMember y user del contexto si está disponible
  const { businessMember, user } = useAuth();

  // Obtener ubicaciones en tiempo real de los mensajeros
  const {
    couriers: couriersWithLocations,
    loading: locationsLoading,
    error: locationsError,
  } = useRealtimeLocations(businessId);

  const createInvitation = async () => {
    setIsCreatingInvitation(true);
    setError(null);
    setSuccess(null);

    try {
      // Verificar que el usuario está autenticado
      if (!user) {
        setError("No autorizado");
        return;
      }

      // Verificar que el usuario es miembro del negocio
      // Usar businessMember del contexto si está disponible
      if (businessMember && businessMember.business_id === businessId) {
        // Ya tenemos la verificación del contexto
      } else {
        // Solo consultar si no tenemos datos del contexto
        const { data: membership } = await supabase
          .from("business_members")
          .select("role")
          .eq("business_id", businessId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!membership) {
          setError("No eres miembro de este negocio");
          return;
        }
      }

      // Generar código de invitación usando RPC
      const { data: codeData, error: codeError } = await supabase.rpc(
        "generate_invitation_code"
      );

      if (codeError) {
        throw codeError;
      }

      const invitationCode = codeData as string;

      // Crear invitación directamente en Supabase
      const { data: invitation, error: invitationError } = await supabase
        .from("courier_invitations")
        .insert({
          business_id: businessId,
          created_by: user.id,
          invitation_code: invitationCode,
          courier_email: courierEmail.trim() || null,
          courier_name: courierName.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      if (invitationError) {
        throw invitationError;
      }

      setSuccess(`¡Invitación creada! Código: ${invitation.invitation_code}`);
      setInvitations([invitation, ...invitations]);
      setCourierName("");
      setCourierEmail("");
      setShowInviteForm(false);
    } catch (err: any) {
      console.error("Error creating invitation:", err);
      setError(err.message || "Error al crear la invitación");
    } finally {
      setIsCreatingInvitation(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`Código ${text} copiado al portapapeles`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const sendViaWhatsApp = (code: string, courierName?: string | null) => {
    const name = courierName ? ` ${courierName}` : "";
    const message = `Hola${name}! Te comparto tu código de invitación para unirte como mensajero:\n\n*${code}*\n\nUsa este código para registrarte en la aplicación.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-secondary-100 text-secondary-800",
      expired: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const labels = {
      pending: "Pendiente",
      accepted: "Aceptada",
      expired: "Expirada",
      cancelled: "Cancelada",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded ${
          badges[status as keyof typeof badges] || badges.pending
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-primary-700">
                Gestión de Mensajeros
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Invita y gestiona a tu equipo de mensajeros
              </p>
            </div>
            <Button
              onClick={() => setShowInviteForm(!showInviteForm)}
              disabled={isCreatingInvitation}
              className="w-full md:w-auto"
            >
              {showInviteForm ? "Cancelar" : "+ Invitar Mensajero"}
            </Button>
          </div>

          {/* Alerts */}
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Invite Form */}
          {showInviteForm && (
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Crear Nueva Invitación
              </h3>
              <div className="space-y-4">
                <FormInput
                  id="courierName"
                  name="courierName"
                  type="text"
                  label="Nombre del Mensajero (Opcional)"
                  placeholder="Juan Pérez"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />

                <FormInput
                  id="courierEmail"
                  name="courierEmail"
                  type="email"
                  label="Email del Mensajero (Opcional)"
                  placeholder="juan@example.com"
                  value={courierEmail}
                  onChange={(e) => setCourierEmail(e.target.value)}
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={createInvitation}
                    isLoading={isCreatingInvitation}
                    disabled={isCreatingInvitation}
                    className="flex-1"
                  >
                    Generar Código de Invitación
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInviteForm(false);
                      setCourierName("");
                      setCourierEmail("");
                    }}
                    disabled={isCreatingInvitation}
                    className="flex-1 sm:flex-initial"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Couriers */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Mensajeros Activos ({couriers.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {couriers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay mensajeros
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza invitando a tu primer mensajero
                  </p>
                </div>
              ) : (
                couriers.map((courier) => (
                  <div key={courier.id} className="px-4 md:px-6 py-4">
                    {/* Mobile View */}
                    <div className="flex flex-col md:hidden gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="shrink-0 w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-secondary-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {courier.full_name || "Sin nombre"}
                            </p>
                            {courier.is_active ? (
                              <span className="px-2 py-0.5 text-xs font-medium bg-secondary-100 text-secondary-800 rounded-full shrink-0">
                                Activo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full shrink-0">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {courier.email}
                          </p>
                          {courier.phone && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {courier.phone}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1.5">
                            Desde {formatDate(courier.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="shrink-0 w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-secondary-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {courier.full_name || "Sin nombre"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {courier.email}
                          </p>
                          {courier.phone && (
                            <p className="text-sm text-gray-500">
                              {courier.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {courier.is_active ? (
                          <span className="px-2 py-1 text-xs font-medium bg-secondary-100 text-secondary-800 rounded">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            Inactivo
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          Desde {formatDate(courier.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mapa de Mensajeros en Tiempo Real - Después de la lista de mensajeros */}
          {couriersWithLocations.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  📍 Ubicación en Tiempo Real
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Visualiza dónde están tus mensajeros en este momento
                </p>
              </div>
              <div className="p-4">
                {locationsLoading ? (
                  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">
                        Cargando ubicaciones...
                      </p>
                    </div>
                  </div>
                ) : locationsError ? (
                  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">Error al cargar ubicaciones</p>
                      <p className="text-xs mt-1">{locationsError}</p>
                    </div>
                  </div>
                ) : (
                  <CouriersMap
                    couriers={couriersWithLocations}
                    height="500px"
                    className="w-full"
                  />
                )}
              </div>
            </div>
          )}

          {/* Invitations */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Invitaciones ({invitations.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {invitations.length === 0 ? (
                <div className="px-4 md:px-6 py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay invitaciones
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Crea una invitación para agregar un nuevo mensajero
                  </p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div key={invitation.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="font-mono font-bold text-lg text-primary-500">
                            {invitation.invitation_code}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(invitation.invitation_code)
                            }
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copiar código"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              sendViaWhatsApp(
                                invitation.invitation_code,
                                invitation.courier_name
                              )
                            }
                            className="text-green-500 hover:text-green-600 transition-colors"
                            title="Enviar por WhatsApp"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                          </button>
                          {getStatusBadge(invitation.status)}
                        </div>
                        {(invitation.courier_name ||
                          invitation.courier_email) && (
                          <div className="text-sm text-gray-600">
                            {invitation.courier_name && (
                              <p>Para: {invitation.courier_name}</p>
                            )}
                            {invitation.courier_email && (
                              <p>Email: {invitation.courier_email}</p>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          <p>Creada: {formatDate(invitation.created_at)}</p>
                          {invitation.status === "pending" && (
                            <p>Expira: {formatDate(invitation.expires_at)}</p>
                          )}
                          {invitation.accepted_at && (
                            <p>
                              Aceptada: {formatDate(invitation.accepted_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
