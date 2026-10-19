import type { CalculatorDef } from "./types";
import { feesCalculators } from "./fees";
import { marketplaceCalculators } from "./marketplaces";
import { creatorCalculators } from "./creators";
import { financeCalculators } from "./finance";
import { devtoolsCalculators } from "./devtools";

export const calculators: CalculatorDef[] = [
  ...feesCalculators,
  ...marketplaceCalculators,
  ...creatorCalculators,
  ...financeCalculators,
  ...devtoolsCalculators,
];

export function getCalculator(vertical: string, slug: string) {
  return calculators.find((c) => c.vertical === vertical && c.slug === slug);
}

export function getBySlug(slug: string) {
  return calculators.find((c) => c.slug === slug);
}

export function getCalculatorsByVertical(vertical: string) {
  return calculators.filter((c) => c.vertical === vertical);
}

export function getRelated(def: CalculatorDef): CalculatorDef[] {
  return def.related
    .map((s) => getBySlug(s))
    .filter((c): c is CalculatorDef => Boolean(c));
}
