import type { Metadata } from "next";
import { SITE_NAME, SITE_EMAIL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `Privacy policy for ${SITE_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Privacy policy</h1>
      <p className="mt-4 leading-7 text-neutral-700">
        Effective date: October 2026. This policy explains what {SITE_NAME}
        ({SITE_URL}) collects and why.
      </p>
      <h2 className="mt-8 text-xl font-semibold">What we collect</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        The calculators run entirely in your browser — the numbers you type are
        never sent to or stored on our servers. Like almost every website, our
        hosting provider may log standard technical data (IP address, browser
        type, pages visited) for security and analytics.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Cookies and advertising</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        We may display advertising (for example via Google AdSense). Ad partners
        may use cookies to serve and measure ads, including personalized ads
        where permitted by law and your consent choices. You can control or
        disable personalized advertising through your ad settings and browser
        cookie controls.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Third-party links</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        Pages link to external providers (fee documentation, official sources).
        Their privacy practices are governed by their own policies.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Contact</h2>
      <p className="mt-3 leading-7 text-neutral-700">
        Privacy questions:{" "}
        <a href={`mailto:${SITE_EMAIL}`} className="text-blue-700 hover:underline">
          {SITE_EMAIL}
        </a>
        .
      </p>
    </article>
  );
}
