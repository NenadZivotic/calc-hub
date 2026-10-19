import type { CalculatorDef } from "../types";
import { money, money0, pct } from "../../format";

export const marketplaceCalculators: CalculatorDef[] = [
  {
    slug: "etsy-profit-calculator",
    vertical: "marketplaces",
    name: "Etsy Profit Calculator",
    title: "Etsy Profit Calculator — True Profit After All Fees",
    seoTitle: "Etsy Profit Calculator 2026 — Fees, Costs & Real Margin",
    description:
      "Calculate your real Etsy profit per order after listing fees, the 6.5% transaction fee, payment processing and optional Offsite Ads.",
    keywords: [
      "etsy profit calculator",
      "etsy fee calculator",
      "etsy fees 2026",
      "how much does etsy take",
      "etsy seller profit",
    ],
    fields: [
      {
        key: "price",
        label: "Item price",
        type: "number",
        default: 25,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "shippingCharged",
        label: "Shipping charged to buyer",
        type: "number",
        default: 4.5,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "itemCost",
        label: "Your cost to make the item",
        type: "number",
        default: 8,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "shippingCost",
        label: "Your actual shipping cost",
        type: "number",
        default: 4.2,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "orders",
        label: "Orders per month",
        type: "number",
        default: 30,
        min: 1,
        step: 1,
      },
      {
        key: "offsite",
        label: "Offsite Ads",
        type: "select",
        default: "none",
        options: [
          { value: "none", label: "Not enrolled / no ad sale" },
          { value: "15", label: "Offsite Ads — 15% of order" },
          { value: "12", label: "Offsite Ads — 12% (mandatory >$10k/yr)" },
        ],
        help: "Offsite Ads only apply to orders attributed to the ad.",
      },
    ],
    compute: (v) => {
      const price = Number(v.price) || 0;
      const shipCharged = Number(v.shippingCharged) || 0;
      const itemCost = Number(v.itemCost) || 0;
      const shipCost = Number(v.shippingCost) || 0;
      const orders = Math.max(0, Number(v.orders) || 0);
      const orderTotal = price + shipCharged;
      const listing = 0.2;
      const transaction = orderTotal * 0.065;
      const processing = orderTotal * 0.03 + 0.25;
      const ads = (orderTotal * Number(v.offsite)) / 100 || 0;
      const fees = listing + transaction + processing + ads;
      const profit = orderTotal - itemCost - shipCost - fees;
      const margin = orderTotal > 0 ? (profit / orderTotal) * 100 : 0;
      return [
        { label: "Etsy fees per order", value: money(fees), tone: "bad" },
        {
          label: "Net profit per order",
          value: money(profit),
          tone: profit >= 0 ? "good" : "bad",
        },
        { label: "Profit margin", value: pct(margin, 1) },
        {
          label: "Profit per month",
          value: money(profit * orders),
          tone: "primary",
          hint: `${orders.toLocaleString("en-US")} orders`,
        },
        {
          label: "Etsy's effective take rate",
          value: pct(orderTotal > 0 ? (fees / orderTotal) * 100 : 0, 1),
        },
      ];
    },
    assumptions: [
      "Listing fee: $0.20 per listing, charged again on each renewal/sale.",
      "Transaction fee: 6.5% of the order total including shipping charged to the buyer.",
      "US payment processing via Etsy Payments: 3% + $0.25.",
      "Offsite Ads (when a sale is attributed): 15%, or 12% for shops over $10,000 lifetime sales (mandatory).",
    ],
    sources: [
      {
        label: "Etsy fees & payments policy",
        url: "https://www.etsy.com/legal/fees/",
      },
      {
        label: "Etsy Offsite Ads",
        url: "https://help.etsy.com/hc/en-us/articles/360000338367",
      },
    ],
    sections: [
      {
        heading: "The four fees stacked on every Etsy order",
        paragraphs: [
          "Most sellers undercount Etsy fees because there isn't one fee — there are four. A $25 item with $4.50 shipping pays $0.20 listing, $1.92 transaction (6.5% of the order total including shipping), and $1.14 payment processing (3% + $0.25). That's $3.26 — an effective take rate of about 11% — before Etsy takes any ad commission.",
          "If the order came through Offsite Ads, add 15% of the order total ($4.43 on that order). Suddenly Etsy's cut is $7.69 — 26% of what the buyer paid — and many 'profitable' listings are actually selling at a loss. This is the single most common reason Etsy shops stall.",
        ],
      },
      {
        heading: "Pricing that survives the fee stack",
        paragraphs: [
          "Work backwards: decide your target margin first, then solve for price. If you want a 30% margin after fees and costs, your sale price plus shipping must be roughly your costs divided by 0.7 minus the fixed fees. On low-priced items the $0.20 listing fee and $0.25 processing fixed fee dominate — a $5 digital item pays an effective rate near 15% even before ads.",
          "Shipping is a fee trap in both directions. Etsy charges 6.5% transaction fee on the shipping you charge buyers, so 'free shipping' baked into the price doesn't reduce the fee — it just relabels it. Charge shipping honestly and price the item for margin.",
        ],
      },
      {
        heading: "Digital products change the math",
        paragraphs: [
          "Digital downloads skip shipping cost entirely, so margins of 80%+ are achievable — but the $0.20 listing fee renews on every sale, and Offsite Ads still apply. On a $3 printable, Etsy's effective take is around 18–20%; on a $15 digital bundle it's closer to 11%. Bundling low-priced downloads into higher-priced packs is the simplest way to dilute the fixed fees.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Etsy take from a $25 sale in 2026?",
        a: "About $3.26 on a $25 item with $4.50 shipping — $0.20 listing + $1.92 transaction + $1.14 processing. Add 15% of the order total if the sale came through Offsite Ads.",
      },
      {
        q: "Does Etsy charge a fee on shipping?",
        a: "Yes — the 6.5% transaction fee applies to the total including shipping charged to the buyer, and payment processing applies to the full amount too.",
      },
      {
        q: "What is a good profit margin on Etsy?",
        a: "After all fees, materials and shipping, most sustainable shops target 25–40%. Below ~15% you have no room for ads, sales or mistakes.",
      },
      {
        q: "Can I opt out of Offsite Ads?",
        a: "Only if your shop has made under $10,000 lifetime. Above that it's mandatory at the reduced 12% rate.",
      },
    ],
    related: [
      "ebay-fee-calculator",
      "shopify-profit-calculator",
      "paypal-fee-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "ebay-fee-calculator",
    vertical: "marketplaces",
    name: "eBay Fee Calculator",
    title: "eBay Fee Calculator — Final Value Fees & Your Payout",
    seoTitle: "eBay Fee Calculator 2026 — Final Value Fee + What You Keep",
    description:
      "Calculate eBay final value fees by category, optional Promoted Listings cost, and see your real payout per sale.",
    keywords: [
      "ebay fee calculator",
      "ebay final value fee",
      "how much does ebay take",
      "ebay seller fees 2026",
      "ebay promoted listings fee",
    ],
    fields: [
      {
        key: "price",
        label: "Sale price",
        type: "number",
        default: 50,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "shippingCharged",
        label: "Shipping charged to buyer",
        type: "number",
        default: 0,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        default: "most",
        options: [
          { value: "most", label: "Most categories — 13.6%" },
          { value: "sneakers", label: "Athletic shoes over $150 — 8%" },
          { value: "watches", label: "Watches & jewelry parts — 15%" },
          { value: "media", label: "Books, music, movies — 14.95%" },
          { value: "equipment", label: "Heavy equipment — 3%" },
        ],
      },
      {
        key: "promotedPct",
        label: "Promoted Listings rate",
        type: "number",
        default: 0,
        min: 0,
        max: 100,
        step: 0.1,
        suffix: "%",
        help: "Ad rate you set, applied to the order total — 0 if you don't promote.",
      },
    ],
    compute: (v) => {
      const total = (Number(v.price) || 0) + (Number(v.shippingCharged) || 0);
      const rates: Record<string, number> = {
        most: 13.6,
        sneakers: 8,
        watches: 15,
        media: 14.95,
        equipment: 3,
      };
      const p = rates[String(v.category)] ?? rates.most;
      const perOrder = total > 10 ? 0.4 : 0.3;
      const fvf = (total * p) / 100 + perOrder;
      const adFee = (total * (Number(v.promotedPct) || 0)) / 100;
      const fees = fvf + adFee;
      const net = total - fees;
      return [
        { label: "Final value fee", value: money(fvf), tone: "bad" },
        {
          label: "Promoted Listings fee",
          value: money(adFee),
          tone: adFee > 0 ? "bad" : "default",
        },
        { label: "Total eBay fees", value: money(fees), tone: "bad" },
        { label: "Your payout", value: money(net), tone: "good" },
        {
          label: "Effective take rate",
          value: pct(total > 0 ? (fees / total) * 100 : 0, 1),
          tone: "primary",
        },
      ];
    },
    assumptions: [
      "Final value fee applies to the order total including shipping charged to the buyer.",
      "Most categories: 13.6% up to $7,500 per item, plus a per-order fee ($0.30 on orders up to $10, $0.40 above).",
      "Store subscribers get modest category discounts not modeled here; sales tax and international fees are excluded.",
    ],
    sources: [
      {
        label: "eBay selling fees",
        url: "https://www.ebay.com/help/selling/fees-credits-invoices/selling-fees?id=4364",
      },
    ],
    sections: [
      {
        heading: "What eBay actually charges",
        paragraphs: [
          "eBay's main fee is the final value fee: 13.6% of the total the buyer pays in most categories — including the shipping charge — plus a small per-order fee of $0.30–$0.40. On a $50 sale with free shipping that's about $7.20, an effective take of ~14.4%.",
          "Category choice matters more than sellers expect. Athletic shoes over $150 pay 8%, heavy equipment just 3%, while watches and media pay around 15%. Listing in the correct category isn't just policy — mispriced categories directly change your margin.",
        ],
      },
      {
        heading: "Promoted Listings: the hidden second fee",
        paragraphs: [
          "Promoted Listings Standard charges your chosen ad rate on the entire order total when a sale is attributed to the ad — and it stacks on top of the final value fee. A 10% ad rate on a 13.6% category means eBay keeps almost a quarter of the order.",
          "The trap: ad-attributed sales look like normal sales in your dashboard. Export your reports monthly and check what share of orders paid the ad fee — sellers routinely discover 30%+ of revenue paid double fees without realizing it.",
        ],
      },
      {
        heading: "eBay vs the alternatives",
        paragraphs: [
          "At ~14% effective take, eBay sits between Etsy (~11% before ads) and Amazon FBA (often 30%+ all-in). eBay's advantage is zero cost to list up to 250 items/month and no monthly fee without a store — you only pay when you sell. For used goods and one-off items it remains the cheapest liquid market.",
        ],
      },
    ],
    faq: [
      {
        q: "What percentage does eBay take in 2026?",
        a: "13.6% of the total order (price + shipping) in most categories, plus $0.30–$0.40 per order. Promoted Listings adds your chosen ad rate on top when the sale is attributed.",
      },
      {
        q: "Does eBay charge a fee if my item doesn't sell?",
        a: "No final value fee. You get 250+ free listings per month; beyond that insertion fees apply (usually $0.35 per listing).",
      },
      {
        q: "Does eBay still charge a fee on shipping?",
        a: "Yes — the final value fee is calculated on the total amount the buyer pays, including shipping.",
      },
      {
        q: "How can I lower eBay fees?",
        a: "List in the lowest correct category, use Promoted Listings only on items that need visibility, and consider a Store subscription if you sell consistently (it discounts final value fees in many categories).",
      },
    ],
    related: [
      "etsy-profit-calculator",
      "paypal-fee-calculator",
      "dropshipping-margin-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "shopify-profit-calculator",
    vertical: "marketplaces",
    name: "Shopify Profit Calculator",
    title: "Shopify Profit Calculator — True Monthly Net After All Costs",
    seoTitle: "Shopify Profit Calculator 2026 — Plan, Fees & Real Net",
    description:
      "Calculate your real monthly Shopify profit after the plan fee, payment processing, apps and cost of goods.",
    keywords: [
      "shopify profit calculator",
      "shopify fees calculator",
      "shopify monthly cost",
      "shopify payments fee",
      "shopify profit margin",
    ],
    fields: [
      {
        key: "revenue",
        label: "Monthly revenue",
        type: "number",
        default: 5000,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "orders",
        label: "Orders per month",
        type: "number",
        default: 100,
        min: 1,
        step: 1,
      },
      {
        key: "plan",
        label: "Shopify plan",
        type: "select",
        default: "basic",
        options: [
          { value: "basic", label: "Basic — $39/mo (2.9% + $0.30)" },
          { value: "shopify", label: "Shopify — $105/mo (2.6% + $0.30)" },
          { value: "advanced", label: "Advanced — $399/mo (2.4% + $0.30)" },
        ],
      },
      {
        key: "gateway",
        label: "Payment gateway",
        type: "select",
        default: "sp",
        options: [
          { value: "sp", label: "Shopify Payments" },
          {
            value: "third",
            label: "Third-party (Stripe/PayPal — extra surcharge)",
          },
        ],
      },
      {
        key: "cogs",
        label: "Cost of goods sold",
        type: "number",
        default: 40,
        min: 0,
        max: 100,
        step: 1,
        suffix: "%",
      },
      {
        key: "apps",
        label: "Monthly app spend",
        type: "number",
        default: 50,
        min: 0,
        step: 1,
        prefix: "$",
      },
    ],
    compute: (v) => {
      const revenue = Number(v.revenue) || 0;
      const orders = Math.max(1, Number(v.orders) || 0);
      const plans: Record<
        string,
        { fee: number; p: number; surcharge: number }
      > = {
        basic: { fee: 39, p: 2.9, surcharge: 2 },
        shopify: { fee: 105, p: 2.6, surcharge: 1 },
        advanced: { fee: 399, p: 2.4, surcharge: 0.6 },
      };
      const plan = plans[String(v.plan)] ?? plans.basic;
      const thirdParty = String(v.gateway) === "third";
      const pctRate = thirdParty ? plan.p + plan.surcharge : plan.p;
      const processing = (revenue * pctRate) / 100 + orders * 0.3;
      const platformCost = plan.fee + processing + (Number(v.apps) || 0);
      const grossProfit = revenue * (1 - (Number(v.cogs) || 0) / 100);
      const net = grossProfit - platformCost;
      const margin = revenue > 0 ? (net / revenue) * 100 : 0;
      return [
        { label: "Payment processing", value: money(processing), tone: "bad" },
        {
          label: "Total platform cost",
          value: money(platformCost),
          tone: "bad",
          hint: "plan + processing + apps",
        },
        { label: "Gross profit (after COGS)", value: money(grossProfit) },
        {
          label: "Net profit per month",
          value: money(net),
          tone: net >= 0 ? "primary" : "bad",
        },
        { label: "Net margin", value: pct(margin, 1) },
      ];
    },
    assumptions: [
      "Monthly plan prices: Basic $39, Shopify $105, Advanced $399 (annual billing discounts not included).",
      "US online Shopify Payments rates per plan: 2.9%/2.6%/2.4% + $0.30.",
      "Third-party gateways add a Shopify surcharge: 2% / 1% / 0.6% by plan, on top of your gateway's own fees.",
    ],
    sources: [
      { label: "Shopify pricing", url: "https://www.shopify.com/pricing" },
    ],
    sections: [
      {
        heading: "The three layers of Shopify cost",
        paragraphs: [
          "Shopify's real cost is three stacked layers: the plan fee, payment processing, and apps. A store doing $5,000/month on Basic pays $39 for the plan, roughly $175 in processing (2.9% + $0.30 × 100 orders), and typically $30–100 in apps — call it $250, or 5% of revenue, before product costs.",
          "The under-discussed layer is the third-party gateway surcharge. Use Stripe or PayPal instead of Shopify Payments and Shopify adds 2% on Basic — on $5,000/month that's an extra $100 for nothing, on top of your gateway's own ~3% fee.",
        ],
      },
      {
        heading: "When upgrading the plan saves money",
        paragraphs: [
          "Higher plans charge less per transaction: 2.9% on Basic vs 2.6% on Shopify vs 2.4% on Advanced. The break-even for upgrading Basic→Shopify is where the 0.3% saving covers the $66/month price difference — roughly $22,000/month in card revenue. Below that, stay on Basic.",
          "The same math applies Basic→Advanced: the extra 0.2% saving (2.6%→2.4%) must cover $294/month, a break-even near $147,000/month. Plan upgrades are a volume decision, not a feature decision — do the math before Shopify's upgrade prompts convince you otherwise.",
        ],
      },
      {
        heading: "What margin do successful stores run?",
        paragraphs: [
          "After product costs, platform fees, shipping and ads, healthy Shopify stores typically net 15–25%. If your net margin is under 10%, the usual culprits are app bloat ($50–200/month of tools you barely use) and over-reliance on paid ads. Audit apps quarterly — each one you remove drops straight to the bottom line.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Shopify really cost per month?",
        a: "Plan fee ($39–399) + payment processing (~2.4–2.9% + $0.30/txn) + apps. A $5k/month store on Basic typically pays around $250/month all-in to the platform.",
      },
      {
        q: "Is Shopify Payments required?",
        a: "No, but using a third-party gateway adds a surcharge of 0.6–2% depending on your plan — almost always making Shopify Payments the cheaper option.",
      },
      {
        q: "When should I upgrade from Basic?",
        a: "When your monthly card revenue exceeds roughly $22,000 — that's where the lower processing rate on the Shopify plan covers the $66/month price increase.",
      },
      {
        q: "What is a good profit margin for a Shopify store?",
        a: "15–25% net after product, platform, shipping and marketing costs is healthy. Under 10% usually means app bloat or ads eating the margin.",
      },
    ],
    related: [
      "stripe-fee-calculator",
      "etsy-profit-calculator",
      "break-even-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "dropshipping-margin-calculator",
    vertical: "marketplaces",
    name: "Dropshipping Margin Calculator",
    title: "Dropshipping Margin Calculator — Real Profit Per Sale",
    seoTitle: "Dropshipping Margin Calculator — Profit, ROAS & Max CPA",
    description:
      "Calculate true dropshipping profit per order after product cost, shipping, payment fees and ad spend — plus your break-even ROAS.",
    keywords: [
      "dropshipping profit calculator",
      "dropshipping margin calculator",
      "roas calculator",
      "max cpa calculator",
      "dropshipping fees",
    ],
    fields: [
      {
        key: "price",
        label: "Sale price",
        type: "number",
        default: 39.99,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "productCost",
        label: "Product cost (supplier)",
        type: "number",
        default: 12,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "shippingCost",
        label: "Shipping cost",
        type: "number",
        default: 4,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "feePct",
        label: "Payment/platform fees",
        type: "number",
        default: 3,
        min: 0,
        max: 30,
        step: 0.1,
        suffix: "%",
      },
      {
        key: "adSpend",
        label: "Ad spend per sale (CPA)",
        type: "number",
        default: 10,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
    ],
    compute: (v) => {
      const price = Number(v.price) || 0;
      const product = Number(v.productCost) || 0;
      const ship = Number(v.shippingCost) || 0;
      const fee = (price * (Number(v.feePct) || 0)) / 100;
      const ad = Number(v.adSpend) || 0;
      const profit = price - product - ship - fee - ad;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      const maxCpa = price - product - ship - fee;
      const breakevenRoas = ad > 0 ? price / ad : Infinity;
      return [
        {
          label: "Net profit per sale",
          value: money(profit),
          tone: profit >= 0 ? "good" : "bad",
        },
        { label: "Profit margin", value: pct(margin, 1) },
        {
          label: "Break-even ROAS",
          value: ad > 0 ? `${breakevenRoas.toFixed(2)}x` : "n/a",
          hint: "revenue ÷ ad spend needed to not lose money",
        },
        {
          label: "Max CPA to break even",
          value: money(Math.max(0, maxCpa)),
          tone: "primary",
        },
        { label: "Payment/platform fees", value: money(fee) },
      ];
    },
    assumptions: [
      "Payment/platform fees modeled as a single percentage of the sale price — adjust to match your stack (Shopify ~2.9% + plan, marketplace 10–15%).",
      "Refunds, chargebacks and VAT/sales tax are not included — budget an extra 3–8% for them in real operations.",
    ],
    sources: [
      { label: "Shopify pricing", url: "https://www.shopify.com/pricing" },
    ],
    sections: [
      {
        heading: "Why most dropshippers miscalculate margin",
        paragraphs: [
          "The classic mistake is pricing '3x over product cost' and calling the difference profit. On a $39.99 sale with a $12 product, $4 shipping, 3% payment fees and $10 of ads, the real profit is $12.79 — a 32% margin, not the 70% markup suggests. Ad spend is a cost of goods in dropshipping, full stop.",
          "Run the calculator with your actual CPA, not your target CPA. Meta and TikTok ad accounts almost always report a better number than your blended cost per actual purchase once you include creative testing and learning-phase spend.",
        ],
      },
      {
        heading: "The two numbers that decide if a product works",
        paragraphs: [
          "Break-even ROAS tells you the minimum ad performance required: if it's 4x and your account historically delivers 2.5x, the product fails no matter how good the creative is. Most viable dropshipping products have a break-even ROAS under 3x.",
          "Max CPA is the ceiling for what you can pay per acquisition. If it's $12 and the ad platform wants $18 per purchase, your only moves are raising price, lowering product cost, or increasing average order value with bundles and upsells.",
        ],
      },
      {
        heading: "Raising margin without raising price",
        paragraphs: [
          "Negotiate supplier pricing after your first ~100 orders — a $1–2 reduction drops straight to profit. Offer quantity bundles (buy 2 save 15%) to raise order value against a fixed CPA. And trim app/subscription costs — on a store doing 50 orders/month, a $30 app costs $0.60 of every sale.",
        ],
      },
    ],
    faq: [
      {
        q: "What is a good profit margin for dropshipping?",
        a: "15–25% net margin after product, shipping, fees and ad spend is sustainable. Under 10% leaves no room for refunds, price tests or ad volatility.",
      },
      {
        q: "What ROAS do I need to be profitable?",
        a: "It depends on your costs — that's the break-even ROAS. If you sell at $40 with $17 of product+shipping+fees, you break even at 1.74x and profit above it. Use the calculator with your real numbers.",
      },
      {
        q: "Should shipping be free in dropshipping?",
        a: "'Free shipping' isn't free — it's priced in. What matters is the total the customer pays versus your total costs. Test both; conversion usually favors free shipping with a higher price.",
      },
      {
        q: "Is dropshipping still profitable in 2026?",
        a: "Yes, but the easy generic-product era is over. Margins come from niche products, negotiated supplier terms, and creatives that lower CPA — the math above is what separates stores that work from stores that burn ad spend.",
      },
    ],
    related: [
      "shopify-profit-calculator",
      "break-even-calculator",
      "etsy-profit-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "amazon-fba-fee-calculator",
    vertical: "marketplaces",
    name: "Amazon FBA Fee Calculator",
    title: "Amazon FBA Fee Calculator — Referral + Fulfillment Fees",
    seoTitle: "Amazon FBA Fee Calculator 2026 — Real Profit Per Unit",
    description:
      "Calculate your real Amazon FBA profit: referral fees by category, fulfillment fees by size tier, and your net margin per unit.",
    keywords: [
      "amazon fba calculator",
      "fba fee calculator",
      "amazon referral fee",
      "amazon seller profit calculator",
      "fulfillment fee amazon",
    ],
    fields: [
      {
        key: "price",
        label: "Sale price",
        type: "number",
        default: 29.99,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "productCost",
        label: "Product cost (landed)",
        type: "number",
        default: 8,
        min: 0,
        step: 0.01,
        prefix: "$",
        help: "Unit cost + inbound shipping to Amazon.",
      },
      {
        key: "category",
        label: "Category referral fee",
        type: "select",
        default: "most",
        options: [
          { value: "most", label: "Most categories — 15%" },
          { value: "apparel", label: "Clothing & accessories — 17%" },
          { value: "electronics", label: "Electronics / computers — 8%" },
          { value: "beauty", label: "Beauty — 8% (<$10) / 15%" },
        ],
      },
      {
        key: "size",
        label: "Size tier (fulfillment fee)",
        type: "select",
        default: "small",
        options: [
          { value: "small", label: "Small standard (≤16 oz) — ~$3.50" },
          { value: "large", label: "Large standard (≤3 lb) — ~$5.40" },
          { value: "bulky", label: "Large bulky — ~$11.00" },
          { value: "xl", label: "Extra large — ~$15.00" },
        ],
        help: "Approximate per-unit FBA fulfillment fee by size/weight tier.",
      },
      {
        key: "units",
        label: "Units per month",
        type: "number",
        default: 100,
        min: 1,
        step: 1,
      },
    ],
    compute: (v) => {
      const price = Number(v.price) || 0;
      const cost = Number(v.productCost) || 0;
      const referralPcts: Record<string, number> = {
        most: 15,
        apparel: 17,
        electronics: 8,
        beauty: price < 10 ? 8 : 15,
      };
      const rp = referralPcts[String(v.category)] ?? 15;
      const fulfill: Record<string, number> = {
        small: 3.5,
        large: 5.4,
        bulky: 11,
        xl: 15,
      };
      const fba = fulfill[String(v.size)] ?? 3.5;
      const referral = (price * rp) / 100;
      const fees = referral + fba;
      const profit = price - cost - fees;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      const roi = cost > 0 ? (profit / cost) * 100 : 0;
      const units = Math.max(0, Number(v.units) || 0);
      return [
        { label: "Referral fee", value: money(referral), tone: "bad" },
        { label: "FBA fulfillment fee", value: money(fba), tone: "bad" },
        {
          label: "Net profit per unit",
          value: money(profit),
          tone: profit >= 0 ? "good" : "bad",
        },
        {
          label: "Margin / ROI on cost",
          value: `${pct(margin, 1)} / ${pct(roi, 0)}`,
        },
        {
          label: "Profit per month",
          value: money(profit * units),
          tone: "primary",
          hint: `${units.toLocaleString("en-US")} units`,
        },
      ];
    },
    assumptions: [
      "Referral fee modeled by category — most categories 15%, apparel 17%, electronics 8%, beauty 8% under $10.",
      "FBA fulfillment fees are approximate per size tier and change with rate cards — verify against Amazon's current fee schedule.",
      "Storage fees (~$0.87/cu ft monthly, higher Oct–Dec), inbound placement, returns processing and the $39.99 Professional plan fee are not included.",
    ],
    sources: [
      { label: "Amazon selling fees", url: "https://sell.amazon.com/pricing" },
      {
        label: "FBA fulfillment fees",
        url: "https://sell.amazon.com/fulfillment-by-amazon/pricing",
      },
    ],
    sections: [
      {
        heading: "The two fees that decide if an FBA product works",
        paragraphs: [
          "Amazon takes its cut in two places: the referral fee (usually 15% of the sale price) and the FBA fulfillment fee (a flat per-unit charge by size and weight). On a $29.99 product in a standard category that's roughly $4.50 referral plus ~$5.40 fulfillment — nearly $10 gone before your product cost.",
          "The brutal implication for cheap products: a $9.99 item pays the same ~$5 fulfillment fee as a $30 item. FBA economics strongly favor the $25–70 price range — expensive enough to absorb fixed fulfillment cost, cheap enough for impulse purchase.",
        ],
      },
      {
        heading: "What this calculator leaves out (on purpose)",
        paragraphs: [
          "The modeled fees are the big two, but the real stack includes monthly storage (peaks in Q4), inbound placement fees, removal/disposal fees and returns processing — budget another 5–10% of revenue for them. Experienced sellers run this calculator first for the margin sanity check, then plug the survivors into Amazon's own Revenue Calculator for the full fee stack.",
        ],
      },
      {
        heading: "FBA vs eBay vs your own store",
        paragraphs: [
          "At ~25–35% all-in take rate, FBA is the most expensive mainstream channel — and often still the most profitable because Amazon's conversion rate and Prime reach are unmatched. The winning pattern for most sellers is FBA for volume + own site (Shopify) for margin on repeat customers who already know the brand.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Amazon FBA take per sale?",
        a: "Typically 30–40% all-in for standard products: ~15% referral fee plus $3.50–15+ fulfillment fee depending on size, before storage and other charges.",
      },
      {
        q: "What is the Amazon referral fee?",
        a: "Amazon's commission on every sale — 15% of the item price in most categories, ranging from 6% (personal computers) to 45%+ (Amazon device accessories).",
      },
      {
        q: "What price range works best for FBA?",
        a: "$25–70 is the classic sweet spot: high enough that fixed fulfillment fees don't destroy the margin, low enough for impulse buying.",
      },
      {
        q: "Is FBA still worth it in 2026?",
        a: "For differentiated products, yes — the fees buy Prime eligibility and Amazon's unmatched conversion. For generic reselling, the margin math almost never works anymore.",
      },
    ],
    related: [
      "etsy-profit-calculator",
      "shopify-profit-calculator",
      "dropshipping-margin-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "poshmark-fee-calculator",
    vertical: "marketplaces",
    name: "Poshmark Fee Calculator",
    title: "Poshmark Fee Calculator — $2.95 or 20%? What You Keep",
    seoTitle: "Poshmark Fee Calculator — Seller Fees Explained",
    description:
      "Calculate Poshmark's selling fee — flat $2.95 under $15 or 20% at $15+ — plus your earnings and the effective take rate.",
    keywords: [
      "poshmark fee calculator",
      "poshmark fees",
      "how much does poshmark take",
      "poshmark seller earnings",
      "poshmark commission",
    ],
    fields: [
      {
        key: "price",
        label: "Sale price",
        type: "number",
        default: 25,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "shippingOffer",
        label: "Shipping discount you offer",
        type: "number",
        default: 0,
        min: 0,
        step: 0.5,
        prefix: "$",
        help: "Optional — comes out of your earnings, not the buyer's.",
      },
    ],
    compute: (v) => {
      const price = Number(v.price) || 0;
      const fee = price < 15 ? 2.95 : price * 0.2;
      const shipDiscount = Math.min(price, Number(v.shippingOffer) || 0);
      const net = Math.max(0, price - fee - shipDiscount);
      const effective = price > 0 ? ((fee + shipDiscount) / price) * 100 : 0;
      return [
        { label: "Poshmark fee", value: money(fee), tone: "bad" },
        { label: "Shipping offer cost", value: money(shipDiscount) },
        { label: "You earn", value: money(net), tone: "good" },
        {
          label: "Effective take rate",
          value: pct(effective, 1),
          tone: "primary",
        },
      ];
    },
    assumptions: [
      "Poshmark fee: $2.95 flat on sales under $15, 20% on sales of $15 or more.",
      "Buyers normally pay shipping — discounted/free shipping offers deduct from your earnings.",
      "No listing fees and no separate payment processing fee.",
    ],
    sources: [
      {
        label: "Poshmark selling fees",
        url: "https://support.poshmark.com/s/article/776851129",
      },
    ],
    sections: [
      {
        heading: "The $15 cliff that changes your pricing",
        paragraphs: [
          "Poshmark's fee has a hard edge: $14.99 costs you $2.95, but $15.00 costs you $3.00 — and at $20 it's already $4.00. The percentage model means cheap items are relatively better deals for sellers: a $12 sale loses 24.6% while a $100 sale loses exactly 20%.",
          "There's a subtler cliff too: pricing at $14 vs $15 barely changes your take ($11.05 vs $12.00), but from $15 upward the 20% rate makes every extra dollar of price worth only $0.80 to you. Bundling several low-value items into one $25+ listing is the standard move to escape the flat-fee zone.",
        ],
      },
      {
        heading: "Poshmark vs eBay vs Depop on clothing",
        paragraphs: [
          "At 20%, Poshmark is the most expensive mainstream resale channel — eBay takes ~14% all-in, Depop 10% + processing, Mercari around 10–13%. What the premium buys: Poshmark's engaged closet-share community and prepaid flat-rate shipping. For items with real Poshmark liquidity (mall brands, mid-tier fashion) it often still nets more because items actually sell — the cheapest platform is worthless if the item sits for six months.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Poshmark take from a sale?",
        a: "$2.95 flat for sales under $15, or 20% for sales of $15 and over. There are no listing or payment processing fees on top.",
      },
      {
        q: "What do I keep from a $30 Poshmark sale?",
        a: "$24.00 — Poshmark takes 20% ($6.00). If you offered a shipping discount, subtract that too.",
      },
      {
        q: "Does the buyer pay shipping on Poshmark?",
        a: "Normally yes — buyers pay a flat label fee. If you make a shipping offer (discounted or free), the difference comes out of your earnings.",
      },
      {
        q: "Is selling on Poshmark worth it with 20% fees?",
        a: "For brands Poshmark's audience actually buys, yes — conversion matters more than fee rate. For items that also sell fast on eBay or Depop, the 6–10% lower fees win.",
      },
    ],
    related: [
      "ebay-fee-calculator",
      "depop-fee-calculator",
      "etsy-profit-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "depop-fee-calculator",
    vertical: "marketplaces",
    name: "Depop Fee Calculator",
    title: "Depop Fee Calculator — 10% Selling Fee + Processing",
    seoTitle: "Depop Fee Calculator — What Sellers Actually Keep",
    description:
      "Calculate Depop's 10% selling fee plus payment processing on any sale — see your real payout and effective take rate.",
    keywords: [
      "depop fee calculator",
      "depop fees",
      "how much does depop take",
      "depop selling fee",
      "depop seller earnings",
    ],
    fields: [
      {
        key: "price",
        label: "Sale price",
        type: "number",
        default: 30,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "shippingCharged",
        label: "Shipping charged to buyer",
        type: "number",
        default: 0,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "shippingCost",
        label: "Your actual shipping cost",
        type: "number",
        default: 4.5,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
    ],
    compute: (v) => {
      const price = Number(v.price) || 0;
      const shipCharged = Number(v.shippingCharged) || 0;
      const shipCost = Number(v.shippingCost) || 0;
      const total = price + shipCharged;
      const sellingFee = total * 0.1;
      const processing = total * 0.033 + 0.45;
      const fees = sellingFee + processing + shipCost;
      const net = total - fees;
      return [
        {
          label: "Depop selling fee (10%)",
          value: money(sellingFee),
          tone: "bad",
        },
        { label: "Payment processing", value: money(processing), tone: "bad" },
        { label: "Shipping cost", value: money(shipCost) },
        { label: "Your payout", value: money(net), tone: "good" },
        {
          label: "Effective take rate",
          value: pct(total > 0 ? (fees / total) * 100 : 0, 1),
          tone: "primary",
        },
      ];
    },
    assumptions: [
      "Depop selling fee: 10% of the total transaction including shipping charged to the buyer.",
      "Depop Payments processing approximated at 3.3% + $0.45 (US); rates vary slightly by country.",
      "Optional boosting fee (8% on boosted sales) is not included.",
    ],
    sources: [
      {
        label: "Depop selling fees",
        url: "https://depophelp.zendesk.com/hc/en-gb/articles/360000108188",
      },
    ],
    sections: [
      {
        heading: "Depop's real take is ~14–18%, not 10%",
        paragraphs: [
          "The headline 10% selling fee hides the second layer: payment processing around 3.3% + $0.45. On a $30 sale that's $3.00 + $1.44 — a $4.44 total, or 14.8% of the transaction. On smaller items the fixed $0.45 pushes it further: a $10 vintage tee loses over 17% before shipping.",
          "The fee also applies to shipping you charge buyers — charging $6 shipping means $0.60 of it goes to Depop, plus processing on the full amount. 'Free shipping' priced into the item doesn't dodge the fee, it just changes where it shows.",
        ],
      },
      {
        heading: "Depop vs Poshmark for secondhand fashion",
        paragraphs: [
          "Depop's ~14% all-in take beats Poshmark's flat 20% meaningfully on most price points, and its audience skews younger (Y2K, streetwear, vintage). Poshmark wins on structured shipping and closet-share mechanics for mall brands. Serious resellers cross-list everything and let sell-through decide — the fee difference is real but secondary to where your specific items move faster.",
        ],
      },
      {
        heading: "The boosting trade-off",
        paragraphs: [
          "Depop's Boosted Listings add 8% on attributed sales — stacking onto the ~14% base take. On a thin-margin item that's the difference between profit and break-even. Boost selectively on stale inventory where 8% beats another month unsold, not as a default.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Depop take from a sale?",
        a: "10% of the total transaction (item + shipping charged) plus payment processing around 3.3% + $0.45 — roughly 14–18% all-in depending on price.",
      },
      {
        q: "Does Depop charge to list items?",
        a: "No — listing is free. You pay the 10% + processing only when an item sells.",
      },
      {
        q: "What is Depop's boosting fee?",
        a: "Optional promoted placement at 8% of the transaction total, charged only when the sale is attributed to the boost.",
      },
      {
        q: "Depop or Poshmark — which has lower fees?",
        a: "Depop: ~14% all-in. Poshmark: flat 20% (or $2.95 under $15). Depop is cheaper for most price points; Poshmark often moves mid-tier brands faster.",
      },
    ],
    related: [
      "poshmark-fee-calculator",
      "ebay-fee-calculator",
      "etsy-profit-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "discount-calculator",
    vertical: "marketplaces",
    name: "Discount Calculator",
    title: "Discount Calculator — Sale Price & Total Savings",
    seoTitle: "Discount Calculator — % Off, Sale Price & Savings",
    description:
      "Calculate the sale price after any discount percent — see final price, amount saved, and what stacking a second discount does.",
    keywords: [
      "discount calculator",
      "percent off calculator",
      "sale price calculator",
      "how much is x percent off",
      "discount price",
    ],
    fields: [
      {
        key: "price",
        label: "Original price",
        type: "number",
        default: 80,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "discount",
        label: "Discount",
        type: "number",
        default: 25,
        min: 0,
        max: 100,
        step: 1,
        suffix: "%",
      },
      {
        key: "extra",
        label: "Extra discount (stacked)",
        type: "number",
        default: 0,
        min: 0,
        max: 100,
        step: 1,
        suffix: "%",
        help: "Second discount applied after the first — e.g. extra 10% off sale items.",
      },
    ],
    compute: (v) => {
      const price = Number(v.price) || 0;
      const d1 = Math.min(100, Math.max(0, Number(v.discount) || 0)) / 100;
      const d2 = Math.min(100, Math.max(0, Number(v.extra) || 0)) / 100;
      const afterFirst = price * (1 - d1);
      const final = afterFirst * (1 - d2);
      const saved = price - final;
      const effective = price > 0 ? (saved / price) * 100 : 0;
      return [
        { label: "Final price", value: money(final), tone: "primary" },
        { label: "You save", value: money(saved), tone: "good" },
        {
          label: "Effective discount",
          value: pct(effective, 1),
          hint:
            d2 > 0
              ? "stacked discounts are multiplicative, not additive"
              : undefined,
        },
        { label: "Price after first discount", value: money(afterFirst) },
      ];
    },
    assumptions: [
      "Stacked discounts apply sequentially — 20% + 10% off means ×0.8 ×0.9 = 28% off, not 30%.",
      "Sales tax applies to the discounted price in most jurisdictions and is not included.",
    ],
    sources: [],
    sections: [
      {
        heading: "Stacked discounts multiply — they never add",
        paragraphs: [
          "The most common checkout misconception: '30% off plus an extra 20% off' is not 50% off. The second discount applies to the already-reduced price: $100 → $80 → $64, an effective 36% off. Retailers know this — 'extra 20% off sale items' sounds bigger than it is.",
          "The math: effective discount = 1 − (1−d₁)(1−d₂). Three stacked 20% discounts give 48.8% off total, not 60%.",
        ],
      },
      {
        heading: "The seller's side of the discount",
        paragraphs: [
          "Discounts come straight out of margin, not revenue. A 25% discount on a product with 30% margin leaves 5% — you're working nearly free. The discount 'trap' math: to earn the same profit at 25% off, you need to sell ~66% more units. Run the margin calculator alongside this one before scheduling a sale.",
        ],
      },
      {
        heading: "The pricing trick that makes discounts legal",
        paragraphs: [
          "Ever notice how 'was $199, now $79' items are never sold at $199? In most jurisdictions the 'was' price must have been genuinely offered recently — but the rules get stretched constantly. If you're the buyer, compare the final price across stores, not the percent off; if you're the seller, fake anchor prices are an actual legal risk, not a growth hack.",
        ],
      },
    ],
    faq: [
      {
        q: "How do you calculate 25% off a price?",
        a: "Multiply the price by 0.75 (1 − 0.25). $80 at 25% off = $60. The discount amount is price × 0.25.",
      },
      {
        q: "Is 30% off + 20% off the same as 50% off?",
        a: "No — stacked discounts multiply: 30% then 20% off = ×0.7 ×0.8 = 56% remaining, i.e. 44% off, not 50%.",
      },
      {
        q: "How much is 40% off $50?",
        a: "$30 — you save $20.",
      },
      {
        q: "What is the formula for discounted price?",
        a: "Final price = original × (1 − discount%). For a stack: original × (1−d₁) × (1−d₂).",
      },
    ],
    related: [
      "margin-calculator",
      "sales-tax-calculator",
      "etsy-profit-calculator",
    ],
    updatedAt: "2026-10-18",
  },
  {
    slug: "etsy-vs-shopify-calculator",
    vertical: "marketplaces",
    name: "Etsy vs Shopify Calculator",
    title: "Etsy vs Shopify Calculator — Which Costs You Less?",
    seoTitle: "Etsy vs Shopify Fee Comparison Calculator 2026",
    description:
      "Compare real costs: Etsy's fee stack vs Shopify's plan + processing at your price and volume — see the break-even point.",
    keywords: [
      "etsy vs shopify",
      "etsy or shopify fees",
      "shopify vs etsy cost",
      "sell on etsy or shopify",
      "etsy vs own website",
    ],
    fields: [
      {
        key: "price",
        label: "Average item price",
        type: "number",
        default: 30,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "orders",
        label: "Orders per month",
        type: "number",
        default: 50,
        min: 1,
        step: 5,
      },
      {
        key: "shipping",
        label: "Shipping charged per order",
        type: "number",
        default: 4,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
    ],
    compute: (v) => {
      const price = Number(v.price) || 0;
      const orders = Math.max(1, Number(v.orders) || 0);
      const ship = Number(v.shipping) || 0;
      const orderTotal = price + ship;
      // Etsy per order: $0.20 listing + 6.5% transaction + 3% + $0.25 processing
      const etsyPerOrder = 0.2 + orderTotal * 0.065 + orderTotal * 0.03 + 0.25;
      const etsyMonthly = etsyPerOrder * orders;
      // Shopify Basic: $39 plan + 2.9% + $0.30 processing (shopify payments, no transaction fee)
      const shopifyPerOrder = orderTotal * 0.029 + 0.3;
      const shopifyMonthly = 39 + shopifyPerOrder * orders;
      const diff = etsyMonthly - shopifyMonthly;
      const revenue = orderTotal * orders;
      // Break-even orders: etsyPer*x = 39 + shopifyPer*x → x = 39/(etsyPer-shopifyPer)
      const delta = etsyPerOrder - shopifyPerOrder;
      const breakeven = delta > 0 ? 39 / delta : Infinity;
      return [
        {
          label: "Etsy cost per order",
          value: money(etsyPerOrder),
          tone: "bad",
        },
        { label: "Etsy monthly total", value: money(etsyMonthly) },
        {
          label: "Shopify cost per order",
          value: money(shopifyPerOrder),
          tone: "bad",
        },
        { label: "Shopify monthly total", value: money(shopifyMonthly) },
        {
          label: diff > 0 ? "Shopify saves you" : "Etsy is cheaper by",
          value: money(Math.abs(diff)),
          tone: "primary",
          hint: `on ${money0(revenue)} monthly revenue`,
        },
        {
          label: "Break-even volume",
          value:
            delta > 0
              ? `${Math.ceil(breakeven)} orders/mo`
              : "Etsy always cheaper",
          hint: "where Shopify's flat $39 plan pays for itself",
        },
      ];
    },
    assumptions: [
      "Etsy: $0.20 listing + 6.5% transaction + 3% + $0.25 processing (US), per order. Offsite Ads not included.",
      "Shopify: Basic plan $39/mo + Shopify Payments 2.9% + $0.30. Apps, theme and marketing costs not included.",
      "The comparison ignores the biggest difference: Etsy brings buyers, Shopify requires your own traffic.",
    ],
    sources: [
      { label: "Etsy fees", url: "https://www.etsy.com/legal/fees/" },
      { label: "Shopify pricing", url: "https://www.shopify.com/pricing" },
    ],
    sections: [
      {
        heading: "The fee math — and why it isn't the real question",
        paragraphs: [
          "On pure costs the comparison is mechanical: Etsy charges ~9.5% + $0.45 per order (listing + transaction + processing) with no monthly fee. Shopify charges $39/month plus ~3% + $0.30 per order. Etsy's higher percentage breaks even against Shopify's flat fee at roughly 60–90 orders/month depending on order value — below that, Etsy is mathematically cheaper.",
          "But the honest framing: you're not comparing two fee structures, you're buying two different products. Etsy's fee includes a marketplace of 90M+ buyers already searching for what you make. Shopify's $39 buys a shop with zero built-in traffic — every visitor costs you ads, SEO or social effort.",
        ],
      },
      {
        heading: "When each one actually wins",
        paragraphs: [
          "Etsy wins when: you're testing products, you have under ~80 orders/month, or your items fit Etsy's search-driven niches (crafts, vintage, personalized, digital). Shopify wins when: you have an audience, repeat customers buy direct, you're past break-even volume, or you need brand control Etsy's template can't give.",
          "The pattern most successful sellers land on: Etsy for discovery and validation → Shopify running in parallel → repeat customers get nudged to the owned site where the ~10% Etsy cut becomes margin again. It's not either/or; it's sequence.",
        ],
      },
      {
        heading: "The hidden costs the calculator can't show",
        paragraphs: [
          "Etsy's hidden costs: Offsite Ads taking 12–15% on attributed sales, review volatility affecting search ranking, and policy risk — one suspension and the revenue stops cold. Shopify's hidden costs: apps ($30–200/month for a real store), the email marketing stack, and the customer acquisition cost that replaces Etsy's free traffic. Price both realities, not both rate cards.",
        ],
      },
    ],
    faq: [
      {
        q: "Is it cheaper to sell on Etsy or Shopify?",
        a: "Etsy is cheaper below roughly 60–90 orders/month (no fixed fee). Above that, Shopify's flat $39 + lower per-order fees usually wins — but Shopify requires you to bring your own traffic.",
      },
      {
        q: "What are Etsy's total fees per sale?",
        a: "About 9.5% + $0.45 per order: $0.20 listing, 6.5% transaction, 3% + $0.25 processing — before optional Offsite Ads (12–15%).",
      },
      {
        q: "Can I sell on both Etsy and Shopify?",
        a: "Yes — most established sellers do. Etsy handles discovery, Shopify handles repeat customers and brand. Tools like Square/ecomdash sync inventory across both.",
      },
      {
        q: "When should I move from Etsy to Shopify?",
        a: "When you have repeat customers who'd buy direct, consistent volume past ~80 orders/month, and at least one traffic channel (email list, social, SEO) to replace Etsy's marketplace.",
      },
    ],
    related: [
      "etsy-profit-calculator",
      "shopify-profit-calculator",
      "break-even-calculator",
    ],
    updatedAt: "2026-10-18",
  },
];
