// supabase/functions/_shared/http.ts
export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export function badRequest(
  message: string,
  extra: Record<string, unknown> = {}
) {
  return json(400, { error: message, ...extra });
}

export function unauthorized(message = "Unauthorized") {
  return json(401, { error: message });
}

export function forbidden(message = "Forbidden") {
  return json(403, { error: message });
}

export function ok(body: unknown) {
  return json(200, body);
}
