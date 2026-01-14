// supabase/functions/_shared/supabase.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

export function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "edge-functions" } },
  });
}

export function supabaseUser(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  // User client to validate JWT + get auth user (via getUser)
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
  });
}
