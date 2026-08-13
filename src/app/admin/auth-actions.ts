"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminAuthPool } from "@/lib/admin/db";
import { verifyAdminPassword } from "@/lib/admin/password";
import { createAdminSession, destroyAdminSession } from "@/lib/admin/session";

const loginSchema = z.object({
  email: z.string().trim().email("Email admin tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

function loginRedirect(error: string): never {
  redirect(`/admin/login?error=${encodeURIComponent(error)}`);
}

export async function loginAdmin(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    loginRedirect(parsed.error.issues[0]?.message ?? "Input login tidak valid.");
  }

  const result = await adminAuthPool.query<{
    id: string;
    email: string;
    password: string | null;
  }>(
    `
      SELECT id, email, password
      FROM admin_users
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [parsed.data.email],
  );
  const admin = result.rows[0];

  if (!admin?.password) {
    loginRedirect("Email admin tidak ditemukan atau belum memiliki password.");
  }

  const isPasswordValid = await verifyAdminPassword({
    password: parsed.data.password,
    storedPassword: admin.password,
  });

  if (!isPasswordValid) {
    loginRedirect("Email atau password admin tidak cocok.");
  }

  await createAdminSession(admin.id, admin.password);
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin/login?notice=Anda sudah keluar dari dashboard.");
}
