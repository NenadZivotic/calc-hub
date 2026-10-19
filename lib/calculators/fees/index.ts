import type { CalculatorDef } from "../types";
import { money, money0, pct } from "../../format";

const stripeRates: Record<
  string,
  { label: string; p: number; fixed: number; note: string }
> = {
  domestic: {
    label: "Domestic card (US) — 2.9% + $0.30",
    p: 2.9,
    fixed: 0.3,
    note: "Standard online card rate for US-issued cards.",
  },
  international: {
    label: "International card — 4.4% + $0.30",
    p: 4.4,
    fixed: 0.3,
    note: "Domestic rate plus the 1.5% international card surcharge.",
  },
  intlConversion: {
    label: "International + currency conversion — 5.4% + $0.30",
    p: 5.4,
    fixed: 0.3,
    note: "Adds a further 1% when a currency conversion is required.",
  },
  ach: {
    label: "ACH direct debit — 0.8% (capped at $5)",
    p: 0.8,
    fixed: 0,
    note: "US bank debit; fee is capped at $5.00 per transaction.",
  },
};

export const feesCalculators: CalculatorDef[] = [
  {
    slug: "stripe-fee-calculator",
    vertical: "fees",
    name: "Stripe Fee Calculator",
    title: "Stripe Fee Calculator — How Much Does Stripe Take?",
    seoTitle: "Stripe Fee Calculator 2026 — Exact Fees Per Transaction",
    description:
      "Calculate the exact Stripe fee on any transaction — domestic cards, international cards, currency conversion and ACH — plus your monthly totals.",
    keywords: [
      "stripe fee calculator",
      "stripe fees",
      "how much does stripe charge",
      "stripe processing fee",
      "stripe international fee",
    ],
    fields: [
      {
        key: "amount",
        label: "Transaction amount",
        type: "number",
        default: 100,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "txns",
        label: "Transactions per month",
        type: "number",
        default: 100,
        min: 1,
        step: 1,
      },
      {
        key: "chargeType",
        label: "Charge type",
        type: "select",
        default: "domestic",
        options: Object.entries(stripeRates).map(([value, r]) => ({
          value,
          label: r.label,
        })),
        help: "Pick the option that matches how your customer pays.",
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const txns = Math.max(0, Number(v.txns) || 0);
      const rate = stripeRates[String(v.chargeType)] ?? stripeRates.domestic;
      let fee = (amount * rate.p) / 100 + rate.fixed;
      if (String(v.chargeType) === "ach") fee = Math.min(fee, 5);
      const net = Math.max(0, amount - fee);
      const effective = amount > 0 ? (fee / amount) * 100 : 0;
      return [
        { label: "Stripe fee per transaction", value: money(fee), tone: "bad" },
        {
          label: "You receive per transaction",
          value: money(net),
          tone: "good",
        },
        { label: "Effective fee rate", value: pct(effective) },
        {
          label: "Total fees per month",
          value: money(fee * txns),
          tone: "bad",
        },
        {
          label: "You receive per month",
          value: money(net * txns),
          tone: "primary",
          hint: `${txns.toLocaleString("en-US")} transactions`,
        },
      ];
    },
    assumptions: [
      "US online card pricing: 2.9% + $0.30 per successful domestic charge.",
      "International cards add 1.5%; currency conversion adds a further 1%.",
      "ACH direct debit is 0.8% capped at $5.00.",
      "Rates are the published pay-as-you-go prices — volume discounts and custom pricing are not included.",
    ],
    sources: [
      { label: "Stripe pricing", url: "https://stripe.com/pricing" },
      {
        label: "Stripe international cards",
        url: "https://stripe.com/pricing/local-payment-methods",
      },
    ],
    sections: [
      {
        heading: "How Stripe pricing actually works",
        paragraphs: [
          "Stripe's headline rate in the US is 2.9% + $0.30 per successful online card charge. The fixed 30 cents matters more than most people realize: on a $5 transaction the effective rate is 8.9%, not 2.9%. If you sell low-priced items, the fixed fee — not the percentage — is what eats your margin.",
          "Two surcharges quietly raise the cost of international sales. Cards issued outside the US add 1.5%, and if Stripe has to convert currency it adds another 1%. A European customer paying in euros on a US account can therefore cost 5.4% + $0.30 — nearly double the headline rate.",
        ],
      },
      {
        heading: "Ways to pay less",
        paragraphs: [
          "If you bill US customers, ACH direct debit is the cheapest rail by far at 0.8% capped at $5 — a $1,000 invoice costs $5 via ACH versus $29.30 by card. It settles slower, but for B2B invoices the savings are dramatic.",
          "Businesses processing over roughly $100k/month can negotiate interchange-plus pricing with Stripe sales, which typically saves 20–40% versus the flat rate. Below that volume, the simplest saving is charging in your customers' local currency only when it improves conversion enough to justify the 1% conversion fee.",
        ],
      },
      {
        heading: "Stripe vs PayPal on fees",
        paragraphs: [
          "On standard US online transactions Stripe (2.9% + $0.30) is cheaper than PayPal (3.49% + $0.49) at almost every ticket size. On a $50 sale Stripe takes $1.75 while PayPal takes $2.24. PayPal stays relevant mainly for conversion: some buyers complete checkout more often when a PayPal button is present, which can outweigh the higher fee.",
        ],
      },
    ],
    faq: [
      {
        q: "What percentage does Stripe take in the US?",
        a: "2.9% + $0.30 per successful online domestic card charge. In-person (Terminal) payments are cheaper at 2.7% + $0.05.",
      },
      {
        q: "How much is Stripe's international fee?",
        a: "International cards add 1.5% (total 4.4% + $0.30). If currency conversion is needed, add another 1% for 5.4% + $0.30 total.",
      },
      {
        q: "Does Stripe refund fees on refunds?",
        a: "No. When you refund a charge, the customer gets their money back but Stripe keeps the original processing fee.",
      },
      {
        q: "Is ACH cheaper than cards on Stripe?",
        a: "Yes — 0.8% capped at $5. A $2,000 payment costs $5 via ACH versus about $58 by credit card.",
      },
    ],
    related: [
      "paypal-fee-calculator",
      "shopify-profit-calculator",
      "etsy-profit-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "paypal-fee-calculator",
    vertical: "fees",
    name: "PayPal Fee Calculator",
    title: "PayPal Fee Calculator — Seller Fees Per Transaction",
    seoTitle: "PayPal Fee Calculator 2026 — Exact Seller Fees",
    description:
      "Calculate PayPal seller fees on any transaction — domestic, international and micropayment rates — and see what you actually keep.",
    keywords: [
      "paypal fee calculator",
      "paypal seller fees",
      "how much does paypal charge",
      "paypal international fee",
      "paypal goods and services fee",
    ],
    fields: [
      {
        key: "amount",
        label: "Transaction amount",
        type: "number",
        default: 100,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "txns",
        label: "Transactions per month",
        type: "number",
        default: 50,
        min: 1,
        step: 1,
      },
      {
        key: "rate",
        label: "Payment type",
        type: "select",
        default: "domestic",
        options: [
          { value: "domestic", label: "US domestic online — 3.49% + $0.49" },
          { value: "international", label: "International — 4.99% + $0.49" },
          { value: "micro", label: "Micropayments — 4.99% + $0.09" },
          { value: "inperson", label: "In-person / QR — 2.29% + $0.09" },
        ],
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const txns = Math.max(0, Number(v.txns) || 0);
      const rates: Record<string, { p: number; f: number }> = {
        domestic: { p: 3.49, f: 0.49 },
        international: { p: 4.99, f: 0.49 },
        micro: { p: 4.99, f: 0.09 },
        inperson: { p: 2.29, f: 0.09 },
      };
      const r = rates[String(v.rate)] ?? rates.domestic;
      const fee = (amount * r.p) / 100 + r.f;
      const net = Math.max(0, amount - fee);
      const effective = amount > 0 ? (fee / amount) * 100 : 0;
      return [
        { label: "PayPal fee per transaction", value: money(fee), tone: "bad" },
        {
          label: "You receive per transaction",
          value: money(net),
          tone: "good",
        },
        { label: "Effective fee rate", value: pct(effective) },
        {
          label: "Total fees per month",
          value: money(fee * txns),
          tone: "bad",
        },
        {
          label: "You receive per month",
          value: money(net * txns),
          tone: "primary",
        },
      ];
    },
    assumptions: [
      "US commercial (goods & services) online rate: 3.49% + $0.49.",
      "International commercial transactions add ~1.5% over the domestic rate.",
      "Micropayments (for items typically under $10): 4.99% + $0.09.",
      "Friends & family transfers are excluded — they carry different or no fees.",
    ],
    sources: [
      {
        label: "PayPal merchant fees",
        url: "https://www.paypal.com/us/business/fees",
      },
    ],
    sections: [
      {
        heading: "Why PayPal's $0.49 fixed fee hurts small sales",
        paragraphs: [
          "PayPal's standard online rate in the US is 3.49% + $0.49 — a higher percentage and a higher fixed fee than Stripe. The fixed component dominates on small tickets: on a $3 digital download PayPal keeps $0.59, an effective rate of almost 20%.",
          "If your average order is under about $10, apply for PayPal's micropayments rate (4.99% + $0.09). The percentage is higher but the nine-cent fixed fee means a $3 sale costs $0.24 instead of $0.59 — a 60% saving. You have to request it; it is not the default.",
        ],
      },
      {
        heading: "International sales and currency conversion",
        paragraphs: [
          "Cross-border commercial payments add roughly 1.5% on top of the domestic rate, bringing you to about 4.99% + fixed fee. On top of that, PayPal's currency conversion spread is typically 3–4% above the mid-market rate — noticeably worse than Stripe's flat 1% conversion fee.",
          "If a meaningful share of your revenue is international, this is where the real cost hides. Holding balances in the currencies you receive and withdrawing through a service with a better exchange rate can recover several percentage points.",
        ],
      },
      {
        heading: "When PayPal is worth the higher fee",
        paragraphs: [
          "PayPal's fee is higher than Stripe's at almost every ticket size, but checkout conversion often improves when buyers see a familiar PayPal button — especially on mobile and for first-time customers. Many stores run both: Stripe as the primary processor and PayPal as an express option.",
        ],
      },
    ],
    faq: [
      {
        q: "What is PayPal's fee for receiving money for goods and services?",
        a: "In the US, 3.49% + $0.49 per online commercial transaction. Friends & family payments use different rules.",
      },
      {
        q: "What is PayPal's international transaction fee?",
        a: "Roughly 4.99% + $0.49 — the domestic rate plus about a 1.5% cross-border surcharge, before any currency conversion spread.",
      },
      {
        q: "Does PayPal charge a monthly fee?",
        a: "No monthly fee for a standard business account. PayPal Payments Pro (advanced checkout) costs $30/month.",
      },
      {
        q: "What are PayPal micropayments?",
        a: "A special rate — 4.99% + $0.09 — for merchants selling low-priced items. You must apply for it on a separate rate agreement.",
      },
    ],
    related: [
      "stripe-fee-calculator",
      "etsy-profit-calculator",
      "ebay-fee-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "square-fee-calculator",
    vertical: "fees",
    name: "Square Fee Calculator",
    title: "Square Fee Calculator — In-Person & Online Rates",
    seoTitle: "Square Fee Calculator 2026 — POS, Online & Invoice Fees",
    description:
      "Calculate Square processing fees for in-person, online, keyed-in and invoice transactions — see your net per sale and per month.",
    keywords: [
      "square fee calculator",
      "square processing fees",
      "square pos fee",
      "square online fee",
      "how much does square charge",
    ],
    fields: [
      {
        key: "amount",
        label: "Transaction amount",
        type: "number",
        default: 50,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "txns",
        label: "Transactions per month",
        type: "number",
        default: 200,
        min: 1,
        step: 1,
      },
      {
        key: "method",
        label: "Payment method",
        type: "select",
        default: "inperson",
        options: [
          {
            value: "inperson",
            label: "In-person (tap/dip/swipe) — 2.6% + $0.15",
          },
          { value: "online", label: "Online checkout — 2.9% + $0.30" },
          { value: "invoice", label: "Invoice (card) — 3.3% + $0.30" },
          { value: "keyed", label: "Keyed-in / card on file — 3.5% + $0.15" },
        ],
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const txns = Math.max(0, Number(v.txns) || 0);
      const rates: Record<string, { p: number; f: number }> = {
        inperson: { p: 2.6, f: 0.15 },
        online: { p: 2.9, f: 0.3 },
        invoice: { p: 3.3, f: 0.3 },
        keyed: { p: 3.5, f: 0.15 },
      };
      const r = rates[String(v.method)] ?? rates.inperson;
      const fee = (amount * r.p) / 100 + r.f;
      const net = Math.max(0, amount - fee);
      const effective = amount > 0 ? (fee / amount) * 100 : 0;
      return [
        { label: "Square fee per transaction", value: money(fee), tone: "bad" },
        {
          label: "You receive per transaction",
          value: money(net),
          tone: "good",
        },
        { label: "Effective fee rate", value: pct(effective) },
        {
          label: "Total fees per month",
          value: money(fee * txns),
          tone: "bad",
        },
        {
          label: "You receive per month",
          value: money(net * txns),
          tone: "primary",
        },
      ];
    },
    assumptions: [
      "US standard pricing: in-person 2.6% + $0.15, online 2.9% + $0.30, invoices 3.3% + $0.30, keyed/card-on-file 3.5% + $0.15.",
      "Free plan rates shown — paid Square subscriptions (Retail, Restaurants Plus) lower some rates.",
      "Chargebacks on Square are typically free of dispute fees, unlike most processors.",
    ],
    sources: [
      { label: "Square pricing", url: "https://squareup.com/us/en/pricing" },
    ],
    sections: [
      {
        heading: "Square's rates are simple — the mix is what matters",
        paragraphs: [
          "Square charges a single flat rate per payment method: 2.6% + $0.15 for in-person payments, 2.9% + $0.30 online, 3.3% + $0.30 on invoices and 3.5% + $0.15 for keyed-in or card-on-file charges. No monthly fee on the free plan — which is why the blended rate across your actual payment mix is the number that matters, not any single rate.",
          "The 15-cent fixed fee on in-person payments is unusually low (Stripe charges 5¢, most processors charge 25–30¢). For businesses with small average tickets — coffee, bakery items, market stalls — that difference is the entire comparison: on a $5 sale Square takes $0.28 while a typical 2.9% + $0.30 processor takes $0.45.",
        ],
      },
      {
        heading: "Keyed-in and card-on-file are the margin killers",
        paragraphs: [
          "Every manually-entered card number costs 3.5% — nearly a full percentage point above in-person rates. Businesses that take orders by phone feel this hard: on $10,000/month of keyed transactions that's an extra $90 versus tap-and-dip. If phone orders are a real channel, invoicing at 3.3% or sending a payment link is cheaper than keying.",
        ],
      },
      {
        heading: "When Square beats Stripe — and when it doesn't",
        paragraphs: [
          "For physical businesses Square's free POS hardware/software bundle plus 2.6% in-person rate is hard to beat below ~$20k/month. Online-only businesses usually do better with Stripe (same 2.9% + $0.30 but better developer tooling) or ACH. The real answer for omnichannel sellers is often Square in store, Stripe online — run both calculators with your actual numbers.",
        ],
      },
    ],
    faq: [
      {
        q: "What percentage does Square take per transaction?",
        a: "2.6% + $0.15 in-person, 2.9% + $0.30 online, 3.3% + $0.30 on invoices, and 3.5% + $0.15 for keyed-in or card-on-file payments.",
      },
      {
        q: "Is there a monthly fee for Square?",
        a: "No monthly fee on the standard plan — you only pay per transaction. Paid plans (Square Plus etc.) add monthly fees but lower some processing rates.",
      },
      {
        q: "Does Square charge for chargebacks?",
        a: "No — Square doesn't charge a dispute fee, which is unusual among payment processors and a real saving for dispute-prone businesses.",
      },
      {
        q: "Square vs Stripe — which is cheaper?",
        a: "For in-person sales Square wins (2.6% + $0.15 vs Stripe Terminal's 2.7% + $0.05 on most tickets). Online they're nearly identical on rate — choose on tooling, not price.",
      },
    ],
    related: [
      "stripe-fee-calculator",
      "paypal-fee-calculator",
      "etsy-profit-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "wise-fee-calculator",
    vertical: "fees",
    name: "Wise Fee Calculator",
    title: "Wise Fee Calculator — Real Cost of Sending Money Abroad",
    seoTitle: "Wise Fee Calculator — Transfer Fees & Exchange Cost",
    description:
      "Calculate what Wise actually charges on your transfer — the fixed fee, the variable percentage, and what arrives on the other side.",
    keywords: [
      "wise fee calculator",
      "wise transfer fees",
      "wise exchange rate markup",
      "transferwise fees",
      "wise cost to send money",
    ],
    fields: [
      {
        key: "amount",
        label: "Amount you send",
        type: "number",
        default: 1000,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "route",
        label: "Route",
        type: "select",
        default: "usd_eur",
        options: [
          { value: "usd_eur", label: "USD → EUR (~0.65% + $0.40)" },
          { value: "usd_gbp", label: "USD → GBP (~0.60% + $0.40)" },
          { value: "usd_inr", label: "USD → INR (~0.90% + $1.30)" },
          { value: "eur_usd", label: "EUR → USD (~0.60% + €0.35)" },
          { value: "usd_php", label: "USD → PHP (~1.10% + $1.10)" },
          { value: "usd_brl", label: "USD → BRL (~1.40% + $1.60)" },
        ],
        help: "Wise fees vary by currency corridor — popular routes are cheaper.",
      },
      {
        key: "funding",
        label: "You pay by",
        type: "select",
        default: "bank",
        options: [
          { value: "bank", label: "Bank transfer / ACH (cheapest)" },
          { value: "debit", label: "Debit card (+~1.15%)" },
          { value: "credit", label: "Credit card (+~4.4%)" },
          { value: "wire", label: "Wire (+$4–6 fixed)" },
        ],
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const routes: Record<string, { pctFee: number; fixed: number }> = {
        usd_eur: { pctFee: 0.0065, fixed: 0.4 },
        usd_gbp: { pctFee: 0.006, fixed: 0.4 },
        usd_inr: { pctFee: 0.009, fixed: 1.3 },
        eur_usd: { pctFee: 0.006, fixed: 0.35 },
        usd_php: { pctFee: 0.011, fixed: 1.1 },
        usd_brl: { pctFee: 0.014, fixed: 1.6 },
      };
      const r = routes[String(v.route)] ?? routes.usd_eur;
      let fee = amount * r.pctFee + r.fixed;
      const funding = String(v.funding);
      if (funding === "debit") fee += amount * 0.0115;
      if (funding === "credit") fee += amount * 0.044;
      if (funding === "wire") fee += 4.14;
      const received = Math.max(0, amount - fee);
      const effPct = amount > 0 ? (fee / amount) * 100 : 0;
      const bankWireEquiv = 35 + amount * 0.02;
      return [
        { label: "Wise fee", value: money(fee), tone: "bad" },
        { label: "Recipient gets", value: money(received), tone: "primary" },
        { label: "Effective cost", value: pct(effPct, 2) },
        {
          label: "vs typical bank wire",
          value: money(bankWireEquiv),
          hint: "$35 wire fee + ~2% FX markup — what banks usually charge",
          tone: "bad",
        },
      ];
    },
    assumptions: [
      "Approximate 2025–26 Wise pricing: mid-market exchange rate (no markup) plus a corridor-specific fee — typically 0.4–1.5% + a small fixed amount.",
      "Card funding adds ~1.15% (debit) or ~4.4% (credit) — bank/ACH funding is cheapest.",
      "Exact fees are shown by Wise before you send and vary by route and payment method.",
    ],
    sources: [{ label: "Wise pricing", url: "https://wise.com/pricing/" }],
    sections: [
      {
        heading:
          "Why Wise is usually the cheapest way to move money across borders",
        paragraphs: [
          "Banks hide the cost of international transfers in the exchange rate: a 'free' wire typically uses a rate 2–4% worse than mid-market — on $1,000 that's $20–40 of invisible fees, on top of the $25–45 wire charge. Wise's model is the opposite: real mid-market rate, fee shown upfront — typically 0.4–1.5% depending on the corridor.",
          "That structural difference is why Wise almost always beats banks on cost, and why comparing 'fees' between banks and Wise is misleading — the bank's real fee lives inside the rate.",
        ],
      },
      {
        heading: "How you fund the transfer changes the price dramatically",
        paragraphs: [
          "Bank transfer or ACH is the baseline — the percentages above assume it. Paying by debit card adds roughly 1.15%, by credit card roughly 4.4% (plus your card's own cash-advance or foreign-transaction fees, which can double it). On a $1,000 transfer, funding by credit card instead of bank adds ~$45 — more than the entire Wise fee.",
        ],
      },
      {
        heading: "Where Wise isn't the answer",
        paragraphs: [
          "For very large transfers ($10k+), dedicated FX brokers (OFX, Currencies Direct) sometimes beat Wise's percentage with negotiated flat rates. For receiving regular freelance/client payments, compare against Payoneer (often cheaper for marketplace payouts) and direct EUR/USD multi-currency accounts — Wise's strength is mid-size occasional transfers, not high-volume payroll.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Wise charge to send $1,000?",
        a: "Roughly $6–7 on major routes (USD→EUR/GBP) funded by bank transfer — about 0.65%. Exotic corridors run 1–1.5%, and card funding adds 1–4.4% on top.",
      },
      {
        q: "Does Wise use the real exchange rate?",
        a: "Yes — Wise converts at the mid-market rate and charges a transparent fee on top, unlike banks which embed 2–4% in a marked-up rate.",
      },
      {
        q: "Is Wise cheaper than a bank wire?",
        a: "Almost always for amounts under ~$10k. A bank wire's true cost is the $25–45 fee plus a 2–4% FX markup — often 3–5% total vs Wise's ~0.6%.",
      },
      {
        q: "How long does a Wise transfer take?",
        a: "Minutes to 2 business days depending on the corridor and funding method — card-funded transfers are fastest, bank-funded cheapest.",
      },
    ],
    related: [
      "payoneer-fee-calculator",
      "paypal-fee-calculator",
      "stripe-fee-calculator",
    ],
    updatedAt: "2026-10-18",
  },
  {
    slug: "payoneer-fee-calculator",
    vertical: "fees",
    name: "Payoneer Fee Calculator",
    title: "Payoneer Fee Calculator — Receiving & Withdrawal Costs",
    seoTitle: "Payoneer Fee Calculator — Real Cost to Get Paid",
    description:
      "Calculate Payoneer's real cost: receiving payments from clients and marketplaces, currency conversion markup, and withdrawing to your bank.",
    keywords: [
      "payoneer fees",
      "payoneer fee calculator",
      "payoneer withdrawal fees",
      "payoneer currency conversion",
      "payoneer vs paypal",
    ],
    fields: [
      {
        key: "amount",
        label: "Amount you receive",
        type: "number",
        default: 1000,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "source",
        label: "Money comes from",
        type: "select",
        default: "marketplace",
        options: [
          { value: "marketplace", label: "Marketplace (Upwork, Amazon…)" },
          { value: "payoneer_user", label: "Another Payoneer user" },
          {
            value: "client_direct",
            label: "Client payment request (~1% ACH / 3.99% card)",
          },
        ],
      },
      {
        key: "withdraw",
        label: "Withdraw as",
        type: "select",
        default: "fx",
        options: [
          { value: "fx", label: "Different currency (~2% FX markup)" },
          { value: "same", label: "Same currency ($1.50 fixed)" },
          { value: "atm", label: "Payoneer card ATM (~$3.15 + FX)" },
        ],
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      let receiveFee = 0;
      if (String(v.source) === "client_direct") receiveFee = amount * 0.0399;
      const net = amount - receiveFee;
      let withdrawFee = 0;
      let withdrawLabel = "";
      if (String(v.withdraw) === "fx") {
        withdrawFee = net * 0.02;
        withdrawLabel = "2% FX conversion markup";
      } else if (String(v.withdraw) === "same") {
        withdrawFee = 1.5;
        withdrawLabel = "$1.50 same-currency withdrawal";
      } else {
        withdrawFee = 3.15 + net * 0.02;
        withdrawLabel = "ATM fee + ~2% FX";
      }
      const total = receiveFee + withdrawFee;
      const landed = Math.max(0, net - withdrawFee);
      const effPct = amount > 0 ? (total / amount) * 100 : 0;
      return [
        { label: "Receiving fee", value: money(receiveFee), tone: "bad" },
        {
          label: "Withdrawal cost",
          value: money(withdrawFee),
          hint: withdrawLabel,
          tone: "bad",
        },
        { label: "Lands in your bank", value: money(landed), tone: "primary" },
        { label: "Effective total cost", value: pct(effPct, 2) },
      ];
    },
    assumptions: [
      "Receiving from marketplaces (Upwork, Amazon, Fiverr) and other Payoneer users is typically free; client card payments cost ~3.99%, ACH ~1%.",
      "Withdrawing to a different currency costs ~2% over the mid-market rate; same-currency withdrawals cost ~$1.50.",
      "Annual account fee of $29.95 applies only if the account receives under $2,000 in 12 months.",
    ],
    sources: [
      { label: "Payoneer fees", url: "https://www.payoneer.com/legal/fees/" },
    ],
    sections: [
      {
        heading: "The fee is in the currency conversion, not the receiving",
        paragraphs: [
          "Payoneer's headline is accurate: receiving from Upwork, Amazon, Fiverr and other partner marketplaces is genuinely free. The cost appears at the exit — withdrawing USD to a EUR/GBP/local-currency bank account costs roughly 2% over mid-market. On a $1,000 monthly payout that's ~$240 a year — real money, but typically still cheaper than PayPal's ~4% conversion markup for the same job.",
        ],
      },
      {
        heading: "The same-currency trick that cuts the cost to $1.50",
        paragraphs: [
          "If you have access to a USD bank account (a US account, or a USD account at a local bank), withdrawing same-currency costs a flat ~$1.50 — the 2% markup disappears entirely. Freelancers who earn in USD but spend in another currency can then convert once at a better rate (Wise, Revolut, or a broker) — often saving 1–1.5% per payout.",
        ],
      },
      {
        heading: "Watch the inactivity fee and the client-payment pricing",
        paragraphs: [
          "Two gotchas: accounts that receive under $2,000 in 12 months get charged $29.95 annually, and requesting payment directly from a client costs ~3.99% for cards (not free like marketplace payouts) — for direct client invoicing, compare against Wise Business or direct bank transfer first.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does Payoneer charge to receive money?",
        a: "Usually nothing from partner marketplaces (Upwork, Amazon, Fiverr) and other Payoneer users. Direct client card payments cost ~3.99%, ACH ~1%.",
      },
      {
        q: "What is Payoneer's withdrawal fee?",
        a: "~2% when converting to a different currency, a flat ~$1.50 for same-currency withdrawals, and ~$3.15 plus FX for ATM withdrawals.",
      },
      {
        q: "Payoneer vs PayPal — which is cheaper for freelancers?",
        a: "Payoneer for marketplace payouts and international withdrawals (~2% total vs PayPal's ~4–5% with conversion). PayPal is better only when the client insists on paying that way.",
      },
      {
        q: "Does Payoneer have a monthly fee?",
        a: "No monthly fee, but a $29.95 annual fee applies if the account receives under $2,000 in a 12-month period.",
      },
    ],
    related: [
      "wise-fee-calculator",
      "paypal-fee-calculator",
      "upwork-fee-calculator",
    ],
    updatedAt: "2026-10-18",
  },
  {
    slug: "paypal-vs-stripe-calculator",
    vertical: "fees",
    name: "PayPal vs Stripe Calculator",
    title: "PayPal vs Stripe Calculator — Which Processor Costs Less?",
    seoTitle: "PayPal vs Stripe Fees Compared — Monthly Cost Calculator",
    description:
      "Compare PayPal and Stripe processing costs at your ticket size and volume — see which is cheaper for your business and by how much.",
    keywords: [
      "paypal vs stripe",
      "paypal or stripe fees",
      "stripe vs paypal cost",
      "paypal vs stripe for small business",
      "payment processor comparison",
    ],
    fields: [
      {
        key: "ticket",
        label: "Average transaction",
        type: "number",
        default: 50,
        min: 0,
        step: 1,
        prefix: "$",
      },
      {
        key: "volume",
        label: "Transactions per month",
        type: "number",
        default: 100,
        min: 1,
        step: 5,
      },
      {
        key: "intl",
        label: "International share",
        type: "number",
        default: 15,
        min: 0,
        max: 100,
        step: 5,
        suffix: "%",
        help: "Share of transactions from international cards — both charge +1.5%.",
      },
    ],
    compute: (v) => {
      const ticket = Number(v.ticket) || 0;
      const volume = Math.max(1, Number(v.volume) || 0);
      const intl = Math.min(100, Math.max(0, Number(v.intl) || 0)) / 100;
      // Stripe: 2.9% + $0.30 domestic; +1.5% intl
      const stripePer = ticket * (0.029 + intl * 0.015) + 0.3;
      // PayPal: 3.49% + $0.49 domestic online; +1.5% intl
      const paypalPer = ticket * (0.0349 + intl * 0.015) + 0.49;
      const stripeMonth = stripePer * volume;
      const paypalMonth = paypalPer * volume;
      const diff = paypalMonth - stripeMonth;
      const revenue = ticket * volume;
      return [
        {
          label: "Stripe cost / transaction",
          value: money(stripePer),
          tone: "bad",
        },
        {
          label: "PayPal cost / transaction",
          value: money(paypalPer),
          tone: "bad",
        },
        { label: "Stripe monthly", value: money(stripeMonth) },
        { label: "PayPal monthly", value: money(paypalMonth) },
        {
          label: diff > 0 ? "Stripe saves you" : "PayPal saves you",
          value: money(Math.abs(diff)),
          tone: "primary",
          hint: `per month on ${money0(revenue)} volume — ${money(Math.abs(diff) * 12)}/yr`,
        },
      ];
    },
    assumptions: [
      "Stripe online: 2.9% + $0.30. PayPal online checkout: 3.49% + $0.49. International cards add ~1.5% on both.",
      "Micropayment pricing (PayPal 4.99% + $0.09, Stripe 5% + $0.05) isn't modeled — it wins under ~$12 tickets on PayPal.",
      "Chargebacks: Stripe $15 refundable, PayPal $20 non-refundable. Currency conversion adds ~1% (Stripe) to ~4% (PayPal) when it applies.",
    ],
    sources: [
      { label: "Stripe pricing", url: "https://stripe.com/pricing" },
      { label: "PayPal fees", url: "https://www.paypal.com/us/business/fees" },
    ],
    sections: [
      {
        heading: "The standard-rate gap is real but not dramatic",
        paragraphs: [
          "At headline rates — Stripe 2.9% + $0.30 vs PayPal 3.49% + $0.49 — Stripe wins on essentially every ticket size. On a $50 transaction it's $1.75 vs $2.24; at 100 transactions/month that's ~$590 a year. The bigger the ticket, the wider the percentage gap bites.",
          "But PayPal isn't in the checkout for its rate — it's there because a meaningful share of buyers only convert when they see the PayPal button. The question is rarely either/or: most stores run Stripe as primary processor with PayPal as an additional option, because a lost sale costs 100%, not 0.6%.",
        ],
      },
      {
        heading: "Where each one actually wins",
        paragraphs: [
          "Stripe wins on: raw rates, developer tooling, subscriptions, international payouts, and transparent fee handling (fee refunded disputes). PayPal wins on: checkout conversion with PayPal-loyal buyers, built-in buyer trust for unknown brands, micropayments under ~$12 (special rate), and Venmo reach.",
          "The honest answer for most businesses: primary processing on Stripe, PayPal offered as a wallet. Offering both typically lifts conversion more than the extra 0.6% on PayPal-routed transactions costs.",
        ],
      },
      {
        heading: "The fees the rate card doesn't show",
        paragraphs: [
          "PayPal's real cost hides in currency conversion (~4% markup vs Stripe's ~1%) and hold policies — new or 'risky' merchants routinely see 21-day holds and rolling reserves. Stripe's hidden cost is integration effort — you need a checkout, while PayPal works as a standalone button. Dispute fees differ too: Stripe $15 refunded if you win, PayPal ~$20 kept regardless.",
        ],
      },
    ],
    faq: [
      {
        q: "Is Stripe or PayPal cheaper?",
        a: "Stripe, on standard rates: 2.9% + $0.30 vs PayPal's 3.49% + $0.49 — roughly $0.49 cheaper on a $50 sale, before currency conversion where Stripe is also cheaper (~1% vs ~4% markup).",
      },
      {
        q: "Should I offer both Stripe and PayPal?",
        a: "Usually yes — PayPal measurably lifts conversion for buyers who only trust it. The extra ~0.6% cost on those transactions is cheaper than the lost sales.",
      },
      {
        q: "Which is better for international payments?",
        a: "Stripe — it charges ~1% on currency conversion vs PayPal's ~4% markup, and supports local payment methods PayPal lacks.",
      },
      {
        q: "Which is better for small transactions?",
        a: "PayPal micropayments (4.99% + $0.09) wins under ~$12 average ticket — compare against Stripe's standard rate on your exact numbers.",
      },
    ],
    related: [
      "stripe-fee-calculator",
      "paypal-fee-calculator",
      "square-fee-calculator",
    ],
    updatedAt: "2026-10-18",
  },
  {
    slug: "stripe-fees-by-country-calculator",
    vertical: "fees",
    name: "Stripe Fees by Country Calculator",
    title: "Stripe Fees by Country Calculator — Rates Around the World",
    seoTitle: "Stripe Fees by Country — International Rate Calculator",
    description:
      "Stripe's fee depends on where your business is registered. Compare domestic rates across the US, UK, EU, Canada, Australia and more.",
    keywords: [
      "stripe fees by country",
      "stripe fees uk",
      "stripe fees europe",
      "stripe international fees",
      "stripe rates by country",
    ],
    fields: [
      {
        key: "country",
        label: "Business registered in",
        type: "select",
        default: "us",
        options: [
          { value: "us", label: "United States (2.9% + $0.30)" },
          { value: "uk", label: "United Kingdom (1.5% + £0.20)" },
          { value: "eu", label: "EU / Eurozone (1.5% + €0.25)" },
          { value: "ca", label: "Canada (2.9% + $0.30 CAD)" },
          { value: "au", label: "Australia (1.75% + A$0.30)" },
          { value: "nz", label: "New Zealand (2.9% + NZ$0.30)" },
          { value: "sg", label: "Singapore (3.4% + S$0.50)" },
          { value: "mx", label: "Mexico (3.6% + MX$3)" },
          { value: "br", label: "Brazil (3.99% + R$0.39)" },
          { value: "in", label: "India (2% domestic)" },
        ],
      },
      {
        key: "amount",
        label: "Transaction amount",
        type: "number",
        default: 100,
        min: 0,
        step: 1,
        prefix: "$",
      },
      {
        key: "intl",
        label: "International card",
        type: "select",
        default: "no",
        options: [
          { value: "no", label: "No — domestic card" },
          { value: "yes", label: "Yes — card from another country" },
        ],
        help: "International cards typically add ~1.5% on top of the domestic rate.",
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const isIntl = String(v.intl) === "yes";
      // pctRate on top of base; fixed fee in local currency units
      const rates: Record<
        string,
        { pctFee: number; fixed: number; intlAdd: number; note: string }
      > = {
        us: { pctFee: 0.029, fixed: 0.3, intlAdd: 0.015, note: "US domestic" },
        uk: {
          pctFee: 0.015,
          fixed: 0.2,
          intlAdd: 0.0115,
          note: "UK domestic cards — among the cheapest",
        },
        eu: {
          pctFee: 0.015,
          fixed: 0.25,
          intlAdd: 0.0125,
          note: "EEA domestic cards",
        },
        ca: { pctFee: 0.029, fixed: 0.3, intlAdd: 0.015, note: "CAD" },
        au: { pctFee: 0.0175, fixed: 0.3, intlAdd: 0.015, note: "AUD" },
        nz: { pctFee: 0.029, fixed: 0.3, intlAdd: 0.015, note: "NZD" },
        sg: { pctFee: 0.034, fixed: 0.5, intlAdd: 0.015, note: "SGD" },
        mx: { pctFee: 0.036, fixed: 3.0, intlAdd: 0.015, note: "MXN" },
        br: { pctFee: 0.0399, fixed: 0.39, intlAdd: 0.015, note: "BRL" },
        in: {
          pctFee: 0.02,
          fixed: 0,
          intlAdd: 0.02,
          note: "INR domestic; international cards ~3%+",
        },
      };
      const r = rates[String(v.country)] ?? rates.us;
      const pctRate = r.pctFee + (isIntl ? r.intlAdd : 0);
      const fee = amount * pctRate + r.fixed;
      const net = Math.max(0, amount - fee);
      const effPct = amount > 0 ? (fee / amount) * 100 : 0;
      return [
        { label: "Stripe fee", value: money(fee), tone: "bad" },
        { label: "You keep", value: money(net), tone: "primary" },
        { label: "Effective rate", value: pct(effPct, 2) },
        {
          label: "Rate basis",
          value: r.note,
          hint: isIntl ? "+ international card surcharge" : "domestic card",
        },
      ];
    },
    assumptions: [
      "Standard online card rates for Stripe accounts registered in each country — domestic card basis, plus the international-card surcharge where selected.",
      "Local currencies differ — the $ shown is a placeholder for the local currency unit (USD, GBP, EUR, CAD, AUD…).",
      "Currency conversion adds ~1% on top when payout currency differs from charge currency.",
    ],
    sources: [{ label: "Stripe pricing", url: "https://stripe.com/pricing" }],
    sections: [
      {
        heading:
          "Stripe's fee depends on where your business lives — not your customers",
        paragraphs: [
          "The rate card follows your Stripe account's country of registration. A UK-registered business pays 1.5% + £0.20 on domestic cards, a US one pays 2.9% + $0.30, a Singapore one pays 3.4% + S$0.50. On identical $100,000 annual volume, that's a $1,400+ difference between the UK and Singapore rate cards.",
          "This is why 'how much does Stripe take' has no single answer — the country the account is registered in sets the domestic rate, and the customer's card location then adds an international surcharge (typically 1.5%) on top.",
        ],
      },
      {
        heading: "The international surcharge is the silent multiplier",
        paragraphs: [
          "Sell globally from a US account and roughly every non-US card adds 1.5%, plus ~1% more if the charge currency must be converted for payout. A European customer paying a US store can trigger ~4.4% total effective fees — approaching PayPal territory. Businesses with heavy international mix sometimes open regional Stripe accounts (US + EU) specifically to keep transactions 'domestic' on each side.",
        ],
      },
      {
        heading: "Why UK/EU rates are so much lower",
        paragraphs: [
          "European interchange is capped by regulation — domestic consumer cards can't exceed 0.2% (debit) / 0.3% (credit), so Stripe's 1.5% rate is almost pure margin anyway. US interchange has no such cap (rewards cards run 2%+), which is why the US rate is nearly double. Same product, different regulatory floor.",
        ],
      },
    ],
    faq: [
      {
        q: "What are Stripe fees in the UK?",
        a: "1.5% + £0.20 for domestic UK cards — among the cheapest Stripe rates worldwide thanks to EU-era interchange caps. International cards add ~1.15%.",
      },
      {
        q: "Does Stripe charge more for international cards?",
        a: "Yes — typically +1.5% on cards issued outside your account's country, plus ~1% more if currency conversion is involved.",
      },
      {
        q: "Which country has the cheapest Stripe fees?",
        a: "UK and EU accounts have the lowest domestic rates (~1.5% + fixed) because interchange is regulated there. India's domestic rate is also low (~2%).",
      },
      {
        q: "Can I pick which country's Stripe fees I pay?",
        a: "Your rate is set by the country where the Stripe account — and the business entity behind it — is legally registered. Registering abroad just for lower fees means forming a real entity there.",
      },
    ],
    related: [
      "stripe-fee-calculator",
      "paypal-vs-stripe-calculator",
      "wise-fee-calculator",
    ],
    updatedAt: "2026-10-19",
  },
  {
    slug: "paypal-vs-wise-calculator",
    vertical: "fees",
    name: "PayPal vs Wise Calculator",
    title:
      "PayPal vs Wise Calculator — Cheapest Way to Get Paid Internationally",
    seoTitle: "PayPal vs Wise Fees Compared — International Payments",
    description:
      "Compare the real cost of receiving an international payment through PayPal vs Wise — including the currency-conversion markup most people miss.",
    keywords: [
      "paypal vs wise",
      "wise vs paypal fees",
      "paypal international fees",
      "wise vs paypal for freelancers",
      "cheapest way to receive international payment",
    ],
    fields: [
      {
        key: "amount",
        label: "Amount you're paid",
        type: "number",
        default: 1000,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "convert",
        label: "Need currency conversion?",
        type: "select",
        default: "yes",
        options: [
          {
            value: "yes",
            label: "Yes — paid in one currency, spend in another",
          },
          { value: "no", label: "No — same currency end to end" },
        ],
        help: "Conversion is where most of the difference hides.",
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const needsFx = String(v.convert) === "yes";
      // PayPal commercial payment ~3.49% + fixed, plus ~4% FX markup when converting
      const paypalFee = amount * 0.0349 + 0.49 + (needsFx ? amount * 0.04 : 0);
      // Wise receive + convert ~0.65% + small fixed
      const wiseFee = amount * 0.0065 + 0.4 + (needsFx ? 0 : amount * 0.01);
      const diff = paypalFee - wiseFee;
      return [
        { label: "PayPal total cost", value: money(paypalFee), tone: "bad" },
        { label: "Wise total cost", value: money(wiseFee), tone: "bad" },
        {
          label: "Wise saves you",
          value: money(Math.max(0, diff)),
          tone: "primary",
          hint:
            diff > 0
              ? `${money(diff * 12)}/yr on monthly payments like this`
              : undefined,
        },
        {
          label: "Effective cost — PayPal",
          value: pct(amount > 0 ? (paypalFee / amount) * 100 : 0, 2),
        },
        {
          label: "Effective cost — Wise",
          value: pct(amount > 0 ? (wiseFee / amount) * 100 : 0, 2),
        },
      ];
    },
    assumptions: [
      "PayPal commercial payment: ~3.49% + $0.49, plus a ~4% currency-conversion markup when converting — the dominant cost.",
      "Wise: ~0.65% + $0.40 typical corridor fee, mid-market exchange rate. Same-currency Wise payouts cost more than shown if you skip the multi-currency account.",
      "Both figures are approximations — PayPal's markup varies by currency pair and Wise's by corridor.",
    ],
    sources: [
      { label: "Wise pricing", url: "https://wise.com/pricing/" },
      { label: "PayPal fees", url: "https://www.paypal.com/us/business/fees" },
    ],
    sections: [
      {
        heading: "The conversion markup is where the money goes",
        paragraphs: [
          "On the rate card PayPal's ~3.5% and Wise's ~0.65% already differ, but the gap explodes when a currency conversion is involved. PayPal converts at roughly 4% over the mid-market rate; Wise converts at mid-market with the fee shown separately. On a $1,000 international payment with conversion, PayPal takes roughly $75 vs Wise's ~$7 — a tenfold difference.",
          "This is the single largest avoidable cost in freelance cross-border payments, and it's invisible because PayPal shows 'no conversion fee' — the markup lives inside the exchange rate itself.",
        ],
      },
      {
        heading: "Same currency changes the picture",
        paragraphs: [
          "If the payment arrives and stays in the same currency (a USD client paying your USD balance), PayPal's ~3.5% is still ~5× Wise's ~0.65% — but without the FX markup the absolute gap shrinks. Wise's real dominance is in the conversion path, which is why its multi-currency account (receive USD/EUR/GBP into local bank details, convert when you choose) is the standard freelancer stack.",
        ],
      },
      {
        heading: "When PayPal still makes sense",
        paragraphs: [
          "PayPal wins when the client insists on paying that way (many companies simply won't onboard Wise), when you need instant checkout integration, or for tiny payments where Wise's fixed fee matters more than the percentage. The rational setup for freelancers: offer Wise/bank transfer as the default, PayPal as the fallback for clients who require it — and price the ~7% PayPal cost into the invoice if you can.",
        ],
      },
    ],
    faq: [
      {
        q: "Is Wise cheaper than PayPal for international payments?",
        a: "Dramatically — roughly 0.65% vs ~7.5% total when currency conversion is involved, because PayPal embeds ~4% in its exchange rate on top of its processing fee.",
      },
      {
        q: "How does PayPal charge for currency conversion?",
        a: "Not as a line item — PayPal applies an exchange rate ~4% worse than mid-market. A $1,000 USD→EUR payment loses ~$40 to the rate itself.",
      },
      {
        q: "Can I receive USD into Wise?",
        a: "Yes — a Wise account gives you local bank details (USD, EUR, GBP and more), so clients pay a domestic transfer and you convert at mid-market when you want.",
      },
      {
        q: "Wise vs PayPal for freelancers — which should I offer?",
        a: "Wise/bank transfer as the default (you keep ~7% more per invoice), PayPal as the fallback for clients who won't use anything else.",
      },
    ],
    related: [
      "wise-fee-calculator",
      "paypal-fee-calculator",
      "payoneer-fee-calculator",
    ],
    updatedAt: "2026-10-19",
  },
];
