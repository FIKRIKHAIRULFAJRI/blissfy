import "server-only";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";

export type AdminSession = {
  admin: {
    id: string;
    email: string;
    displayName: string | null;
  };
};

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const admin = await getAdminSession();

  if (!admin) {
    return null;
  }

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
    },
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getCurrentAdmin();

  if (!session) {
    redirect("/admin/login?error=unauthorized");
  }

  return session;
}
