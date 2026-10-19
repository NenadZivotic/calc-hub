import type { CalculatorDef } from "../types";
import { money, money0, num, pct } from "../../format";

const vatRates: Record<string, { label: string; rate: number }> = {
  uk: { label: "United Kingdom — 20%", rate: 0.2 },
  de: { label: "Germany — 19%", rate: 0.19 },
  fr: { label: "France — 20%", rate: 0.2 },
  it: { label: "Italy — 22%", rate: 0.22 },
  es: { label: "Spain — 21%", rate: 0.21 },
  nl: { label: "Netherlands — 21%", rate: 0.21 },
  pl: { label: "Poland — 23%", rate: 0.23 },
  ie: { label: "Ireland — 23%", rate: 0.23 },
  pt: { label: "Portugal — 23%", rate: 0.23 },
  gr: { label: "Greece — 24%", rate: 0.24 },
  se: { label: "Sweden — 25%", rate: 0.25 },
  hr: { label: "Croatia — 25%", rate: 0.25 },
  hu: { label: "Hungary — 27%", rate: 0.27 },
  rs: { label: "Serbia — 20%", rate: 0.2 },
};

export const financeCalculators: CalculatorDef[] = [
  {
    slug: "break-even-calculator",
    vertical: "finance",
    name: "Break-Even Calculator",
    title: "Break-Even Calculator — Units & Revenue to Cover Costs",
    seoTitle: "Break-Even Calculator — Find Your Break-Even Point",
    description:
      "Calculate your break-even point in units and revenue from fixed costs, price and variable cost per unit — plus contribution margin.",
    keywords: [
      "break even calculator",
      "break even point",
      "contribution margin calculator",
      "fixed costs calculator",
      "breakeven analysis",
    ],
    fields: [
      {
        key: "fixed",
        label: "Fixed costs per month",
        type: "number",
        default: 5000,
        min: 0,
        step: 100,
        prefix: "$",
        help: "Rent, salaries, software — costs that don't scale with sales.",
      },
      {
        key: "price",
        label: "Price per unit",
        type: "number",
        default: 50,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "variable",
        label: "Variable cost per unit",
        type: "number",
        default: 20,
        min: 0,
        step: 0.01,
        prefix: "$",
        help: "What each unit costs you: product, shipping, payment fees.",
      },
    ],
    compute: (v) => {
      const fixed = Number(v.fixed) || 0;
      const price = Number(v.price) || 0;
      const variable = Number(v.variable) || 0;
      const cm = price - variable;
      const cmPct = price > 0 ? (cm / price) * 100 : 0;
      if (cm <= 0) {
        return [
          {
            label: "Contribution margin",
            value: money(cm),
            tone: "bad",
            hint: "price minus variable cost is not positive",
          },
          {
            label: "Break-even units",
            value: "Never",
            tone: "bad",
            hint: "you lose money on every unit sold — raise price or cut variable cost",
          },
        ];
      }
      const units = fixed / cm;
      return [
        {
          label: "Contribution margin",
          value: `${money(cm)} (${pct(cmPct, 1)})`,
          hint: "what each unit contributes toward fixed costs",
        },
        {
          label: "Break-even units / month",
          value: num(Math.ceil(units)),
          tone: "primary",
        },
        {
          label: "Break-even revenue / month",
          value: money0(units * price),
          tone: "primary",
        },
        {
          label: "Profit at 2× break-even",
          value: money0(units * cm),
          hint: `selling ${num(Math.ceil(units * 2))} units`,
        },
      ];
    },
    assumptions: [
      "Fixed costs are constant per period regardless of volume.",
      "Variable costs scale linearly with units sold.",
      "Single product / blended average margin — for multiple products, use your average unit economics.",
    ],
    sources: [],
    sections: [
      {
        heading: "The one number that runs the whole business",
        paragraphs: [
          "Break-even analysis compresses your entire business model into one sentence: 'I must sell N units a month just to keep the lights on.' Everything above N is profit; everything below is loss funded by your runway.",
          "With $5,000 of monthly fixed costs and a $30 contribution margin, break-even is 167 units — about 6 units a day. Whether that's easy or impossible tells you more about your business than any motivational metric.",
        ],
      },
      {
        heading: "Contribution margin is where games are won",
        paragraphs: [
          "The contribution margin — price minus variable cost — is what each sale actually contributes to the business. A $50 product with $20 of product cost, $6 shipping and $1.50 of payment fees has a real margin of $22.50, not $30. Count every per-unit cost or you'll 'break even' while bleeding cash.",
          "This is also why cheap products are structurally hard: at a $5 contribution margin you need 1,000 units to cover $5,000 of fixed costs. High margins buy you a business that works at realistic volumes.",
        ],
      },
      {
        heading: "Three levers to lower break-even",
        paragraphs: [
          "Cut fixed costs (the cleanest lever — every dollar removed lowers break-even permanently), raise price (more powerful than it looks: a $5 price increase on a $30 margin drops break-even by 17%), or cut variable costs (supplier negotiation, cheaper shipping). Marketing scales volume but doesn't move the point — fix the math before you scale it.",
        ],
      },
    ],
    faq: [
      {
        q: "How do you calculate the break-even point?",
        a: "Break-even units = fixed costs ÷ (price − variable cost per unit). That denominator — the contribution margin — is what each unit contributes to covering fixed costs.",
      },
      {
        q: "What is a good contribution margin?",
        a: "It depends on the business, but as a rule: the higher your fixed costs, the bigger your margin must be. Software runs 70–90%; physical products often 30–60%.",
      },
      {
        q: "What if my price equals my variable cost?",
        a: "Then each unit contributes nothing toward fixed costs and break-even is infinite — you lose money on every sale no matter the volume. Raise price or cut variable cost.",
      },
      {
        q: "Is break-even per month or total?",
        a: "Either works — just keep the period consistent. If fixed costs are monthly, the result is units per month.",
      },
    ],
    related: [
      "dropshipping-margin-calculator",
      "saas-ltv-cac-calculator",
      "freelance-rate-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "vat-calculator",
    vertical: "finance",
    name: "VAT Calculator",
    title: "VAT Calculator — Add or Remove VAT by Country",
    seoTitle: "VAT Calculator — Add & Remove VAT (All EU Rates + UK)",
    description:
      "Add VAT to a net price or strip VAT out of a gross price — standard rates for the UK, EU and Serbia.",
    keywords: [
      "vat calculator",
      "add vat",
      "remove vat",
      "vat inclusive price",
      "eu vat rates",
    ],
    fields: [
      {
        key: "amount",
        label: "Amount",
        type: "number",
        default: 100,
        min: 0,
        step: 0.01,
      },
      {
        key: "mode",
        label: "Direction",
        type: "select",
        default: "add",
        options: [
          { value: "add", label: "Add VAT (net → gross)" },
          { value: "remove", label: "Remove VAT (gross → net)" },
        ],
      },
      {
        key: "country",
        label: "Country / rate",
        type: "select",
        default: "uk",
        options: Object.entries(vatRates).map(([value, c]) => ({
          value,
          label: c.label,
        })),
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const country = vatRates[String(v.country)] ?? vatRates.uk;
      const r = country.rate;
      if (String(v.mode) === "add") {
        const vat = amount * r;
        return [
          { label: "Net amount", value: money(amount) },
          { label: `VAT (${pct(r * 100, 0)})`, value: money(vat), tone: "bad" },
          {
            label: "Gross amount",
            value: money(amount + vat),
            tone: "primary",
          },
        ];
      }
      const net = amount / (1 + r);
      return [
        { label: "Gross amount", value: money(amount) },
        {
          label: `VAT (${pct(r * 100, 0)})`,
          value: money(amount - net),
          tone: "bad",
        },
        { label: "Net amount", value: money(net), tone: "primary" },
      ];
    },
    assumptions: [
      "Standard rates only — reduced rates (food, books, medicines) and zero-rated/exempt categories are not covered.",
      "For EU B2C digital sales the customer's country rate applies; B2B cross-border usually reverse-charges at 0%.",
    ],
    sources: [
      {
        label: "EU VAT rates (European Commission)",
        url: "https://taxation-customs.ec.europa.eu/taxation/vat/vat-rules-and-rates_en",
      },
      { label: "UK VAT rates", url: "https://www.gov.uk/vat-rates" },
    ],
    sections: [
      {
        heading: "Add vs remove: the formula people get backwards",
        paragraphs: [
          "Adding VAT is multiplication: net × 1.20 = gross at a 20% rate. Removing it is division, not subtraction — a £120 gross price is £100 net + £20 VAT, and 20% of £120 is £24, not £20. Taking '20% off' a gross price always leaves you short.",
          "The clean version: VAT = gross − gross ÷ (1 + rate). That single line is all the calculator does on 'remove' mode — and it's the formula accountants check your invoices against.",
        ],
      },
      {
        heading: "Which rate applies when you sell across borders",
        paragraphs: [
          "For EU B2C sales of digital goods and services, VAT is owed at the customer's country rate — a German customer pays German VAT on your UK or Serbian product, which is exactly what EU OSS (One-Stop Shop) registration exists to handle.",
          "B2B sales inside the EU generally reverse-charge: you invoice at 0% and the buyer accounts for VAT in their country. Get a valid VAT ID or the exemption doesn't apply — that's the detail that turns 'simple' cross-border invoicing into a tax bill.",
        ],
      },
      {
        heading: "When you're below the registration threshold",
        paragraphs: [
          "Most countries have a registration threshold (UK: £90,000 rolling turnover; EU states vary; the EU-wide SME scheme allows ~€100k) below which you don't charge VAT at all. Staying under it makes your prices 20%+ more competitive — crossing it overnight either raises your prices or eats your margin. Plan the crossing; don't discover it in an accountant's email.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I remove VAT from a price?",
        a: "Divide the gross by (1 + rate). At 20% VAT: net = gross ÷ 1.20, and the VAT portion = gross − net. Never subtract 20% of the gross.",
      },
      {
        q: "What is the standard VAT rate in the EU?",
        a: "It ranges 17–27% by country: Hungary highest at 27%, Luxembourg lowest at 17%. Most large economies sit at 19–22%.",
      },
      {
        q: "Do I charge VAT on exports outside the EU/UK?",
        a: "Generally no — exports are zero-rated. Sales to consumers inside the EU follow the destination country's rate via OSS.",
      },
      {
        q: "Is VAT the same as sales tax?",
        a: "Functionally similar for the buyer, structurally different: VAT is collected at every stage of the supply chain with input credits, US-style sales tax is charged only at the final sale.",
      },
    ],
    related: [
      "break-even-calculator",
      "freelance-rate-calculator",
      "etsy-profit-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "saas-ltv-cac-calculator",
    vertical: "finance",
    name: "SaaS LTV/CAC Calculator",
    title: "SaaS LTV/CAC Calculator — Unit Economics That Survive",
    seoTitle: "SaaS LTV:CAC Calculator — Lifetime Value & Payback",
    description:
      "Calculate customer lifetime value, LTV:CAC ratio and CAC payback months from ARPU, margin, churn and acquisition cost.",
    keywords: [
      "ltv cac calculator",
      "saas ltv calculator",
      "customer lifetime value",
      "cac payback",
      "saas unit economics",
    ],
    fields: [
      {
        key: "arpu",
        label: "ARPU (revenue per user / month)",
        type: "number",
        default: 49,
        min: 0,
        step: 1,
        prefix: "$",
      },
      {
        key: "margin",
        label: "Gross margin",
        type: "number",
        default: 80,
        min: 1,
        max: 100,
        step: 1,
        suffix: "%",
        help: "Revenue minus hosting, support and other cost-to-serve.",
      },
      {
        key: "churn",
        label: "Monthly churn",
        type: "number",
        default: 3,
        min: 0.1,
        max: 50,
        step: 0.1,
        suffix: "%",
      },
      {
        key: "cac",
        label: "CAC (cost to acquire a customer)",
        type: "number",
        default: 150,
        min: 0,
        step: 5,
        prefix: "$",
        help: "Total sales + marketing spend ÷ customers acquired.",
      },
    ],
    compute: (v) => {
      const arpu = Number(v.arpu) || 0;
      const margin = Math.max(1, Number(v.margin) || 0) / 100;
      const churn = Math.max(0.001, (Number(v.churn) || 0) / 100);
      const cac = Number(v.cac) || 0;
      const monthlyProfit = arpu * margin;
      const ltv = monthlyProfit / churn;
      const ratio = cac > 0 ? ltv / cac : Infinity;
      const payback = monthlyProfit > 0 ? cac / monthlyProfit : Infinity;
      const avgLifeMonths = 1 / churn;
      return [
        {
          label: "Customer lifetime value",
          value: money0(ltv),
          tone: "primary",
        },
        {
          label: "LTV : CAC ratio",
          value: cac > 0 ? `${ratio.toFixed(1)} : 1` : "n/a",
          tone: ratio >= 3 ? "good" : "bad",
          hint: "≥3:1 healthy, <3:1 fix economics before scaling",
        },
        {
          label: "CAC payback",
          value: `${payback.toFixed(1)} months`,
          tone: payback <= 12 ? "good" : "bad",
        },
        {
          label: "Average customer lifetime",
          value: `${avgLifeMonths.toFixed(1)} months`,
          hint: `at ${pct(churn * 100, 1)} monthly churn`,
        },
        { label: "Gross profit per user / month", value: money(monthlyProfit) },
      ];
    },
    assumptions: [
      "Simple LTV model: (ARPU × gross margin) ÷ monthly churn. Assumes constant churn and no expansion revenue.",
      "CAC should include all sales & marketing cost — ads, salaries, tools, commissions — divided by new customers in the same period.",
      "Discounting future revenue (present value) is not applied; for long lifetimes real LTV is somewhat lower.",
    ],
    sources: [],
    sections: [
      {
        heading: "The ratio that decides whether you can spend",
        paragraphs: [
          "LTV:CAC answers one question: how many dollars of lifetime gross profit does each dollar of acquisition buy? Below 3:1 the machine loses efficiency — you're paying so much for customers relative to their value that growth burns cash instead of generating it. At 5:1+ you may actually be under-investing in growth.",
          "The classic failure mode: founders celebrate a growing MRR while CAC quietly doubles and LTV stays flat. A ratio drifting from 4:1 toward 2:1 is a business getting worse while looking better.",
        ],
      },
      {
        heading: "Churn is the square on the chessboard",
        paragraphs: [
          "Small churn changes compound brutally. At $49 ARPU and 80% margin, 5% monthly churn gives an LTV of $784. Cut churn to 2.5% and LTV doubles to $1,568 — no new customers, no price increase. Retention is the highest-leverage number in the whole equation.",
          "This is also why monthly-churn products die young: at 10% monthly churn the average customer lives 10 months, so LTV can never exceed ~10 months of margin. You cannot acquire your way out of a leaky bucket.",
        ],
      },
      {
        heading: "Payback period: the cash-flow reality check",
        paragraphs: [
          "LTV:CAC measures eventual value; payback measures when you stop funding it. A 5:1 ratio with a 30-month payback still means every customer is underwater for two and a half years — which is why many profitable-on-paper SaaS companies still run out of cash.",
          "Bootstrap rule of thumb: keep payback under 12 months. Funded companies tolerate more because capital substitutes for cash flow, but the discipline is the same — long paybacks break the moment acquisition slows.",
        ],
      },
    ],
    faq: [
      {
        q: "What is a good LTV:CAC ratio?",
        a: "The industry benchmark is ≥3:1 — each dollar of acquisition should return three dollars of lifetime gross profit. Under 3:1 economics are fragile; over 5:1 you may be under-spending on growth.",
      },
      {
        q: "How is SaaS LTV calculated?",
        a: "LTV = (ARPU × gross margin) ÷ churn rate. With annual churn use the annual form; just keep the period consistent.",
      },
      {
        q: "What is a good CAC payback period?",
        a: "Under 12 months for bootstrapped companies; venture-backed SaaS often tolerates 12–18. Beyond that, growth consumes more cash than it creates.",
      },
      {
        q: "Does LTV include expansion revenue?",
        a: "This model doesn't — it's conservative. Products with strong seat/usage expansion have higher real LTV, which is why net revenue retention above 100% is such a prized metric.",
      },
    ],
    related: [
      "break-even-calculator",
      "dropshipping-margin-calculator",
      "stripe-fee-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "loan-payment-calculator",
    vertical: "finance",
    name: "Loan Payment Calculator",
    title: "Loan Payment Calculator — Monthly Payment & Total Interest",
    seoTitle: "Loan Payment Calculator — EMI, Total Interest & Cost",
    description:
      "Calculate the monthly payment on any loan — plus total interest and the real cost of borrowing over the full term.",
    keywords: [
      "loan payment calculator",
      "monthly payment calculator",
      "loan calculator",
      "emi calculator",
      "total interest calculator",
    ],
    fields: [
      {
        key: "principal",
        label: "Loan amount",
        type: "number",
        default: 25000,
        min: 0,
        step: 500,
        prefix: "$",
      },
      {
        key: "rate",
        label: "Annual interest rate",
        type: "number",
        default: 8.5,
        min: 0,
        max: 50,
        step: 0.1,
        suffix: "%",
      },
      {
        key: "years",
        label: "Term (years)",
        type: "number",
        default: 5,
        min: 0.5,
        max: 40,
        step: 0.5,
      },
    ],
    compute: (v) => {
      const p = Number(v.principal) || 0;
      const r = (Number(v.rate) || 0) / 100 / 12;
      const n = Math.max(1, Math.round((Number(v.years) || 0) * 12));
      const payment =
        r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n;
      const total = payment * n;
      const interest = total - p;
      return [
        { label: "Monthly payment", value: money(payment), tone: "primary" },
        { label: "Total interest paid", value: money(interest), tone: "bad" },
        { label: "Total repaid", value: money(total) },
        {
          label: "Interest as % of loan",
          value: pct(p > 0 ? (interest / p) * 100 : 0, 1),
          hint: `${n} payments over ${Number(v.years) || 0} years`,
        },
      ];
    },
    assumptions: [
      "Standard amortizing loan with fixed monthly payments (M = P·r(1+r)ⁿ ÷ ((1+r)ⁿ−1)).",
      "Origination fees, insurance and early-repayment penalties are not included — check your loan agreement for APR vs nominal rate.",
    ],
    sources: [],
    sections: [
      {
        heading: "The monthly payment is not the price of the loan",
        paragraphs: [
          "Lenders sell the monthly payment; the real price is total interest. A $25,000 loan at 8.5% for 5 years costs $513/month and $5,775 in interest — 23% on top of what you borrowed. Stretch that to 7 years and the payment drops to $396 but interest balloons to $8,300. You paid $117/month less per month and $2,500 more overall.",
          "This is the core trade of loan shopping: monthly affordability versus total cost. The calculator shows both — optimize for the smallest total interest you can still afford monthly.",
        ],
      },
      {
        heading: "Small rate differences compound into real money",
        paragraphs: [
          "Two points on the rate matter more than they look. On $25,000 over 5 years, 6.5% vs 8.5% saves ~$1,300 in interest. On a $300,000 30-year mortgage, 6% vs 7% is a ~$71,000 difference — the price of a car, hidden inside 0.02 of an APR.",
        ],
      },
      {
        heading: "Paying extra: the asymmetric weapon",
        paragraphs: [
          "Extra principal payments attack interest directly — every dollar of principal removed stops accruing interest for the remaining term. Even $50/month extra on the loan above shortens it by months and saves hundreds in interest. Check for prepayment penalties first; most consumer loans don't have them, some business loans do.",
        ],
      },
    ],
    faq: [
      {
        q: "How is a monthly loan payment calculated?",
        a: "M = P·r(1+r)ⁿ ÷ ((1+r)ⁿ−1), where P is principal, r is the monthly rate (annual ÷ 12), and n is the number of payments.",
      },
      {
        q: "Is it better to have a longer or shorter loan term?",
        a: "Shorter terms cost more per month but far less in total interest. Longer terms buy monthly affordability at a steep total-cost premium — pick the shortest term you can comfortably pay.",
      },
      {
        q: "What's the difference between interest rate and APR?",
        a: "The interest rate is the cost of the money; APR adds fees (origination, points, insurance) into an effective yearly cost — APR is the honest comparison number between lenders.",
      },
      {
        q: "Does paying a loan off early save money?",
        a: "Yes — you stop interest on the remaining principal. Check for prepayment penalties first; they're rare on consumer loans but exist.",
      },
    ],
    related: [
      "compound-interest-calculator",
      "break-even-calculator",
      "vat-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "compound-interest-calculator",
    vertical: "finance",
    name: "Compound Interest Calculator",
    title: "Compound Interest Calculator — Growth of Savings Over Time",
    seoTitle: "Compound Interest Calculator — With Monthly Deposits",
    description:
      "See how an initial deposit plus monthly contributions grows with compounding — final balance, total contributions and interest earned.",
    keywords: [
      "compound interest calculator",
      "investment growth calculator",
      "savings calculator",
      "monthly contribution calculator",
      "interest on savings",
    ],
    fields: [
      {
        key: "initial",
        label: "Initial deposit",
        type: "number",
        default: 10000,
        min: 0,
        step: 100,
        prefix: "$",
      },
      {
        key: "monthly",
        label: "Monthly contribution",
        type: "number",
        default: 300,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "rate",
        label: "Annual return",
        type: "number",
        default: 7,
        min: 0,
        max: 30,
        step: 0.1,
        suffix: "%",
      },
      {
        key: "years",
        label: "Years",
        type: "number",
        default: 20,
        min: 1,
        max: 50,
        step: 1,
      },
    ],
    compute: (v) => {
      const initial = Number(v.initial) || 0;
      const monthly = Number(v.monthly) || 0;
      const r = (Number(v.rate) || 0) / 100 / 12;
      const n = Math.max(1, Math.round((Number(v.years) || 0) * 12));
      const fvInitial = initial * Math.pow(1 + r, n);
      const fvContrib =
        r > 0 ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n;
      const fv = fvInitial + fvContrib;
      const contributed = initial + monthly * n;
      const interest = fv - contributed;
      return [
        { label: "Final balance", value: money0(fv), tone: "primary" },
        { label: "You contributed", value: money0(contributed) },
        { label: "Interest earned", value: money0(interest), tone: "good" },
        {
          label: "Growth multiple",
          value: contributed > 0 ? `${(fv / contributed).toFixed(2)}x` : "—",
          hint: `${n} monthly compounding periods`,
        },
      ];
    },
    assumptions: [
      "Monthly compounding, contributions at month-end, constant annual return.",
      "Taxes, fees and inflation are not included — a 7% nominal return is roughly 4–5% real after inflation.",
      "Real investment returns fluctuate year to year; the model shows a smoothed path, not a prediction.",
    ],
    sources: [],
    sections: [
      {
        heading: "Why time beats amount in compounding",
        paragraphs: [
          "Compounding is exponential — the last years do most of the work. $10,000 plus $300/month at 7% grows to about $37k in 10 years but $167k in 20 and $380k in 30. The second decade adds more than three times what the first did. Starting five years earlier is worth more than doubling the monthly contribution later.",
          "This is the uncomfortable math behind 'start early': the person who invests $300/month from age 25 to 35 and stops often ends richer than someone who starts at 35 and invests the same amount until 65 — despite contributing less than half as much money.",
        ],
      },
      {
        heading: "What return should you assume?",
        paragraphs: [
          "The S&P 500 has returned ~10% nominal historically, ~7% after inflation. High-yield savings run ~4–5%, bonds ~4–6%. Anything projecting 15%+ sustained is not an investment plan, it's a hope — build the plan on 7–8% and let upside be upside.",
        ],
      },
      {
        heading: "The silent drag: fees and inflation",
        paragraphs: [
          "A 1% annual fee doesn't cost 1% — at 7% returns it cuts your 30-year balance by roughly 25%. That's why the index-fund-vs-managed-fund debate matters more than any stock pick. And remember the number that counts is purchasing power: $380k in 30 years buys what ~$190k buys today at 2.5% inflation.",
        ],
      },
    ],
    faq: [
      {
        q: "How does compound interest work?",
        a: "Interest earns interest: each period's return is calculated on the growing balance, not just the principal. Over long horizons growth becomes exponential — small early differences become large late ones.",
      },
      {
        q: "How much will $10,000 grow in 20 years?",
        a: "At 7% compounded monthly: about $40,400. Add $300/month contributions and it's roughly $196,000.",
      },
      {
        q: "What is the rule of 72?",
        a: "Divide 72 by your annual return to estimate doubling time — at 7%, money doubles roughly every 10 years.",
      },
      {
        q: "Is monthly or annual compounding better?",
        a: "More frequent compounding earns slightly more — at 7% the difference between monthly and annual compounding is small (~0.3%/year) but compounds over decades.",
      },
    ],
    related: [
      "loan-payment-calculator",
      "break-even-calculator",
      "saas-ltv-cac-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "salary-to-hourly-calculator",
    vertical: "finance",
    name: "Salary to Hourly Calculator",
    title: "Salary to Hourly Calculator — What Your Pay Is Really Worth",
    seoTitle: "Salary to Hourly Calculator — Annual, Monthly, Daily Rates",
    description:
      "Convert an annual salary into hourly, daily, weekly and monthly rates — adjusted for your actual working hours and vacation.",
    keywords: [
      "salary to hourly calculator",
      "hourly wage calculator",
      "annual salary hourly rate",
      "salary converter",
      "what is my hourly rate",
    ],
    fields: [
      {
        key: "salary",
        label: "Annual salary (gross)",
        type: "number",
        default: 65000,
        min: 0,
        step: 1000,
        prefix: "$",
      },
      {
        key: "hoursWeek",
        label: "Hours worked per week",
        type: "number",
        default: 40,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        key: "weeksOff",
        label: "Paid weeks off per year",
        type: "number",
        default: 3,
        min: 0,
        max: 20,
        step: 0.5,
        help: "Vacation + holidays — time you're paid for but don't work.",
      },
      {
        key: "freq",
        label: "Pay frequency",
        type: "select",
        default: "biweekly",
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "biweekly", label: "Bi-weekly (26 paychecks)" },
          { value: "weekly", label: "Weekly" },
        ],
      },
    ],
    compute: (v) => {
      const salary = Number(v.salary) || 0;
      const hw = Math.max(1, Number(v.hoursWeek) || 40);
      const off = Math.min(51, Math.max(0, Number(v.weeksOff) || 0));
      const workedWeeks = 52 - off;
      const workedHours = workedWeeks * hw;
      const hourly = workedHours > 0 ? salary / workedHours : 0;
      const freqPay: Record<string, { label: string; n: number }> = {
        monthly: { label: "Per paycheck (monthly)", n: 12 },
        biweekly: { label: "Per paycheck (bi-weekly)", n: 26 },
        weekly: { label: "Per paycheck (weekly)", n: 52 },
      };
      const f = freqPay[String(v.freq)] ?? freqPay.biweekly;
      return [
        {
          label: "True hourly rate",
          value: money(hourly),
          tone: "primary",
          hint: "per hour actually worked",
        },
        { label: "Per day (8h)", value: money(hourly * 8) },
        { label: "Per week", value: money(salary / 52) },
        { label: "Per month", value: money(salary / 12) },
        { label: f.label, value: money(salary / f.n), tone: "good" },
      ];
    },
    assumptions: [
      "Gross salary before taxes and deductions — divide by your local effective tax rate for take-home equivalents.",
      "True hourly uses only weeks actually worked; the headline 'salary ÷ 2,080' assumes 52 full 40-hour weeks, which overstates hours for most people.",
    ],
    sources: [],
    sections: [
      {
        heading: "Your real hourly rate is lower than salary ÷ 2,080",
        paragraphs: [
          "The textbook conversion — annual salary divided by 2,080 hours — assumes you work all 52 weeks at 40 hours. Nobody does. Three weeks of vacation plus holidays puts a $65,000 salary at roughly $33/hour for time actually worked, not the $31.25 the naive formula gives.",
          "Then it gets worse: unpaid overtime, commuting, and work-thoughts-at-11pm all dilute the denominator. A salaried job averaging 50 real hours a week pays 20% less per hour than its 40-hour sticker.",
        ],
      },
      {
        heading: "The number that matters for comparisons",
        paragraphs: [
          "Salary-to-hourly conversion is most useful when comparing against freelance or contract offers. A $65k job at ~$33/hour real means a contract paying $50/hour already out-earns it on rate — before you even count the premium contractors should charge for benefits and risk. Run both through the freelance rate calculator for the full picture.",
        ],
      },
      {
        heading: "Bi-weekly vs monthly paychecks",
        paragraphs: [
          "Bi-weekly pay (26 checks) is the most common US schedule — two months a year deliver a 'bonus' third paycheck that's actually just your salary distributed differently. Budgeting monthly on 26 checks requires dividing by 12, not multiplying a single check by 2.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I convert my salary to an hourly rate?",
        a: "Divide annual salary by annual worked hours: (52 − vacation weeks) × weekly hours. $65,000 at 40h/week with 3 weeks off is ~$33/hour.",
      },
      {
        q: "What is $65,000 a year per hour?",
        a: "About $31.25 using the simple 2,080-hour formula, or ~$33/hour counting only weeks actually worked.",
      },
      {
        q: "Is salary or hourly pay better?",
        a: "Salary brings stability and usually benefits; hourly pays for every hour worked including overtime. Compare on true hourly rate plus the value of benefits, not the headline number.",
      },
      {
        q: "How many paychecks in a year bi-weekly?",
        a: "26 — which is why two months each year have three paychecks.",
      },
    ],
    related: [
      "freelance-rate-calculator",
      "loan-payment-calculator",
      "compound-interest-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "sales-tax-calculator",
    vertical: "finance",
    name: "Sales Tax Calculator",
    title: "US Sales Tax Calculator — Add or Remove Tax by State",
    seoTitle: "Sales Tax Calculator — Rates for All 45 US States",
    description:
      "Calculate US sales tax by state: add tax to a price or strip it out of a total. State base rates for all 45 taxing states plus DC.",
    keywords: [
      "sales tax calculator",
      "add sales tax",
      "remove sales tax",
      "state sales tax rates",
      "sales tax by state",
    ],
    fields: [
      {
        key: "amount",
        label: "Amount",
        type: "number",
        default: 100,
        min: 0,
        step: 0.01,
        prefix: "$",
      },
      {
        key: "mode",
        label: "Direction",
        type: "select",
        default: "add",
        options: [
          { value: "add", label: "Add tax (pre-tax → total)" },
          { value: "remove", label: "Remove tax (total → pre-tax)" },
        ],
      },
      {
        key: "state",
        label: "State",
        type: "select",
        default: "ca",
        options: Object.entries({
          al: "Alabama — 4%",
          ak: "Alaska — 0% (local only)",
          az: "Arizona — 5.6%",
          ar: "Arkansas — 6.5%",
          ca: "California — 7.25%",
          co: "Colorado — 2.9%",
          ct: "Connecticut — 6.35%",
          dc: "D.C. — 6%",
          fl: "Florida — 6%",
          ga: "Georgia — 4%",
          hi: "Hawaii — 4%",
          id: "Idaho — 6%",
          il: "Illinois — 6.25%",
          in: "Indiana — 7%",
          ia: "Iowa — 6%",
          ks: "Kansas — 6.5%",
          ky: "Kentucky — 6%",
          la: "Louisiana — 4.45%",
          me: "Maine — 5.5%",
          md: "Maryland — 6%",
          ma: "Massachusetts — 6.25%",
          mi: "Michigan — 6%",
          mn: "Minnesota — 6.875%",
          ms: "Mississippi — 7%",
          mo: "Missouri — 4.225%",
          ne: "Nebraska — 5.5%",
          nv: "Nevada — 6.85%",
          nj: "New Jersey — 6.625%",
          nm: "New Mexico — 4.875%",
          ny: "New York — 4%",
          nc: "North Carolina — 4.75%",
          nd: "North Dakota — 5%",
          oh: "Ohio — 5.75%",
          ok: "Oklahoma — 4.5%",
          pa: "Pennsylvania — 6%",
          ri: "Rhode Island — 7%",
          sc: "South Carolina — 6%",
          sd: "South Dakota — 4.2%",
          tn: "Tennessee — 7%",
          tx: "Texas — 6.25%",
          ut: "Utah — 6.1%",
          vt: "Vermont — 6%",
          va: "Virginia — 5.3%",
          wa: "Washington — 6.5%",
          wv: "West Virginia — 6%",
          wi: "Wisconsin — 5%",
          wy: "Wyoming — 4%",
        }).map(([value, label]) => ({ value, label })),
        help: "State base rate — local taxes can add 0–5%+ on top.",
      },
    ],
    compute: (v) => {
      const amount = Number(v.amount) || 0;
      const rates: Record<string, number> = {
        al: 4,
        ak: 0,
        az: 5.6,
        ar: 6.5,
        ca: 7.25,
        co: 2.9,
        ct: 6.35,
        dc: 6,
        fl: 6,
        ga: 4,
        hi: 4,
        id: 6,
        il: 6.25,
        in: 7,
        ia: 6,
        ks: 6.5,
        ky: 6,
        la: 4.45,
        me: 5.5,
        md: 6,
        ma: 6.25,
        mi: 6,
        mn: 6.875,
        ms: 7,
        mo: 4.225,
        ne: 5.5,
        nv: 6.85,
        nj: 6.625,
        nm: 4.875,
        ny: 4,
        nc: 4.75,
        nd: 5,
        oh: 5.75,
        ok: 4.5,
        pa: 6,
        ri: 7,
        sc: 6,
        sd: 4.2,
        tn: 7,
        tx: 6.25,
        ut: 6.1,
        vt: 6,
        va: 5.3,
        wa: 6.5,
        wv: 6,
        wi: 5,
        wy: 4,
      };
      const rate = (rates[String(v.state)] ?? 7.25) / 100;
      if (String(v.mode) === "add") {
        const tax = amount * rate;
        return [
          { label: "Pre-tax amount", value: money(amount) },
          {
            label: `State tax (${pct(rate * 100, 3)})`,
            value: money(tax),
            tone: "bad",
          },
          {
            label: "Total with tax",
            value: money(amount + tax),
            tone: "primary",
          },
          {
            label: "Effective rate note",
            value: "—",
            hint: "local rates may add 0–5%+ on top",
          },
        ];
      }
      const net = rate > 0 ? amount / (1 + rate) : amount;
      return [
        { label: "Total (tax incl.)", value: money(amount) },
        {
          label: `State tax (${pct(rate * 100, 3)})`,
          value: money(amount - net),
          tone: "bad",
        },
        { label: "Pre-tax amount", value: money(net), tone: "primary" },
        {
          label: "Effective rate note",
          value: "—",
          hint: "local rates may add 0–5%+ on top",
        },
      ];
    },
    assumptions: [
      "State base rates only — cities and counties add local sales tax in most states (combined rates commonly reach 8–10.25% in CA, ~8.9% average in TN, etc.).",
      "Oregon, Montana, New Hampshire and Delaware have no state sales tax and aren't listed.",
      "Marketplace sales, exempt items (groceries, prescriptions in many states) and use tax follow different rules.",
    ],
    sources: [
      {
        label: "State & local sales tax rates",
        url: "https://taxfoundation.org/data/all/state/sales-tax-rates/",
      },
    ],
    sections: [
      {
        heading: "Base rate vs the rate you actually pay",
        paragraphs: [
          "State base rates are the floor, not the price at the register. California's 7.25% base becomes 7.75–10.75% once city and district taxes stack — Los Angeles hits 9.5%, parts of the Bay Area pass 10%. Tennessee's 7% state rate routinely combines to ~9.5% with local additions.",
          "For exact checkout math you need the combined rate for the specific address — the state base shown here is what matters for business nexus rules and rough estimates, not the last word on any receipt.",
        ],
      },
      {
        heading: "Removing tax: why dividing isn't subtracting",
        paragraphs: [
          "To strip tax from a total, divide by (1 + rate) — never subtract the percentage. A $107.25 receipt in California is $100 pre-tax, but 7.25% of $107.25 is $7.78, not $7.25. Get this wrong on expense reports and the error compounds across every line item.",
        ],
      },
      {
        heading: "What online sellers need to know",
        paragraphs: [
          "Since the 2018 Wayfair ruling, you owe sales tax in states where you have 'economic nexus' — typically $100,000 in annual sales or 200 transactions. You collect the *buyer's* state+local combined rate, not your own. Marketplaces (Amazon, eBay, Etsy) collect it for you as 'marketplace facilitators'; sales through your own store are on you — this is where tools like TaxJar earn their keep.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I add sales tax to a price?",
        a: "Multiply by (1 + rate). At 7.25%: $100 × 1.0725 = $107.25. The tax portion is the price × rate.",
      },
      {
        q: "How do I remove sales tax from a total?",
        a: "Divide the total by (1 + rate): pre-tax = total ÷ 1.0725. Never subtract the percentage of the total — that over-removes the tax.",
      },
      {
        q: "Which US states have no sales tax?",
        a: "Oregon, Montana, New Hampshire and Delaware (the 'NOMAD' states). Alaska has no state tax but allows local sales taxes.",
      },
      {
        q: "Do I have to charge sales tax for online sales?",
        a: "Yes, in states where you have economic nexus — usually $100k+ in sales. Marketplaces collect for you; your own web store must handle it itself.",
      },
    ],
    related: [
      "vat-calculator",
      "break-even-calculator",
      "etsy-profit-calculator",
    ],
    updatedAt: "2026-10-01",
  },
  {
    slug: "mortgage-payment-calculator",
    vertical: "finance",
    name: "Mortgage Payment Calculator",
    title: "Mortgage Payment Calculator — P&I, Tax & Insurance",
    seoTitle: "Mortgage Payment Calculator — True Monthly Cost",
    description:
      "Calculate your real monthly mortgage payment: principal & interest plus property tax, insurance and HOA — and the total cost of the loan.",
    keywords: [
      "mortgage calculator",
      "mortgage payment calculator",
      "monthly mortgage payment",
      "home loan calculator",
      "piti calculator",
    ],
    fields: [
      {
        key: "homePrice",
        label: "Home price",
        type: "number",
        default: 350000,
        min: 0,
        step: 5000,
        prefix: "$",
      },
      {
        key: "down",
        label: "Down payment",
        type: "number",
        default: 20,
        min: 0,
        max: 90,
        step: 1,
        suffix: "%",
      },
      {
        key: "rate",
        label: "Interest rate",
        type: "number",
        default: 6.5,
        min: 0,
        max: 20,
        step: 0.05,
        suffix: "%",
      },
      {
        key: "years",
        label: "Term (years)",
        type: "number",
        default: 30,
        min: 5,
        max: 40,
        step: 5,
      },
      {
        key: "propTax",
        label: "Annual property tax",
        type: "number",
        default: 4200,
        min: 0,
        step: 100,
        prefix: "$",
      },
      {
        key: "insurance",
        label: "Annual insurance + HOA",
        type: "number",
        default: 1800,
        min: 0,
        step: 50,
        prefix: "$",
      },
    ],
    compute: (v) => {
      const price = Number(v.homePrice) || 0;
      const down =
        price * (Math.min(99, Math.max(0, Number(v.down) || 0)) / 100);
      const p = Math.max(0, price - down);
      const r = (Number(v.rate) || 0) / 100 / 12;
      const n = Math.max(1, Math.round((Number(v.years) || 0) * 12));
      const pi =
        r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n;
      const escrows =
        ((Number(v.propTax) || 0) + (Number(v.insurance) || 0)) / 12;
      const total = pi + escrows;
      const totalPaid = pi * n;
      const interest = totalPaid - p;
      return [
        { label: "Principal & interest", value: money(pi) },
        { label: "Tax + insurance / month", value: money(escrows) },
        {
          label: "Total monthly payment",
          value: money(total),
          tone: "primary",
        },
        {
          label: "Loan amount",
          value: money0(p),
          hint: `down payment ${money0(down)}`,
        },
        {
          label: "Total interest over term",
          value: money0(interest),
          tone: "bad",
        },
        { label: "Total cost of loan", value: money0(totalPaid), tone: "bad" },
      ];
    },
    assumptions: [
      "Standard fixed-rate amortizing mortgage — P&I via M = P·r(1+r)ⁿ÷((1+r)ⁿ−1).",
      "PMI (typically 0.5–1%/yr when down payment <20%) is not included — add it to insurance if it applies.",
      "ARMs, points, and closing costs are excluded.",
    ],
    sources: [],
    sections: [
      {
        heading: "P&I is only part of the check you'll write",
        paragraphs: [
          "The number lenders quote — principal & interest — is usually 70–80% of the real monthly outlay. On a $350k home with 20% down at 6.5% for 30 years, P&I is ~$1,770. Add $4,200/year property tax and $1,800 insurance+HOA and you're writing $2,270 checks. The full PITI is what affordability actually means.",
          "And if your down payment is under 20%, add PMI: typically 0.5–1% of the loan per year — another $115–230/month on this loan until you hit 78–80% equity.",
        ],
      },
      {
        heading: "The interest number that changes behavior",
        paragraphs: [
          "On a $280k 30-year mortgage at 6.5%, total interest is ~$357,000 — you pay back 2.27× what you borrowed. Same loan at 15 years: payment jumps to ~$2,440 but total interest collapses to ~$159,000. The 15-year costs 38% more monthly and saves ~$198k — the single largest financial decision most people make is that term toggle.",
          "Even 0.5% on the rate moves the needle hard: 6.0% vs 6.5% on this loan saves ~$34,000 over 30 years — which is why rate-shopping three lenders is worth more than most financial advice you'll ever get.",
        ],
      },
      {
        heading: "The extra-payment math",
        paragraphs: [
          "Every extra principal dollar stops accruing interest for the rest of the term. Just $200/month extra on this loan cuts ~6 years off the schedule and saves ~$80k in interest. Biweekly payments (26 half-payments = 13 full payments a year) achieve a similar effect almost invisibly.",
        ],
      },
    ],
    faq: [
      {
        q: "How much is a $300,000 mortgage per month?",
        a: "At 6.5% for 30 years: ~$1,896 P&I, or roughly $2,350–2,550 with typical taxes and insurance. At 15 years: ~$2,613 P&I but less than half the total interest.",
      },
      {
        q: "How is a mortgage payment calculated?",
        a: "M = P·r(1+r)ⁿ ÷ ((1+r)ⁿ−1) on the loan amount (price minus down payment), where r is the monthly rate and n is months. Taxes and insurance are added on top.",
      },
      {
        q: "What is PITI?",
        a: "Principal, Interest, Taxes, Insurance — the full monthly housing cost, which is what lenders use for the 28% debt-to-income affordability guideline.",
      },
      {
        q: "Is a 15 or 30 year mortgage better?",
        a: "15-year: higher payment, ~half the interest, forced equity building. 30-year: flexibility — you can always pay extra and simulate the 15-year schedule while keeping the option to pay less.",
      },
    ],
    related: [
      "loan-payment-calculator",
      "compound-interest-calculator",
      "break-even-calculator",
    ],
    updatedAt: "2026-10-18",
  },
  {
    slug: "margin-calculator",
    vertical: "finance",
    name: "Margin Calculator",
    title: "Margin Calculator — Gross Margin & Markup in One",
    seoTitle: "Margin Calculator — Margin %, Markup % & Gross Profit",
    description:
      "Calculate gross margin and markup from cost and price — or price from cost and target margin. The difference explained with real math.",
    keywords: [
      "margin calculator",
      "gross margin calculator",
      "markup calculator",
      "margin vs markup",
      "profit margin formula",
    ],
    fields: [
      {
        key: "cost",
        label: "Cost per unit",
        type: "number",
        default: 40,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "price",
        label: "Sale price",
        type: "number",
        default: 60,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "target",
        label: "Target margin",
        type: "number",
        default: 40,
        min: 0,
        max: 95,
        step: 1,
        suffix: "%",
        help: "See the price you'd need to hit this margin on your cost.",
      },
    ],
    compute: (v) => {
      const cost = Number(v.cost) || 0;
      const price = Number(v.price) || 0;
      const profit = price - cost;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      const markup = cost > 0 ? (profit / cost) * 100 : 0;
      const targetPct = Math.min(99, Math.max(0, Number(v.target) || 0)) / 100;
      const neededPrice = targetPct < 1 ? cost / (1 - targetPct) : Infinity;
      return [
        {
          label: "Gross profit per unit",
          value: money(profit),
          tone: profit >= 0 ? "good" : "bad",
        },
        { label: "Margin (of price)", value: pct(margin, 1), tone: "primary" },
        { label: "Markup (of cost)", value: pct(markup, 1) },
        {
          label: `Price for ${pct(targetPct * 100, 0)} margin`,
          value: money(neededPrice),
          tone: "primary",
          hint: `cost ÷ (1 − ${pct(targetPct * 100, 0)})`,
        },
      ];
    },
    assumptions: [
      "Margin = profit ÷ sale price; markup = profit ÷ cost. Same profit, different denominators — margin is always the smaller number.",
      "Unit economics only — overheads, taxes and discounts are excluded.",
    ],
    sources: [],
    sections: [
      {
        heading: "Margin vs markup — the confusion that costs businesses",
        paragraphs: [
          "A product costing $40 sold at $60 has a $20 profit — that's 33.3% margin (of the $60 price) but 50% markup (on the $40 cost). Same dollars, wildly different percentages. Quoting one when the conversation expects the other is how pricing meetings produce wrong decisions.",
          "The classic disaster: a retailer wants '40% margin' and applies a 40% markup — price becomes $56 instead of $66.67, a real margin of 28.6%, and the difference evaporates silently across every sale.",
        ],
      },
      {
        heading: "The formula that sets prices correctly",
        paragraphs: [
          "To hit a target margin, divide cost by (1 − margin): $40 ÷ (1 − 0.40) = $66.67. Memorize the inverse pairs — a 50% margin needs a 100% markup, a 33% margin needs 50% markup, a 25% margin needs 33% markup. If you think in markups, you're always underpricing.",
        ],
      },
      {
        heading: "What margin tells you — and what it doesn't",
        paragraphs: [
          "Margin is what the market sees (your income statement shows it); markup is the internal pricing tool. Neither includes overheads — a 40% gross margin with 35% overhead is a 5% business. Use margin for investor/accounting talk, markup when setting prices, and never confuse them in the same spreadsheet.",
        ],
      },
    ],
    faq: [
      {
        q: "How do you calculate margin?",
        a: "Margin % = (price − cost) ÷ price × 100. It measures profit as a share of the sale price.",
      },
      {
        q: "What is a 30% margin in dollars?",
        a: "Depends on the price: margin is relative. On a $60 sale it means $18 profit — cost was $42.",
      },
      {
        q: "How do I price for a 40% margin?",
        a: "Price = cost ÷ 0.6. A $40 cost needs a $66.67 price — a 66.7% markup, not 40%.",
      },
      {
        q: "Is margin or markup bigger?",
        a: "Markup is always larger for the same profit — it divides by the smaller number (cost). 50% markup = 33% margin; 100% markup = 50% margin.",
      },
    ],
    related: [
      "break-even-calculator",
      "dropshipping-margin-calculator",
      "vat-calculator",
    ],
    updatedAt: "2026-10-18",
  },
  {
    slug: "roas-calculator",
    vertical: "finance",
    name: "ROAS Calculator",
    title: "ROAS Calculator — Return on Ad Spend & Break-Even",
    seoTitle: "ROAS Calculator — Revenue ÷ Ad Spend & Profit ROAS",
    description:
      "Calculate ROAS from ad spend and revenue — plus your true break-even ROAS once margin is factored in.",
    keywords: [
      "roas calculator",
      "return on ad spend",
      "break even roas",
      "roas formula",
      "ad spend calculator",
    ],
    fields: [
      {
        key: "spend",
        label: "Ad spend",
        type: "number",
        default: 1000,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "revenue",
        label: "Revenue from ads",
        type: "number",
        default: 4000,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "margin",
        label: "Gross margin",
        type: "number",
        default: 40,
        min: 1,
        max: 100,
        step: 1,
        suffix: "%",
        help: "Profit share of revenue before ad spend.",
      },
    ],
    compute: (v) => {
      const spend = Math.max(1, Number(v.spend) || 0);
      const revenue = Number(v.revenue) || 0;
      const margin = Math.min(100, Math.max(1, Number(v.margin) || 0)) / 100;
      const roas = revenue / spend;
      const grossProfit = revenue * margin;
      const net = grossProfit - spend;
      const breakevenRoas = 1 / margin;
      return [
        {
          label: "ROAS",
          value: `${roas.toFixed(2)}x`,
          tone: "primary",
          hint: `${money0(revenue)} ÷ ${money0(spend)}`,
        },
        {
          label: "Profit ROAS (after margin)",
          value: `${(grossProfit / spend).toFixed(2)}x`,
          hint: "ROAS weighted by real margin — the honest number",
        },
        {
          label: "Net profit after ads",
          value: money(net),
          tone: net >= 0 ? "good" : "bad",
        },
        {
          label: "Break-even ROAS",
          value: `${breakevenRoas.toFixed(2)}x`,
          hint: `at ${pct(margin * 100, 0)} margin, anything below loses money`,
          tone: "bad",
        },
      ];
    },
    assumptions: [
      "ROAS = revenue ÷ ad spend. Break-even ROAS = 1 ÷ gross margin.",
      "Refunds, platform fees and agency fees are not included — subtract them from margin for the strictest number.",
    ],
    sources: [],
    sections: [
      {
        heading: "Why a 3x ROAS can still lose money",
        paragraphs: [
          "ROAS counts revenue, not profit. A 3x ROAS on a product with 30% margin means each $1 of ads returns $3 of revenue but only $0.90 of gross profit — you're losing 10 cents per dollar spent while the dashboard celebrates. The only ROAS that matters is the one relative to your margin.",
          "The fix is one division: break-even ROAS = 1 ÷ margin. At 40% margin you need 2.5x just to tread water; at 25% margin, 4x. Most accounts judged 'profitable' at 3x are silently unprofitable on low-margin products.",
        ],
      },
      {
        heading: "Platform ROAS is inflated — blend your own",
        paragraphs: [
          "Meta and Google report attributed revenue generously: view-through conversions, existing customers, brand searches all get credited. Your real ROAS is total revenue change ÷ spend, which is why experienced advertisers run weekly blended (MER) numbers alongside the platform dashboards.",
        ],
      },
      {
        heading: "The levers when ROAS is short of break-even",
        paragraphs: [
          "Four moves: raise prices (margin up, break-even ROAS down), raise AOV (bundles, upsells — same clicks, more revenue), cut CPA (better creative, tighter audiences), or accept sub-breakeven short-term if LTV pays it back — subscription and repeat-purchase models can run 'unprofitable' first-order ROAs profitably. But only if you actually measured LTV, not vibes.",
        ],
      },
    ],
    faq: [
      {
        q: "What is a good ROAS?",
        a: "Anything above your break-even ROAS (1 ÷ margin). At 40% margin that's 2.5x; at 60% margin, 1.67x. 'Good' is relative to your margin, not an industry number.",
      },
      {
        q: "How is ROAS calculated?",
        a: "ROAS = revenue attributed to ads ÷ ad spend. $4,000 revenue on $1,000 spend = 4x ROAS.",
      },
      {
        q: "ROAS vs ROI — what's the difference?",
        a: "ROAS measures revenue per ad dollar; ROI measures profit after all costs. ROAS ignores margin — a 4x ROAS on 20% margin still loses money.",
      },
      {
        q: "Why does Meta show higher ROAS than my bank account?",
        a: "Attribution inflation: view-through conversions, repeat customers and brand searches all get credited to ads. Compare platform ROAS to blended revenue lift for the truth.",
      },
    ],
    related: [
      "dropshipping-margin-calculator",
      "cpm-calculator",
      "saas-ltv-cac-calculator",
    ],
    updatedAt: "2026-10-18",
  },
  {
    slug: "cpm-calculator",
    vertical: "finance",
    name: "CPM Calculator",
    title: "CPM Calculator — Cost Per Mille, CPC & CTR Together",
    seoTitle: "CPM Calculator — Ad Cost Per 1,000 Impressions",
    description:
      "Calculate CPM, CPC and CTR from spend, impressions and clicks — compare ad costs across platforms and campaigns.",
    keywords: [
      "cpm calculator",
      "cpc calculator",
      "ctr calculator",
      "cost per mille",
      "ad impressions calculator",
    ],
    fields: [
      {
        key: "spend",
        label: "Ad spend",
        type: "number",
        default: 500,
        min: 0,
        step: 10,
        prefix: "$",
      },
      {
        key: "impressions",
        label: "Impressions",
        type: "number",
        default: 50000,
        min: 0,
        step: 1000,
      },
      {
        key: "clicks",
        label: "Clicks",
        type: "number",
        default: 750,
        min: 0,
        step: 10,
      },
    ],
    compute: (v) => {
      const spend = Number(v.spend) || 0;
      const impressions = Math.max(0, Number(v.impressions) || 0);
      const clicks = Math.max(0, Number(v.clicks) || 0);
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      return [
        { label: "CPM (cost per 1,000)", value: money(cpm), tone: "primary" },
        { label: "CPC (cost per click)", value: money(cpc) },
        { label: "CTR (click-through rate)", value: pct(ctr, 2) },
        {
          label: "Impressions per $1",
          value: spend > 0 ? num(impressions / spend) : "—",
          hint: "reach efficiency of the spend",
        },
      ];
    },
    assumptions: [
      "CPM = (spend ÷ impressions) × 1,000; CPC = spend ÷ clicks; CTR = clicks ÷ impressions.",
      "Typical ranges: Meta CPM $5–15, Google Display $2–5, TikTok $5–10, LinkedIn $30–60+.",
    ],
    sources: [],
    sections: [
      {
        heading: "CPM measures reach, not results",
        paragraphs: [
          "CPM tells you what eyeballs cost — nothing more. A $3 CPM to an audience that never buys is infinitely more expensive than a $40 CPM to decision-makers. Judging campaigns on CPM alone is how budgets get spent efficiently on the wrong people.",
          "Read it as a diagnostic instead: rising CPM usually means audience saturation or auction competition (Q4 hits every advertiser), falling CPM with flat CTR means you're buying cheaper emptiness.",
        ],
      },
      {
        heading: "The three metrics work as a chain",
        paragraphs: [
          "CPM → CTR → CPC form one equation: cheap impressions (low CPM) with weak creative (low CTR) still produce expensive clicks (high CPC). You can't optimize one without the others — a platform's CPM is fixed by the auction, but your CTR is the lever you control, and it divides straight into CPC.",
        ],
      },
      {
        heading: "Benchmarks worth knowing",
        paragraphs: [
          "Rough 2025–26 ranges: Meta $5–15, Google Display $2–5, TikTok $5–10, YouTube $10–30, LinkedIn $30–60+. Dramatically lower CPMs usually mean low-quality placements or broad geographies — check where the impressions actually ran before celebrating.",
        ],
      },
    ],
    faq: [
      {
        q: "How is CPM calculated?",
        a: "CPM = (ad spend ÷ impressions) × 1,000. $500 on 50,000 impressions = $10 CPM.",
      },
      {
        q: "What is a good CPM?",
        a: "It depends entirely on the platform and audience — $5–15 is typical on Meta, $30+ on LinkedIn can be excellent if the audience converts. Judge CPM by downstream cost per result, not the number itself.",
      },
      {
        q: "CPM vs CPC — which bidding is better?",
        a: "CPM buying is cheaper for awareness if your creative gets average-or-better CTR. CPC buying protects you from paying for impressions nobody clicks. Most platforms optimize toward CPC-like outcomes regardless of the bidding mode.",
      },
      {
        q: "What CTR should I aim for?",
        a: "Roughly 1%+ on Meta/Display, 0.5%+ on YouTube, 0.45%+ on LinkedIn feed. Below these, the problem is the creative, not the CPM.",
      },
    ],
    related: [
      "roas-calculator",
      "engagement-rate-calculator",
      "break-even-calculator",
    ],
    updatedAt: "2026-10-18",
  },
  {
    slug: "tip-calculator",
    vertical: "finance",
    name: "Tip Calculator",
    title: "Tip Calculator — Split the Bill & Tip Per Person",
    seoTitle: "Tip Calculator — Tip %, Split Bill & Total Per Person",
    description:
      "Calculate the tip, the total, and what each person pays when splitting the bill — with tip-on-pre-tax done the right way.",
    keywords: [
      "tip calculator",
      "split bill calculator",
      "how much to tip",
      "tip per person",
      "restaurant tip calculator",
    ],
    fields: [
      {
        key: "bill",
        label: "Bill amount",
        type: "number",
        default: 86.4,
        min: 0,
        step: 0.5,
        prefix: "$",
      },
      {
        key: "tipPct",
        label: "Tip",
        type: "number",
        default: 18,
        min: 0,
        max: 50,
        step: 1,
        suffix: "%",
      },
      {
        key: "people",
        label: "Split between",
        type: "number",
        default: 3,
        min: 1,
        step: 1,
        help: "Number of people sharing the bill.",
      },
      {
        key: "tax",
        label: "Sales tax on the bill",
        type: "number",
        default: 8,
        min: 0,
        max: 15,
        step: 0.25,
        suffix: "%",
        help: "So the tip is calculated on the pre-tax amount, as etiquette suggests.",
      },
    ],
    compute: (v) => {
      const bill = Number(v.bill) || 0;
      const tipPct = Math.max(0, Number(v.tipPct) || 0) / 100;
      const people = Math.max(1, Math.round(Number(v.people) || 1));
      const tax = Math.min(15, Math.max(0, Number(v.tax) || 0)) / 100;
      const preTax = tax > 0 ? bill / (1 + tax) : bill;
      const tip = preTax * tipPct;
      const total = bill + tip;
      const perPerson = total / people;
      return [
        { label: "Tip amount", value: money(tip), tone: "primary" },
        { label: "Total with tip", value: money(total) },
        {
          label: "Each person pays",
          value: money(perPerson),
          tone: "primary",
          hint: people > 1 ? `split ${people} ways` : undefined,
        },
        {
          label: "Pre-tax amount",
          value: money(preTax),
          hint: "tip is based on this",
        },
        { label: "Tip per person", value: money(tip / people) },
      ];
    },
    assumptions: [
      "Tip is calculated on the pre-tax amount — the etiquette-standard base.",
      "US norms: 15–20% for sit-down service, 18–20%+ for good service, 10–15% for delivery.",
    ],
    sources: [],
    sections: [
      {
        heading: "Tip on the pre-tax amount — that's the standard",
        paragraphs: [
          "Etiquette says the tip applies to the service, not the government's share — tip on the pre-tax bill. On an $86.40 check with 8% tax, the pre-tax amount is $80 — an 18% tip is $14.40, not $15.55. The difference is small per meal and adds up across hundreds of restaurant visits a year.",
          "Most suggested-tip screens conveniently calculate on the post-tax total, and some now start suggestions at 22% — the check is not the authority; do your own math.",
        ],
      },
      {
        heading: "The mental-math version",
        paragraphs: [
          "10% is just a decimal shift — $86.40 → $8.64. From there: 15% is 10% plus half again ($8.64 + $4.32 ≈ $13), 20% is double ($17.28), 18% is '20% minus a bit'. Learn the 10%-shift and you never need the calculator again — but splitting three ways with different tax rates is exactly when you do.",
        ],
      },
      {
        heading: "Splitting the bill without the awkwardness",
        paragraphs: [
          "The clean approach for groups: decide the tip once (on pre-tax), add it to the total, divide evenly — or have one person pay and settle up via Venmo/Splitwise. If orders differed wildly, proportional splitting (each pays their share of pre-tax + proportional tip + proportional tax) is fairer than equal splits — and this calculator gives you the numbers either way.",
        ],
      },
    ],
    faq: [
      {
        q: "How much is a 20% tip on $86.40?",
        a: "$16 on the pre-tax $80 — or $17.28 if you tip on the post-tax total. The pre-tax amount is the etiquette-correct base.",
      },
      {
        q: "Should you tip on the pre- or post-tax amount?",
        a: "Pre-tax is the convention — the tip rewards service, not the tax. Suggested-tip screens often quietly use the post-tax total.",
      },
      {
        q: "What is the standard tip percentage in the US?",
        a: "15–20% at sit-down restaurants (18–20%+ for good service), 10–15% for delivery, $1–2 per drink at bars, 15–20% for taxis/rideshare.",
      },
      {
        q: "How do you split a tip evenly?",
        a: "Add the tip to the total, divide by the number of people. Each pays (bill + tip) ÷ people — this calculator does it in one step.",
      },
    ],
    related: [
      "sales-tax-calculator",
      "discount-calculator",
      "salary-to-hourly-calculator",
    ],
    updatedAt: "2026-10-18",
  },
];
