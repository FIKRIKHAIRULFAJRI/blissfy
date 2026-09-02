import { forwardAdminImageRequest } from "@/lib/admin/product-image-api";
import { getCurrentAdmin } from "@/lib/admin/auth";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { productId } = await context.params;

  return forwardAdminImageRequest({
    method: "GET",
    path: `/v1/admin/products/${encodeURIComponent(productId)}/images`,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const admin = await getCurrentAdmin();

  if (!admin) {
    return Response.json(
      { message: "Sesi Admin tidak valid atau sudah berakhir." },
      { status: 401 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (contentLength > 81 * 1024 * 1024) {
    return Response.json(
      { message: "Total upload terlalu besar." },
      { status: 413 },
    );
  }

  const formData = await request.formData();

  return forwardAdminImageRequest({
    body: formData,
    method: "POST",
    path: `/v1/admin/products/${encodeURIComponent(productId)}/images`,
  });
}
