import Link from "next/link";
import type { CalculatorDef } from "@/lib/calculators/types";

export function CalcCard({ calc }: { calc: CalculatorDef }) {
  return (
    <Link
      href={`/${calc.vertical}/${calc.slug}`}
      className="group rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
    >
      <div className="text-base font-semibold text-neutral-900 group-hover:text-blue-700">
        {calc.name}
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{calc.description}</p>
    </Link>
  );
}
