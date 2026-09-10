import { QuoteBenchmarker } from "@/components/quote-benchmarker";

export default function CustomerAppPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-accent)]">
          Pris-check & booking
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Udfyld forsendelsen, sammenlign Nor Express / Nor Economy, og book den
          løsning I vil bruge.
        </p>
      </div>
      <QuoteBenchmarker />
    </section>
  );
}
