import { ImageResponse } from "next/og";
import { calculators, getCalculator } from "@/lib/calculators";
import { SITE_NAME } from "@/lib/site";

export const alt = "Calculator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return calculators.map((c) => ({ vertical: c.vertical, slug: c.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}) {
  const { vertical, slug } = await params;
  const calc = getCalculator(vertical, slug);
  const title = calc?.name ?? "Calculator";
  const desc = calc?.description ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #0a0a0a 0%, #14294a 100%)",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 26,
            opacity: 0.7,
          }}
        >
          <span
            style={{
              background: "#2563eb",
              borderRadius: 10,
              padding: "6px 18px",
              marginRight: 18,
              fontWeight: 700,
            }}
          >
            {SITE_NAME}
          </span>
          <span>{calc?.vertical ?? ""}</span>
        </div>
        <div
          style={{
            fontSize: title.length > 30 ? 56 : 68,
            fontWeight: 800,
            lineHeight: 1.1,
            marginTop: 32,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 26,
            opacity: 0.7,
            marginTop: 28,
            lineHeight: 1.35,
            maxWidth: 900,
          }}
        >
          {desc.length > 110 ? desc.slice(0, 110) + "…" : desc}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 80,
            fontSize: 22,
            opacity: 0.5,
          }}
        >
          Free calculator — no sign-up
        </div>
      </div>
    ),
    size,
  );
}
