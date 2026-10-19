import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Guides — fee math and business numbers explained",
  description:
    "Plain-language guides to payment fees, marketplace costs, and ad metrics — each paired with a free calculator.",
  alternates: { canonical: "/learn" },
};

export default function LearnIndex() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Guides</h1>
      <p className="mt-3 max-w-3xl text-lg text-neutral-600">
        Short, numbers-first guides to the fees and metrics behind online
        business — every guide links to a calculator so you can run your own
        figures.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/learn/${a.slug}`}
            className="group rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
          >
            <div className="text-base font-semibold text-neutral-900 group-hover:text-blue-700">
              {a.title}
            </div>
            <p className="mt-1 line-clamp-3 text-sm text-neutral-600">
              {a.description}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Updated {a.updatedAt}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
