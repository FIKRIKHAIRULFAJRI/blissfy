import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder, CreateOrderError } from "@/lib/orders/service";
import { createOrderRequestSchema } from "@/lib/orders/schemas";

const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 10;
const orderRateLimit = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: "ORDER_RATE_LIMITED",
        message: "Terlalu banyak percobaan checkout. Coba lagi sebentar.",
      },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createOrderRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "ORDER_BAD_REQUEST",
        message: "Data checkout belum lengkap atau tidak valid.",
        issues: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const order = await createOrder(parsed.data);

    return NextResponse.json({
      ok: true,
      order,
    });
  } catch (error) {
    return safeOrderErrorResponse(error);
  }
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = orderRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    orderRateLimit.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    return { allowed: true };
  }

  if (current.count >= rateLimitMaxRequests) {
    return { allowed: false };
  }

  current.count += 1;
  return { allowed: true };
}

function safeOrderErrorResponse(error: unknown) {
  if (error instanceof CreateOrderError) {
    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        message: error.message,
      },
      { status: error.status },
    );
  }

  console.error("Order creation failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });

  return NextResponse.json(
    {
      ok: false,
      code: "ORDER_UNAVAILABLE",
      message: "Pesanan belum dapat dibuat. Coba lagi.",
    },
    { status: 503 },
  );
}
