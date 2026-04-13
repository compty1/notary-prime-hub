/**
 * OP-004: Environment validation at startup
 */

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
}

const ENV_SCHEMA: EnvVar[] = [
  { key: "VITE_SUPABASE_URL", required: true, description: "Backend API URL" },
  { key: "VITE_SUPABASE_PUBLISHABLE_KEY", required: true, description: "Backend public API key" },
];

export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const env of ENV_SCHEMA) {
    const value = import.meta.env[env.key];
    if (env.required && (!value || value === "undefined")) {
      errors.push(`Missing required environment variable: ${env.key} — ${env.description}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getEnvVar(key: string, fallback?: string): string {
  const value = import.meta.env[key];
  if (!value && fallback !== undefined) return fallback;
  if (!value) throw new Error(`Environment variable ${key} is not set`);
  return value;
}
