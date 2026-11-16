import Script from "next/script";
import { securePublicOrigin } from "@/lib/publicOrigin.mjs";

const leadHubUrl = securePublicOrigin(process.env.NEXT_PUBLIC_LEADHUB_URL);

export default function LeadCapture() {
  if (!leadHubUrl) return null;

  return (
    <section className="mx-auto mb-20 mt-12 grid max-w-7xl gap-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12" aria-labelledby="updates-title">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">A little more Spott</p>
        <h2 id="updates-title" className="text-3xl font-semibold tracking-tight md:text-4xl">Make the next good plan happen.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Get occasional product and event-planning updates. Confirm your email first; unsubscribe whenever you like.</p>
      </div>
      <div data-leadhub="gatherly" data-theme="dark" className="min-w-0 md:w-[28rem]" />
      <Script src={`${leadHubUrl}/embed.js`} strategy="afterInteractive" />
    </section>
  );
}
