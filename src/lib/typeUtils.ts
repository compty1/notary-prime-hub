/**
 * CODE-002: Exhaustive check helper for TypeScript switch statements.
 * Use in default cases to ensure all enum values are handled at compile time.
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}
