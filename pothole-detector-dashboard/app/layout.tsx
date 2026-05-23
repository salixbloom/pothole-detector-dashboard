import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Navbar from './components/Navbar';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { getSession } from '@/lib/auth';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PotholeIQ',
  description: 'City road damage dashboard',
};

// Runs synchronously before first paint to avoid a theme flash.
// Reads localStorage and sets data-theme / data-contrast / data-text-size on <html>.
const INIT_A11Y = `(function(){try{
  var s=JSON.parse(localStorage.getItem('potholeiq-a11y')||'{}');
  var theme=s.theme||'dark';
  var contrast=s.contrast||'normal';
  var size=s.textSize||'md';
  if(theme==='system'){theme=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}
  var h=document.documentElement;
  h.setAttribute('data-theme',theme);
  h.setAttribute('data-contrast',contrast);
  h.setAttribute('data-text-size',size);
}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className="h-full" data-theme="dark" data-contrast="normal" data-text-size="md">
      <body suppressHydrationWarning className={`${geist.className} bg-zinc-950 text-white h-full flex flex-col`}>
        {/* Inline script prevents theme flash before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: INIT_A11Y }} />
        <AccessibilityProvider>
          <Navbar session={session} />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
