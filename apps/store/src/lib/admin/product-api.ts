import "server-only";

import { getCurrentAdmin } from "@/lib/admin/auth";
import { getAdminSessionToken } from "@/lib/admin/session";
import { getApiUrl } from "@/lib/api";

export type AdminProduct = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  normalPrice: number;
  isActive: boolean;
  categoryName: string;
  variantCount: number;
  totalStock: number;
  activeDiscountCount: number;
  imageCount: number;
};

export async function requestAdminProductApi({ body, method, path }: { body?: string; method: "DELETE" | "PATCH" | "POST"; path: string }) {
  const [admin, token] = await Promise.all([getCurrentAdmin(), getAdminSessionToken()]);
  if (!admin || !token) return Response.json({ message: "Sesi Admin tidak valid." }, { status: 401 });
  try {
    return await fetch(getApiUrl(path), { body, cache: "no-store", headers: { "x-blissfy-admin-session": token, ...(body ? { "content-type": "application/json" } : {}) }, method });
  } catch { return Response.json({ message: "API admin tidak dapat dihubungi." }, { status: 502 }); }
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const [admin, token] = await Promise.all([getCurrentAdmin(), getAdminSessionToken()]);
  if (!admin || !token) throw new Error("Sesi Admin tidak valid.");
  const response = await fetch(getApiUrl(`/v1/admin/products/${encodeURIComponent(id)}`), { cache: "no-store", headers: { "x-blissfy-admin-session": token } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Tidak dapat memuat produk dari API admin.");
  return (await response.json()) as AdminProduct;
}

export async function listAdminProducts({
  page,
  q,
  status,
}: {
  page: number;
  q: string;
  status: "active" | "all" | "inactive";
}): Promise<{ products: AdminProduct[]; total: number }> {
  const [admin, token] = await Promise.all([
    getCurrentAdmin(),
    getAdminSessionToken(),
  ]);
  if (!admin || !token) throw new Error("Sesi Admin tidak valid.");

  const query = new URLSearchParams({ page: String(page) });
  if (q) query.set("q", q);
  if (status !== "all") query.set("status", status);

  const response = await fetch(
    getApiUrl(`/v1/admin/products?${query.toString()}`),
    {
      cache: "no-store",
      headers: { "x-blissfy-admin-session": token },
    },
  );
  if (!response.ok) throw new Error("Tidak dapat memuat produk dari API admin.");
  return (await response.json()) as { products: AdminProduct[]; total: number };
}
