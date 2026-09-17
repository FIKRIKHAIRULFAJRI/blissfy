import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />

        <div className="flex">
          <AdminSidebar />

          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
