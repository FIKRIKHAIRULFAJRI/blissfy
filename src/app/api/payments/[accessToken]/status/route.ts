import { NextResponse } from "next/server";
import { getPublicPaymentStateByToken } from "@/lib/payments/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accessToken: string }> },
) {
  const { accessToken } = await params;
  const payment = await getPublicPaymentStateByToken(accessToken);

  if (!payment) {
    return NextResponse.json(
      {
        ok: false,
        code: "ORDER_NOT_FOUND",
        message: "Link pembayaran tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    payment,
  });
}
