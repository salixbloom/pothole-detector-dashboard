import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="max-w-lg">
        <span className="inline-block text-xs font-medium tracking-widest text-red-400 uppercase mb-6">
          Road intelligence platform
        </span>

        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
          Potholes are destroying your city.
          <span className="text-zinc-400"> We track every one.</span>
        </h1>

        <p className="text-zinc-400 text-base leading-relaxed mb-10">
          PotholeIQ gives city councils real-time visibility into road damage —
          ranked by severity, backed by sensor data, and ready to act on.
          Stop guessing. Start fixing.
        </p>

        <Link
          href="/dashboard"
          className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
