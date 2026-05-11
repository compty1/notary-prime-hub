/**
 * Platform deprecation notice system.
 * Enhancement #89 (Deprecation notices for removed features)
 */

export interface DeprecationNotice {
  feature: string;
  deprecatedAt: string;
  removalDate: string;
  replacement?: string;
  migrationGuide?: string;
}

export const ACTIVE_DEPRECATIONS: DeprecationNotice[] = [
  // Add deprecation notices here as features are phased out
];

/** Check if any features are deprecated */
export function getActiveDeprecations(): DeprecationNotice[] {
  const now = new Date().toISOString();
  return ACTIVE_DEPRECATIONS.filter((d) => d.removalDate > now);
}

/** Check if a specific feature is deprecated */
export function isDeprecated(featureName: string): DeprecationNotice | null {
  return ACTIVE_DEPRECATIONS.find((d) => d.feature === featureName) || null;
}

/** Surface deprecation warnings to the console (dev-only — silent in production builds). */
export function warnIfDeprecated(featureName: string): void {
  if (!import.meta.env.DEV) return;
  const notice = isDeprecated(featureName);
  if (notice) {
    // eslint-disable-next-line no-console
    console.warn(
      `[DEPRECATED] "${notice.feature}" — removal scheduled for ${notice.removalDate}.` +
        (notice.replacement ? ` Use "${notice.replacement}" instead.` : "") +
        (notice.migrationGuide ? ` Migration: ${notice.migrationGuide}` : ""),
    );
  }
}
