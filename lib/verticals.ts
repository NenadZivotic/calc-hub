export interface VerticalDef {
  slug: string;
  name: string;
  title: string;
  description: string;
}

export const verticals: VerticalDef[] = [
  {
    slug: "fees",
    name: "Payment fees",
    title: "Payment Processing Fee Calculators",
    description:
      "See exactly what Stripe, PayPal and other processors take from every sale, and what actually lands in your account.",
  },
  {
    slug: "marketplaces",
    name: "Marketplaces",
    title: "Marketplace Seller Calculators",
    description:
      "Profit and fee calculators for Etsy, eBay, Shopify and dropshipping sellers — know your real margin before you price.",
  },
  {
    slug: "creators",
    name: "Creators & freelancers",
    title: "Creator & Freelancer Calculators",
    description:
      "Estimate YouTube and TikTok earnings, and calculate the freelance rate you actually need to hit your income goals.",
  },
  {
    slug: "finance",
    name: "Business finance",
    title: "Business Finance Calculators",
    description:
      "Break-even points, VAT, SaaS unit economics and other numbers every business owner should be able to compute in seconds.",
  },
  {
    slug: "devtools",
    name: "Developer tools",
    title: "Free Developer Security & Config Tools",
    description:
      "Paste-in tools that run entirely in your browser — decode JWTs, lint Dockerfiles, audit security headers and scan for leaked secrets. Nothing is uploaded.",
  },
];

export function getVertical(slug: string): VerticalDef | undefined {
  return verticals.find((v) => v.slug === slug);
}
