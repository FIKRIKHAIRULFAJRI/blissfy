import type { User } from '@/lib/auth-context';

export interface AdminSidebarProps {
  session: User | null;
}

export default function AdminSidebar({ session }: AdminSidebarProps) {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/products', label: 'Products' },
    { href: '/dashboard/products/new', label: 'Create Product' },
    { href: '/dashboard/orders', label: 'Orders' },
    { href: '/dashboard/orders/[id]', label: 'Order Details' },
    { href: '/dashboard/vouchers', label: 'Vouchers' },
    { href: '/dashboard/settings', label: 'Homepage Settings' },
    { href: '/dashboard/categories', label: 'Categories' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <div className="space-y-2">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>\n    </aside>
  );
}

