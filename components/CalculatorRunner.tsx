"use client";

import { useEffect, useMemo, useState } from "react";
import type { FieldValues } from "@/lib/calculators/types";
import { getCalculator } from "@/lib/calculators";

const toneClasses: Record<string, string> = {
  default: "border-neutral-200 bg-white",
  primary: "border-blue-200 bg-blue-50",
  good: "border-emerald-200 bg-emerald-50",
  bad: "border-rose-200 bg-rose-50",
};

const toneText: Record<string, string> = {
  default: "text-neutral-900",
  primary: "text-blue-900",
  good: "text-emerald-900",
  bad: "text-rose-900",
};

export function CalculatorRunner({
  vertical,
  slug,
}: {
  vertical: string;
  slug: string;
}) {
  const calc = getCalculator(vertical, slug);
  const initial = useMemo(() => {
    const values: FieldValues = {};
    for (const f of calc?.fields ?? []) values[f.key] = f.default;
    return values;
  }, [calc]);

  const [values, setValues] = useState<FieldValues>(initial);
  const [mounted, setMounted] = useState(false);
  const [nonce, setNonce] = useState(0);
  useEffect(() => setMounted(true), []);
  const canCompute = calc && (!calc.deferCompute || mounted);
  const results = useMemo(
    () => (canCompute ? calc.compute({ ...values, __nonce: nonce }) : []),
    [canCompute, calc, values, nonce],
  );

  if (!calc) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {calc.fields.map((f) => (
          <label
            key={f.key}
            className={`block ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
          >
            <span className="mb-1 block text-sm font-medium text-neutral-800">
              {f.label}
            </span>
            {f.type === "textarea" ? (
              <textarea
                value={String(values[f.key])}
                rows={f.rows ?? 8}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                spellCheck={false}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
              />
            ) : f.type === "select" ? (
              <select
                value={String(values[f.key])}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center rounded-lg border border-neutral-300 bg-white focus-within:border-blue-500">
                {f.prefix && (
                  <span className="pl-3 text-sm text-neutral-500">
                    {f.prefix}
                  </span>
                )}
                <input
                  type="number"
                  value={String(values[f.key])}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [f.key]:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm focus:outline-none"
                />
                {f.suffix && (
                  <span className="pr-3 text-sm text-neutral-500">
                    {f.suffix}
                  </span>
                )}
              </div>
            )}
            {f.help && (
              <span className="mt-1 block text-xs text-neutral-500">
                {f.help}
              </span>
            )}
          </label>
        ))}
      </div>

      {calc.deferCompute && (
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r, i) => (
          <div
            key={`${r.label}-${i}`}
            className={`rounded-xl border p-4 ${toneClasses[r.tone ?? "default"]} ${r.wide ? "sm:col-span-2 lg:col-span-3" : ""}`}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {r.label}
            </div>
            <div
              className={`mt-1 text-xl font-semibold ${toneText[r.tone ?? "default"]} ${r.mono ? "break-all font-mono text-sm whitespace-pre-wrap" : ""}`}
            >
              {r.value}
            </div>
            {r.hint && (
              <div className="mt-1 text-xs text-neutral-500">{r.hint}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
