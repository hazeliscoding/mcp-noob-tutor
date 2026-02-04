import type { ZodError, ZodSchema } from 'zod';

/**
 * Minimal validation utilities for runtime safety.
 *
 * Why this module exists:
 * - Routes can validate incoming requests before tools see them
 * - Errors are returned as plain objects (not thrown), so handlers can shape responses clearly
 *
 * This uses Zod, which is good for learning because:
 * - It forces you to declare schemas explicitly (no magic)
 * - Error messages are helpful without being overwhelming
 */

/**
 * A validation outcome: either success with typed data, or failure with human-friendly issues.
 *
 * Think of it like a Result type from Rust: makes errors explicit but not loud.
 */
export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; issues: Array<{ path: string; message: string }> };

/**
 * Safely validate a value against a Zod schema.
 *
 * @example
 * const result = validate(mySchema, req.body);
 * if (!result.ok) return reply.status(400).send({ issues: result.issues });
 * // Now `result.data` is safely typed.
 */
export function validate<T>(schema: ZodSchema<T>, value: unknown): ValidationResult<T> {
  const result = schema.safeParse(value);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  return { ok: false, issues: formatIssues(result.error) };
}

function formatIssues(error: ZodError) {
  /**
   * Flatten Zod errors into a simple, JSON-safe format.
   *
   * This turns a nested error tree into a flat list so you can send it directly to the client.
   */
  return error.issues.map((i) => ({
    path: i.path.length ? i.path.join('.') : '(root)',
    message: i.message,
  }));
}
