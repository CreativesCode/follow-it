"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-email",
  "/auth/callback",
  "/auth/reset-password",
  "/terms",
  "/privacy",
];

// Auth routes that should redirect to dashboard if user is already authenticated
const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

/**
 * Client-side auth guard component
 * Replaces middleware functionality for SPA
 * Handles redirects based on authentication state
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userLoading, roleType } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to load
    if (userLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route)
    );
    const isAuthRoute = AUTH_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (user && isAuthRoute) {
      router.replace("/dashboard");
      return;
    }

    // If user is not authenticated and trying to access protected routes, redirect to login
    if (!user && !isPublicRoute) {
      const redirectUrl = `/auth/login?redirectTo=${encodeURIComponent(
        pathname
      )}`;
      router.replace(redirectUrl);
      return;
    }
  }, [user, userLoading, pathname, router]);

  // Don't render children until auth state is determined for protected routes
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  if (!isPublicRoute && userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
