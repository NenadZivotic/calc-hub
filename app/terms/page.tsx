import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Terms of use for ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Terms of use</h1>
      <p className="mt-4 leading-7 text-neutral-700">
        By using {SITE_NAME} you agree to these terms.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Informational use only</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        {SITE_NAME} provides estimates for informational purposes and is not
        financial, tax, or legal advice. Fee schedules, payout programs and tax
        rules change frequently and vary by account type and jurisdiction — always
        verify figures against official provider documentation before making
        decisions.
      </p>
      <h2 className="mt-8 text-xl font-semibold">No warranty</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        The service is provided &quot;as is&quot; without warranties of any kind.
        We are not liable for decisions made or losses incurred based on
        calculator outputs.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Acceptable use</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        You may use the calculators freely for personal and commercial purposes.
        Do not scrape the site at abusive volumes, misrepresent outputs as
        official quotes, or use the site in ways that violate applicable law.
      </p>
    </article>
  );
}
