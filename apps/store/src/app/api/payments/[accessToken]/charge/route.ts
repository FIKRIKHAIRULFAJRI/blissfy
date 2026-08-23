import { NextResponse } from "next/server";
import {
  PaymentServiceError,
  createOrGetQrisPayment,
} from "@/lib/payments/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ accessToken: string }> },
) {
  const { accessToken } = await params;

  try {
    const payment = await createOrGetQrisPayment(accessToken);

    return NextResponse.json({
      ok: true,
      payment,
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        {
          ok: false,
          code: error.code,
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("Create Midtrans QRIS payment failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      {
        ok: false,
        code: "PAYMENT_CHARGE_FAILED",
        message: "QRIS belum dapat dibuat. Coba lagi.",
      },
      { status: 503 },
    );
  }
}
