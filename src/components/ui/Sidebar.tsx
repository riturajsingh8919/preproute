'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Edit3, ClipboardList } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: BarChart2, exact: true },
  { name: 'Test Creation', href: '/tests/create', icon: Edit3, startsWith: '/tests' },
  { name: 'Test Tracking', href: '/tests/tracking', icon: ClipboardList },
];

export const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (item: typeof navItems[number]) => {
    if (item.exact) return pathname === item.href;
    if (item.startsWith) {
      return pathname.startsWith(item.startsWith) && !pathname.startsWith('/tests/tracking');
    }
    return pathname === item.href;
  };

  return (
    <div className="w-50 shrink-0 border-r border-gray-200 bg-white flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 shrink-0">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="PrepRoute" width={130} height={34} className="object-contain" style={{ width: "auto", height: "auto" }} priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        <ul className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <li key={item.name} className="relative">
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#4461F2] rounded-r-full" />
                )}
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ml-1 ${
                    active
                      ? 'bg-blue-50 text-[#4461F2]'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={active ? 2.2 : 1.7} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
