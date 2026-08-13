import { NextResponse } from "next/server";
import { z } from "zod";
import { validateShippingCart } from "@/lib/shipping/server";
import { getShippingProvider } from "@/lib/shipping/provider";
import { shippingRateRequestSchema } from "@/lib/shipping/schemas";
import { ShippingProviderError, allowedCourierCodes } from "@/lib/shipping/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = shippingRateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Payload cek ongkir belum lengkap.",
        issues: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const shippingCart = await validateShippingCart(parsed.data.items);
    const provider = getShippingProvider();
    const quotes = await provider.getRates({
      originDistrictId: shippingCart.originDistrictId,
      destinationDistrictId: parsed.data.destinationDistrictId,
      weightGrams: shippingCart.totalWeightGrams,
      couriers: [...allowedCourierCodes],
    });

    if (quotes.length === 0) {
      throw new ShippingProviderError({
        code: "SHIPPING_UNSUPPORTED_LOCATION",
        message:
          "Layanan JNE atau J&T belum tersedia untuk alamat tujuan ini.",
        status: 422,
      });
    }

    return NextResponse.json({
      ok: true,
      quotes,
      totalProductWeightGrams: shippingCart.totalProductWeightGrams,
      packagingWeightGrams: shippingCart.packagingWeightGrams,
      totalWeightGrams: shippingCart.totalWeightGrams,
    });
  } catch (error) {
    return safeShippingErrorResponse(error);
  }
}

function safeShippingErrorResponse(error: unknown) {
  if (error instanceof ShippingProviderError) {
    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        message: error.message,
      },
      { status: error.status },
    );
  }

  console.error("Shipping rates request failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });

  return NextResponse.json(
    {
      ok: false,
      code: "SHIPPING_PROVIDER_UNAVAILABLE",
      message: "Ongkir belum dapat dihitung. Coba lagi.",
    },
    { status: 502 },
  );
}
