import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalcCard } from "@/components/CalcCard";
import { getCalculatorsByVertical } from "@/lib/calculators";
import { getVertical, verticals } from "@/lib/verticals";

export function generateStaticParams() {
  return verticals.map((v) => ({ vertical: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const { vertical } = await params;
  const v = getVertical(vertical);
  if (!v) return {};
  return {
    title: v.title,
    description: v.description,
    alternates: { canonical: `/${v.slug}` },
  };
}

export default async function VerticalPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;
  const v = getVertical(vertical);
  if (!v) notFound();
  const calcs = getCalculatorsByVertical(vertical);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{v.title}</h1>
      <p className="mt-3 max-w-3xl text-lg text-neutral-600">{v.description}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calcs.map((c) => (
          <CalcCard key={c.slug} calc={c} />
        ))}
      </div>
    </div>
  );
}
