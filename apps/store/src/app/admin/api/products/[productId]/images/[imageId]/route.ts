import { forwardAdminImageRequest } from "@/lib/admin/product-image-api";

type RouteContext = {
  params: Promise<{ imageId: string; productId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { imageId, productId } = await context.params;

  return forwardAdminImageRequest({
    method: "DELETE",
    path: `/v1/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
  });
}
