import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
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
