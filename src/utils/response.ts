// ═══════════════════════════════════════════════════════════════════════════════
// Standardized API Response Builder
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { AppError, ValidationError } from "./errors";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export function successResponse<T>(data: T, message = "Success", status = 200, meta?: Record<string, unknown>) {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
  };
  return NextResponse.json(body, { status });
}

export function createdResponse<T>(data: T, message = "Created successfully") {
  return successResponse(data, message, 201);
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
) {
  return successResponse(data, message, 200, {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    const body: ApiResponse = {
      success: false,
      message: error.message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(error instanceof ValidationError && { meta: { errors: error.errors } }),
    };
    return NextResponse.json(body, { status: error.statusCode });
  }

  console.error("[UNHANDLED ERROR]", error);
  const body: ApiResponse = {
    success: false,
    message: "An unexpected error occurred",
    data: null,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: 500 });
}
