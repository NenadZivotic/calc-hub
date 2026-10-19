import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalculatorRunner } from "@/components/CalculatorRunner";
import { CalcCard } from "@/components/CalcCard";
import { articlesForCalculator } from "@/lib/articles";
import { calculators, getCalculator, getRelated } from "@/lib/calculators";
import { getVertical } from "@/lib/verticals";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return calculators.map((c) => ({ vertical: c.vertical, slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}): Promise<Metadata> {
  const { vertical, slug } = await params;
  const calc = getCalculator(vertical, slug);
  if (!calc) return {};
  return {
    title: calc.seoTitle,
    description: calc.description,
    keywords: calc.keywords,
    alternates: { canonical: `/${calc.vertical}/${calc.slug}` },
    openGraph: {
      title: calc.seoTitle,
      description: calc.description,
      type: "website",
    },
  };
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}) {
  const { vertical, slug } = await params;
  const calc = getCalculator(vertical, slug);
  if (!calc) notFound();
  const v = getVertical(calc.vertical);
  const related = getRelated(calc);
  const guides = articlesForCalculator(calc.slug);
  const url = `${SITE_URL}/${calc.vertical}/${calc.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: calc.name,
      url,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: calc.description,
      dateModified: calc.updatedAt,
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: v?.name ?? calc.vertical,
          item: `${SITE_URL}/${calc.vertical}`,
        },
        { "@type": "ListItem", position: 3, name: calc.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: calc.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-neutral-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blue-700">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/${calc.vertical}`} className="hover:text-blue-700">
          {v?.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">{calc.name}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">{calc.title}</h1>
      <p className="mt-3 max-w-3xl text-lg text-neutral-600">
        {calc.description}
      </p>

      <div className="mt-6">
        <CalculatorRunner vertical={calc.vertical} slug={calc.slug} />
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Last reviewed {calc.updatedAt}. Rates change — verify against the
        official sources linked below before relying on these figures.
      </p>

      {calc.assumptions.length > 0 && (
        <section className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
            What this is based on
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {calc.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {calc.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {calc.sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  {s.label} ↗
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {calc.sections.map((s) => (
        <section key={s.heading} className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">{s.heading}</h2>
          {s.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="mt-3 leading-7 text-neutral-700">
              {p}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-10 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <dl className="mt-4 divide-y divide-neutral-200">
          {calc.faq.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="font-medium text-neutral-900">{f.q}</dt>
              <dd className="mt-2 leading-7 text-neutral-700">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {guides.length > 0 && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-xl font-semibold">Related guides</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-neutral-700">
            {guides.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/learn/${a.slug}`}
                  className="text-blue-700 hover:underline"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Related calculators</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <CalcCard key={c.slug} calc={c} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
