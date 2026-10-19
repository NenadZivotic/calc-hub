import type { CalculatorDef } from "../types";
import { money, money0, num, pct } from "../../format";

const ytNiches: Record<string, { label: string; low: number; high: number }> = {
  finance: { label: "Finance & investing", low: 12, high: 30 },
  business: { label: "Business & making money", low: 10, high: 25 },
  tech: { label: "Tech & software", low: 6, high: 15 },
  education: { label: "Education & how-to", low: 5, high: 12 },
  health: { label: "Health & fitness", low: 4, high: 10 },
  lifestyle: { label: "Lifestyle & vlog", low: 2, high: 6 },
  gaming: { label: "Gaming", low: 1, high: 5 },
  entertainment: { label: "Entertainment & comedy", low: 1, high: 4 },
};

export const creatorCalculators: CalculatorDef[] = [
  {
    slug: "youtube-revenue-calculator",
    vertical: "creators",
    name: "YouTube Revenue Calculator",
    title: "YouTube Revenue Calculator — Estimate AdSense Earnings",
    seoTitle: "YouTube Revenue Calculator 2026 — Earnings by Niche & Views",
    description:
      "Estimate YouTube AdSense revenue from monthly views and niche — realistic RPM ranges, monetized-playback share, and yearly projections.",
    keywords: [
      "youtube revenue calculator",
      "youtube earnings calculator",
      "youtube rpm",
      "how much does youtube pay",
      "youtube adsense calculator",
    ],
    fields: [
      {
        key: "views",
        label: "Monthly views",
        type: "number",
        default: 100000,
        min: 0,
        step: 1000,
      },
      {
        key: "niche",
        label: "Channel niche",
        type: "select",
        default: "tech",
        options: Object.entries(ytNiches).map(([value, n]) => ({
          value,
          label: `${n.label} (RPM $${n.low}–$${n.high})`,
        })),
      },
      {
        key: "monetized",
        label: "Share of monetized views",
        type: "number",
        default: 55,
        min: 0,
        max: 100,
        step: 1,
        suffix: "%",
        help: "Shorts, non-monetized geographies and ad-blocked views don't pay.",
      },
    ],
    compute: (v) => {
      const views = Math.max(0, Number(v.views) || 0);
      const share = Math.min(100, Math.max(0, Number(v.monetized) || 0)) / 100;
      const niche = ytNiches[String(v.niche)] ?? ytNiches.tech;
      const monetizedViews = views * share;
      const low = (monetizedViews / 1000) * niche.low;
      const high = (monetizedViews / 1000) * niche.high;
      return [
        {
          label: "Estimated monthly revenue",
          value: `${money0(low)} – ${money0(high)}`,
          tone: "primary",
        },
        {
          label: "Estimated yearly revenue",
          value: `${money0(low * 12)} – ${money0(high * 12)}`,
        },
        {
          label: "Earnings per 1,000 views",
          value: `$${(niche.low * share).toFixed(2)} – $${(niche.high * share).toFixed(2)}`,
          hint: "after adjusting for monetized share",
        },
        { label: "Monetized views / month", value: num(monetizedViews) },
      ];
    },
    assumptions: [
      "RPM = revenue per 1,000 monetized playbacks, net to the creator after YouTube's 45% share.",
      "Ranges reflect commonly reported niche RPMs on long-form videos; your actual RPM varies with geography, season and watch time.",
      "Shorts use a different revenue model — feed RPMs are typically $0.05–$0.15 and are not covered here.",
    ],
    sources: [
      {
        label: "YouTube Partner Program",
        url: "https://support.google.com/youtube/answer/72851",
      },
    ],
    sections: [
      {
        heading: "Why niche is the biggest lever on YouTube income",
        paragraphs: [
          "Advertisers pay for audiences that buy expensive things. A finance channel earns $12–30 RPM because credit card and brokerage ads are worth a fortune; a gaming channel earns $1–5 because its audience buys cheaper stuff. Same views, 10x difference in pay.",
          "This is why 'views' comparisons mislead. A 100k-view finance video can out-earn a 1M-view comedy video. If you're choosing a channel topic partly for income, niche economics should drive the decision more than subscriber-count fantasies.",
        ],
      },
      {
        heading: "The monetized-views reality check",
        paragraphs: [
          "Not every view pays. Shorts, ad-blocked viewers, viewers in low-ad-spend countries and non-skippable views that get skipped all generate $0. Most long-form channels see 45–65% of views actually monetized — which is why raw 'CPM × views' estimates overshoot real payouts by 40% or more.",
        ],
      },
      {
        heading: "Ads are the floor, not the ceiling",
        paragraphs: [
          "Channels that treat AdSense as the whole business leave most of the money on the table. Sponsorships typically pay $25–50 per 1,000 expected views in decent niches — several times the AdSense rate — and affiliates, memberships and products multiply it further. AdSense is your baseline; the calculator shows the floor of what your traffic is worth.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does YouTube pay per 1,000 views?",
        a: "Long-form RPMs range roughly $1–30 net to the creator depending on niche, audience geography and season. Tech and finance sit at the top; gaming and entertainment at the bottom.",
      },
      {
        q: "How much does 1 million views pay?",
        a: "In a high-RPM niche like finance, $6,000–16,000. In entertainment, often $500–2,000. Multiply your monthly views by your niche's RPM and monetized share — the calculator does exactly that.",
      },
      {
        q: "When can I monetize on YouTube?",
        a: "YPP requires 1,000 subscribers plus either 4,000 public watch hours (long-form) or 10M Shorts views in 90 days.",
      },
      {
        q: "Do Shorts pay the same as long videos?",
        a: "No — Shorts RPM is typically $0.05–0.15 per 1,000 views, an order of magnitude lower than long-form. Shorts grow the channel; long-form pays for it.",
      },
    ],
    related: [
      "tiktok-revenue-calculator",
      "freelance-rate-calculator",
      "break-even-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "tiktok-revenue-calculator",
    vertical: "creators",
    name: "TikTok Revenue Calculator",
    title: "TikTok Revenue Calculator — Creator Rewards Earnings",
    seoTitle: "TikTok Revenue Calculator 2026 — Creator Rewards RPM",
    description:
      "Estimate TikTok Creator Rewards earnings from qualified views — realistic RPM ranges and monthly/yearly projections.",
    keywords: [
      "tiktok revenue calculator",
      "tiktok earnings calculator",
      "tiktok creator rewards rpm",
      "how much does tiktok pay",
      "tiktok creator fund",
    ],
    fields: [
      {
        key: "views",
        label: "Monthly qualified views",
        type: "number",
        default: 500000,
        min: 0,
        step: 1000,
        help: "Only views over 5 seconds on videos longer than 1 minute count as 'qualified'.",
      },
      {
        key: "rpm",
        label: "RPM scenario",
        type: "select",
        default: "mid",
        options: [
          { value: "low", label: "Conservative — $0.40 per 1k" },
          { value: "mid", label: "Typical — $0.60 per 1k" },
          { value: "high", label: "Strong — $1.00 per 1k" },
        ],
      },
    ],
    compute: (v) => {
      const views = Math.max(0, Number(v.views) || 0);
      const rpms: Record<string, number> = { low: 0.4, mid: 0.6, high: 1 };
      const rpm = rpms[String(v.rpm)] ?? rpms.mid;
      const monthly = (views / 1000) * rpm;
      return [
        { label: "Monthly earnings", value: money(monthly), tone: "primary" },
        { label: "Yearly projection", value: money0(monthly * 12) },
        {
          label: "Per million qualified views",
          value: money0(rpm * 1000),
          hint: `at $${rpm.toFixed(2)} RPM`,
        },
      ];
    },
    assumptions: [
      "Creator Rewards Program pays on 'qualified' views — views over 5 seconds on original videos longer than 1 minute.",
      "Reported RPMs cluster around $0.40–$1.00, varying with geography, engagement quality and search value of content.",
      "Requires 10,000 followers + 100,000 views in 30 days and a supported country.",
    ],
    sources: [
      {
        label: "TikTok Creator Rewards",
        url: "https://support.tiktok.com/en/business-and-creator/creator-rewards-program",
      },
    ],
    sections: [
      {
        heading: "Creator Rewards pays for watch time, not virality",
        paragraphs: [
          "TikTok's Creator Rewards replaced the old Creator Fund with a model that pays roughly $0.40–$1.00 per 1,000 qualified views — but only on original videos over one minute, and only on views lasting over five seconds. A viral 10-second clip earns nothing.",
          "The multiplier that matters is 'search value' — TikTok pays more for content people actively search for. Tutorials and how-tos outperform random virals in RPM even at the same view counts.",
        ],
      },
      {
        heading: "What the numbers mean in practice",
        paragraphs: [
          "At a $0.60 RPM you need about 1.7M qualified views a month to make $1,000. That's realistic for a consistent niche account but nowhere near passive income — TikTok monetization through the platform alone is a supplement, not a salary.",
          "The accounts actually earning from TikTok treat it as top-of-funnel: driving to products, affiliate links, brand deals or platforms with better RPMs. Creator Rewards is the bonus; the funnel is the business.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does TikTok pay per 1,000 views?",
        a: "Under Creator Rewards, roughly $0.40–$1.00 per 1,000 qualified views — views over 5 seconds on videos longer than 1 minute.",
      },
      {
        q: "How much is 1 million views on TikTok worth?",
        a: "Around $400–$1,000 if they're qualified views on eligible videos. Viral clips under a minute or short-view traffic pays nothing.",
      },
      {
        q: "What are the requirements for Creator Rewards?",
        a: "10,000 followers, 100,000 views in the last 30 days, being 18+, and located in a supported country.",
      },
      {
        q: "TikTok vs YouTube — which pays more per view?",
        a: "YouTube long-form by a wide margin ($1–30 RPM vs TikTok's $0.40–1.00). TikTok's advantage is reach velocity — it's easier to get the views; YouTube pays more per view you get.",
      },
    ],
    related: [
      "youtube-revenue-calculator",
      "freelance-rate-calculator",
      "break-even-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "freelance-rate-calculator",
    vertical: "creators",
    name: "Freelance Rate Calculator",
    title: "Freelance Rate Calculator — The Hourly Rate You Actually Need",
    seoTitle: "Freelance Rate Calculator — Hourly & Day Rate From Goals",
    description:
      "Work backwards from your income goal: taxes, expenses, vacation and non-billable hours to the hourly and day rate you must charge.",
    keywords: [
      "freelance rate calculator",
      "hourly rate calculator",
      "freelance day rate",
      "how much to charge freelance",
      "contractor rate calculator",
    ],
    fields: [
      {
        key: "takeHome",
        label: "Target annual take-home",
        type: "number",
        default: 60000,
        min: 0,
        step: 1000,
        prefix: "$",
      },
      {
        key: "taxPct",
        label: "Taxes & contributions",
        type: "number",
        default: 30,
        min: 0,
        max: 60,
        step: 1,
        suffix: "%",
        help: "Income tax + self-employment/social contributions combined.",
      },
      {
        key: "expenses",
        label: "Annual business expenses",
        type: "number",
        default: 6000,
        min: 0,
        step: 100,
        prefix: "$",
        help: "Hardware, software, insurance, coworking, accounting…",
      },
      {
        key: "hoursWeek",
        label: "Working hours per week",
        type: "number",
        default: 40,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        key: "billable",
        label: "Billable share",
        type: "number",
        default: 70,
        min: 10,
        max: 100,
        step: 1,
        suffix: "%",
        help: "Admin, sales and marketing aren't billable — 60–75% is realistic.",
      },
      {
        key: "weeksOff",
        label: "Weeks off per year",
        type: "number",
        default: 4,
        min: 0,
        max: 26,
        step: 1,
      },
    ],
    compute: (v) => {
      const takeHome = Number(v.takeHome) || 0;
      const tax = Math.min(90, Math.max(0, Number(v.taxPct) || 0)) / 100;
      const expenses = Number(v.expenses) || 0;
      const hoursWeek = Math.max(1, Number(v.hoursWeek) || 0);
      const billable = Math.min(
        1,
        Math.max(0.1, (Number(v.billable) || 0) / 100),
      );
      const weeksOff = Math.min(51, Math.max(0, Number(v.weeksOff) || 0));
      const billableHours = (52 - weeksOff) * hoursWeek * billable;
      const grossNeeded = takeHome / (1 - tax) + expenses;
      const hourly = billableHours > 0 ? grossNeeded / billableHours : 0;
      return [
        {
          label: "Required hourly rate",
          value: money(hourly),
          tone: "primary",
        },
        { label: "Day rate (8h)", value: money(hourly * 8), tone: "primary" },
        {
          label: "Required annual revenue",
          value: money0(grossNeeded),
          hint: "to cover take-home + taxes + expenses",
        },
        { label: "Monthly revenue target", value: money0(grossNeeded / 12) },
        {
          label: "Billable hours per year",
          value: num(billableHours),
          hint: `${52 - weeksOff} working weeks × ${num(hoursWeek)}h × ${num(billable * 100)}% billable`,
        },
      ];
    },
    assumptions: [
      "Taxes modeled as a single flat percentage of gross — combine your income tax and self-employment/social contribution rates.",
      "Billable share accounts for unpaid work: sales, invoicing, admin, marketing.",
      "Weeks off include vacation, sick days and slow periods between contracts.",
    ],
    sources: [],
    sections: [
      {
        heading: "Why your salary-based rate is wrong",
        paragraphs: [
          "The classic mistake: take your old salary, divide by 2,080, and call that your freelance rate. A $60k salary becomes $29/hour — but that math silently assumes someone else pays your taxes' employer half, your benefits, your equipment, and 100% of your hours are billable. None of that is true freelancing.",
          "The real formula runs backwards: take-home goal → gross up for taxes → add business expenses → divide by the hours you can actually bill. A $60k take-home at 30% tax with $6k of expenses needs ~$92k of revenue — and at 1,344 billable hours that's $68/hour, not $29.",
        ],
      },
      {
        heading: "The billable-hours trap",
        paragraphs: [
          "New freelancers assume 40 billable hours a week. Reality: sales calls, proposals, invoicing, bookkeeping, learning and marketing easily eat 25–40% of a solo freelancer's time. If you plan for 100% utilization you'll land at 60–70% and wonder where the money went.",
          "Weeks off matter just as much. Employees get paid vacation; freelancers get unpaid silence. Four weeks off removes ~8% of your annual capacity — price it in, or you're funding your own vacation pay cut.",
        ],
      },
      {
        heading: "Hourly is the floor, not the product",
        paragraphs: [
          "Use this number as the minimum below which you lose money on every hour — then stop selling hours. Value-priced projects and retainers decouple income from your calendar. The hourly rate tells you what a project must effectively pay per hour to be worth taking; it should be invisible to the client.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I calculate my freelance hourly rate?",
        a: "Required revenue = (target take-home ÷ (1 − tax rate)) + annual expenses. Hourly rate = required revenue ÷ annual billable hours. The calculator runs this for you.",
      },
      {
        q: "What percentage of my hours are actually billable?",
        a: "Most solo freelancers bill 60–75% of working time. The rest goes to sales, admin, invoicing and marketing. Track a month honestly before trusting a higher number.",
      },
      {
        q: "Should I charge hourly or per project?",
        a: "Know your hourly floor, then quote per project. Hourly billing punishes efficiency — the faster you get, the less you earn. Project pricing rewards it.",
      },
      {
        q: "How do taxes work for freelancers?",
        a: "You pay both income tax and self-employment/social contributions — typically 25–40% combined depending on country and bracket. Budget it as a flat percentage and set it aside on every invoice.",
      },
    ],
    related: [
      "youtube-revenue-calculator",
      "break-even-calculator",
      "vat-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "patreon-fee-calculator",
    vertical: "creators",
    name: "Patreon Fee Calculator",
    title: "Patreon Fee Calculator — What Creators Actually Keep",
    seoTitle: "Patreon Fee Calculator — Platform & Processing Fees",
    description:
      "Calculate Patreon's cut of your memberships: platform fee by plan plus payment processing — see your real net monthly income.",
    keywords: [
      "patreon fee calculator",
      "patreon fees",
      "how much does patreon take",
      "patreon platform fee",
      "patreon earnings calculator",
    ],
    fields: [
      {
        key: "patrons",
        label: "Paying patrons",
        type: "number",
        default: 100,
        min: 0,
        step: 1,
      },
      {
        key: "pledge",
        label: "Average pledge per month",
        type: "number",
        default: 8,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "plan",
        label: "Patreon plan",
        type: "select",
        default: "pro",
        options: [
          { value: "pro", label: "Pro — 8% platform fee" },
          { value: "premium", label: "Premium — 12% platform fee" },
        ],
      },
    ],
    compute: (v) => {
      const patrons = Math.max(0, Number(v.patrons) || 0);
      const pledge = Number(v.pledge) || 0;
      const platformPct = String(v.plan) === "premium" ? 0.12 : 0.08;
      const gross = patrons * pledge;
      const platform = gross * platformPct;
      const processing = gross * 0.029 + patrons * 0.3;
      const net = gross - platform - processing;
      return [
        { label: "Monthly gross", value: money(gross) },
        {
          label: `Platform fee (${platformPct * 100}%)`,
          value: money(platform),
          tone: "bad",
        },
        {
          label: "Payment processing (~2.9% + $0.30)",
          value: money(processing),
          tone: "bad",
        },
        { label: "You keep per month", value: money(net), tone: "primary" },
        {
          label: "Effective take rate",
          value: pct(
            gross > 0 ? ((platform + processing) / gross) * 100 : 0,
            1,
          ),
        },
        { label: "Yearly net", value: money(net * 12), tone: "good" },
      ];
    },
    assumptions: [
      "Patreon platform fee: 8% on Pro, 12% on Premium (which adds merchandising and dedicated support).",
      "Payment processing approximated at 2.9% + $0.30 per pledge — actual rates vary slightly by payment method and country.",
      "Currency conversion and payout fees (1% Payoneer, $0.25 US ACH, etc.) are not included.",
    ],
    sources: [
      { label: "Patreon pricing", url: "https://www.patreon.com/pricing" },
    ],
    sections: [
      {
        heading: "Patreon's real take is ~11–16%, not 8%",
        paragraphs: [
          "The advertised 8% platform fee is only half the story — payment processing adds roughly 2.9% + $0.30 per pledge. On a $5 pledge that's 8% + $0.45, an effective take of 17%. Smaller pledges get squeezed hardest because the per-transaction fixed fee is a bigger share.",
          "This is the case against $1–2 tiers as your only offering: 100 patrons at $2 nets you roughly $150/month after all fees. The same 100 patrons at $8 nets ~$665. Tier structure matters more than patron count.",
        ],
      },
      {
        heading: "Pro vs Premium: when 12% is worth it",
        paragraphs: [
          "The Premium plan costs 4 percentage points more — on $800/month gross that's $32 — in exchange for merchandise-for-membership and a dedicated partner manager. Merch only pays off if you would otherwise run it yourself; for most creators Pro at 8% is the right tier until memberships are large enough that the manager's retention help justifies the cut.",
        ],
      },
      {
        heading: "Patreon vs the alternatives",
        paragraphs: [
          "Ko-fi takes 0% on donations (5% on memberships/shop on free plan), Buy Me a Coffee takes 5% flat, and Substack takes 10% + processing. Patreon charges the most but delivers the strongest discovery, retention tooling and member analytics. Many creators run Patreon as primary with Ko-fi as a fee-free tip jar for one-off support.",
        ],
      },
    ],
    faq: [
      {
        q: "What percentage does Patreon take?",
        a: "8% platform fee on Pro or 12% on Premium, plus ~2.9% + $0.30 payment processing per pledge — a real take of roughly 11–16% depending on pledge size.",
      },
      {
        q: "How much do I keep from a $5 pledge?",
        a: "On Pro: about $4.15 — Patreon takes $0.40 platform fee plus ~$0.45 in processing.",
      },
      {
        q: "Is Patreon or Ko-fi cheaper?",
        a: "Ko-fi is cheaper (0% on donations, 5% on memberships) but has less discovery and fewer retention features. Patreon's premium pays for tooling, not just processing.",
      },
      {
        q: "Does Patreon charge for free members?",
        a: "No — the platform fee applies only to paid pledges. Free members and followers cost nothing.",
      },
    ],
    related: [
      "substack-revenue-calculator",
      "youtube-revenue-calculator",
      "freelance-rate-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "substack-revenue-calculator",
    vertical: "creators",
    name: "Substack Revenue Calculator",
    title: "Substack Revenue Calculator — Net Income After Fees",
    seoTitle: "Substack Revenue Calculator — Paid Subs & Real Net",
    description:
      "Estimate Substack net income: paid subscribers × price minus the 10% platform fee and Stripe processing — monthly and yearly.",
    keywords: [
      "substack revenue calculator",
      "substack fees",
      "how much does substack take",
      "substack earnings",
      "newsletter revenue calculator",
    ],
    fields: [
      {
        key: "subs",
        label: "Paid subscribers",
        type: "number",
        default: 500,
        min: 0,
        step: 10,
      },
      {
        key: "price",
        label: "Monthly price",
        type: "number",
        default: 8,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "annualShare",
        label: "Share on annual plans",
        type: "number",
        default: 30,
        min: 0,
        max: 100,
        step: 5,
        suffix: "%",
        help: "Annual subs are billed at ~10× monthly price, once a year.",
      },
    ],
    compute: (v) => {
      const subs = Math.max(0, Number(v.subs) || 0);
      const price = Number(v.price) || 0;
      const annualShare = Math.min(
        1,
        Math.max(0, (Number(v.annualShare) || 0) / 100),
      );
      const monthlySubs = subs * (1 - annualShare);
      const annualSubs = subs * annualShare;
      const monthlyGross = monthlySubs * price + (annualSubs * price * 10) / 12;
      const platform = monthlyGross * 0.1;
      const processing =
        monthlySubs * (price * 0.029 + 0.3) +
        (annualSubs * (price * 10 * 0.029 + 0.3)) / 12;
      const net = monthlyGross - platform - processing;
      return [
        { label: "Monthly gross (blended)", value: money(monthlyGross) },
        { label: "Substack fee (10%)", value: money(platform), tone: "bad" },
        {
          label: "Stripe processing (~2.9% + $0.30)",
          value: money(processing),
          tone: "bad",
        },
        { label: "You keep per month", value: money(net), tone: "primary" },
        { label: "You keep per year", value: money(net * 12), tone: "good" },
        {
          label: "Effective take rate",
          value: pct(
            monthlyGross > 0
              ? ((platform + processing) / monthlyGross) * 100
              : 0,
            1,
          ),
        },
      ];
    },
    assumptions: [
      "Substack platform fee: 10% of every paid transaction.",
      "Stripe processing approximated at 2.9% + $0.30 per billing event.",
      "Annual plans modeled at 10× the monthly price (Substack's default discount structure), recognized monthly.",
    ],
    sources: [
      { label: "Substack pricing", url: "https://substack.com/going-paid" },
    ],
    sections: [
      {
        heading: "Substack's 10% is the real price — but there's a nuance",
        paragraphs: [
          "Between the 10% platform fee and ~3% Stripe processing, Substack keeps roughly 13–15% of gross. On 500 subscribers at $8 that's about $4,000/month gross, $3,400 net — a meaningful cut, though still far better than ad-supported models at the same audience size.",
          "The counterpoint: 10% buys hosting, email delivery, the recommendation network (which drives a large share of growth for most publications) and a payment stack you'd otherwise assemble yourself. Beehiiv's flat $49–99/month can beat Substack's percentage past ~$1,000/month of paid revenue — the math flips faster than people expect.",
        ],
      },
      {
        heading: "The annual-plan effect on cash flow",
        paragraphs: [
          "Annual subscribers pay ~10 months' price upfront. That's a cash-flow weapon — one annual sub delivers 10 months of revenue today — but it also means churn is invisible for a year and refunds cluster at renewal. Model your annual share honestly; most newsletters sit at 20–40%.",
        ],
      },
      {
        heading: "What 'paid conversion' usually looks like",
        paragraphs: [
          "Industry rule of thumb: 5–10% of free subscribers convert to paid. 5,000 free subs at 7% = 350 paid. At $8/month that's ~$2,400 net — which is why list growth, not fee optimization, is the real lever until you're past ~2,000 paid subscribers.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Substack take from paid subscriptions?",
        a: "10% platform fee plus Stripe processing (~2.9% + $0.30 per transaction) — roughly 13–15% of gross combined.",
      },
      {
        q: "How much do I keep from a $8/month subscriber?",
        a: "About $6.67 — Substack takes $0.80, Stripe takes ~$0.53.",
      },
      {
        q: "Is Substack or Beehiiv cheaper?",
        a: "Beehiiv's flat monthly fee beats Substack's 10% once paid revenue exceeds roughly $500–1,000/month, but Beehiiv lacks Substack's recommendation network that drives free growth.",
      },
      {
        q: "What percentage of free subscribers go paid?",
        a: "Typically 5–10% for engaged newsletters. Niche B2B lists convert higher; general interest lists lower.",
      },
    ],
    related: [
      "patreon-fee-calculator",
      "youtube-revenue-calculator",
      "freelance-rate-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "twitch-revenue-calculator",
    vertical: "creators",
    name: "Twitch Revenue Calculator",
    title: "Twitch Revenue Calculator — Subs, Bits & Ad Income",
    seoTitle: "Twitch Revenue Calculator — Streamer Income Estimate",
    description:
      "Estimate monthly Twitch income from subscribers, Bits and ad revenue — realistic splits and what streamers actually keep.",
    keywords: [
      "twitch revenue calculator",
      "twitch earnings calculator",
      "twitch sub revenue",
      "twitch bits value",
      "how much do streamers make",
    ],
    fields: [
      {
        key: "subs",
        label: "Active subscribers",
        type: "number",
        default: 100,
        min: 0,
        step: 5,
      },
      {
        key: "subSplit",
        label: "Sub revenue share",
        type: "select",
        default: "50",
        options: [
          { value: "50", label: "Standard — 50/50 split" },
          { value: "70", label: "Partner Plus — 70/30 split" },
        ],
      },
      {
        key: "bits",
        label: "Bits received per month",
        type: "number",
        default: 10000,
        min: 0,
        step: 100,
        help: "100 Bits = $1.00 to the streamer.",
      },
      {
        key: "avgViewers",
        label: "Average concurrent viewers",
        type: "number",
        default: 50,
        min: 0,
        step: 5,
      },
      {
        key: "hours",
        label: "Stream hours per month",
        type: "number",
        default: 80,
        min: 0,
        step: 5,
      },
    ],
    compute: (v) => {
      const subs = Math.max(0, Number(v.subs) || 0);
      const share = Number(v.subSplit) / 100;
      const bits = Math.max(0, Number(v.bits) || 0);
      const viewers = Math.max(0, Number(v.avgViewers) || 0);
      const hours = Math.max(0, Number(v.hours) || 0);
      const subRevenue = subs * 4.99 * share;
      const bitRevenue = bits * 0.01;
      // ~$3.50 ad revenue per 1,000 viewer-minutes of ads, ~3 min of ads per hour
      const adRevenue = (viewers * hours * 3 * 3.5) / 1000;
      const total = subRevenue + bitRevenue + adRevenue;
      return [
        {
          label: "Subscription revenue",
          value: money(subRevenue),
          hint: `$2.50 or $3.49 per Tier-1 sub`,
        },
        {
          label: "Bits revenue",
          value: money(bitRevenue),
          hint: "100 Bits = $1.00",
        },
        {
          label: "Estimated ad revenue",
          value: money(adRevenue),
          hint: "~$3.50 CPM, ~3 min ads/hour",
        },
        { label: "Total per month", value: money(total), tone: "primary" },
        { label: "Yearly projection", value: money(total * 12), tone: "good" },
      ];
    },
    assumptions: [
      "Tier-1 subs priced at $4.99; standard split 50/50, Partner Plus 70/30 (requires 100–350 sub points to qualify).",
      "Bits pay the streamer $0.01 each — viewers pay more for them, that's Twitch's margin.",
      "Ad revenue is the least predictable input — modeled at ~$3.50 effective CPM on ~3 minutes of ads per hour.",
      "Donations, sponsorships and merch are excluded — for most streamers they exceed Twitch-native income.",
    ],
    sources: [
      {
        label: "Twitch Monetized Streamer Agreement",
        url: "https://www.twitch.tv/p/en/legal/monetized-streamer-agreement/",
      },
    ],
    sections: [
      {
        heading: "Where Twitch money actually comes from",
        paragraphs: [
          "Twitch income stacks three sources with very different economics. Subscriptions are the backbone: 100 subs at the standard 50/50 split is ~$250/month. Bits are tips in platform currency — 100 Bits = $1, clean and instant. Ads are the weakest link for small channels: at 50 average viewers, ~3 minutes of ads per hour earns roughly $40/month — meaningful only at large scale.",
          "The sobering baseline: a streamer needs roughly 400 consistent subscribers for ~$1,000/month from subs alone. That's why almost every streamer past a few hundred viewers treats Twitch income as the floor and builds sponsorships, donations and YouTube repurposing on top.",
        ],
      },
      {
        heading: "50/50 vs 70/30: the Partner Plus ladder",
        paragraphs: [
          "Twitch's Partner Plus program lifts qualifying partners to a 70/30 sub split — that's an extra $1 per Tier-1 sub per month, worth real money at scale (1,000 subs = +$1,000/month). The catch: you need to maintain 100–350 sub points for three consecutive months, and gifted/prime subs count differently. Below Partner, everyone sits at 50/50.",
        ],
      },
      {
        heading: "Why ads are a trap for small streamers",
        paragraphs: [
          "Running frequent ads on a 50-viewer stream earns pocket change while pushing viewers away — the classic small-channel mistake. Most partners keep ads minimal until 200+ average viewers; growth compounds faster than pennies per ad impression. Twitch's own incentive structure (ad-free sub perks) quietly confirms it.",
        ],
      },
    ],
    faq: [
      {
        q: "How much is a Twitch sub worth to the streamer?",
        a: "$2.50 on the standard 50/50 split, or $3.49 on Partner Plus 70/30 — for a $4.99 Tier-1 sub. Tier 2/3 and regional pricing vary.",
      },
      {
        q: "How much are 1,000 Bits worth?",
        a: "$10.00 to the streamer — 100 Bits = $1, always.",
      },
      {
        q: "How many subs do you need to make $1,000/month?",
        a: "About 400 subscribers on the standard split — before bits, ads or external revenue.",
      },
      {
        q: "Do Prime Gaming subs pay the same?",
        a: "Yes — Prime subs pay the streamer the same share as Tier-1 subs, they just cost the viewer nothing extra.",
      },
    ],
    related: [
      "youtube-revenue-calculator",
      "patreon-fee-calculator",
      "substack-revenue-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "gumroad-fee-calculator",
    vertical: "creators",
    name: "Gumroad Fee Calculator",
    title: "Gumroad Fee Calculator — What You Keep Per Sale",
    seoTitle: "Gumroad Fee Calculator — 10% + Processing Explained",
    description:
      "Calculate Gumroad's platform fee plus payment processing on digital product sales — see your net per sale and effective take rate.",
    keywords: [
      "gumroad fee calculator",
      "gumroad fees",
      "how much does gumroad take",
      "gumroad seller earnings",
      "gumroad pricing",
    ],
    fields: [
      {
        key: "price",
        label: "Product price",
        type: "number",
        default: 29,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "sales",
        label: "Sales per month",
        type: "number",
        default: 40,
        min: 1,
        step: 1,
      },
    ],
    compute: (v) => {
      const price = Number(v.price) || 0;
      const sales = Math.max(0, Number(v.sales) || 0);
      const platform = price * 0.1;
      const processing = price * 0.035 + 0.3;
      const fee = platform + processing;
      const net = Math.max(0, price - fee);
      return [
        { label: "Gumroad fee (10%)", value: money(platform), tone: "bad" },
        { label: "Payment processing", value: money(processing), tone: "bad" },
        { label: "You keep per sale", value: money(net), tone: "good" },
        {
          label: "Effective take rate",
          value: pct(price > 0 ? (fee / price) * 100 : 0, 1),
        },
        { label: "Net per month", value: money(net * sales), tone: "primary" },
      ];
    },
    assumptions: [
      "Gumroad platform fee: 10% of every sale.",
      "Payment processing approximated at 3.5% + $0.30 (card rates vary slightly by country and method).",
      "Affiliate commissions on sales driven by Gumroad's Discover are additional and not modeled.",
    ],
    sources: [{ label: "Gumroad pricing", url: "https://gumroad.com/pricing" }],
    sections: [
      {
        heading: "Gumroad's real take is ~14–18% of every sale",
        paragraphs: [
          "Gumroad advertises a clean 10% — but payment processing stacks on top. On a $29 ebook that's $2.90 platform + $1.32 processing, a $4.22 total, about 14.5%. On a $5 product the fixed 30¢ processing pushes the take toward 19%.",
          "There's no monthly fee, no listing fee, no hosting fee — you pay only when you sell. That makes Gumroad the cheapest place to *start* and one of the more expensive places to *scale*: at 200 sales/month of a $29 product you're paying ~$840/month in fees, where a $29/month storefront app plus 3% processing would cost ~$200.",
        ],
      },
      {
        heading: "Gumroad vs LemonSqueezy vs Payhip",
        paragraphs: [
          "The direct competitors price similarly: LemonSqueezy ~5% + processing (but adds a subscription for some features), Payhip 5%/2%/0% by plan tier + processing. Gumroad's premium buys you Discover — its built-in marketplace that can drive real sales for template/ebook products — plus the simplest setup in the category. Run the math on your expected volume, then weigh whether Discover's traffic is worth the extra ~5%.",
        ],
      },
      {
        heading: "Pricing digital products on Gumroad",
        paragraphs: [
          "Because fees scale with price, your pricing power is untouched — charge $19 or $99 and the take rate stays ~13–15%. The real trap is ultra-cheap pricing: a $3 download nets about $2.35. Bundle or price at $15+ and the fee stack stops mattering.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Gumroad take per sale?",
        a: "10% platform fee plus ~3.5% + $0.30 payment processing — about 14–18% total depending on price.",
      },
      {
        q: "What do I keep from a $29 Gumroad sale?",
        a: "About $24.78 — Gumroad takes $2.90, processing takes ~$1.32.",
      },
      {
        q: "Is Gumroad free to start?",
        a: "Yes — no monthly or listing fees. You pay per sale only, which makes it the lowest-risk place to test a product.",
      },
      {
        q: "Gumroad vs Payhip — which is cheaper?",
        a: "Payhip's paid plans drop to 0–2% platform fee + processing, cheaper at volume; Gumroad's 10% includes its Discover marketplace which can drive sales other platforms can't.",
      },
    ],
    related: [
      "etsy-profit-calculator",
      "patreon-fee-calculator",
      "stripe-fee-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "kofi-fee-calculator",
    vertical: "creators",
    name: "Ko-fi Fee Calculator",
    title: "Ko-fi Fee Calculator — 0% Donations, 5% Memberships",
    seoTitle: "Ko-fi Fee Calculator — What Creators Keep",
    description:
      "Calculate what you keep on Ko-fi: 0% on donations, 5% on memberships and shop sales (0% on Gold) minus PayPal/Stripe processing.",
    keywords: [
      "ko-fi fee calculator",
      "ko-fi fees",
      "how much does ko-fi take",
      "ko-fi vs patreon fees",
      "ko-fi gold",
    ],
    fields: [
      {
        key: "amount",
        label: "Supporter payment",
        type: "number",
        default: 10,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "count",
        label: "Payments per month",
        type: "number",
        default: 30,
        min: 1,
        step: 1,
      },
      {
        key: "kind",
        label: "Payment type",
        type: "select",
        default: "donation",
        options: [
          { value: "donation", label: "Donation — 0% Ko-fi fee" },
          { value: "member", label: "Membership / shop — 5% Ko-fi fee" },
          { value: "gold", label: "Gold plan — 0% on everything" },
        ],
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const count = Math.max(0, Number(v.count) || 0);
      const platformPct = String(v.kind) === "member" ? 0.05 : 0;
      const platform = amount * platformPct;
      const processing = amount * 0.034 + 0.3;
      const fee = platform + processing;
      const net = Math.max(0, amount - fee);
      return [
        {
          label: "Ko-fi platform fee",
          value: money(platform),
          tone: platform > 0 ? "bad" : "good",
        },
        { label: "Payment processing", value: money(processing), tone: "bad" },
        { label: "You keep per payment", value: money(net), tone: "good" },
        {
          label: "Effective take rate",
          value: pct(amount > 0 ? (fee / amount) * 100 : 0, 1),
        },
        { label: "Net per month", value: money(net * count), tone: "primary" },
      ];
    },
    assumptions: [
      "Ko-fi fees: 0% on donations, 5% on memberships/shop/commissions, 0% on everything with Ko-fi Gold (~$6–12/month).",
      "PayPal/Stripe processing approximated at 3.4% + $0.30 — you still pay processor fees on every payment regardless of Ko-fi's cut.",
    ],
    sources: [{ label: "Ko-fi pricing", url: "https://ko-fi.com/pricing" }],
    sections: [
      {
        heading: "The cheapest mainstream tip jar — with one catch",
        paragraphs: [
          "Ko-fi takes 0% on donations — the only major platform that does. On a $10 tip you lose only ~$0.64 to payment processing (6.4%), versus ~$1.25+ on Patreon-class platforms. For tip-jar income, nothing mainstream is cheaper.",
          "The catch: memberships, shop sales and commissions carry a 5% fee unless you pay for Gold (~$6–12/month). Gold breaks even at about $120–240/month of recurring revenue — past that, it's the cheapest membership platform in existence.",
        ],
      },
      {
        heading: "Ko-fi vs Patreon: the honest comparison",
        paragraphs: [
          "On fees alone Ko-fi wins everywhere: 0–5% versus Patreon's 11–16% effective take. On a $500/month membership income that's ~$25 vs ~$70 lost. But Patreon buys discovery and retention tooling that materially grows membership bases — creators consistently report Patreon's ecosystem converting better despite the higher cut. The common pattern: Patreon as the membership hub, Ko-fi as the zero-fee tip jar linked everywhere.",
        ],
      },
      {
        heading: "When the fee matters more than the platform",
        paragraphs: [
          "If your audience already knows where to find you (YouTube, newsletter, community), platform discovery adds nothing — you're paying for tooling you don't use. In that case the decision is purely financial: Ko-fi or even a self-hosted Stripe tip page wins. Pay for discovery only when you still need it.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Ko-fi really take 0%?",
        a: "On donations, yes — you only pay PayPal/Stripe processing (~3.4% + $0.30). Memberships and shop sales cost 5%, or 0% on the Gold plan.",
      },
      {
        q: "Ko-fi vs Patreon fees?",
        a: "Ko-fi: 0–5% + processing. Patreon: 8–12% platform fee + processing — roughly double at typical pledge sizes.",
      },
      {
        q: "Is Ko-fi Gold worth it?",
        a: "If you earn more than ~$150–200/month from memberships/shop, the $6–12/month Gold fee beats the 5% it removes.",
      },
      {
        q: "Can I use Ko-fi and Patreon together?",
        a: "Yes — many creators use Patreon for memberships and Ko-fi as a free tip jar for one-off support. Different products, different fee structures.",
      },
    ],
    related: [
      "patreon-fee-calculator",
      "gumroad-fee-calculator",
      "substack-revenue-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "upwork-fee-calculator",
    vertical: "creators",
    name: "Upwork Fee Calculator",
    title: "Upwork Fee Calculator — The 10% Service Fee Math",
    seoTitle: "Upwork Fee Calculator — Freelancer Take-Home Pay",
    description:
      "Calculate Upwork's 10% freelancer service fee plus withdrawal costs on any contract — see your real take-home per job.",
    keywords: [
      "upwork fee calculator",
      "upwork fees",
      "how much does upwork take",
      "upwork service fee",
      "upwork take home pay",
    ],
    fields: [
      {
        key: "amount",
        label: "Contract value",
        type: "number",
        default: 1000,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "payout",
        label: "Payout method",
        type: "select",
        default: "ach",
        options: [
          { value: "ach", label: "Direct to US bank — free" },
          { value: "paypal", label: "PayPal — free (PayPal fees may apply)" },
          { value: "wire", label: "Wire transfer — $50" },
          { value: "payoneer", label: "Payoneer — free (Payoneer fees apply)" },
        ],
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const service = amount * 0.1;
      const withdrawal = String(v.payout) === "wire" ? 50 : 0;
      const net = Math.max(0, amount - service - withdrawal);
      return [
        {
          label: "Upwork service fee (10%)",
          value: money(service),
          tone: "bad",
        },
        { label: "Withdrawal fee", value: money(withdrawal) },
        { label: "You receive", value: money(net), tone: "good" },
        {
          label: "Effective hourly on this contract",
          value: "—",
          hint: "divide 'You receive' by hours worked for the honest rate",
        },
        {
          label: "Effective take rate",
          value: pct(
            amount > 0 ? ((service + withdrawal) / amount) * 100 : 0,
            1,
          ),
          tone: "primary",
        },
      ];
    },
    assumptions: [
      "Freelancer service fee: flat 10% of every payment since 2023 (the old 5–20% sliding scale is gone).",
      "Connects spent on proposals (~10–16 per application) are not included — treat them as a marketing cost.",
      "Wire withdrawal costs $50; ACH, PayPal and Payoneer withdrawals are free on Upwork's side.",
    ],
    sources: [
      {
        label: "Upwork service fees",
        url: "https://support.upwork.com/hc/en-us/articles/360036560553",
      },
    ],
    sections: [
      {
        heading: "The honest 10% — better than it used to be",
        paragraphs: [
          "Upwork flattened its notorious sliding scale (20% on first $500, 10% to $10k, 5% above) into a simple 10% in 2023. On a $1,000 contract you keep $900 — clean math. For small contracts this is dramatically better than the old 20% tier.",
          "What's easy to miss: the 10% applies to everything, forever — there's no veteran discount anymore. A five-year client still costs 10% on every invoice, which is why long-term Upwork relationships push many freelancers to negotiate off-platform contracts (with the legal/ToS risk that carries).",
        ],
      },
      {
        heading: "The real cost isn't the 10% — it's the Connects",
        paragraphs: [
          "Every proposal burns 10–16 Connects (~$0.15 each). Win one in five proposals and each contract carries $7.50–12 of proposal spend before the service fee. On a $300 job that's another 3–4% — the effective cost of Upwork is closer to 13–14% for most freelancers.",
          "Price it in or bleed slowly: if your off-platform rate is $50/hour, quote $56–60 on Upwork. Clients who flinch at market rates aren't your market.",
        ],
      },
      {
        heading: "Upwork vs Fiverr math",
        paragraphs: [
          "Fiverr charges sellers a flat 20% — double Upwork's 10%. But Fiverr's buyers come to you (no proposal spend), while Upwork demands sales effort. The rule of thumb that emerges: for work you must actively hunt, Upwork's 10% + effort beats Fiverr's 20% + zero effort only if your pipeline converts — track proposal-to-contract honestly.",
        ],
      },
    ],
    faq: [
      {
        q: "What percentage does Upwork take from freelancers?",
        a: "A flat 10% service fee on all earnings, since 2023. The old 20%/10%/5% sliding scale is gone.",
      },
      {
        q: "How much do I keep from a $1,000 Upwork contract?",
        a: "$900 — Upwork takes $100, withdrawal is free via ACH/PayPal/Payoneer.",
      },
      {
        q: "Does Upwork charge for sending proposals?",
        a: "Indirectly — proposals cost 10–16 Connects each (~$0.15/Connect). Budget $2–2.50 per application.",
      },
      {
        q: "Can I take clients off Upwork to avoid the fee?",
        a: "Not for 24 months after the contract starts without paying a conversion fee (typically 12% of estimated annual earnings). Moving early violates ToS and risks both accounts.",
      },
    ],
    related: [
      "fiverr-fee-calculator",
      "freelance-rate-calculator",
      "gumroad-fee-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "fiverr-fee-calculator",
    vertical: "creators",
    name: "Fiverr Fee Calculator",
    title: "Fiverr Fee Calculator — The 20% Reality Check",
    seoTitle: "Fiverr Fee Calculator — What Sellers Actually Keep",
    description:
      "Calculate Fiverr's 20% seller fee on any gig order — your real earnings per order and what the platform takes per month.",
    keywords: [
      "fiverr fee calculator",
      "fiverr fees",
      "how much does fiverr take",
      "fiverr seller earnings",
      "fiverr commission",
    ],
    fields: [
      {
        key: "order",
        label: "Order value",
        type: "number",
        default: 100,
        min: 5,
        step: 5,
        prefix: "$",
      },
      {
        key: "orders",
        label: "Orders per month",
        type: "number",
        default: 15,
        min: 1,
        step: 1,
      },
      {
        key: "promoted",
        label: "Promoted gig ad rate",
        type: "number",
        default: 0,
        min: 0,
        max: 50,
        step: 1,
        suffix: "%",
        help: "Extra % of order paid to Fiverr on ad-driven sales — 0 if unused.",
      },
    ],
    compute: (v) => {
      const order = Number(v.order) || 0;
      const orders = Math.max(0, Number(v.orders) || 0);
      const adPct = Math.max(0, Number(v.promoted) || 0) / 100;
      const fee = order * 0.2;
      const adFee = order * adPct;
      const net = Math.max(0, order - fee - adFee);
      return [
        { label: "Fiverr fee (20%)", value: money(fee), tone: "bad" },
        {
          label: "Promoted gig fee",
          value: money(adFee),
          tone: adFee > 0 ? "bad" : "default",
        },
        { label: "You keep per order", value: money(net), tone: "good" },
        {
          label: "Effective take rate",
          value: pct(order > 0 ? ((fee + adFee) / order) * 100 : 0, 1),
        },
        { label: "Net per month", value: money(net * orders), tone: "primary" },
        {
          label: "Fiverr keeps per month",
          value: money((fee + adFee) * orders),
          tone: "bad",
        },
      ];
    },
    assumptions: [
      "Seller fee: flat 20% of every order including tips.",
      "Promoted Gigs charge your chosen rate on attributed orders — stacked on the 20%.",
      "Withdrawal fees ($1–3 depending on method/currency) are not included.",
    ],
    sources: [
      {
        label: "Fiverr service fees",
        url: "https://www.fiverr.com/support/articles/360010451637",
      },
    ],
    sections: [
      {
        heading: "20% is the steepest cut in freelancing",
        paragraphs: [
          "Fiverr takes a flat 20% of every order — double Upwork's 10%, quadruple what direct invoicing costs. A $100 gig nets $80; a $1,000 project nets $800. There is no negotiating it, no volume discount, no loyalty tier.",
          "The honest framing: Fiverr's 20% is a marketing fee, not a payment fee. Their marketplace brings buyers to you with zero prospecting effort — cold outreach, proposals, portfolio sites, and ad spend are all 'free' in the sense that you didn't do them. Whether 20% is expensive depends entirely on what customer acquisition costs you elsewhere.",
        ],
      },
      {
        heading: "Promoted Gigs can push the take past 30%",
        paragraphs: [
          "Promoted Gigs let you pay extra for placement — charged as a percentage of each attributed order on top of the 20%. Run a 10% ad rate and Fiverr keeps $30 of every $100 order. Watch the attribution: if most of your 'organic' sales were actually ad-attributed, your real take rate is far worse than 20%.",
        ],
      },
      {
        heading: "Surviving the fee: productize, don't discount",
        paragraphs: [
          "The math kills hourly-style gigs — at 20% off the top plus revisions, effective rates collapse. The gigs that thrive are productized packages with scope locked tight: fixed deliverables, fixed turnaround, tiered pricing. A $150 'logo package, 3 concepts' beats 'logo design hourly' every time because the scope creep that makes 20% fatal is priced out.",
          "And the standard graduation path: use Fiverr to build proof, then move repeat clients to direct contracts where the 20% becomes your margin again.",
        ],
      },
    ],
    faq: [
      {
        q: "What percentage does Fiverr take from sellers?",
        a: "A flat 20% on everything — orders, extras and tips — with no volume discounts.",
      },
      {
        q: "How much do I keep from a $100 Fiverr order?",
        a: "$80 before withdrawal fees. If the sale came through a Promoted Gig, subtract your ad rate too.",
      },
      {
        q: "Is Fiverr or Upwork cheaper for freelancers?",
        a: "Upwork: 10% + proposal costs. Fiverr: 20% flat + optional ad fees. Upwork is cheaper on paper; Fiverr requires less sales effort since buyers come to you.",
      },
      {
        q: "Can I charge more on Fiverr to cover the fee?",
        a: "Yes — that's exactly what top sellers do: price at 125% of your target net. The fee is predictable, so price it into the package instead of eating it.",
      },
    ],
    related: [
      "upwork-fee-calculator",
      "freelance-rate-calculator",
      "gumroad-fee-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "engagement-rate-calculator",
    vertical: "creators",
    name: "Engagement Rate Calculator",
    title: "Engagement Rate Calculator — Instagram, TikTok & YouTube",
    seoTitle: "Engagement Rate Calculator — With Benchmarks",
    description:
      "Calculate social media engagement rate from followers and interactions — plus how your number stacks up against benchmarks.",
    keywords: [
      "engagement rate calculator",
      "instagram engagement rate",
      "tiktok engagement rate",
      "social media engagement",
      "engagement rate formula",
    ],
    fields: [
      {
        key: "followers",
        label: "Followers / subscribers",
        type: "number",
        default: 10000,
        min: 0,
        step: 100,
      },
      {
        key: "likes",
        label: "Average likes per post",
        type: "number",
        default: 320,
        min: 0,
        step: 10,
      },
      {
        key: "comments",
        label: "Average comments per post",
        type: "number",
        default: 25,
        min: 0,
        step: 1,
      },
      {
        key: "platform",
        label: "Platform",
        type: "select",
        default: "instagram",
        options: [
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "youtube", label: "YouTube" },
          { value: "twitter", label: "X / Twitter" },
        ],
      },
    ],
    compute: (v) => {
      const followers = Math.max(1, Number(v.followers) || 0);
      const interactions = (Number(v.likes) || 0) + (Number(v.comments) || 0);
      const rate = (interactions / followers) * 100;
      const bench: Record<string, { low: number; high: number }> = {
        instagram: { low: 1, high: 5 },
        tiktok: { low: 4, high: 18 },
        youtube: { low: 2, high: 6 },
        twitter: { low: 0.5, high: 2 },
      };
      const b = bench[String(v.platform)] ?? bench.instagram;
      const verdict =
        rate >= b.high
          ? "Excellent — top tier"
          : rate >= b.low
            ? "Average range"
            : "Below average";
      return [
        { label: "Engagement rate", value: pct(rate, 2), tone: "primary" },
        {
          label: `Benchmark (${String(v.platform)})`,
          value: `${b.low}–${b.high}%`,
          hint: "typical range for the platform",
        },
        {
          label: "Verdict",
          value: verdict,
          tone: rate >= b.low ? "good" : "bad",
        },
        { label: "Avg interactions per post", value: num(interactions) },
      ];
    },
    assumptions: [
      "Formula: (likes + comments) ÷ followers × 100 — the standard brand-deal metric.",
      "Benchmarks: Instagram ~1–5%, TikTok ~4–18%, YouTube ~2–6%, X ~0.5–2%. Smaller accounts naturally run higher rates.",
      "Saves, shares and watch time aren't counted here — they matter more to algorithms than to brand deals.",
    ],
    sources: [],
    sections: [
      {
        heading: "The number brands actually check",
        paragraphs: [
          "Engagement rate is the first filter every brand runs before a sponsorship deal — a 100k account at 0.8% engagement is worth less than a 15k account at 6%. It exposes bought followers instantly: fake audiences don't like or comment, so inflated counts crater the rate.",
          "The formula most brands use: (likes + comments) ÷ followers × 100, averaged over the last 10–20 posts. Some include shares and saves where visible — worth calculating both ways.",
        ],
      },
      {
        heading: "Why benchmarks differ so much by platform",
        paragraphs: [
          "TikTok's 4–18% isn't because TikTokers are better — the algorithm shows content to non-followers, inflating interaction relative to follower count. Instagram's 1–5% reflects feed saturation. YouTube sits lower because views, not followers, are the real denominator there (like-rate-per-view is the better YouTube metric).",
          "Inside each platform, smaller accounts naturally run hotter — a 2k-follower account at 8% is unremarkable, a 500k account at 8% is elite. Benchmark within your size band, not the platform average.",
        ],
      },
      {
        heading: "Raising it — the honest version",
        paragraphs: [
          "Engagement rate responds to two things: content that triggers a response (questions, opinions, saveable utility) and consistency that keeps the audience warm. The tricks that don't work: engagement pods (algorithms discount pod-like patterns), comment bait without substance (trains low-quality engagement), and posting more (volume dilutes per-post rate without growing total engagement).",
        ],
      },
    ],
    faq: [
      {
        q: "How do you calculate engagement rate?",
        a: "Engagement rate = (likes + comments) ÷ followers × 100, averaged across recent posts. Some formulas include shares and saves.",
      },
      {
        q: "What is a good engagement rate on Instagram?",
        a: "1–3% is average, 3–5% is good, above 5% is excellent — especially for accounts over 50k followers.",
      },
      {
        q: "Why is my engagement rate dropping?",
        a: "Usually audience growth outpacing content quality, or reach shrinking. If followers grew 20% but interactions stayed flat, the math alone drops your rate — check per-post reach first.",
      },
      {
        q: "Do bought followers hurt engagement rate?",
        a: "Catastrophically — fake accounts never interact, so every 1,000 bought followers permanently dilutes your rate and brands spot it instantly.",
      },
    ],
    related: [
      "youtube-revenue-calculator",
      "tiktok-revenue-calculator",
      "cpm-calculator",
    ],
    updatedAt: "2026-10-18",
  },
];
