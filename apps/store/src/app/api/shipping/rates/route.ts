import { NextResponse } from "next/server";
import { z } from "zod";
import { validateShippingCart } from "@/lib/shipping/server";
import { getShippingProvider } from "@/lib/shipping/provider";
import { shippingRateRequestSchema } from "@/lib/shipping/schemas";
import { ShippingProviderError, allowedCourierCodes } from "@/lib/shipping/types";
import {
  persistShippingQuotes,
  scopeShippingQuotes,
  type ShippingQuotePayload,
} from "@/lib/orders/quote";

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
    let quotes = await provider.getRates({
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

    if (parsed.data.destination) {
      const quotePayload: ShippingQuotePayload = {
        destination: parsed.data.destination,
        items: shippingCart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        totalProductWeightGram: shippingCart.totalProductWeightGrams,
        packagingWeightGram: shippingCart.packagingWeightGrams,
        totalWeightGram: shippingCart.totalWeightGrams,
      };
      quotes = scopeShippingQuotes(quotePayload, quotes);

      await persistShippingQuotes({
        destination: parsed.data.destination,
        items: quotePayload.items,
        originDistrictId: shippingCart.originDistrictId,
        packagingWeightGram: shippingCart.packagingWeightGrams,
        quotes,
        totalProductWeightGram: shippingCart.totalProductWeightGrams,
        totalWeightGram: shippingCart.totalWeightGrams,
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
