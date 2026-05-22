'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AccessibilityPanel from './AccessibilityPanel';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/reports', label: 'Reports' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center px-6 gap-8 shrink-0">
      <span className="text-white font-semibold text-sm tracking-tight">PotholeIQ</span>
      <div className="flex gap-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              pathname === link.href
                ? 'text-white bg-zinc-800'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <AccessibilityPanel />
        <span className="text-xs text-zinc-400">Dublin City Council</span>
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white font-medium">
          R
        </div>
      </div>
    </nav>
  );
}
