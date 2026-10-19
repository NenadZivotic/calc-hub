import type { Metadata } from "next";
import { SITE_NAME, SITE_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE_NAME} — who builds these calculators and why.`,
};

export default function AboutPage() {
  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">About {SITE_NAME}</h1>
      <p className="mt-4 leading-7 text-neutral-700">
        {SITE_NAME} is a collection of free calculators for people who earn money
        online — sellers, creators, freelancers and small business owners. Every
        tool answers one question honestly: <em>what do you actually keep?</em>
      </p>
      <h2 className="mt-8 text-xl font-semibold">How the numbers are made</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        Each calculator is built on the provider&apos;s published fee schedule or
        widely reported market data, with the assumptions listed directly on the
        page and links to official sources where they exist. Rates change — every
        page shows a &quot;last reviewed&quot; date, and we recommend verifying
        figures against the provider&apos;s current documentation before making
        financial decisions.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Contact</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        Found a stale rate, a bug, or want to request a calculator? Email{" "}
        <a href={`mailto:${SITE_EMAIL}`} className="text-blue-700 hover:underline">
          {SITE_EMAIL}
        </a>
        .
      </p>
    </article>
  );
}
