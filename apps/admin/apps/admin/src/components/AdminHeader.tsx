import { useAuth } from '@/lib/auth-context';

export default function AdminHeader() {
  const { session, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Blissfy Admin</h1>
        <div className="flex items-center space-x-4">
          {session ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Logged in as {session.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Not authenticated</div>
          )}
        </div>
      </div>
    </header>
  );
}
