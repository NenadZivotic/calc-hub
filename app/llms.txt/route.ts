import { calculators } from "@/lib/calculators";
import { articles } from "@/lib/articles";
import { verticals } from "@/lib/verticals";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export function GET() {
  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE}.`,
    "",
    "All tools are free, run client-side where possible, and require no sign-up.",
    "",
  ];

  for (const v of verticals) {
    const calcs = calculators.filter((c) => c.vertical === v.slug);
    if (!calcs.length) continue;
    lines.push(`## ${v.name}`, "");
    for (const c of calcs) {
      lines.push(
        `- [${c.name}](${SITE_URL}/${c.vertical}/${c.slug}): ${c.description}`,
      );
    }
    lines.push("");
  }

  if (articles.length) {
    lines.push("## Guides", "");
    for (const a of articles) {
      lines.push(`- [${a.title}](${SITE_URL}/learn/${a.slug}): ${a.description}`);
    }
    lines.push("");
  }

  lines.push(
    "## Site",
    "",
    `- [About](${SITE_URL}/about)`,
    `- [Sitemap](${SITE_URL}/sitemap.xml)`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
