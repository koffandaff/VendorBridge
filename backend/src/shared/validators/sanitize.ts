/**
 * Sanitizes input string by stripping potential HTML tags and script injections.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return input;
  }
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "");
}

/**
 * Recursively sanitizes strings in objects/arrays.
 */
export function sanitizeInput<T>(input: T): T {
  if (typeof input === "string") {
    return sanitizeString(input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)) as unknown as T;
  }
  if (input !== null && typeof input === "object" && !(input instanceof Date)) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = sanitizeInput(value);
    }
    return sanitizedObj as T;
  }
  return input;
}
