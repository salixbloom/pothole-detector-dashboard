'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestAccessAction } from './actions';

function Field({
  id,
  label,
  required = true,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}
        {!required && <span className="ml-1 text-zinc-600">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors';

export default function RequestAccessPage() {
  const [state, action, pending] = useActionState(requestAccessAction, null);

  if (state?.status === 'success') {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-900/40 border border-green-800/50 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <polyline points="4 10 8 14 16 6" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Request received</h2>
          <p className="text-sm text-zinc-400 mb-6">
            We'll review your request and get in touch at the email you provided. This is a manual
            process and can take a day or two.
          </p>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm font-semibold text-white hover:text-zinc-300 transition-colors">
            PotholeIQ
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Request access</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Accounts are created manually for verified city councils.
          </p>
        </div>

        <form action={action} className="space-y-4">
          <Field id="city_name" label="City / Council name">
            <input
              id="city_name"
              name="city_name"
              type="text"
              required
              className={inputClass}
              placeholder="Dublin City Council"
            />
          </Field>

          <Field id="contact_name" label="Your name">
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              autoComplete="name"
              required
              className={inputClass}
              placeholder="Jane Smith"
            />
          </Field>

          <Field id="email" label="Work email">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              placeholder="jane@citycouncil.ie"
            />
          </Field>

          <Field id="region" label="Region / Country">
            <input
              id="region"
              name="region"
              type="text"
              required
              className={inputClass}
              placeholder="Ireland"
            />
          </Field>

          <Field id="message" label="Anything else we should know" required={false}>
            <textarea
              id="message"
              name="message"
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Number of roads managed, current tooling, etc."
            />
          </Field>

          {state?.status === 'error' && (
            <p role="alert" className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2.5">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {pending ? 'Sending…' : 'Send request'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Already have an account?{' '}
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
