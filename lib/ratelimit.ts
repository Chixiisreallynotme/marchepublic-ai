type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; retryAfterS: number };

/**
 * Fixed-window in-memory rate limiter (per process). Suited to the single
 * Node process of the V1 deployment; swap for a shared store when scaling
 * horizontally (documented V2 seam).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterS: 0 };
  }

  if (bucket.count < limit) {
    bucket.count += 1;
    return { ok: true, retryAfterS: 0 };
  }

  return { ok: false, retryAfterS: Math.ceil((bucket.resetAt - now) / 1000) };
}

export function rateLimitResponse(result: RateLimitResult): Response | null {
  if (result.ok) return null;
  return new Response(
    JSON.stringify({ error: "Trop de requêtes. Réessayez plus tard." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterS),
      },
    }
  );
}

function clientKey(request: Request, scope: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  return `${scope}:${ip}`;
}

export function limitOr429(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
): Response | null {
  return rateLimitResponse(rateLimit(clientKey(request, scope), limit, windowMs));
}
