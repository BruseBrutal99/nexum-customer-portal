import Image from "next/image";
import Link from "next/link";

export function BrandAuthShell({
  children,
  eyebrow,
}: {
  children: React.ReactNode;
  eyebrow: string;
}) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <aside className="relative hidden min-h-screen overflow-hidden bg-[var(--color-accent)] lg:block">
        <Image
          src="/brand/hero-hirtshals.webp"
          alt=""
          fill
          className="object-cover object-[50%_40%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,26,48,0.92)] via-[rgba(11,42,74,0.45)] to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
          <Image
            src="/brand/logo-nor-spedition.png"
            alt="NOR Spedition"
            width={180}
            height={100}
            className="mb-6 h-12 w-auto brightness-0 invert"
          />
          <p className="text-sm font-medium tracking-[0.08em] text-white/80 uppercase">
            {eyebrow}
          </p>
          <h1 className="display mt-2 text-4xl">Nor Courier</h1>
          <p className="mt-3 max-w-sm text-sm text-white/85">
            Pris-check og benchmarking med samme udtryk som norspedition.dk.
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/logo-nor-spedition.png"
              alt="NOR Spedition"
              width={120}
              height={66}
              className="h-9 w-auto"
            />
            <span className="text-sm font-semibold text-[var(--color-accent)]">
              Nor Courier
            </span>
          </Link>
          <Link href="/" className="text-sm text-[var(--color-ink-muted)] hover:underline">
            Til forsiden
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
