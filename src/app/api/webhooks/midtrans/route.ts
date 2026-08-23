import { NextResponse } from "next/server";
import { midtransNotificationSchema } from "@/lib/payments/schemas";
import {
  MidtransNotificationError,
  processMidtransNotification,
} from "@/lib/payments/midtrans";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");

    if (contentLength > 64_000) {
      return NextResponse.json(
        {
          ok: false,
          message: "Payload notifikasi terlalu besar.",
        },
        { status: 413 },
      );
    }

    const payload = midtransNotificationSchema.parse(await request.json());
    const result = await processMidtransNotification(payload, {
      source: "webhook",
      verifySignature: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MidtransNotificationError) {
      return NextResponse.json(
        {
          ok: false,
          code: error.code,
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("Midtrans webhook processing failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      {
        ok: false,
        code: "WEBHOOK_PROCESSING_FAILED",
        message: "Notifikasi pembayaran belum dapat diproses.",
      },
      { status: 400 },
    );
  }
}
