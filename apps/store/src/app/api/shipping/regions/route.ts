import { NextResponse } from "next/server";
import { z } from "zod";
import { getShippingProvider } from "@/lib/shipping/provider";
import { regionQuerySchema } from "@/lib/shipping/schemas";
import { ShippingProviderError } from "@/lib/shipping/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = regionQuerySchema.safeParse({
    level: url.searchParams.get("level"),
    parentId: url.searchParams.get("parentId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Parameter wilayah belum lengkap.",
        issues: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const provider = getShippingProvider();
    const regions = await provider.getRegions(parsed.data);

    return NextResponse.json({
      ok: true,
      regions,
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

  console.error("Shipping regions request failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });

  return NextResponse.json(
    {
      ok: false,
      code: "SHIPPING_PROVIDER_UNAVAILABLE",
      message: "Data wilayah belum dapat dimuat. Coba lagi.",
    },
    { status: 502 },
  );
}
