import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          background: "linear-gradient(135deg, #0a0a0a 0%, #1e3a5f 100%)",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 16 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
          Know your real numbers
        </div>
        <div style={{ fontSize: 30, opacity: 0.75, marginTop: 24 }}>
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    size,
  );
}
