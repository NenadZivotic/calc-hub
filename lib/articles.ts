export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

export interface ArticleDef {
  slug: string;
  /** h1 */
  title: string;
  seoTitle: string;
  /** Excerpt shown on the index and in meta description. */
  description: string;
  sections: ArticleSection[];
  /** Calculator slugs linked from the article body and listed at the end. */
  calculatorSlugs: string[];
  updatedAt: string;
}

export const articles: ArticleDef[] = [
  {
    slug: "etsy-vs-shopify-fees",
    title: "Etsy vs Shopify Fees: The Real Math at Every Sales Volume",
    seoTitle: "Etsy vs Shopify Fees Compared — Where the Break-Even Point Is",
    description:
      "Etsy charges ~9.5% + $0.45 per order with no monthly fee. Shopify charges $39/month plus ~3% per order. Here is the math that decides which one costs you less — and why fees are not the whole story.",
    calculatorSlugs: [
      "etsy-vs-shopify-calculator",
      "etsy-profit-calculator",
      "shopify-profit-calculator",
    ],
    updatedAt: "2026-10-18",
    sections: [
      {
        heading: "The two fee structures, side by side",
        paragraphs: [
          "Etsy's stack is per-order and has no fixed cost: a $0.20 listing fee, a 6.5% transaction fee on the order total (item + shipping), and payment processing of 3% + $0.25. On a $30 item with $4 shipping that comes to about $3.68 — roughly 10.8% of the order.",
          "Shopify flips the structure: a flat $39/month for the Basic plan, then only payment processing — 2.9% + $0.30 through Shopify Payments, with no extra transaction fee. The same $34 order costs about $1.29 in fees, but that $39 subscription runs whether you sell anything or not.",
        ],
      },
      {
        heading: "Where the break-even point sits",
        paragraphs: [
          "Etsy's per-order cost is higher, so there is a volume where Shopify's flat fee pays for itself. Working the algebra — Etsy takes about 9.5% + $0.45 per order while Shopify takes about 3% + $0.30 after the plan — the difference is roughly $0.15 plus 6.5% of the order value per order. At a $34 average order, that is about $2.36 per order, which amortizes the $39 plan at around 17 orders per month.",
          "Below that volume Etsy is mathematically cheaper. Above it, Shopify's fee total drops under Etsy's and keeps falling as a percentage of revenue. Use the Etsy vs Shopify calculator to run the comparison at your own price point and volume — the break-even moves fast with order value.",
        ],
      },
      {
        heading: "Why the cheaper option isn't always the right one",
        paragraphs: [
          "The fee comparison answers 'which costs less', but the two platforms sell different products. Etsy's 9.5% includes access to a marketplace where tens of millions of buyers already search for handmade, vintage, and craft supplies. Shopify's $39 buys a storefront with zero built-in traffic — every visitor is one you paid for with ads, SEO, or social content.",
          "Etsy also has fees the rate card buries: Offsite Ads adds 12–15% on orders attributed to Etsy's advertising (mandatory once you pass $10k/year). Shopify's hidden costs are apps — a realistic store quickly adds $30–100/month in app subscriptions — plus the customer acquisition cost that replaces the traffic Etsy gave you for free.",
        ],
      },
      {
        heading: "The pattern most sellers actually follow",
        paragraphs: [
          "Start on Etsy to validate that people will pay for the product — the marketplace supplies the demand while you test pricing and photos. Once you have repeat customers and steady volume, open a Shopify store in parallel and migrate repeat buyers to the owned site, where the ~10% Etsy cut becomes margin again. It is a sequence, not a choice — and the fee math tells you when you have outgrown the first stage.",
        ],
      },
    ],
  },
  {
    slug: "stripe-vs-paypal-fees",
    title: "Stripe vs PayPal Fees: Which Processor Actually Costs Less",
    seoTitle: "Stripe vs PayPal Fees Compared — Real Cost Per Transaction",
    description:
      "Stripe charges 2.9% + $0.30, PayPal charges 3.49% + $0.49 for standard online payments. But the real difference hides in currency conversion, disputes, and payout timing. Here is the full comparison.",
    calculatorSlugs: [
      "paypal-vs-stripe-calculator",
      "stripe-fee-calculator",
      "paypal-fee-calculator",
    ],
    updatedAt: "2026-10-18",
    sections: [
      {
        heading: "The headline rates",
        paragraphs: [
          "For standard online card processing, Stripe takes 2.9% + $0.30 per successful charge and PayPal takes 3.49% + $0.49. On a $50 sale that is $1.75 vs $2.24 — Stripe keeps about $0.49 more in your pocket per order. On 100 orders a month the gap is roughly $590 a year; the percentage gap widens further as the ticket grows.",
          "Both add about 1.5% for international cards, so the relative gap stays about the same for cross-border sales.",
        ],
      },
      {
        heading: "Where the real costs hide",
        paragraphs: [
          "Currency conversion is the big one. Stripe converts at about a 1% markup; PayPal's conversion markup runs closer to 4%. If you charge in USD and settle in another currency, that 3-point difference dwarfs the 0.59% rate-card gap — a $1,000 monthly payout converted by PayPal costs roughly $30 more than Stripe's.",
          "Disputes differ too: Stripe charges $15 per chargeback and refunds it if you win; PayPal charges about $20 and keeps it either way. And PayPal is notorious for 21-day holds and rolling reserves on new or 'risky' accounts — a cash-flow cost that never appears on a fee page.",
        ],
      },
      {
        heading: "Why stores offer both anyway",
        paragraphs: [
          "If Stripe is cheaper, why does every serious checkout still show a PayPal button? Because a measurable slice of buyers will only complete a purchase with PayPal — stored credentials, buyer protection, no card number entry. Losing that sale costs 100% of the order, not the 0.6% rate difference.",
          "The standard setup is Stripe as the primary processor plus PayPal as a wallet option. The PayPal-routed transactions cost a bit more, but the conversion lift on PayPal-loyal buyers more than pays the difference.",
        ],
      },
      {
        heading: "The one case where PayPal wins on price",
        paragraphs: [
          "Micropayments. PayPal's micropayment rate (4.99% + $0.09) beats Stripe's standard rate on tickets under about $12 — a $5 transaction costs $0.34 vs $0.45. Stripe has a similar micropayment rate (5% + $0.05) but you must ask for it. For digital goods, tips, or low-priced content, run both through the PayPal vs Stripe calculator before committing.",
        ],
      },
    ],
  },
  {
    slug: "payment-processing-fees-explained",
    title: "How Payment Processing Fees Actually Work",
    seoTitle: "Payment Processing Fees Explained — Where Every Cent Goes",
    description:
      "A $100 sale does not deposit $97.10. Processing fees are actually three separate charges — interchange, assessment, and markup — and knowing which is which tells you what you can negotiate and what you can't.",
    calculatorSlugs: [
      "stripe-fee-calculator",
      "paypal-fee-calculator",
      "square-fee-calculator",
    ],
    updatedAt: "2026-10-18",
    sections: [
      {
        heading: "The three layers inside 2.9% + $0.30",
        paragraphs: [
          "When Stripe, Square or PayPal quotes you 2.9% + $0.30, that single number bundles three separate charges. Interchange — the largest share, roughly 1.5–2% — goes to the bank that issued the customer's card. Assessment — around 0.15% — goes to the card network (Visa, Mastercard). Markup — the remainder, typically 0.7–1% plus the $0.30 — is what your processor actually keeps.",
          "Flat-rate pricing exists precisely so you never have to think about this. The processor pools every card type, pays whatever interchange each one really costs, and pockets the difference.",
        ],
      },
      {
        heading: "Why some cards cost the processor more than others",
        paragraphs: [
          "Interchange isn't one rate — it's a matrix. A plain debit card tapped in person can cost under 1%; a premium rewards credit card keyed in online can exceed 2.5%. The cardholder's 'free' airline miles are funded by your interchange. That's why processors quote blended rates — and why interchange-plus pricing exists for larger merchants.",
          "With interchange-plus, you see the real interchange on every transaction plus a fixed processor markup. It's cheaper at scale (usually past ~$10–25k/month) but the monthly statement becomes a spreadsheet. Under that volume, flat-rate simplicity usually wins on total cost.",
        ],
      },
      {
        heading: "The fixed fee is why small tickets hurt",
        paragraphs: [
          "The '$0.30' matters more than the '2.9%' on small transactions. A $5 charge costs $0.45 — an effective 9% fee. A $100 charge costs $3.20 — 3.2%. This is why micropayment rates exist (smaller percentage, smaller fixed fee) and why minimum-purchase signs exist in coffee shops.",
        ],
      },
      {
        heading: "What you can actually negotiate",
        paragraphs: [
          "Interchange and assessment are set by the card networks — no processor can change them. The negotiable part is the markup, and processors will shave it once your volume justifies it (typically $80k+/month for Stripe's volume discounts). Below that, your real levers are choosing the right fee model, avoiding international and currency-conversion surcharges where possible, and pricing products so the fixed fee doesn't eat small-ticket margins.",
        ],
      },
    ],
  },
  {
    slug: "roas-isnt-profit",
    title: "Why a 3x ROAS Can Still Lose Money",
    seoTitle: "ROAS Isn't Profit — Break-Even ROAS Explained",
    description:
      "A 3x return on ad spend sounds profitable, but ROAS counts revenue, not margin. Here is the one division that tells you whether your ads actually make money.",
    calculatorSlugs: [
      "roas-calculator",
      "cpm-calculator",
      "break-even-calculator",
    ],
    updatedAt: "2026-10-18",
    sections: [
      {
        heading: "The math that fools most dashboards",
        paragraphs: [
          "ROAS = revenue ÷ ad spend. Spend $1,000, sell $3,000, and the dashboard celebrates a 3x. But if your product margin is 30%, that $3,000 of revenue is only $900 of gross profit — you spent $1,000 to make $900, losing $100 while the platform reports success.",
          "This is the most common way small e-commerce and dropshipping stores bleed money: optimizing toward a number that was never connected to profit.",
        ],
      },
      {
        heading: "Break-even ROAS: one division",
        paragraphs: [
          "Break-even ROAS = 1 ÷ gross margin. At 40% margin you need 2.5x just to stay even; at 25% margin, 4x; at 60%, only 1.67x. 'Good ROAS' isn't an industry benchmark — it's a property of your own margin, and every product in the same account can have a different break-even.",
          "Run your numbers through the ROAS calculator: enter spend, revenue, and margin, and it shows both the vanity ROAS and the profit-weighted one, plus the break-even threshold for your margin.",
        ],
      },
      {
        heading: "Platform ROAS is inflated on top of that",
        paragraphs: [
          "Meta and Google attribute conversions generously — view-through windows, brand searches, and customers who would have bought anyway all get credited to ads. Platform-reported ROAS commonly runs 1.5–2x higher than blended reality (total revenue ÷ total spend, sometimes called MER). Trustworthy advertisers watch both: platform ROAS for optimization signals, blended ROAS for whether the business is actually working.",
        ],
      },
      {
        heading: "When running below break-even is correct",
        paragraphs: [
          "One exception: if you have measured lifetime value, a first-order loss can be rational. A subscription with a $120 average lifetime profit can profitably buy customers at a $60 first-order loss — but only if retention is real, not hoped for. The dangerous version is 'we'll make it back on repeat purchases' without the LTV data to prove it.",
        ],
      },
    ],
  },
  {
    slug: "freelance-platform-fees-compared",
    title:
      "Upwork vs Fiverr vs Going Direct: What Freelance Platforms Really Take",
    seoTitle: "Freelance Platform Fees Compared — Upwork, Fiverr & Direct",
    description:
      "Upwork takes 10%, Fiverr takes 20%, and 'direct' isn't free either. Here is what each channel actually costs per $1,000 of work — and the platform math most freelancers get wrong.",
    calculatorSlugs: [
      "upwork-fee-calculator",
      "fiverr-fee-calculator",
      "freelance-rate-calculator",
    ],
    updatedAt: "2026-10-19",
    sections: [
      {
        heading: "The headline cuts",
        paragraphs: [
          "Upwork takes a flat 10% of everything you bill a client (it was a sliding 20/10/5% scale until 2023). Fiverr takes a flat 20% of every order — on both the base gig and the extras. Going direct costs 0% in platform fees, which is why the standard career advice is 'use platforms to get started, move clients direct as soon as you can'.",
          "The catch: that advice ignores what the fee buys. On $1,000 of work, Upwork keeps $100, Fiverr keeps $200 — but both are selling you demand. A platform client found you; a direct client is one you acquired yourself, and acquisition has a real cost in unpaid hours.",
        ],
      },
      {
        heading: "The honest math per channel",
        paragraphs: [
          "Take the same $50/hour work through three channels. Upwork: $45/hour lands after the 10% cut, minus Connects (paid proposal credits, roughly $0.15 each) and the payment hold. Fiverr: $40/hour lands after 20% — but the order came to you while you slept, no proposals written. Direct: the full $50 lands — but only if you found the client yourself, which costs either ad spend, content time, or the unbillable hours spent pitching.",
          "Framed correctly, platform fees aren't a tax on your work — they're a customer acquisition cost that platforms itemize for you. The question is whether 10–20% is a better CAC than what you'd spend replacing it.",
        ],
      },
      {
        heading: "The rule that actually matters: lifetime of the client",
        paragraphs: [
          "The platforms' real value compounds differently per channel. Upwork's flat 10% is brutal on a $500 one-off but cheap insurance on a $50,000/year retainer — and Upwork's terms actually let you take the relationship off-platform after two years (or buy out the contract). Fiverr's 20% never scales down, making it expensive for repeat work — its model is designed for one-off commodity orders, not relationships.",
          "Direct clients have no ceiling: no platform cut on year three of a retainer, no algorithm changes, no account-suspension risk wiping out your pipeline. Every sustained freelance career ends up mostly-direct — the platforms are the on-ramp, not the road.",
        ],
      },
      {
        heading: "The pricing move most freelancers miss",
        paragraphs: [
          "Platform fees are priced into rates, not absorbed. A freelancer who needs $45/hour net doesn't charge $45 on Upwork and accept the cut — they charge $50. The fee is the client's problem, disclosed only if they ask. Run your target net rate through the freelance rate calculator, then reverse it through each platform's cut — quoting your net rate on-platform is quietly taking a pay cut.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function articlesForCalculator(slug: string) {
  return articles.filter((a) => a.calculatorSlugs.includes(slug));
}
