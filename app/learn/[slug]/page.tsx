import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalcCard } from "@/components/CalcCard";
import { articles, getArticle } from "@/lib/articles";
import { getBySlug } from "@/lib/calculators";
import type { CalculatorDef } from "@/lib/calculators/types";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.seoTitle,
    description: article.description,
    alternates: { canonical: `/learn/${article.slug}` },
    openGraph: {
      title: article.seoTitle,
      description: article.description,
      type: "article",
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const url = `${SITE_URL}/learn/${article.slug}`;
  const relatedCalcs = article.calculatorSlugs
    .map((s) => getBySlug(s))
    .filter((c): c is CalculatorDef => Boolean(c));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      dateModified: article.updatedAt,
      datePublished: article.updatedAt,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Guides",
          item: `${SITE_URL}/learn`,
        },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
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
        <Link href="/learn" className="hover:text-blue-700">
          Guides
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">{article.title}</span>
      </nav>

      <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight">
        {article.title}
      </h1>
      <p className="mt-3 max-w-3xl text-lg text-neutral-600">
        {article.description}
      </p>
      <p className="mt-3 text-xs text-neutral-500">
        Last reviewed {article.updatedAt}.
      </p>

      {article.sections.map((s) => (
        <section key={s.heading} className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">{s.heading}</h2>
          {s.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="mt-3 leading-7 text-neutral-700">
              {p}
            </p>
          ))}
        </section>
      ))}

      {relatedCalcs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Run the numbers yourself</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCalcs.map((c) => (
              <CalcCard key={c.slug} calc={c} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
