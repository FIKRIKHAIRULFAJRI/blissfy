'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    // Redirect handled by AuthContext
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Blissfy.co Admin</h1>

        <div className="flex items-center gap-4">
          {session && (
            <>
              <span className="text-sm text-gray-600">{session.user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
