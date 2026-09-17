import "server-only";

import { getCurrentAdmin } from "@/lib/admin/auth";
import { getAdminSessionToken } from "@/lib/admin/session";
import { getApiUrl } from "@/lib/api";

const ADMIN_SESSION_HEADER = "x-blissfy-admin-session";

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
};

export async function requestAdminCategoryApi({
  body,
  method,
  path,
}: {
  body?: string;
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

  try {
    return await fetch(getApiUrl(path), {
      body,
      cache: "no-store",
      headers: {
        [ADMIN_SESSION_HEADER]: sessionToken,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      method,
    });
  } catch {
    return Response.json(
      { message: "API admin tidak dapat dihubungi. Coba lagi." },
      { status: 502 },
    );
  }
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const response = await requestAdminCategoryApi({
    method: "GET",
    path: "/v1/admin/categories",
  });

  if (!response.ok) {
    throw new Error("Tidak dapat memuat kategori dari API admin.");
  }

  const payload = (await response.json()) as { categories: AdminCategory[] };
  return payload.categories;
}
