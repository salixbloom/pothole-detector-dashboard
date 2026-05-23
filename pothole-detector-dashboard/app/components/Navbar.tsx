'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import AccessibilityPanel from './AccessibilityPanel';
import { logoutAction } from '@/app/actions/auth';
import type { SessionPayload } from '@/lib/auth';

interface NavbarProps {
  session: SessionPayload | null;
}

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/reports', label: 'Reports' },
    { href: '/settings', label: 'Settings' },
  ];

  function handleLogout() {
    startTransition(() => logoutAction());
  }

  return (
    <nav className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center px-6 gap-8 shrink-0">
      <Link href="/" className="text-white font-semibold text-sm tracking-tight hover:text-zinc-300 transition-colors">
        PotholeIQ
      </Link>

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

        {session ? (
          <>
            <span className="text-xs text-zinc-400">{session.cityName}</span>
            <div
              className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white font-medium"
              title={session.email}
            >
              {session.cityName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              disabled={pending}
              className="text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Signing out…' : 'Sign out'}
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
