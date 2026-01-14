"use client";

import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type UserRole = "business" | "courier";

function CourierInvitationStep({ onBack }: { onBack: () => void; user: any }) {
  const router = useRouter();
  const [invitationCode, setInvitationCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedInvitation, setValidatedInvitation] = useState<any | null>(
    null
  );

  const validateCode = async () => {
    if (!invitationCode.trim()) {
      setError("Por favor ingresa un código de invitación");
      return;
    }

    setIsValidating(true);
    setError(null);
    setValidatedInvitation(null);

    try {
      const response = await fetch("/api/couriers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode: invitationCode.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || "Código de invitación inválido o expirado");
        return;
      }

      setValidatedInvitation(data.invitation);
    } catch (err: any) {
      console.error("Error validating invitation:", err);
      setError("Error al validar el código");
    } finally {
      setIsValidating(false);
    }
  };

  const acceptInvitation = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch("/api/couriers/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode: invitationCode.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al aceptar la invitación");
        return;
      }

      // Success! Redirect to dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      setError("Error al aceptar la invitación");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AuthCard
      title="Unirse como Mensajero"
      description="Ingresa el código de invitación que recibiste"
    >
      {error && <Alert variant="error">{error}</Alert>}

      {!validatedInvitation ? (
        <div className="space-y-4">
          <Alert variant="info">
            Los mensajeros deben ser invitados por un negocio. Solicita a tu
            empleador un código de invitación.
          </Alert>

          <FormInput
            id="invitationCode"
            name="invitationCode"
            type="text"
            label="Código de Invitación"
            placeholder="Ej: ABC12345"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            required
          />

          <Button
            onClick={validateCode}
            className="w-full"
            isLoading={isValidating}
            disabled={isValidating || !invitationCode.trim()}
          >
            Validar Código
          </Button>

          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full"
            disabled={isValidating}
          >
            Volver
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="success">
            ¡Código válido! Te estás uniendo a:{" "}
            <strong>{validatedInvitation.businesses.name}</strong>
          </Alert>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Negocio</p>
              <p className="text-gray-900">
                {validatedInvitation.businesses.name}
              </p>
            </div>
            {validatedInvitation.courier_name && (
              <div>
                <p className="text-sm font-medium text-gray-700">Nombre</p>
                <p className="text-gray-900">
                  {validatedInvitation.courier_name}
                </p>
              </div>
            )}
            {validatedInvitation.courier_email && (
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-900">
                  {validatedInvitation.courier_email}
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={acceptInvitation}
            className="w-full"
            isLoading={isAccepting}
            disabled={isAccepting}
          >
            Aceptar Invitación y Continuar
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setValidatedInvitation(null);
              setInvitationCode("");
            }}
            className="w-full"
            disabled={isAccepting}
          >
            Usar Otro Código
          </Button>
        </div>
      )}
    </AuthCard>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Prevent multiple executions in React Strict Mode
  const hasCheckedUser = useRef(false);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode (development)
    if (hasCheckedUser.current) return;
    hasCheckedUser.current = true;

    checkUser();
  }, []);

  async function checkUser() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      setUser(user);

      // Check if user already has a profile
      const { data: businessMembers } = await supabase
        .from("business_members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: couriers } = await supabase
        .from("couriers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (businessMembers || couriers) {
        // User already has a profile, redirect to dashboard
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Error checking user:", error);
    }
  }

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleBusinessSetup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting || hasSubmitted.current) {
      console.log("Already submitting, ignoring duplicate request");
      return;
    }

    hasSubmitted.current = true;
    setIsSubmitting(true);
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const businessName = formData.get("businessName") as string;
    const timezone = formData.get("timezone") as string;

    try {
      const supabase = createClient();

      console.log("Creating business...", { businessName, timezone });

      // Create business
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: businessName,
          timezone: timezone || "America/Havana",
        })
        .select("id")
        .single();

      if (businessError) {
        console.error("Business creation error:", businessError);
        throw businessError;
      }

      if (!businessData?.id) {
        throw new Error("No se pudo crear el negocio");
      }

      console.log("Business created:", businessData.id);

      // Add user as business owner
      const { error: memberError } = await supabase
        .from("business_members")
        .insert({
          business_id: businessData.id,
          user_id: user.id,
          role: "owner",
          is_active: true,
        });

      if (memberError) {
        console.error("Member creation error:", memberError);
        throw memberError;
      }

      console.log("Business member created, redirecting...");

      // Use replace instead of push to prevent back navigation
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "Error al configurar tu negocio");
      // Reset submission flag on error so user can retry
      hasSubmitted.current = false;
      setIsSubmitting(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <AuthCard
        title="¿Cómo usarás Follow It?"
        description="Selecciona tu rol para personalizar tu experiencia"
      >
        <div className="space-y-3">
          <button
            onClick={() => handleRoleSelect("business")}
            disabled={isLoading}
            className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200">
                <svg
                  className="w-6 h-6 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Soy un Negocio</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona repartos, asigna mensajeros y monitorea entregas en
                  tiempo real
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("courier")}
            disabled={isLoading}
            className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center group-hover:bg-secondary-200">
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
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">
                  Soy un Mensajero
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Recibe asignaciones, actualiza estados y sube comprobantes de
                  entrega
                </p>
              </div>
            </div>
          </button>
        </div>
      </AuthCard>
    );
  }

  if (step === 2 && role === "business") {
    return (
      <AuthCard
        title="Configura tu Negocio"
        description="Ingresa la información básica de tu empresa"
      >
        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleBusinessSetup} className="space-y-4">
          <FormInput
            id="businessName"
            name="businessName"
            type="text"
            label="Nombre del Negocio"
            placeholder="Mi Empresa de Repartos"
            required
          />

          <div className="space-y-1">
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-700"
            >
              Zona Horaria
            </label>
            <select
              id="timezone"
              name="timezone"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              defaultValue="America/Havana"
            >
              <option value="America/Havana">Cuba (GMT-5)</option>
              <option value="America/New_York">New York (GMT-5)</option>
              <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
              <option value="America/Mexico_City">Mexico City (GMT-6)</option>
              <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
              <option value="Europe/Madrid">Madrid (GMT+1)</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isSubmitting}
          >
            Completar Configuración
          </Button>
        </form>

        <Button
          variant="ghost"
          onClick={() => setStep(1)}
          className="w-full"
          disabled={isSubmitting}
        >
          Volver
        </Button>
      </AuthCard>
    );
  }

  if (step === 2 && role === "courier") {
    return <CourierInvitationStep onBack={() => setStep(1)} user={user} />;
  }

  return null;
}
