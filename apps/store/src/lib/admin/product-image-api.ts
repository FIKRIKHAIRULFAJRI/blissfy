import "server-only";

import { getCurrentAdmin } from "@/lib/admin/auth";
import { getAdminSessionToken } from "@/lib/admin/session";
import { getApiUrl } from "@/lib/api";

export type { AdminProductImage } from "@/lib/admin/product-image-types";

const ADMIN_SESSION_HEADER = "x-blissfy-admin-session";

export async function forwardAdminImageRequest({
  body,
  contentType,
  method,
  path,
}: {
  body?: BodyInit;
  contentType?: string;
  method: "DELETE" | "GET" | "PATCH" | "POST";
  path: string;
}): Promise<Response> {
  const [admin, sessionToken] = await Promise.all([
    getCurrentAdmin(),
    getAdminSessionToken(),
  ]);

  if (!admin || !sessionToken) {
    return Response.json(
      { message: "Sesi Admin tidak valid atau sudah berakhir." },
      { status: 401 },
    );
  }

  const headers = new Headers({
    [ADMIN_SESSION_HEADER]: sessionToken,
  });

  if (contentType) {
    headers.set("content-type", contentType);
  }

  try {
    const response = await fetch(getApiUrl(path), {
      body,
      cache: "no-store",
      headers,
      method,
    });
    const responseBody = await response.text();

    return new Response(responseBody, {
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
      status: response.status,
    });
  } catch {
    return Response.json(
      { message: "API image tidak dapat dihubungi. Coba lagi." },
      { status: 502 },
    );
  }
}
