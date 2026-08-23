import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getInternalCronSecret } from "@/lib/midtrans/config";

export async function POST(request: Request) {
  const configuredSecret = getInternalCronSecret();
  const requestSecret = request.headers.get("x-cron-secret") ?? "";

  if (!configuredSecret) {
    return NextResponse.json(
      {
        ok: false,
        message: "Secret rekonsiliasi belum dikonfigurasi.",
      },
      { status: 503 },
    );
  }

  if (requestSecret !== configuredSecret) {
    return NextResponse.json(
      {
        ok: false,
        message: "Tidak diizinkan.",
      },
      { status: 401 },
    );
  }

  try {
    const result = await db.query<{ releasedCount: number }>(
      `
        SELECT public.release_expired_stock_reservations() AS "releasedCount"
      `,
    );

    return NextResponse.json({
      ok: true,
      releasedCount: result.rows[0]?.releasedCount ?? 0,
    });
  } catch (error) {
    console.error("Release expired stock reservations failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      {
        ok: false,
        message: "Reservasi kedaluwarsa belum dapat direkonsiliasi.",
      },
      { status: 503 },
    );
  }
}
