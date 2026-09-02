import { forwardAdminImageRequest } from "@/lib/admin/product-image-api";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { productId } = await context.params;

  return forwardAdminImageRequest({
    body: await request.text(),
    contentType: "application/json",
    method: "PATCH",
    path: `/v1/admin/products/${encodeURIComponent(productId)}/images/order`,
  });
}
