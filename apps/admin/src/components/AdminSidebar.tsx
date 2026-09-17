'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Products', href: '/dashboard/products' },
  { name: 'Orders', href: '/dashboard/orders' },
  { name: 'Inventory', href: '/dashboard/inventory' },
  { name: 'Categories', href: '/dashboard/categories' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-4 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
