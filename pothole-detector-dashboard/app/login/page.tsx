'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm font-semibold text-white hover:text-zinc-300 transition-colors">
            PotholeIQ
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-zinc-400">Sign in to your city dashboard</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
              placeholder="you@citycouncil.ie"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p role="alert" className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2.5">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          No account?{' '}
          <Link href="/request-access" className="text-zinc-400 hover:text-white transition-colors">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
