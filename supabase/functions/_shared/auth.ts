import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function unauthorized(message = "Authorization required"): Response {
  return jsonResponse({ error: message }, 401);
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

/**
 * Fail-closed user auth for user-facing edge functions.
 * Requires a real user JWT (anon/publishable key is rejected by getUser).
 */
export async function requireUser(
  req: Request
): Promise<{ user: User; authHeader: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  const token = bearerToken(req);
  if (!authHeader || !token) {
    return unauthorized("Authorization required");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Authentication is not configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return unauthorized("Authentication failed");
  }

  return { user, authHeader };
}

/**
 * Fail-closed auth for the privileged extract-knowledge job.
 * Accepts EXTRACT_KNOWLEDGE_SECRET / CRON_SECRET, or a valid user JWT.
 * If no secret is configured, only a valid user JWT is accepted.
 */
export async function requireExtractKnowledgeAuth(
  req: Request
): Promise<{ ok: true } | Response> {
  const cronSecret =
    Deno.env.get("EXTRACT_KNOWLEDGE_SECRET") ?? Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret")?.trim();
  const token = bearerToken(req);

  if (cronSecret) {
    if (headerSecret === cronSecret || token === cronSecret) {
      return { ok: true };
    }
  }

  const userResult = await requireUser(req);
  if (userResult instanceof Response) {
    return unauthorized("Authorization required");
  }

  return { ok: true };
}
