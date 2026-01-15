"use client";

import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { register } from "@/lib/auth/client-actions";
import { registerSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(register, null);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  const onSubmit = (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);
    formAction(formData);
  };

  return (
    <AuthCard
      title="Crear Cuenta"
      description="Comienza a gestionar tus repartos hoy mismo"
    >
      {state && !state.success && state.error && (
        <Alert variant="error">{state.error}</Alert>
      )}
      {state?.success && state?.message && (
        <Alert variant="success">{state.message}</Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          id="fullName"
          type="text"
          label="Nombre Completo"
          placeholder="Juan Pérez"
          required
          autoComplete="name"
          error={
            errors.fullName?.message ||
            (state && !state.success ? state.fieldErrors?.fullName : undefined)
          }
          {...registerField("fullName")}
        />

        <FormInput
          id="email"
          type="email"
          label="Email"
          placeholder="tu@email.com"
          required
          autoComplete="email"
          error={
            errors.email?.message ||
            (state && !state.success ? state.fieldErrors?.email : undefined)
          }
          {...registerField("email")}
        />

        <FormInput
          id="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          hint="Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
          error={
            errors.password?.message ||
            (state && !state.success ? state.fieldErrors?.password : undefined)
          }
          {...registerField("password")}
        />

        <FormInput
          id="confirmPassword"
          type="password"
          label="Confirmar Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          error={
            errors.confirmPassword?.message ||
            (state && !state.success
              ? state.fieldErrors?.confirmPassword
              : undefined)
          }
          {...registerField("confirmPassword")}
        />

        <div className="flex items-start">
          <input
            type="checkbox"
            name="terms"
            id="terms"
            required
            className="w-4 h-4 mt-1 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
            Acepto los{" "}
            <Link
              href="/terms"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacy"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Política de Privacidad
            </Link>
          </label>
        </div>

        <Button type="submit" className="w-full safe-area-bottom" isLoading={isPending}>
          Crear Cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{" "}
        <Link
          href="/auth/login"
          className="text-primary-500 hover:text-primary-600 font-medium"
        >
          Inicia sesión aquí
        </Link>
      </p>
    </AuthCard>
  );
}
