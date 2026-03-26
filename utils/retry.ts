/**
 * withRetry — exponential backoff utility
 *
 * Reintenta una operación async hasta maxAttempts veces.
 * Delays: baseDelayMs × 2^(intento-1)  →  500ms, 1s, 2s por defecto.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      onRetry?.(attempt, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
