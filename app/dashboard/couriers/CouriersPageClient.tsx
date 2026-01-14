"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { logout } from "@/lib/auth/actions";
import Link from "next/link";
import { useState } from "react";

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
  user,
  businessId,
  businessName,
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

  const createInvitation = async () => {
    setIsCreatingInvitation(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/couriers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          courierName: courierName.trim() || null,
          courierEmail: courierEmail.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear la invitación");
        return;
      }

      setSuccess(
        `¡Invitación creada! Código: ${data.invitation.invitation_code}`
      );
      setInvitations([data.invitation, ...invitations]);
      setCourierName("");
      setCourierEmail("");
      setShowInviteForm(false);
    } catch (err: any) {
      console.error("Error creating invitation:", err);
      setError("Error al crear la invitación");
    } finally {
      setIsCreatingInvitation(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`Código ${text} copiado al portapapeles`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                  Follow It
                </h1>
              </Link>
              <span className="text-gray-300">→</span>
              <span className="text-lg font-medium text-gray-700">
                Mensajeros
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500">{businessName}</p>
              </div>
              <form action={logout}>
                <Button type="submit" variant="outline" size="sm">
                  Cerrar Sesión
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Gestión de Mensajeros
              </h2>
              <p className="text-gray-600 mt-1">
                Invita y gestiona a tu equipo de mensajeros
              </p>
            </div>
            <Button
              onClick={() => setShowInviteForm(!showInviteForm)}
              disabled={isCreatingInvitation}
            >
              {showInviteForm ? "Cancelar" : "+ Invitar Mensajero"}
            </Button>
          </div>

          {/* Alerts */}
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Invite Form */}
          {showInviteForm && (
            <div className="bg-white rounded-lg shadow p-6">
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

                <div className="flex space-x-3">
                  <Button
                    onClick={createInvitation}
                    isLoading={isCreatingInvitation}
                    disabled={isCreatingInvitation}
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
                  <div key={courier.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-green-600"
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
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
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

          {/* Invitations */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Invitaciones ({invitations.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {invitations.length === 0 ? (
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
                          <p className="font-mono font-bold text-lg text-blue-600">
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
                          {getStatusBadge(invitation.status)}
                        </div>
                        {(invitation.courier_name || invitation.courier_email) && (
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
                            <p>
                              Expira: {formatDate(invitation.expires_at)}
                            </p>
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
