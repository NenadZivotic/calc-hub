import type { Metadata } from "next";
import Link from "next/link";
import { CalcCard } from "@/components/CalcCard";
import { articles } from "@/lib/articles";
import { getCalculatorsByVertical } from "@/lib/calculators";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { verticals } from "@/lib/verticals";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description:
    "Free, accurate calculators for online sellers, creators and freelancers: Stripe & PayPal fees, Etsy/eBay/Shopify profit, YouTube revenue, VAT, break-even and more.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div>
      <section className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Know your real numbers before the platform takes its cut
        </h1>
        <p className="mt-3 text-lg text-neutral-600">
          {SITE_TAGLINE}. Every calculator is built on published fee schedules
          and shows exactly how the math works — no sign-up, no email wall.
        </p>
      </section>

      {verticals.map((v) => (
        <section key={v.slug} className="mt-12">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                <Link href={`/${v.slug}`} className="hover:text-blue-700">
                  {v.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-neutral-600">{v.description}</p>
            </div>
            <Link
              href={`/${v.slug}`}
              className="hidden shrink-0 text-sm font-medium text-blue-700 hover:underline sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getCalculatorsByVertical(v.slug).map((c) => (
              <CalcCard key={c.slug} calc={c} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              <Link href="/learn" className="hover:text-blue-700">
                Guides
              </Link>
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              The math behind the fees, explained in plain language.
            </p>
          </div>
          <Link
            href="/learn"
            className="hidden shrink-0 text-sm font-medium text-blue-700 hover:underline sm:block"
          >
            View all →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/learn/${a.slug}`}
              className="group rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
            >
              <div className="text-base font-semibold text-neutral-900 group-hover:text-blue-700">
                {a.title}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                {a.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
