/**
 * AI-001: AI Writer guardrails - input sanitization, token limits, rate limiting
 */

const BLOCKED_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+(a\s+)?different/i,
  /disregard\s+(the\s+)?(above|previous)/i,
];

export function sanitizeAIInput(input: string): { safe: boolean; sanitized: string; reason?: string } {
  if (!input || input.trim().length === 0) {
    return { safe: false, sanitized: "", reason: "Input cannot be empty" };
  }

  if (input.length > 10000) {
    return { safe: false, sanitized: input.slice(0, 10000), reason: "Input exceeds maximum length of 10,000 characters" };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return { safe: false, sanitized: "", reason: "Input contains disallowed patterns" };
    }
  }

  // Strip HTML/script tags
  const sanitized = input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();

  return { safe: true, sanitized };
}

// Simple in-memory rate limiter per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkAIRateLimit(
  userId: string,
  tier: "free" | "pro" | "enterprise" = "free"
): { allowed: boolean; remaining: number; resetInMs: number } {
  const limits: Record<string, number> = { free: 3, pro: 50, enterprise: 1000 };
  const maxPerDay = limits[tier] || 3;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + dayMs };
    rateLimitMap.set(userId, entry);
  }

  if (entry.count >= maxPerDay) {
    return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: maxPerDay - entry.count, resetInMs: entry.resetAt - now };
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}

export const MAX_OUTPUT_TOKENS: Record<string, number> = {
  free: 2000,
  pro: 8000,
  enterprise: 32000,
};
