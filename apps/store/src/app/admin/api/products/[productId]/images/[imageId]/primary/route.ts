import { forwardAdminImageRequest } from "@/lib/admin/product-image-api";

type RouteContext = {
  params: Promise<{ imageId: string; productId: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const { imageId, productId } = await context.params;

  return forwardAdminImageRequest({
    method: "PATCH",
    path: `/v1/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}/primary`,
  });
}
