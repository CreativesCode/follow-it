"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { headers } from "next/headers";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
  );

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es requerida"),
});

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
});

// ============================================
// TYPES
// ============================================

type ActionResult =
  | { success: true; message?: string; redirectTo?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

// ============================================
// HELPER FUNCTIONS
// ============================================

function getURL() {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000/";
  // Make sure to include `https://` when not localhost.
  url = url.startsWith("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
}

// ============================================
// LOGIN ACTION
// ============================================

export async function login(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Validate input
  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return {
      success: false,
      error: "Por favor, corrige los errores en el formulario",
      fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  // Attempt to sign in
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error:
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : "Error al iniciar sesión. Por favor, intenta de nuevo.",
    };
  }

  // Check if user has a business or courier profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Error al obtener información del usuario",
    };
  }

  // Redirect based on user role
  redirect("/dashboard");
}

// ============================================
// REGISTER ACTION
// ============================================

export async function register(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    fullName: formData.get("fullName"),
  };

  // Validate input
  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return {
      success: false,
      error: "Por favor, corrige los errores en el formulario",
      fieldErrors,
    };
  }

  const { email, password, confirmPassword, fullName } = parsed.data;

  // Check if passwords match
  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Las contraseñas no coinciden",
      fieldErrors: { confirmPassword: "Las contraseñas no coinciden" },
    };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") || getURL();

  // Attempt to sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error:
        error.message === "User already registered"
          ? "Este email ya está registrado"
          : "Error al crear la cuenta. Por favor, intenta de nuevo.",
    };
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return {
      success: true,
      message:
        "Cuenta creada exitosamente. Por favor, verifica tu email para continuar.",
      redirectTo: "/auth/verify-email",
    };
  }

  // If auto-confirmed (local dev), redirect to onboarding
  return {
    success: true,
    message: "Cuenta creada exitosamente",
    redirectTo: "/auth/onboarding",
  };
}

// ============================================
// LOGOUT ACTION
// ============================================

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

// ============================================
// FORGOT PASSWORD ACTION
// ============================================

export async function forgotPassword(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
  };

  // Validate input
  const parsed = forgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return {
      success: false,
      error: "Por favor, ingresa un email válido",
      fieldErrors,
    };
  }

  const { email } = parsed.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || getURL();

  // Send password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      error: "Error al enviar el email. Por favor, intenta de nuevo.",
    };
  }

  return {
    success: true,
    message:
      "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.",
  };
}

// ============================================
// RESET PASSWORD ACTION
// ============================================

export async function resetPassword(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  // Validate input
  const parsed = resetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return {
      success: false,
      error: "Por favor, corrige los errores en el formulario",
      fieldErrors,
    };
  }

  const { password, confirmPassword } = parsed.data;

  // Check if passwords match
  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Las contraseñas no coinciden",
      fieldErrors: { confirmPassword: "Las contraseñas no coinciden" },
    };
  }

  const supabase = await createClient();

  // Update password
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: "Error al restablecer la contraseña. Por favor, intenta de nuevo.",
    };
  }

  return {
    success: true,
    message: "Contraseña actualizada exitosamente",
    redirectTo: "/dashboard",
  };
}

// ============================================
// MAGIC LINK ACTION
// ============================================

export async function sendMagicLink(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
  };

  // Validate input
  const parsed = forgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return {
      success: false,
      error: "Por favor, ingresa un email válido",
      fieldErrors,
    };
  }

  const { email } = parsed.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || getURL();

  // Send magic link
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Magic link error:", error);
    return {
      success: false,
      error: "Error al enviar el enlace mágico. Por favor, intenta de nuevo.",
    };
  }

  return {
    success: true,
    message: "Enlace mágico enviado. Revisa tu email.",
  };
}

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================

export async function resendVerificationEmail(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Usuario no encontrado",
    };
  }

  // Resend confirmation email
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email!,
  });

  if (error) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      error: "Error al reenviar el email. Por favor, intenta de nuevo.",
    };
  }

  return {
    success: true,
    message: "Email de verificación reenviado. Revisa tu bandeja de entrada.",
  };
}

// ============================================
// OAUTH LOGIN
// ============================================

export async function signInWithOAuth(
  provider: "google" | "github"
): Promise<ActionResult> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || getURL();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("OAuth error:", error);
    return {
      success: false,
      error: "Error al iniciar sesión con " + provider,
    };
  }

  if (data.url) {
    redirect(data.url);
  }

  return {
    success: false,
    error: "Error al iniciar sesión",
  };
}
