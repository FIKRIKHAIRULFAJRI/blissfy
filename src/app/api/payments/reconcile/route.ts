import { NextResponse } from "next/server";
import { getInternalCronSecret } from "@/lib/midtrans/config";
import { reconcilePendingMidtransPayments } from "@/lib/payments/midtrans";

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
    const results = await reconcilePendingMidtransPayments();

    return NextResponse.json({
      ok: true,
      checked: results.length,
      results,
    });
  } catch (error) {
    console.error("Midtrans reconciliation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      {
        ok: false,
        message: "Rekonsiliasi pembayaran belum dapat dijalankan.",
      },
      { status: 503 },
    );
  }
}
