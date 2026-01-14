// lib/supabase/middleware.ts
// Cliente de Supabase para uso en middleware de Next.js
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Evitar escribir en la base de datos desde el middleware
  // Solo refrescar la sesión si es necesario
  await supabase.auth.getUser();

  // Si el usuario está autenticado y está intentando acceder a rutas públicas,
  // puedes redirigir según tu lógica de negocio
  // Ejemplo: redirigir a /admin si está autenticado y va a /login
  // const { data: { user } } = await supabase.auth.getUser();
  // if (user && request.nextUrl.pathname === '/login') {
  //   return NextResponse.redirect(new URL('/admin', request.url));
  // }

  return supabaseResponse;
}
