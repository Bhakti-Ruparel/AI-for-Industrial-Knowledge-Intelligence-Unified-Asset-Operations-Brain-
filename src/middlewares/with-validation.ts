// ═══════════════════════════════════════════════════════════════════════════════
// Validation Middleware — Zod schema validation
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
import { ValidationError } from "@/utils/errors";

export function withValidation<T>(schema: ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      }
      throw new ValidationError("Validation failed", errors);
    }

    return result.data;
  };
}

export function validateQuery<T>(schema: ZodSchema<T>, searchParams: URLSearchParams): T {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => { params[key] = value; });

  const result = schema.safeParse(params);
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    }
    throw new ValidationError("Invalid query parameters", errors);
  }

  return result.data;
}
