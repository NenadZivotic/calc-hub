import type { CalculatorDef, ResultItem } from "../types";
import { num } from "../../format";

const LITE_REPO = "https://github.com/NenadZivotic/lite-agent-skills";
const AGENSI = (slug: string) => `https://agensi.io/skills/${slug}`;

const UPDATED = "2026-10-19";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const mask = (s: string) => `${s.slice(0, 4)}… (len=${s.length})`;

function parseHeaders(text: string): Map<string, string> {
  const h = new Map<string, string>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("HTTP/") || !line.includes(":")) continue;
    const i = line.indexOf(":");
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    h.set(k, h.has(k) ? `${h.get(k)}, ${v}` : v);
  }
  return h;
}

function noInput(): ResultItem[] {
  return [
    {
      label: "Waiting",
      value: "Paste content above",
      hint: "The tool runs instantly, entirely in your browser.",
      tone: "primary",
      wide: true,
    },
  ];
}

const sevTone = (s: string): ResultItem["tone"] =>
  s === "fail" ? "bad" : s === "warn" ? "primary" : "good";

/* ------------------------------------------------------------------ */
/* 1. JWT decoder                                                      */
/* ------------------------------------------------------------------ */

function b64uJson(part: string): unknown {
  let s = part.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return JSON.parse(atob(s));
}

const ts = (n: unknown) => {
  const d = new Date(Number(n) * 1000);
  return Number.isFinite(d.getTime())
    ? d.toISOString().replace("T", " ").replace(".000Z", " UTC")
    : String(n);
};

function computeJwt(v: Record<string, number | string>): ResultItem[] {
  const raw = String(v.token ?? "").trim();
  if (!raw) return noInput();
  const tok = raw.replace(/^Bearer\s+/i, "");
  const parts = tok.split(".");
  if (parts.length !== 3)
    return [
      {
        label: "Invalid",
        value: `Expected 3 segments, got ${parts.length}`,
        tone: "bad",
        wide: true,
      },
    ];

  let header: Record<string, unknown>, claims: Record<string, unknown>;
  try {
    header = b64uJson(parts[0]) as Record<string, unknown>;
    claims = b64uJson(parts[1]) as Record<string, unknown>;
  } catch {
    return [
      {
        label: "Invalid",
        value: "Segments are not base64url-encoded JSON",
        tone: "bad",
        wide: true,
      },
    ];
  }

  const out: ResultItem[] = [
    {
      label: "Status",
      value: "Decodes OK (signature not verified)",
      tone: "good",
      hint: "Decoding is not verification — a valid decode says nothing about trust.",
    },
    {
      label: "Algorithm",
      value: String(header.alg ?? "—"),
      mono: true,
      tone:
        header.alg === "none" || String(header.alg).startsWith("HS")
          ? "primary"
          : "default",
      hint:
        header.alg === "none"
          ? "alg=none is dangerous — reject it server-side."
          : undefined,
    },
    { label: "Type", value: String(header.typ ?? "JWT"), mono: true },
  ];

  if (claims.exp != null) {
    const exp = Number(claims.exp) * 1000;
    const expired = exp < Date.now();
    out.push({
      label: "Expires",
      value: `${ts(claims.exp)}${expired ? " — EXPIRED" : ""}`,
      tone: expired ? "bad" : "good",
      wide: true,
    });
  } else {
    out.push({
      label: "Expires",
      value: "No exp claim — token never expires",
      tone: "primary",
      wide: true,
      hint: "Tokens without expiry are a risk; rotate on suspicion.",
    });
  }
  if (claims.iat != null)
    out.push({ label: "Issued at", value: ts(claims.iat), wide: true });
  if (claims.nbf != null)
    out.push({ label: "Not before", value: ts(claims.nbf), wide: true });
  if (claims.iss != null)
    out.push({
      label: "Issuer",
      value: String(claims.iss),
      mono: true,
      wide: true,
    });
  if (claims.sub != null)
    out.push({
      label: "Subject",
      value: String(claims.sub),
      mono: true,
      wide: true,
    });
  if (claims.aud != null)
    out.push({
      label: "Audience",
      value: String(claims.aud),
      mono: true,
      wide: true,
    });

  out.push({
    label: "All claims",
    value: JSON.stringify(claims, null, 2),
    mono: true,
    wide: true,
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* 2. Dockerfile security lint                                         */
/* ------------------------------------------------------------------ */

const DF_SECRET =
  /(secret|token|key|password|passwd|pwd|api[-_]?key|credential|private)/i;

function computeDockerfile(v: Record<string, number | string>): ResultItem[] {
  const text = String(v.dockerfile ?? "");
  if (!text.trim()) return noInput();

  const findings: {
    id: string;
    severity: "fail" | "warn";
    line: number | null;
    detail: string;
    fix: string;
  }[] = [];
  let hasUser = false;
  const stages = new Set<string>();

  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const n = i + 1;

    const from = line.match(/^FROM\s+(\S+)(?:\s+AS\s+(\S+))?/i);
    if (from) {
      const img = from[1];
      if (from[2]) stages.add(from[2].toLowerCase());
      const isStageRef = stages.has(img.toLowerCase()) || img === "scratch";
      if (!isStageRef && (!img.includes(":") || /:latest$/i.test(img)))
        findings.push({
          id: "image-latest",
          severity: "warn",
          line: n,
          detail: `mutable base image "${img}"`,
          fix: "pin a specific tag or digest",
        });
      return;
    }
    if (/^USER\s+/i.test(line)) {
      hasUser = true;
      return;
    }
    const env = line.match(/^(?:ENV|ARG)\s+([A-Za-z_][\w]*)[=\s]+(\S+)/i);
    if (env && DF_SECRET.test(env[1]) && !/^\$\{?[\w]+\}?$/.test(env[2]))
      findings.push({
        id: "baked-secret",
        severity: "fail",
        line: n,
        detail: `${env[1]} assigned a literal value (${mask(env[2])})`,
        fix: "use BuildKit --secret or runtime env; rotate the exposed value",
      });
    if (
      /^RUN\s+/i.test(line) &&
      /(curl|wget)[^|]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/i.test(line)
    )
      findings.push({
        id: "run-curl-sh",
        severity: "fail",
        line: n,
        detail: "piping a remote script straight into a shell",
        fix: "download, checksum-verify, then execute",
      });
    if (/^ADD\s+https?:\/\//i.test(line))
      findings.push({
        id: "add-remote",
        severity: "warn",
        line: n,
        detail: "ADD fetches a remote URL with no integrity check",
        fix: "use RUN curl + checksum, or COPY a vendored file",
      });
  });

  if (!hasUser)
    findings.push({
      id: "root-user",
      severity: "warn",
      line: null,
      detail: "no USER directive — container runs as root",
      fix: "add a non-root USER",
    });

  const fails = findings.filter((f) => f.severity === "fail").length;
  const warns = findings.filter((f) => f.severity === "warn").length;
  const out: ResultItem[] = [
    {
      label: "Verdict",
      value: findings.length
        ? `${fails} fail · ${warns} warn`
        : "Clean — no top-5 issues found",
      tone: findings.length ? (fails ? "bad" : "primary") : "good",
      wide: true,
    },
  ];
  for (const f of findings)
    out.push({
      label: `${f.severity.toUpperCase()} ${f.line != null ? `· line ${f.line}` : ""} · ${f.id}`,
      value: f.detail,
      hint: `Fix: ${f.fix}`,
      tone: sevTone(f.severity),
      wide: true,
    });
  return out;
}

/* ------------------------------------------------------------------ */
/* 3. Security headers checker                                         */
/* ------------------------------------------------------------------ */

const HEADER_CHECKS = [
  {
    id: "hsts",
    names: ["strict-transport-security"],
    hint: "add Strict-Transport-Security: max-age=31536000; includeSubDomains",
  },
  {
    id: "content-security-policy",
    names: ["content-security-policy"],
    hint: "add a Content-Security-Policy (start with default-src 'self')",
  },
  {
    id: "x-frame-options",
    names: ["x-frame-options", "content-security-policy"],
    match: /frame-ancestors|deny|sameorigin/i,
    hint: "add X-Frame-Options: DENY or a CSP frame-ancestors directive",
  },
  {
    id: "x-content-type-options",
    names: ["x-content-type-options"],
    hint: "add X-Content-Type-Options: nosniff",
  },
  {
    id: "referrer-policy",
    names: ["referrer-policy"],
    hint: "add Referrer-Policy: strict-origin-when-cross-origin",
  },
  {
    id: "permissions-policy",
    names: ["permissions-policy"],
    hint: "add Permissions-Policy to disable unused browser features",
  },
];

function computeHeaders(v: Record<string, number | string>): ResultItem[] {
  const text = String(v.headers ?? "");
  if (!text.trim()) return noInput();
  const h = parseHeaders(text);
  if (!h.size)
    return [
      {
        label: "Nothing parsed",
        value: "No header lines found",
        tone: "bad",
        wide: true,
        hint: 'Paste raw response headers, one "Name: value" per line (copy from DevTools → Network).',
      },
    ];

  const out: ResultItem[] = [];
  let pass = 0,
    bad = 0;
  const push = (
    id: string,
    status: "pass" | "warn" | "fail",
    detail: string,
  ) => {
    if (status === "pass") pass++;
    else bad++;
    out.push({
      label: `${status.toUpperCase()} · ${id}`,
      value: detail,
      tone: status === "pass" ? "good" : sevTone(status),
      wide: true,
    });
  };

  for (const r of HEADER_CHECKS) {
    const present =
      r.names.some((n) => h.has(n)) &&
      (!("match" in r && r.match) ||
        r.names.some((n) =>
          (r as { match?: RegExp }).match!.test(h.get(n) ?? ""),
        ));
    push(r.id, present ? "pass" : "warn", present ? "present" : r.hint);
  }

  const server = h.get("server");
  if (server && /[\d.]/.test(server))
    push(
      "server-disclosure",
      "warn",
      `Server reveals a version: ${server.slice(0, 40)}`,
    );
  else push("server-disclosure", "pass", "no version leaked in Server header");

  const sc = h.get("set-cookie");
  if (sc) {
    const missing: string[] = [];
    if (!/secure/i.test(sc)) missing.push("Secure");
    if (!/httponly/i.test(sc)) missing.push("HttpOnly");
    if (!/samesite/i.test(sc)) missing.push("SameSite");
    push(
      "cookie-flags",
      missing.length ? "fail" : "pass",
      missing.length
        ? `missing flags: ${missing.join(", ")}`
        : "Secure + HttpOnly + SameSite set",
    );
  }

  out.unshift({
    label: "Verdict",
    value: `${pass} pass · ${bad} need attention`,
    tone: bad ? "primary" : "good",
    wide: true,
    hint: `${h.size} headers parsed`,
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* 4. .env parity checker                                              */
/* ------------------------------------------------------------------ */

function parseEnv(text: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    m.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
  }
  return m;
}

function computeEnvParity(v: Record<string, number | string>): ResultItem[] {
  const envText = String(v.env ?? "");
  const exText = String(v.example ?? "");
  if (!envText.trim() && !exText.trim()) return noInput();
  const env = parseEnv(envText);
  const ex = parseEnv(exText);
  if (!env.size || !ex.size)
    return [
      {
        label: "Nothing parsed",
        value: `${env.size} keys in .env, ${ex.size} in .env.example`,
        tone: "bad",
        wide: true,
        hint: "Paste KEY=value lines into both boxes. Values never leave your browser.",
      },
    ];

  const missingInEnv = [...ex.keys()].filter((k) => !env.has(k));
  const extraInEnv = [...env.keys()].filter((k) => !ex.has(k));
  const emptyRequired = [...env.keys()].filter(
    (k) => env.get(k) === "" || env.get(k) === '""' || env.get(k) === "''",
  );
  const drift = missingInEnv.length + emptyRequired.length;

  const out: ResultItem[] = [
    {
      label: "Verdict",
      value:
        drift === 0 ? "In sync" : `${drift} drift issue${drift > 1 ? "s" : ""}`,
      tone: drift === 0 ? "good" : "bad",
      wide: true,
      hint: `${env.size} keys in .env · ${ex.size} in .env.example`,
    },
  ];
  if (missingInEnv.length)
    out.push({
      label: `Missing in .env (${missingInEnv.length})`,
      value: missingInEnv.join("\n"),
      mono: true,
      wide: true,
      tone: "bad",
      hint: "Documented but not set — the app will likely crash or misbehave.",
    });
  if (emptyRequired.length)
    out.push({
      label: `Set but empty (${emptyRequired.length})`,
      value: emptyRequired.join("\n"),
      mono: true,
      wide: true,
      tone: "primary",
      hint: "Key present with an empty value — often a half-finished setup.",
    });
  if (extraInEnv.length)
    out.push({
      label: `Extra in .env (${extraInEnv.length})`,
      value: extraInEnv.join("\n"),
      mono: true,
      wide: true,
      hint: "Set but undocumented — add to .env.example or remove.",
    });
  return out;
}

/* ------------------------------------------------------------------ */
/* 5. CORS config checker                                              */
/* ------------------------------------------------------------------ */

function computeCors(v: Record<string, number | string>): ResultItem[] {
  const text = String(v.headers ?? "");
  if (!text.trim()) return noInput();
  const h = parseHeaders(text);
  if (!h.size)
    return [
      {
        label: "Nothing parsed",
        value: "No headers found",
        tone: "bad",
        wide: true,
        hint: "Paste the response headers of a preflight or API request.",
      },
    ];

  const acao = h.get("access-control-allow-origin");
  const acac =
    (h.get("access-control-allow-credentials") ?? "").toLowerCase() === "true";
  const findings: {
    id: string;
    sev: "fail" | "warn" | "info";
    d: string;
    fix: string;
  }[] = [];
  const push = (
    id: string,
    sev: "fail" | "warn" | "info",
    d: string,
    fix: string,
  ) => findings.push({ id, sev, d, fix });

  if (acao === "*") {
    if (acac)
      push(
        "wildcard-with-credentials",
        "fail",
        "ACAO is * with credentials=true — invalid per spec, signals broken CORS logic",
        "never combine * with credentials; use an explicit allowlist",
      );
    else
      push(
        "wildcard-origin",
        "info",
        "ACAO is * — fine for public data, wrong for authenticated endpoints",
        "confirm the endpoint serves only public data",
      );
  }
  if (acao === "null")
    push(
      "null-origin-accepted",
      "warn",
      "ACAO is null — sandboxed iframes and redirects send Origin: null",
      "reject null unless a documented flow needs it",
    );
  if (acao && acao !== "*" && acao !== "null") {
    try {
      new URL(acao);
      if (acac)
        push(
          "reflected-with-credentials",
          "warn",
          `ACAO "${acao}" + credentials — safe only if this origin is on an allowlist; if reflected from the request, any site can read authenticated responses`,
          "verify the origin is allowlisted and Vary: Origin is set",
        );
    } catch {
      push(
        "acao-not-origin",
        "warn",
        `ACAO "${acao}" is not a valid origin`,
        "return a scheme://host[:port] value",
      );
    }
  }
  if (acac && !acao)
    push(
      "credentials-without-acao",
      "warn",
      "ACAC true but no ACAO — credentials flag has no effect alone",
      "pair with an allowlisted ACAO",
    );
  if (h.get("access-control-allow-headers") === "*")
    push(
      "allow-headers-wildcard",
      "info",
      "ACAH is * — any custom header can be sent",
      "restrict if the API doesn't need arbitrary headers",
    );
  if (acao && acao !== "*" && !/origin/i.test(h.get("vary") ?? ""))
    push(
      "missing-vary-origin",
      "warn",
      "dynamic ACAO without Vary: Origin — caches may serve the wrong origin",
      "add Vary: Origin",
    );

  const worst = findings.some((f) => f.sev === "fail")
    ? "bad"
    : findings.some((f) => f.sev === "warn")
      ? "primary"
      : "good";
  const out: ResultItem[] = [
    {
      label: "Verdict",
      value: findings.length
        ? `${findings.length} finding${findings.length > 1 ? "s" : ""}`
        : "No dangerous combinations",
      tone: findings.length ? worst : "good",
      wide: true,
      hint: acao
        ? `ACAO: ${acao} · credentials: ${acac}`
        : "No Access-Control-Allow-Origin header present",
    },
  ];
  for (const f of findings)
    out.push({
      label: `${f.sev.toUpperCase()} · ${f.id}`,
      value: f.d,
      hint: `Fix: ${f.fix}`,
      tone: f.sev === "info" ? "default" : sevTone(f.sev),
      wide: true,
    });
  return out;
}

/* ------------------------------------------------------------------ */
/* 6. Secret leak scanner                                              */
/* ------------------------------------------------------------------ */

const LEAK_PATTERNS = [
  { id: "aws-access-key", re: /AKIA[0-9A-Z]{16}/g },
  { id: "github-token", re: /gh[pousr]_[A-Za-z0-9]{20,}/g },
  { id: "slack-token", re: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { id: "private-key-block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  {
    id: "generic-api-key",
    re: /(?:api[_-]?key|apikey|secret|token|password|passwd)\s*[:=]\s*["']?([A-Za-z0-9_/+\-.]{16,})["']?/gi,
  },
  {
    id: "bearer-jwt",
    re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g,
  },
];

function computeLeaks(v: Record<string, number | string>): ResultItem[] {
  const text = String(v.code ?? "");
  if (!text.trim()) return noInput();

  const findings: { line: number; pattern: string; fp: string }[] = [];
  const diffMode = text
    .split("\n")
    .some((l) => l.startsWith("+++") || l.startsWith("@@"));

  text.split("\n").forEach((line, i) => {
    if (diffMode && !line.startsWith("+")) return;
    if (line.startsWith("+++")) return;
    for (const p of LEAK_PATTERNS) {
      p.re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = p.re.exec(line)))
        findings.push({
          line: i + 1,
          pattern: p.id,
          fp: mask(m[1] ?? m[0]),
        });
    }
  });

  const out: ResultItem[] = [
    {
      label: "Verdict",
      value: findings.length
        ? `${findings.length} potential secret${findings.length > 1 ? "s" : ""} found`
        : "No secrets detected",
      tone: findings.length ? "bad" : "good",
      wide: true,
      hint: diffMode
        ? "Diff detected — only added (+) lines were scanned."
        : "Whole input scanned. Matched values are masked, never shown in full.",
    },
  ];
  for (const f of findings)
    out.push({
      label: `line ${f.line} · ${f.pattern}`,
      value: f.fp,
      mono: true,
      tone: "bad",
      wide: true,
      hint: "Rotate it now — treat anything committed or pasted as compromised.",
    });
  return out;
}

/* ------------------------------------------------------------------ */
/* 7. GitHub Actions security audit                                    */
/* ------------------------------------------------------------------ */

function computeWorkflow(v: Record<string, number | string>): ResultItem[] {
  const text = String(v.workflow ?? "");
  if (!text.trim()) return noInput();

  const findings: {
    id: string;
    sev: "fail" | "warn";
    line: number;
    d: string;
    fix: string;
  }[] = [];
  const push = (
    id: string,
    sev: "fail" | "warn",
    line: number,
    d: string,
    fix: string,
  ) => findings.push({ id, sev, line, d, fix });

  const lines = text.split("\n");
  const isPRTarget = /pull_request_target/.test(text);
  const checksOutHead =
    /ref:\s*\$\{\{\s*github\.(event\.pull_request\.head\.(sha|ref)|head_ref)/.test(
      text,
    );

  lines.forEach((line, i) => {
    const n = i + 1;
    const uses = line.match(/uses:\s*([^\s#]+)/);
    if (uses && !uses[1].startsWith("./")) {
      const ref = uses[1].split("@")[1];
      if (!ref || !/^[0-9a-f]{40}$/i.test(ref))
        push(
          "unpinned-action",
          "fail",
          n,
          `${uses[1]} not pinned to a commit SHA`,
          "pin to the full SHA, keep the version as a comment",
        );
    }
    if (
      /\$\{\{\s*secrets\.[\w]+\s*\}\}/.test(line) &&
      /run:|echo|print/i.test(line)
    )
      push(
        "secret-in-run",
        "warn",
        n,
        "secret referenced inside a run step — can leak into logs",
        "pass via env: or prefer OIDC over long-lived secrets",
      );
    if (/permissions:\s*write-all/.test(line))
      push(
        "broad-permissions",
        "warn",
        n,
        "permissions: write-all",
        "scope to least privilege per job",
      );
    if (
      /run:.*\$\{\{\s*github\.event\.(issue\.title|issue\.body|comment|pull_request\.title|pull_request\.body|review|discussion)/.test(
        line,
      )
    )
      push(
        "script-injection",
        "fail",
        n,
        "attacker-controlled github.event.* interpolated into run:",
        "assign to an env var first, never inline into shell",
      );
  });
  if (isPRTarget && checksOutHead) {
    const n = lines.findIndex((l) => /ref:\s*\$\{\{/.test(l)) + 1;
    push(
      "pull-request-target",
      "fail",
      n,
      "pull_request_target + checkout of PR head runs fork code with repo secrets",
      "use pull_request or split trusted/untrusted jobs",
    );
  }

  const fails = findings.filter((f) => f.sev === "fail").length;
  const warns = findings.filter((f) => f.sev === "warn").length;
  const out: ResultItem[] = [
    {
      label: "Verdict",
      value: findings.length
        ? `${fails} fail · ${warns} warn`
        : "Clean — no top-5 risks found",
      tone: findings.length ? (fails ? "bad" : "primary") : "good",
      wide: true,
    },
  ];
  for (const f of findings)
    out.push({
      label: `${f.sev.toUpperCase()} · line ${f.line} · ${f.id}`,
      value: f.d,
      hint: `Fix: ${f.fix}`,
      tone: sevTone(f.sev),
      wide: true,
    });
  return out;
}

/* ------------------------------------------------------------------ */
/* 7. AI search readiness (GEO) audit                                  */
/* ------------------------------------------------------------------ */

interface RobotsGroup {
  uas: string[];
  allow: string[];
  disallow: string[];
}

function parseRobots(text: string): {
  groups: RobotsGroup[];
  sitemaps: string[];
} {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let cur: RobotsGroup = { uas: [], allow: [], disallow: [] };
  let curHasRules = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(\S*)/i);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (curHasRules) {
        groups.push(cur);
        cur = { uas: [], allow: [], disallow: [] };
        curHasRules = false;
      }
      cur.uas.push(value.toLowerCase());
    } else if (field === "sitemap") {
      sitemaps.push(value);
    } else if (field === "allow" || field === "disallow") {
      if (!cur.uas.length) continue;
      cur[field].push(value);
      curHasRules = true;
    }
  }
  if (cur.uas.length) groups.push(cur);
  return { groups, sitemaps };
}

type Access = "allowed" | "blocked" | "unlisted";

function botAccess(bot: string, groups: RobotsGroup[]): Access {
  const b = bot.toLowerCase();
  const g =
    groups.find((gr) => gr.uas.includes(b)) ??
    groups.find((gr) => gr.uas.includes("*"));
  if (!g) return "unlisted";
  if (g.disallow.includes("/") && !g.allow.includes("/")) return "blocked";
  return "allowed";
}

const AI_BOTS: { engine: string; bots: string[] }[] = [
  { engine: "ChatGPT search", bots: ["OAI-SearchBot", "ChatGPT-User"] },
  { engine: "OpenAI training", bots: ["GPTBot"] },
  { engine: "Claude", bots: ["ClaudeBot", "Claude-User", "Claude-SearchBot"] },
  { engine: "Perplexity", bots: ["PerplexityBot", "Perplexity-User"] },
  { engine: "Google AI", bots: ["Googlebot"] },
];

/** Bots whose block actually costs you citations — training bots excluded. */
const TRAINING_ONLY = new Set(["gptbot", "claudebot"]);

type CheckStatus = "pass" | "warn" | "fail" | "info";

interface Check {
  label: string;
  status: CheckStatus;
  value: string;
  hint?: string;
  wide?: boolean;
  mono?: boolean;
}

const statusTone = (s: CheckStatus): ResultItem["tone"] =>
  s === "fail"
    ? "bad"
    : s === "warn"
      ? "primary"
      : s === "info"
        ? "default"
        : "good";

function computeAiReadiness(v: Record<string, number | string>): ResultItem[] {
  const html = String(v.html ?? "").trim();
  const robots = String(v.robots ?? "").trim();
  const llms = String(v.llms ?? "").trim();
  if (!html && !robots && !llms) return noInput();

  const checks: Check[] = [];

  /* robots.txt — can AI crawlers reach you at all? */
  if (robots) {
    const { groups, sitemaps } = parseRobots(robots);
    const detail: string[] = [];
    const blockedBots: string[] = [];
    for (const e of AI_BOTS) {
      const sts = e.bots.map((b) => ({ bot: b, st: botAccess(b, groups) }));
      for (const { bot, st } of sts)
        if (st === "blocked") blockedBots.push(bot);
      detail.push(
        `${e.engine}: ${sts.some((s) => s.st === "blocked") ? "BLOCKED" : sts.some((s) => s.st === "unlisted") ? "not listed" : "open"}`,
      );
    }
    const blockedCritical = blockedBots.filter(
      (b) => !TRAINING_ONLY.has(b.toLowerCase()),
    );
    const blockedTraining = blockedBots.filter((b) =>
      TRAINING_ONLY.has(b.toLowerCase()),
    );
    checks.push({
      label: "AI crawler access",
      status: blockedCritical.length ? "fail" : "pass",
      value: blockedBots.length
        ? `Blocked: ${blockedBots.join(", ")}`
        : "No AI crawlers blocked",
      hint: blockedCritical.length
        ? "These bots power AI answers — if they can't fetch your page, you can't be cited. Paste-ready fix below."
        : detail.join(" · ") +
          (blockedTraining.length
            ? " — training-only blocks, fine if intentional"
            : ""),
      wide: true,
    });
    if (blockedCritical.length) {
      checks.push({
        label: "Paste-ready robots.txt fix",
        status: "info",
        value: blockedCritical
          .map((b) => `User-agent: ${b}\nAllow: /\n`)
          .join("\n"),
        hint: "Append to robots.txt — a bot-specific group overrides the * wildcard group.",
        wide: true,
        mono: true,
      });
    }
    checks.push({
      label: "Sitemap declared",
      status: sitemaps.length ? "pass" : "warn",
      value: sitemaps.length ? sitemaps[0] : "No Sitemap: directive",
      hint: sitemaps.length
        ? undefined
        : "Add `Sitemap: https://yoursite.com/sitemap.xml` to robots.txt — AI and classic crawlers both use it for discovery.",
    });
  } else {
    checks.push({
      label: "robots.txt",
      status: "info",
      value: "Not provided",
      hint: "Paste the contents of https://yoursite.com/robots.txt to check whether AI crawlers (OAI-SearchBot, ClaudeBot, PerplexityBot…) can reach your pages.",
      wide: true,
    });
  }

  /* HTML — can an answer engine extract a citable answer? */
  if (html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const q = (sel: string) => doc.querySelector(sel);
    const qa = (sel: string) => [...doc.querySelectorAll(sel)];

    const title = q("title")?.textContent?.trim() ?? "";
    checks.push({
      label: "<title> tag",
      status: !title ? "fail" : title.length <= 65 ? "pass" : "warn",
      value: title ? `${title.length} chars` : "Missing",
      hint: !title
        ? "Every citable page needs a clear title."
        : title.length > 65
          ? "Trim under ~60 chars — answer engines lift short, declarative titles cleanly."
          : undefined,
    });

    const metaDesc =
      q('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
    checks.push({
      label: "Meta description",
      status: metaDesc ? "pass" : "warn",
      value: metaDesc ? `${metaDesc.length} chars` : "Missing",
      hint: metaDesc
        ? undefined
        : "Often used as the answer snippet — write a 1–2 sentence declarative summary of the page.",
    });

    const canonical = q('link[rel="canonical"]')?.getAttribute("href") ?? "";
    checks.push({
      label: "Canonical URL",
      status: canonical ? "pass" : "warn",
      value: canonical || "Missing",
      hint: canonical
        ? undefined
        : "Without a canonical, AI engines may cite a duplicate or parameter-laden version of the page.",
    });

    const h1s = qa("h1");
    checks.push({
      label: "Single H1",
      status: h1s.length === 1 ? "pass" : "warn",
      value: `${h1s.length} found`,
      hint:
        h1s.length === 1
          ? undefined
          : "Answer engines extract the page's core claim from one clear H1 — multiples dilute it.",
    });

    const types = new Set<string>();
    let hasDate = false;
    let hasAuthor = false;
    let badLd = 0;
    const walk = (n: unknown): void => {
      if (Array.isArray(n)) return void n.forEach(walk);
      if (!n || typeof n !== "object") return;
      const o = n as Record<string, unknown>;
      const t = o["@type"];
      if (typeof t === "string") types.add(t);
      if (Array.isArray(t)) t.forEach((x) => types.add(String(x)));
      if ("datePublished" in o || "dateModified" in o) hasDate = true;
      if ("author" in o || "publisher" in o) hasAuthor = true;
      Object.values(o).forEach(walk);
    };
    for (const s of qa('script[type="application/ld+json"]')) {
      try {
        walk(JSON.parse(s.textContent ?? ""));
      } catch {
        badLd++;
      }
    }
    checks.push({
      label: "Structured data (JSON-LD)",
      status: types.size ? "pass" : "fail",
      value: types.size
        ? [...types].slice(0, 6).join(", ") + (types.size > 6 ? "…" : "")
        : "None found",
      hint:
        (types.size
          ? undefined
          : "Add Organization / Article / FAQPage JSON-LD — structured data is what answer engines parse most reliably.") +
        (badLd
          ? ` ${badLd} block(s) failed to parse — validate your JSON-LD.`
          : ""),
      wide: true,
    });
    checks.push({
      label: "FAQPage schema",
      status: types.has("FAQPage") ? "pass" : "warn",
      value: types.has("FAQPage") ? "Present" : "No FAQPage markup",
      hint: types.has("FAQPage")
        ? undefined
        : "Q&A blocks are the most quotable format for answer engines — mark your FAQ section up with FAQPage JSON-LD.",
    });

    const qHeads = qa("h2,h3").filter((h) =>
      /\?\s*$/.test(h.textContent?.trim() ?? ""),
    );
    checks.push({
      label: "Question headings",
      status: qHeads.length >= 2 ? "pass" : "warn",
      value: `${qHeads.length} found`,
      hint:
        qHeads.length >= 2
          ? undefined
          : "H2/H3 phrased as questions (“How much does X cost?”) match how people prompt AI — engines lift those sections.",
    });

    const firstP =
      qa("p")
        .map((p) => p.textContent?.trim() ?? "")
        .find((t) => t.length > 0) ?? "";
    const answerish = firstP.length >= 40 && firstP.length <= 400;
    checks.push({
      label: "Answer-first opening",
      status: answerish ? "pass" : "warn",
      value: firstP ? `${firstP.length} chars` : "No <p> found",
      hint: answerish
        ? undefined
        : "Lead with a 1–2 sentence direct answer before the backstory — AI extracts the first clear statement on the page.",
    });

    const tables = qa("table").length;
    const lists = qa("ul,ol").length;
    const words = (doc.body?.textContent ?? "")
      .split(/\s+/)
      .filter(Boolean).length;
    checks.push({
      label: "Extractable content",
      status: words >= 300 && (tables > 0 || lists > 0) ? "pass" : "warn",
      value: `${words} words · ${tables} tables · ${lists} lists`,
      hint:
        words < 300
          ? "Thin pages are rarely cited — aim for a substantive answer."
          : !tables && !lists
            ? "Tables and lists give answer engines liftable structure — pricing tables and steps get quoted often."
            : undefined,
    });

    const timeEls = qa("time[datetime]").length;
    checks.push({
      label: "Freshness signals",
      status: hasDate || timeEls ? "pass" : "warn",
      value: hasDate
        ? "Dates in JSON-LD"
        : timeEls
          ? `${timeEls} <time> elements`
          : "No dates found",
      hint:
        hasDate || timeEls
          ? undefined
          : "Engines prefer fresh sources — expose datePublished/dateModified in JSON-LD or a <time> element.",
    });
    checks.push({
      label: "Authorship / entity",
      status: hasAuthor ? "pass" : "warn",
      value: hasAuthor ? "author/publisher declared" : "None declared",
      hint: hasAuthor
        ? undefined
        : "A named author + Organization entity helps answer engines trust and attribute the source.",
    });
  } else {
    checks.push({
      label: "Page HTML",
      status: "info",
      value: "Not provided",
      hint: "Open the page → Ctrl+U (view source) → copy all → paste above to run the content checks.",
      wide: true,
    });
  }

  /* llms.txt */
  if (llms) {
    const hasH1 = /^#\s+\S/m.test(llms);
    const hasQuote = /^>\s+\S/m.test(llms);
    const links = (llms.match(/\]\(https?:\/\//g) ?? []).length;
    checks.push({
      label: "llms.txt",
      status: hasH1 && links > 0 ? "pass" : "warn",
      value: `${links} links${hasH1 ? "" : " · missing # title"}${hasQuote ? "" : " · missing > summary"}`,
      hint:
        hasH1 && links > 0
          ? undefined
          : "A valid llms.txt needs a # title, a > blockquote summary, and markdown links to your canonical pages.",
      wide: true,
    });
  } else {
    checks.push({
      label: "llms.txt",
      status: "warn",
      value: "Not provided",
      hint: "Create /llms.txt — a markdown index telling AI crawlers which pages are your canonical sources. Starter below if you pasted your HTML.",
      wide: true,
    });
    if (html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const t = doc.querySelector("title")?.textContent?.trim() ?? "";
      const desc =
        doc
          .querySelector('meta[name="description"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const canon =
        doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ??
        "https://yoursite.com/";
      const brand = (t.split(/[|—–·]/).pop() ?? t).trim() || "Site name";
      const page = (t.split(/[|—–·]/).shift() ?? t).trim() || "Home";
      checks.push({
        label: "llms.txt starter",
        status: "info",
        value:
          `# ${brand}\n\n` +
          `> ${desc || "One-sentence summary of what this site offers."}\n\n` +
          `## Pages\n\n` +
          `- [${page}](${canon})${desc ? `: ${desc}` : ""}`,
        hint: "Save as /llms.txt at your domain root, then add one link per page worth citing.",
        wide: true,
        mono: true,
      });
    }
  }

  const scored = checks.filter((c) => c.status !== "info");
  const pts = scored.reduce(
    (a, c) => a + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0),
    0,
  );
  const score: ResultItem = {
    label: "AI-search readiness score",
    value: `${Math.round(pts * 2) / 2} / ${scored.length}`,
    tone:
      pts >= scored.length * 0.85
        ? "good"
        : pts >= scored.length * 0.55
          ? "primary"
          : "bad",
    hint: "Each card below is one check — fails first, ordered by impact.",
    wide: true,
  };

  return [
    score,
    ...checks.map((c) => ({
      label: c.label,
      value: c.value,
      tone: statusTone(c.status),
      hint: c.hint,
      wide: c.wide,
      mono: c.mono,
    })),
  ];
}

/* ------------------------------------------------------------------ */
/* 8. JSON formatter & validator                                       */
/* ------------------------------------------------------------------ */

function jsonDepth(n: unknown, d = 1): number {
  if (Array.isArray(n))
    return n.length ? Math.max(...n.map((x) => jsonDepth(x, d + 1))) : d;
  if (n && typeof n === "object")
    return Math.max(
      d,
      ...Object.values(n as Record<string, unknown>).map((x) =>
        jsonDepth(x, d + 1),
      ),
    );
  return d;
}

function countKeys(n: unknown): number {
  if (Array.isArray(n)) return n.reduce((a, x) => a + countKeys(x), 0);
  if (n && typeof n === "object")
    return (
      Object.keys(n as object).length +
      Object.values(n as Record<string, unknown>).reduce(
        (a: number, x) => a + countKeys(x),
        0,
      )
    );
  return 0;
}

function computeJson(v: Record<string, number | string>): ResultItem[] {
  const raw = String(v.json ?? "");
  if (!raw.trim()) return noInput();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const posM = msg.match(/position\s+(\d+)/i);
    let loc = "";
    if (posM) {
      const pos = Number(posM[1]);
      const upto = raw.slice(0, pos);
      const line = upto.split("\n").length;
      const col = pos - upto.lastIndexOf("\n");
      loc = ` — near line ${line}, column ${col}`;
    }
    return [
      {
        label: "Invalid JSON",
        value: msg + loc,
        tone: "bad",
        wide: true,
        hint: "Common causes: trailing commas, single quotes, unquoted keys, or a truncated paste.",
      },
    ];
  }

  const formatted = JSON.stringify(parsed, null, 2);
  const topKeys = Array.isArray(parsed)
    ? `array of ${parsed.length} item${parsed.length === 1 ? "" : "s"}`
    : parsed && typeof parsed === "object"
      ? `object with ${Object.keys(parsed as object).length} top-level key${Object.keys(parsed as object).length === 1 ? "" : "s"}`
      : `scalar ${typeof parsed}`;
  return [
    { label: "Valid JSON", value: topKeys, tone: "good", wide: true },
    {
      label: "Stats",
      value: `${countKeys(parsed)} total keys · depth ${jsonDepth(parsed)} · ${new Blob([raw]).size} B → ${new Blob([formatted]).size} B`,
      wide: true,
    },
    { label: "Formatted", value: formatted, mono: true, wide: true },
  ];
}

/* ------------------------------------------------------------------ */
/* 9. Cron expression parser                                           */
/* ------------------------------------------------------------------ */

const CRON_NAMES: Record<number, string> = {
  3: "month/day-of-month",
  4: "month",
  5: "day-of-week (0–6, 0=Sun)",
};

function cronField(
  field: string,
  min: number,
  max: number,
): Set<number> | null {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    const m = part.match(/^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/);
    if (!m) return null;
    let lo = m[1] === "*" ? min : Number(m[1]);
    let hi = m[2] ? Number(m[2]) : m[1] === "*" ? max : lo;
    const step = m[3] ? Number(m[3]) : 1;
    if (lo < min || hi > max || lo > hi || step < 1) return null;
    for (let x = lo; x <= hi; x += step) out.add(x);
  }
  return out;
}

function computeCron(v: Record<string, number | string>): ResultItem[] {
  const expr = String(v.expression ?? "").trim();
  if (!expr) return noInput();
  const fields = expr.split(/\s+/);
  if (fields.length !== 5)
    return [
      {
        label: "Invalid",
        value: `Expected 5 fields (min hour day month weekday), got ${fields.length}`,
        tone: "bad",
        wide: true,
        hint: "This parser reads the standard 5-field cron format — @daily and 6/7-field variants aren't supported.",
      },
    ];

  const ranges: [number, number][] = [
    [0, 59],
    [0, 23],
    [1, 31],
    [1, 12],
    [0, 7],
  ];
  const sets: Set<number>[] = [];
  for (let i = 0; i < 5; i++) {
    const s = cronField(fields[i], ranges[i][0], ranges[i][1]);
    if (!s)
      return [
        {
          label: "Invalid",
          value: `Field ${i + 1} ("${fields[i]}") can't be parsed`,
          tone: "bad",
          wide: true,
          hint: `Field ${i + 1} is the ${CRON_NAMES[i] ?? "field"} — allowed range ${ranges[i][0]}–${ranges[i][1]}.`,
        },
      ];
    sets.push(s);
  }
  const domRestricted = fields[2] !== "*";
  const dowRestricted = fields[4] !== "*";
  // Standard cron: when BOTH dom and dow are restricted, match is OR
  const dowMatch = (d: Date) => {
    const dow = d.getDay();
    const domOk = sets[2].has(d.getDate());
    const dowOk = sets[4].has(dow) || (dow === 0 && sets[4].has(7));
    return domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk;
  };

  const runs: string[] = [];
  const t = new Date(Date.now() + 60_000);
  t.setSeconds(0, 0);
  for (let i = 0; i < 366 * 24 * 60 && runs.length < 5; i++) {
    const d = new Date(t.getTime() + i * 60_000);
    if (
      sets[0].has(d.getMinutes()) &&
      sets[1].has(d.getHours()) &&
      sets[3].has(d.getMonth() + 1) &&
      dowMatch(d)
    )
      runs.push(
        d.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
  }

  const plain: string[] = [];
  const [fMin, fHour, fDom, fMon, fDow] = fields;
  if (expr === "* * * * *") plain.push("Every minute");
  else if (fMin !== "*" && fHour === "*")
    plain.push(`Every hour at minute ${fMin}`);
  else if (fDom === "*" && fMon === "*" && fDow === "*")
    plain.push(`Daily at ${fHour.padStart(2, "0")}:${fMin.padStart(2, "0")}`);
  else if (fDom === "*" && fMon === "*")
    plain.push(
      `On day-of-week ${fDow} at ${fHour.padStart(2, "0")}:${fMin.padStart(2, "0")}`,
    );
  else if (fDow === "*" && fMon === "*")
    plain.push(
      `On day ${fDom} of each month at ${fHour.padStart(2, "0")}:${fMin.padStart(2, "0")}`,
    );
  else plain.push("See the next runs below for the concrete schedule");

  return [
    {
      label: "In plain English",
      value: plain[0],
      tone: "primary",
      wide: true,
      hint:
        domRestricted && dowRestricted
          ? "Note: day-of-month and day-of-week both set — cron ORs them, not ANDs."
          : undefined,
    },
    {
      label: "Next 5 runs (your local time)",
      value: runs.length ? runs.join("\n") : "No run found within a year",
      mono: true,
      wide: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 10. Regex tester                                                    */
/* ------------------------------------------------------------------ */

function computeRegex(v: Record<string, number | string>): ResultItem[] {
  const pattern = String(v.pattern ?? "");
  const text = String(v.text ?? "");
  if (!pattern && !text) return noInput();
  if (!pattern)
    return [
      {
        label: "Waiting",
        value: "Enter a pattern",
        tone: "primary",
        wide: true,
      },
    ];

  let re: RegExp;
  try {
    re = new RegExp(pattern, String(v.flags ?? "g"));
  } catch (e) {
    return [
      {
        label: "Invalid pattern",
        value: e instanceof Error ? e.message : String(e),
        tone: "bad",
        wide: true,
      },
    ];
  }

  const matches: { m: string; idx: number; groups: string[] }[] = [];
  if (re.global) {
    let mm: RegExpExecArray | null;
    let guard = 0;
    while ((mm = re.exec(text)) && matches.length < 100 && guard++ < 1000) {
      matches.push({
        m: mm[0],
        idx: mm.index,
        groups: mm.slice(1).map(String),
      });
      if (mm[0] === "") re.lastIndex++;
    }
  } else {
    const mm = re.exec(text);
    if (mm)
      matches.push({
        m: mm[0],
        idx: mm.index,
        groups: mm.slice(1).map(String),
      });
  }

  const out: ResultItem[] = [
    {
      label: "Verdict",
      value: `${matches.length} match${matches.length === 1 ? "" : "es"}`,
      tone: matches.length ? "good" : "bad",
      wide: true,
      hint: `/${pattern}/${String(v.flags ?? "g")} against ${text.length} chars`,
    },
  ];
  for (const [i, mm] of matches.slice(0, 20).entries())
    out.push({
      label: `Match ${i + 1} @ index ${mm.idx}`,
      value: mm.m,
      mono: true,
      wide: true,
      hint: mm.groups.length ? `groups: ${mm.groups.join(" | ")}` : undefined,
    });
  if (matches.length > 20)
    out.push({
      label: "…",
      value: `+${matches.length - 20} more matches (showing first 20)`,
      wide: true,
    });
  return out;
}

/* ------------------------------------------------------------------ */
/* 11. Base64 encoder / decoder                                        */
/* ------------------------------------------------------------------ */

function b64encode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function b64decode(s: string): string {
  const bin = atob(s.replace(/\s+/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function computeBase64(v: Record<string, number | string>): ResultItem[] {
  const input = String(v.input ?? "");
  if (!input) return noInput();
  if (String(v.mode) === "decode") {
    try {
      const out = b64decode(input);
      return [
        { label: "Decoded", value: out, mono: true, wide: true, tone: "good" },
        {
          label: "Stats",
          value: `${input.replace(/\s+/g, "").length} b64 chars → ${new TextEncoder().encode(out).length} bytes`,
          wide: true,
        },
      ];
    } catch {
      return [
        {
          label: "Invalid Base64",
          value: "Input can't be decoded — bad characters or wrong padding",
          tone: "bad",
          wide: true,
          hint: "Whitespace is ignored. Base64URL (- and _ instead of + and /) is common in JWTs — swap the characters first.",
        },
      ];
    }
  }
  const out = b64encode(input);
  return [
    { label: "Encoded", value: out, mono: true, wide: true, tone: "good" },
    {
      label: "Stats",
      value: `${new TextEncoder().encode(input).length} bytes → ${out.length} chars (~33% size increase)`,
      wide: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 12. URL encoder / decoder / analyzer                                */
/* ------------------------------------------------------------------ */

function computeUrl(v: Record<string, number | string>): ResultItem[] {
  const input = String(v.input ?? "").trim();
  if (!input) return noInput();
  const mode = String(v.mode ?? "analyze");

  if (mode === "encode")
    return [
      {
        label: "Encoded",
        value: encodeURIComponent(input),
        mono: true,
        wide: true,
        tone: "good",
        hint: "encodeURIComponent — safe for query-string values, encodes / : & = ?",
      },
    ];
  if (mode === "decode") {
    try {
      return [
        {
          label: "Decoded",
          value: decodeURIComponent(input),
          mono: true,
          wide: true,
          tone: "good",
        },
      ];
    } catch {
      return [
        {
          label: "Invalid",
          value: "Malformed percent-encoding",
          tone: "bad",
          wide: true,
          hint: "Each % must be followed by two hex digits.",
        },
      ];
    }
  }

  try {
    const u = new URL(input);
    const out: ResultItem[] = [
      { label: "Protocol", value: u.protocol.replace(":", "") },
      { label: "Host", value: u.hostname, mono: true },
      { label: "Path", value: u.pathname, mono: true, wide: true },
    ];
    if (u.port) out.push({ label: "Port", value: u.port, mono: true });
    const params = [...u.searchParams.entries()];
    out.push({
      label: `Query params (${params.length})`,
      value: params.length
        ? params.map(([k, val]) => `${k} = ${val}`).join("\n")
        : "none",
      mono: true,
      wide: true,
      hint: "Values shown already percent-decoded",
    });
    if (u.hash)
      out.push({ label: "Fragment", value: u.hash.slice(1), mono: true });
    return out;
  } catch {
    return [
      {
        label: "Not a valid URL",
        value: "Can't parse — needs a scheme like https://",
        tone: "bad",
        wide: true,
        hint: "Try https://example.com/path?a=1 — or switch the mode to encode/decode.",
      },
    ];
  }
}

/* ------------------------------------------------------------------ */
/* 13. UUID generator                                                  */
/* ------------------------------------------------------------------ */

function computeUuid(v: Record<string, number | string>): ResultItem[] {
  const count = Math.min(50, Math.max(1, Math.round(Number(v.count) || 10)));
  const upper = String(v.format) === "upper";
  const uuids = Array.from({ length: count }, () => crypto.randomUUID());
  const list = upper ? uuids.map((u) => u.toUpperCase()) : uuids;
  return [
    {
      label: `${count} UUID${count > 1 ? "s" : ""} (v4, random)`,
      value: list.join("\n"),
      mono: true,
      wide: true,
      tone: "good",
      hint: "Generated with crypto.randomUUID() — cryptographically secure, ~2^122 possible values.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 14. Color converter                                                 */
/* ------------------------------------------------------------------ */

function parseColor(raw: string): { r: number; g: number; b: number } | null {
  const s = raw.trim().toLowerCase();
  const hex = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = s.match(/^rgba?\((\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  const hsl = s.match(/^hsla?\((\d+)[\s,]+(\d+)%?[\s,]+(\d+)%?/);
  if (hsl) {
    const h = (Number(hsl[1]) % 360) / 360,
      s2 = Number(hsl[2]) / 100,
      l = Number(hsl[3]) / 100;
    const q = l < 0.5 ? l * (1 + s2) : l + s2 - l * s2;
    const p = 2 * l - q;
    const hue = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return {
      r: Math.round(hue(h + 1 / 3) * 255),
      g: Math.round(hue(h) * 255),
      b: Math.round(hue(h - 1 / 3) * 255),
    };
  }
  return null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h =
    max === rn
      ? (gn - bn) / d + (gn < bn ? 6 : 0)
      : max === gn
        ? (bn - rn) / d + 2
        : (rn - gn) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

function luminance(r: number, g: number, b: number): number {
  const f = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function computeColor(v: Record<string, number | string>): ResultItem[] {
  const input = String(v.color ?? "");
  if (!input.trim()) return noInput();
  const c = parseColor(input);
  if (!c)
    return [
      {
        label: "Not a color",
        value: "Can't parse that input",
        tone: "bad",
        wide: true,
        hint: "Accepted: #3b82f6, #48f, rgb(59,130,246), hsl(217,91%,60%)",
      },
    ];
  const hex = `#${[c.r, c.g, c.b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
  const lum = luminance(c.r, c.g, c.b);
  const contrastWhite = (1.05 / (lum + 0.05)).toFixed(2);
  const contrastBlack = ((lum + 0.05) / 0.05).toFixed(2);
  return [
    { label: "HEX", value: hex, mono: true, tone: "primary" },
    {
      label: "RGB",
      value: `rgb(${c.r}, ${c.g}, ${c.b})`,
      mono: true,
    },
    {
      label: "HSL",
      value: `hsl(${h}, ${s}%, ${l}%)`,
      mono: true,
    },
    {
      label: "Contrast vs white text",
      value: `${contrastWhite}:1`,
      tone: Number(contrastWhite) >= 4.5 ? "good" : "bad",
      hint: "WCAG AA needs ≥4.5:1",
    },
    {
      label: "Contrast vs black text",
      value: `${contrastBlack}:1`,
      tone: Number(contrastBlack) >= 4.5 ? "good" : "bad",
      hint: "WCAG AA needs ≥4.5:1",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 15. Unix timestamp converter                                        */
/* ------------------------------------------------------------------ */

function relTime(ms: number): string {
  const s = Math.round(Math.abs(ms) / 1000);
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let v = s,
    u = "second";
  for (const [f, name] of units) {
    if (v < f) {
      u = name;
      break;
    }
    v /= f;
    u = name;
  }
  const n = Math.max(1, Math.round(v));
  const plural = n === 1 ? u : u + "s";
  return ms >= 0 ? `in ${n} ${plural}` : `${n} ${plural} ago`;
}

function computeTimestamp(v: Record<string, number | string>): ResultItem[] {
  const input = String(v.input ?? "").trim();
  if (!input) return noInput();

  let d: Date | null = null;
  if (/^-?\d{9,15}$/.test(input)) {
    const n = Number(input);
    // Auto-detect unit by magnitude: s (1e9-1e10), ms (1e12-1e13), µs (1e15)
    if (input.length <= 10) d = new Date(n * 1000);
    else if (input.length <= 13) d = new Date(n);
    else d = new Date(n / 1000);
  } else {
    const p = Date.parse(input);
    if (!Number.isNaN(p)) d = new Date(p);
  }
  if (!d || Number.isNaN(d.getTime()))
    return [
      {
        label: "Can't parse",
        value: "Not a timestamp or a readable date",
        tone: "bad",
        wide: true,
        hint: "Accepted: 1715000000 (s), 1715000000000 (ms), or a date like '2026-10-19 14:30'",
      },
    ];

  const ms = d.getTime();
  return [
    {
      label: "ISO 8601 (UTC)",
      value: d.toISOString(),
      mono: true,
      wide: true,
      tone: "primary",
    },
    { label: "Unix seconds", value: String(Math.floor(ms / 1000)), mono: true },
    { label: "Milliseconds", value: String(ms), mono: true },
    {
      label: "Relative",
      value: relTime(ms - Date.now()),
      tone: "primary",
    },
    {
      label: "Local time",
      value: d.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      wide: true,
    },
    {
      label: "Now",
      value: `${Math.floor(Date.now() / 1000)} (s)`,
      mono: true,
      hint: "current Unix timestamp at compute time",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 16. Text diff checker                                               */
/* ------------------------------------------------------------------ */

function computeDiff(v: Record<string, number | string>): ResultItem[] {
  const a = String(v.before ?? "");
  const b = String(v.after ?? "");
  if (!a.trim() && !b.trim()) return noInput();
  const al = a.split("\n");
  const bl = b.split("\n");
  if (al.length > 1500 || bl.length > 1500)
    return [
      {
        label: "Too large",
        value: "Inputs capped at 1,500 lines each",
        tone: "bad",
        wide: true,
        hint: "For big diffs use git diff locally.",
      },
    ];

  const n = al.length,
    m = bl.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] =
        al[i] === bl[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const rows: { t: "same" | "add" | "del"; s: string }[] = [];
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (al[i] === bl[j]) {
      rows.push({ t: "same", s: "  " + al[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ t: "del", s: "- " + al[i] });
      i++;
    } else {
      rows.push({ t: "add", s: "+ " + bl[j] });
      j++;
    }
  }
  while (i < n) rows.push({ t: "del", s: "- " + al[i++] });
  while (j < m) rows.push({ t: "add", s: "+ " + bl[j++] });

  const adds = rows.filter((r) => r.t === "add").length;
  const dels = rows.filter((r) => r.t === "del").length;
  const changed = adds + dels;
  return [
    {
      label: "Verdict",
      value: changed ? `+${adds} / −${dels} lines changed` : "Identical",
      tone: changed ? "primary" : "good",
      wide: true,
      hint: `${n} → ${m} lines`,
    },
    {
      label: "Diff",
      value: rows.map((r) => r.s).join("\n"),
      mono: true,
      wide: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 17. Word counter                                                    */
/* ------------------------------------------------------------------ */

function computeWordCount(v: Record<string, number | string>): ResultItem[] {
  const text = String(v.text ?? "");
  if (!text.trim()) return noInput();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?…]+/).filter((s) => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chars = text.length;
  const noSpaces = text.replace(/\s/g, "").length;
  const freq = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase().replace(/[^\w'-]/g, "");
    if (k) freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const readMin = words.length / 200;
  return [
    { label: "Words", value: num(words.length), tone: "primary" },
    {
      label: "Characters",
      value: num(chars),
      hint: `${num(noSpaces)} without spaces`,
    },
    { label: "Sentences", value: num(sentences.length) },
    { label: "Paragraphs", value: num(paragraphs.length) },
    {
      label: "Reading time",
      value:
        readMin < 1
          ? `${Math.ceil(readMin * 60)}s`
          : `~${readMin.toFixed(1)} min`,
      hint: "at 200 wpm average",
    },
    {
      label: "Top words",
      value: top.map(([w, c]) => `${w} ×${c}`).join("  ·  ") || "—",
      wide: true,
      mono: true,
      hint: "most frequent — keyword stuffing check for SEO",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 18. Text case converter                                             */
/* ------------------------------------------------------------------ */

function wordsOf(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const titleCase = (ws: string[]) =>
  ws.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

function computeCase(v: Record<string, number | string>): ResultItem[] {
  const input = String(v.input ?? "");
  if (!input.trim()) return noInput();
  const ws = wordsOf(input);
  if (!ws.length)
    return [
      {
        label: "No words found",
        value: "Letters and digits only",
        tone: "bad",
        wide: true,
      },
    ];
  return [
    {
      label: "camelCase",
      value: ws[0] + titleCase(ws.slice(1)).replace(/ /g, ""),
      mono: true,
    },
    { label: "PascalCase", value: titleCase(ws).replace(/ /g, ""), mono: true },
    { label: "snake_case", value: ws.join("_"), mono: true },
    { label: "kebab-case", value: ws.join("-"), mono: true },
    { label: "SCREAMING_SNAKE", value: ws.join("_").toUpperCase(), mono: true },
    { label: "Title Case", value: titleCase(ws), mono: true },
  ];
}

/* ------------------------------------------------------------------ */
/* 19. Number base converter                                           */
/* ------------------------------------------------------------------ */

function computeBase(v: Record<string, number | string>): ResultItem[] {
  const input = String(v.input ?? "")
    .trim()
    .toLowerCase();
  if (!input) return noInput();
  let n: bigint | null = null;
  try {
    if (
      /^0x[0-9a-f]+$/.test(input) ||
      (/^[0-9a-f]+$/.test(input) && /[a-f]/.test(input))
    )
      n = BigInt("0x" + input.replace(/^0x/, ""));
    else if (/^0b[01]+$/.test(input)) n = BigInt(input);
    else if (/^0o[0-7]+$/.test(input)) n = BigInt(input);
    else if (/^-?\d+$/.test(input)) n = BigInt(input);
  } catch {
    n = null;
  }
  if (n === null)
    return [
      {
        label: "Can't parse",
        value: "Not a recognizable number",
        tone: "bad",
        wide: true,
        hint: "Accepted: decimal 255, hex 0xff or ff (with letters), binary 0b1010, octal 0o17",
      },
    ];
  const hex = n < 0n ? "-0x" + (-n).toString(16) : "0x" + n.toString(16);
  return [
    { label: "Decimal", value: n.toString(10), mono: true, tone: "primary" },
    { label: "Hex", value: hex, mono: true },
    {
      label: "Binary",
      value: (n < 0n ? "-" : "") + "0b" + (n < 0n ? -n : n).toString(2),
      mono: true,
      wide: true,
    },
    {
      label: "Octal",
      value: (n < 0n ? "-" : "") + "0o" + (n < 0n ? -n : n).toString(8),
      mono: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 20. Aspect ratio calculator                                         */
/* ------------------------------------------------------------------ */

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

function computeAspect(v: Record<string, number | string>): ResultItem[] {
  const w = Number(v.width) || 0;
  const h = Number(v.height) || 0;
  const newW = Number(v.newWidth) || 0;
  const newH = Number(v.newHeight) || 0;
  if (w <= 0 || h <= 0)
    return [
      {
        label: "Waiting",
        value: "Enter width and height",
        tone: "primary",
        wide: true,
      },
    ];
  const g = gcd(Math.round(w), Math.round(h));
  const rw = Math.round(w) / g,
    rh = Math.round(h) / g;
  const out: ResultItem[] = [
    { label: "Aspect ratio", value: `${rw}:${rh}`, tone: "primary" },
    {
      label: "As decimal",
      value: (w / h).toFixed(4),
      hint: "width ÷ height",
    },
  ];
  if (newW > 0)
    out.push({
      label: `At ${Math.round(newW)}px wide`,
      value: `${Math.round(newW)} × ${Math.round((newW * h) / w)}px`,
      tone: "good",
      hint: "height scaled to keep the ratio",
    });
  if (newH > 0)
    out.push({
      label: `At ${Math.round(newH)}px tall`,
      value: `${Math.round((newH * w) / h)} × ${Math.round(newH)}px`,
      tone: "good",
      hint: "width scaled to keep the ratio",
    });
  return out;
}

/* ------------------------------------------------------------------ */
/* 21. Lorem ipsum generator                                           */
/* ------------------------------------------------------------------ */

const LOREM =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
    " ",
  );

function loremPara(seed: number, sentences: number): string {
  const parts: string[] = [];
  for (let s = 0; s < sentences; s++) {
    const len = 6 + ((seed * 7 + s * 11) % 9);
    const start = (seed * 13 + s * 29) % LOREM.length;
    const ws = Array.from(
      { length: len },
      (_, i) => LOREM[(start + i) % LOREM.length],
    );
    const sent = ws.join(" ");
    parts.push(sent[0].toUpperCase() + sent.slice(1) + ".");
  }
  return parts.join(" ");
}

function computeLorem(v: Record<string, number | string>): ResultItem[] {
  const paras = Math.min(
    20,
    Math.max(1, Math.round(Number(v.paragraphs) || 3)),
  );
  const text = Array.from({ length: paras }, (_, i) =>
    loremPara(i, 3 + (i % 3)),
  ).join("\n\n");
  return [
    {
      label: `${paras} paragraph${paras > 1 ? "s" : ""}`,
      value: text,
      mono: true,
      wide: true,
      tone: "good",
      hint: `${text.split(/\s+/).filter(Boolean).length} words · deterministic output, safe for mockups`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Definitions                                                         */
/* ------------------------------------------------------------------ */

const PRIVACY_NOTE =
  "Everything runs locally in your browser — pasted content is never uploaded, logged or stored.";

export const devtoolsCalculators: CalculatorDef[] = [
  {
    slug: "jwt-decoder",
    vertical: "devtools",
    name: "JWT Decoder",
    title: "JWT Decoder — Decode JSON Web Tokens Online",
    seoTitle: "JWT Decoder Online — Free, Private, No Upload",
    description:
      "Paste a JWT and instantly see its header, claims and expiry — decoded entirely in your browser. No upload, no sign-up, nothing leaves your device.",
    keywords: [
      "jwt decoder",
      "decode jwt online",
      "json web token decoder",
      "jwt debugger",
      "jwt expiry checker",
      "decode jwt without uploading",
    ],
    fields: [
      {
        key: "token",
        label: 'JWT (with or without the "Bearer " prefix)',
        type: "textarea",
        rows: 5,
        default: "",
        placeholder: "eyJhbGciOiJIUzI1NiIs…",
        help: PRIVACY_NOTE,
      },
    ],
    compute: computeJwt,
    assumptions: [
      "Decode-only: the signature is NOT verified — a decoded token can still be forged.",
      "Timestamps (exp, iat, nbf) are interpreted as Unix seconds per RFC 7519.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "RFC 7519 — JSON Web Token",
        url: "https://www.rfc-editor.org/rfc/rfc7519",
      },
      {
        label: "Free CLI version on GitHub",
        url: `${LITE_REPO}/tree/main/jwt-inspector-lite`,
      },
      { label: "Full JWT inspector agent skill", url: AGENSI("jwt-inspector") },
    ],
    sections: [
      {
        heading: "What a JWT actually is",
        paragraphs: [
          "A JSON Web Token is three base64url-encoded segments joined by dots: header, payload and signature. The header states the algorithm (alg) and type. The payload carries claims — registered ones like iss (issuer), sub (subject), aud (audience), exp (expiry) and iat (issued-at), plus any custom claims the issuer adds.",
          "Decoding reads the first two segments. It proves nothing about authenticity — anyone can craft a token with arbitrary claims. Always verify the signature and the issuer's keys server-side before trusting any claim.",
        ],
      },
      {
        heading: "Common red flags to look for",
        paragraphs: [
          'An alg of "none" or a weak symmetric algorithm like HS256 where a public algorithm was expected, a missing exp claim (the token never expires), an iat far in the past combined with no rotation policy, and sensitive data in claims — payloads are only base64, never encrypted, so anything placed in them is readable by anyone who holds the token.',
          "If you found this token in a log file, a commit or a paste, treat it as compromised and ask the issuer to revoke or rotate it.",
        ],
      },
    ],
    faq: [
      {
        q: "Is it safe to paste a JWT here?",
        a: "Yes — decoding happens entirely in your browser with JavaScript. The token is never sent over the network, which you can verify in DevTools → Network. That said, treat every decoded token as sensitive and never paste production tokens into tools that do upload.",
      },
      {
        q: "Why does it say 'signature not verified'?",
        a: "Verification requires the issuer's secret or public key and an active validation of claims. This tool only decodes — it's for inspection and debugging, not authentication.",
      },
      {
        q: "The token has three parts but won't decode — why?",
        a: "Segments must be base64url-encoded JSON. Tokens that are encrypted (JWE, five segments), opaque reference tokens, or truncated copies will fail to decode.",
      },
      {
        q: "What does 'expired' mean for a token?",
        a: "The exp claim is in the past. Well-behaved APIs reject expired tokens — if yours still accepts them, that's a bug worth reporting.",
      },
    ],
    related: [
      "secret-leak-scanner",
      "security-headers-checker",
      "cors-config-checker",
    ],
    updatedAt: UPDATED,
  },

  {
    slug: "dockerfile-security-lint",
    vertical: "devtools",
    name: "Dockerfile Security Lint",
    title: "Dockerfile Security Linter — Top-5 Container Risks",
    seoTitle: "Dockerfile Security Linter — Free Browser-Based Check",
    description:
      "Paste a Dockerfile and get an instant security review: baked secrets, unpinned base images, root containers, curl-pipe-to-shell and remote ADD — all checked locally.",
    keywords: [
      "dockerfile linter",
      "docker security check",
      "dockerfile security scanner",
      "container security",
      "dockerfile best practices",
    ],
    fields: [
      {
        key: "dockerfile",
        label: "Dockerfile contents",
        type: "textarea",
        rows: 12,
        default: "",
        placeholder: "FROM node:20\nWORKDIR /app\n…",
        help: PRIVACY_NOTE,
      },
    ],
    compute: computeDockerfile,
    assumptions: [
      "Checks the five highest-impact rules: literal secrets in ENV/ARG, mutable or untagged base images, missing USER (root), curl|wget piped to a shell, and ADD of remote URLs.",
      "Multi-stage builds are understood — stage aliases and 'scratch' are not flagged as unpinned.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "OWASP Docker Security Cheat Sheet",
        url: "https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html",
      },
      {
        label: "Free CLI version on GitHub",
        url: `${LITE_REPO}/tree/main/docker-security-lint-lite`,
      },
      {
        label: "Full Docker audit agent skill (20+ rules)",
        url: AGENSI("docker-security-audit"),
      },
    ],
    sections: [
      {
        heading: "Why these five rules",
        paragraphs: [
          "Most container-image compromises trace back to a short list of mistakes: a credential baked into a layer (visible to anyone who pulls the image), a :latest tag that silently changes under you, a process running as root, an install script piped into a shell with no integrity check, or ADD quietly fetching remote code.",
          "This linter focuses on exactly those. The full audit in the agent skill adds healthchecks, exposed ports, package pinning, .dockerignore coverage and more — but fixing these five removes most of the real-world risk.",
        ],
      },
      {
        heading: "What 'baked secret' means in practice",
        paragraphs: [
          "ENV API_KEY=abc123 looks harmless, but every image layer — including the one containing that value — is shipped to every registry that hosts the image. Deleting the line later does not remove it from history. Use BuildKit secrets (--mount=type=secret) for build-time credentials and runtime environment injection for the rest, and rotate anything that was ever committed.",
        ],
      },
    ],
    faq: [
      {
        q: "Does it run my Dockerfile or contact a registry?",
        a: "No — it's a static pattern check on the pasted text. Nothing is executed or fetched.",
      },
      {
        q: "Is a FROM myorg/base:latest really a problem?",
        a: "Yes for reproducibility and supply-chain safety — the tag can be repointed at any time. Pin to a digest (@sha256:…) for deploys that matter.",
      },
      {
        q: "My base image is a scratch or a stage alias and it's still flagged?",
        a: "It shouldn't be — stage aliases defined by earlier FROM … AS lines and 'scratch' are recognized. If you hit a false positive, the open-source CLI version is the reference implementation to file against.",
      },
    ],
    related: [
      "secret-leak-scanner",
      "github-actions-security-audit",
      "security-headers-checker",
    ],
    updatedAt: UPDATED,
  },

  {
    slug: "security-headers-checker",
    vertical: "devtools",
    name: "Security Headers Checker",
    title: "HTTP Security Headers Checker — Grade Your Response",
    seoTitle: "Security Headers Checker — Free HTTP Header Audit",
    description:
      "Paste HTTP response headers and instantly see which security headers are missing — HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy — plus cookie flag and Server version checks.",
    keywords: [
      "security headers checker",
      "http security headers test",
      "strict transport security check",
      "content security policy checker",
      "x-frame-options test",
    ],
    fields: [
      {
        key: "headers",
        label: "Response headers (one per line)",
        type: "textarea",
        rows: 10,
        default: "",
        placeholder: "HTTP/2 200\ncontent-type: text/html\nset-cookie: sid=…",
        help:
          "Copy from DevTools → Network → Headers, or `curl -sI <your-site>`. " +
          PRIVACY_NOTE,
      },
    ],
    compute: computeHeaders,
    assumptions: [
      "Checks the six headers with the widest protection coverage, plus Server-version disclosure and Set-Cookie flags (Secure, HttpOnly, SameSite).",
      "X-Frame-Options passes if either the header is present or CSP frame-ancestors covers it.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "OWASP Secure Headers Project",
        url: "https://owasp.org/www-project-secure-headers/",
      },
      {
        label: "Free CLI version on GitHub",
        url: `${LITE_REPO}/tree/main/http-header-audit-lite`,
      },
      {
        label: "Full header audit agent skill",
        url: AGENSI("http-header-audit"),
      },
    ],
    sections: [
      {
        heading: "Why paste headers instead of entering a URL?",
        paragraphs: [
          "URL-based scanners see only what a remote fetch returns — often a CDN or WAF response rather than your app's real headers, and frequently blocked by bot protection. Pasting the raw response from your own browser or curl shows exactly what real users receive.",
          "It also keeps private endpoints private: staging URLs and internal dashboards never need to be typed into a third-party scanner.",
        ],
      },
      {
        heading: "Start with the cheap wins",
        paragraphs: [
          "X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin and X-Frame-Options: DENY are one-line changes with zero risk to functionality. HSTS and a Content-Security-Policy take more care — roll CSP out in Report-Only mode first to see what would break.",
        ],
      },
    ],
    faq: [
      {
        q: "Where do I copy the headers from?",
        a: "In Chrome/Firefox: F12 → Network → click a request → Headers → Response headers. Or run curl -sI https://yoursite.com and paste the output.",
      },
      {
        q: "Is a missing header an active vulnerability?",
        a: "Not by itself — it removes a defense layer. Missing clickjacking or MIME-sniffing protections only matter when combined with another weakness, but they're trivially cheap to add.",
      },
      {
        q: "My CDN sets some headers — which ones should my app set?",
        a: "Whatever reaches the client last wins. Check the final response the browser sees (what you pasted here) — that is the effective set.",
      },
    ],
    related: ["cors-config-checker", "secret-leak-scanner", "jwt-decoder"],
    updatedAt: UPDATED,
  },

  {
    slug: "env-parity-checker",
    vertical: "devtools",
    name: ".env Parity Checker",
    title: ".env vs .env.example Parity Checker — Find Config Drift",
    seoTitle: ".env Parity Checker — Compare Env Files Privately",
    description:
      "Paste your .env and .env.example to instantly find missing keys, empty values and undocumented extras. Values never leave your browser — only key names are compared.",
    keywords: [
      "env file checker",
      "env example compare",
      "dotenv diff",
      "environment variable checker",
      "config drift detector",
    ],
    fields: [
      {
        key: "env",
        label: "Your .env",
        type: "textarea",
        rows: 8,
        default: "",
        placeholder: "DATABASE_URL=postgres://…\nAPI_KEY=…",
        help: PRIVACY_NOTE,
      },
      {
        key: "example",
        label: "Your .env.example",
        type: "textarea",
        rows: 8,
        default: "",
        placeholder: "DATABASE_URL=\nAPI_KEY=",
      },
    ],
    compute: computeEnvParity,
    assumptions: [
      "Only key names are compared — values are never displayed in results.",
      "Keys present in .env with an empty value count as drift (present but unfinished).",
      "Comment lines (#) and lines without '=' are ignored, matching dotenv conventions.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "Free CLI version on GitHub",
        url: `${LITE_REPO}/tree/main/env-config-audit-lite`,
      },
      {
        label: "Full env config audit agent skill",
        url: AGENSI("env-config-audit"),
      },
    ],
    sections: [
      {
        heading: "Why env drift breaks deploys",
        paragraphs: [
          "The classic production incident: a developer adds STRIPE_WEBHOOK_SECRET locally, forgets to document it in .env.example, and the next deploy crashes because the key was never set in CI. The mirror image is just as common — keys documented in the example that nobody sets, leaving features silently disabled.",
          "Key-parity checking catches both directions. Run it before every release, or wire the CLI version into a pre-commit hook or CI job so drift fails the build instead of the deploy.",
        ],
      },
    ],
    faq: [
      {
        q: "Do my secret values get uploaded?",
        a: "No — the comparison runs in your browser and results show key names only. You can disconnect from the internet and the tool still works.",
      },
      {
        q: "What does 'extra in .env' mean?",
        a: "Keys set in your .env that don't appear in .env.example — undocumented configuration. Either add them to the example file or remove them; either way the example should reflect reality.",
      },
      {
        q: "What counts as 'empty'?",
        a: "A key with no value, or a literal \"\" or '' — usually a placeholder someone forgot to fill in.",
      },
    ],
    related: [
      "secret-leak-scanner",
      "github-actions-security-audit",
      "jwt-decoder",
    ],
    updatedAt: UPDATED,
  },

  {
    slug: "cors-config-checker",
    vertical: "devtools",
    name: "CORS Config Checker",
    title: "CORS Misconfiguration Checker — Dangerous Combinations",
    seoTitle: "CORS Checker — Find Misconfigured Access-Control Headers",
    description:
      "Paste your API's CORS response headers and detect dangerous setups: wildcard origins with credentials, null-origin acceptance, reflected origins and missing Vary: Origin.",
    keywords: [
      "cors checker",
      "cors misconfiguration",
      "access-control-allow-origin test",
      "cors security check",
      "cors vulnerability scanner",
    ],
    fields: [
      {
        key: "headers",
        label: "Response headers containing Access-Control-*",
        type: "textarea",
        rows: 8,
        default: "",
        placeholder:
          "access-control-allow-origin: *\naccess-control-allow-credentials: true",
        help:
          "From DevTools → Network, or curl -sI -H 'Origin: https://example.com' <endpoint>. " +
          PRIVACY_NOTE,
      },
    ],
    compute: computeCors,
    assumptions: [
      "Detects: wildcard+credentials, null origin, reflected origin with credentials, credentials without ACAO, wildcard allow-headers, and missing Vary: Origin on dynamic ACAO.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "PortSwigger — CORS vulnerabilities",
        url: "https://portswigger.net/web-security/cors",
      },
      {
        label: "Free CLI version on GitHub",
        url: `${LITE_REPO}/tree/main/cors-misconfig-check-lite`,
      },
      {
        label: "Full CORS audit agent skill",
        url: AGENSI("cors-misconfig-check"),
      },
    ],
    sections: [
      {
        heading: "The combination that actually bites",
        paragraphs: [
          "A single permissive header is rarely the problem — it's the combination. Access-Control-Allow-Origin: * alone is fine for public data. But pairing a reflected origin with Access-Control-Allow-Credentials: true means any website can make authenticated requests on behalf of your users and read the responses.",
          "The sneakiest variant is Origin reflection: the server copies whatever Origin the request sends into ACAO. If credentials are also allowed, the CORS policy is effectively absent — every origin becomes trusted.",
        ],
      },
      {
        heading: "Why Vary: Origin matters",
        paragraphs: [
          "When ACAO is dynamic (different origins get different answers), caches — both browsers' and CDNs' — can store and replay a response meant for one origin to another. Vary: Origin tells caches to key the entry by origin, preventing one visitor's permissive response from being served to everyone.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I capture the right headers?",
        a: "CORS decisions are made on the response to both preflight (OPTIONS) and actual requests. Paste headers from both if you can — or run: curl -sI -H 'Origin: https://evil.example' -X OPTIONS <endpoint>.",
      },
      {
        q: "Is ACAO: * ever OK?",
        a: "Yes — for genuinely public, unauthenticated data (public APIs, CDN assets, open datasets). It's a problem only when the endpoint serves user-specific or authenticated content.",
      },
      {
        q: "The checker says my reflected origin is a warning, not a fail?",
        a: "Reflection itself isn't proof of a bug — if your allowlist check happens before reflection you're fine. It's flagged because it's where real-world CORS bugs hide; verify the allowlist exists and that Vary: Origin is set.",
      },
    ],
    related: ["security-headers-checker", "jwt-decoder", "secret-leak-scanner"],
    updatedAt: UPDATED,
  },

  {
    slug: "secret-leak-scanner",
    vertical: "devtools",
    name: "Secret Leak Scanner",
    title: "Secret Leak Scanner — Find API Keys in Code & Diffs",
    seoTitle: "Secret Leak Scanner — Detect API Keys & Tokens in Code",
    description:
      "Paste code or a git diff and detect leaked credentials — AWS keys, GitHub and Slack tokens, private key blocks, hardcoded API keys and JWTs. Matched values are masked, never displayed.",
    keywords: [
      "secret scanner",
      "api key leak detector",
      "find secrets in code",
      "git diff secret scan",
      "credential leak checker",
      "aws key leak",
    ],
    fields: [
      {
        key: "code",
        label: "Code, config or git diff",
        type: "textarea",
        rows: 12,
        default: "",
        placeholder: "Paste a file, a `git diff`, or `git log -p` output…",
        help: "Diffs are scanned on added (+) lines only. " + PRIVACY_NOTE,
      },
    ],
    compute: computeLeaks,
    assumptions: [
      "Detects six high-confidence patterns: AWS access keys, GitHub tokens, Slack tokens, PEM private-key blocks, generic 'key = value' secrets, and JWTs.",
      "If the input looks like a unified diff, only added (+) lines are scanned — matching the behavior of pre-commit scanners.",
      "Matches are fingerprinted (first 4 chars + length), never shown in full.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "GitHub — About secret scanning",
        url: "https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning",
      },
      {
        label: "Free CLI version on GitHub",
        url: `${LITE_REPO}/tree/main/git-history-leak-check-lite`,
      },
      {
        label: "Full history-scan agent skill",
        url: AGENSI("secret-leak-scan"),
      },
    ],
    sections: [
      {
        heading: "A match means rotate, not just delete",
        paragraphs: [
          "If the scanner flags something that was ever committed, pushed, pasted in a ticket or logged — it's compromised regardless of whether anyone downloaded it. Deleting the line does nothing; the value lives in git history, CI logs and search indexes forever.",
          "The only remediation is revocation: rotate the key at the provider, then clean history as a secondary step. For full-history scanning across every commit and branch, the CLI version and the full agent skill cover much deeper patterns.",
        ],
      },
      {
        heading: "Where leaks actually happen",
        paragraphs: [
          "Not in .env files (everyone knows those) — but in test fixtures, example configs, debug logging, error messages that echo request headers, and 'temporary' debugging commits that land in main. Scanning diffs before merge catches exactly these.",
        ],
      },
    ],
    faq: [
      {
        q: "Does this upload my code?",
        a: "No — pattern matching runs entirely in your browser. Nothing is sent anywhere; scan production code safely.",
      },
      {
        q: "Why are matched values masked?",
        a: "So the tool itself can't leak your secret into screenshots, shared windows or logs. You get the first 4 characters and the length — enough to identify and rotate it.",
      },
      {
        q: "What about secrets this doesn't catch?",
        a: "High-entropy strings without recognizable prefixes (random passwords, some provider keys) need entropy-based scanning — that's what the full agent skill adds, along with git-history traversal.",
      },
    ],
    related: [
      "dockerfile-security-lint",
      "github-actions-security-audit",
      "jwt-decoder",
    ],
    updatedAt: UPDATED,
  },

  {
    slug: "github-actions-security-audit",
    vertical: "devtools",
    name: "GitHub Actions Security Audit",
    title: "GitHub Actions Security Audit — Top-5 Workflow Risks",
    seoTitle: "GitHub Actions Security Audit — Free Workflow Linter",
    description:
      "Paste a GitHub Actions workflow YAML and catch the top-5 CI/CD risks: unpinned actions, script injection, pull_request_target abuse, secrets in run steps and write-all permissions.",
    keywords: [
      "github actions security",
      "workflow security audit",
      "ci cd security scanner",
      "pull_request_target vulnerability",
      "unpinned actions checker",
    ],
    fields: [
      {
        key: "workflow",
        label: "Workflow YAML (.github/workflows/*.yml)",
        type: "textarea",
        rows: 14,
        default: "",
        placeholder: "name: ci\non: [push]\njobs:\n  build:…",
        help: PRIVACY_NOTE,
      },
    ],
    compute: computeWorkflow,
    assumptions: [
      "Checks: actions not pinned to a full commit SHA, github.event.* interpolated into run: (script injection), secrets referenced inside run steps, permissions: write-all, and pull_request_target combined with checkout of PR head.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "GitHub — Security hardening for Actions",
        url: "https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions",
      },
      {
        label: "Free CLI version on GitHub",
        url: `${LITE_REPO}/tree/main/ci-cd-security-audit-lite`,
      },
      {
        label: "Full CI/CD audit agent skill",
        url: AGENSI("ci-cd-security-audit"),
      },
    ],
    sections: [
      {
        heading: "Why unpinned actions are fail-level",
        paragraphs: [
          "uses: actions/checkout@v4 trusts whoever controls that tag. Tags can be moved — a compromised action maintainer (or a supply-chain attacker) can repoint v4 at malicious code, and your next run silently executes it with your repo's tokens and secrets. Pinning to a full commit SHA makes the code immutable; Dependabot can still bump it.",
          "The 2025 tj-actions compromise hit exactly this pattern — moved tags executing credential-theft code in thousands of pipelines.",
        ],
      },
      {
        heading: "The pull_request_target trap",
        paragraphs: [
          "pull_request_target runs the workflow from the base repo — with its secrets and write token — but it can still check out and run code from the attacker's fork. Anyone can open a PR; if your job does actions/checkout with the PR head SHA and then executes it, you've handed a stranger your secrets.",
          "The safe patterns: use pull_request for untrusted code, or split the workflow — a privileged job that never checks out PR code, and an unprivileged one that does.",
        ],
      },
    ],
    faq: [
      {
        q: "Is ${{ secrets.X }} in a run step always bad?",
        a: "Interpolation into the shell means the value appears in the process command line and can be echoed into logs. Passing it via env: keeps it out of the command string — safer, though the real fix for cloud access is OIDC.",
      },
      {
        q: "My action is from github.com/actions — still needs pinning?",
        a: "First-party actions are lower-risk, but pinning everything is simpler than maintaining a trust list — and it protects you if a repo is transferred.",
      },
      {
        q: "Does this parse YAML?",
        a: "It's a line-based pattern audit, not a full YAML parser — the same checks the open-source CLI runs. Multiline run: blocks get caught by the pull_request_target and injection heuristics.",
      },
    ],
    related: [
      "secret-leak-scanner",
      "dockerfile-security-lint",
      "env-parity-checker",
    ],
    updatedAt: UPDATED,
  },

  {
    slug: "ai-search-readiness-checker",
    vertical: "devtools",
    name: "AI Search Readiness Checker",
    title: "AI Search Readiness Checker — Can ChatGPT & Perplexity Cite You?",
    seoTitle: "AI Search Readiness Checker — Free GEO & llms.txt Audit",
    description:
      "Paste your page HTML, robots.txt and llms.txt to see if ChatGPT, Perplexity, Claude and Google AI can actually read, parse and cite your site — 13 checks, all in your browser.",
    keywords: [
      "ai search visibility checker",
      "llms.txt checker",
      "geo audit tool",
      "generative engine optimization checker",
      "chatgpt crawler checker",
      "gptbot robots.txt test",
      "ai citation checker",
    ],
    fields: [
      {
        key: "html",
        label: "Page HTML (view source of the page you want cited)",
        type: "textarea",
        rows: 10,
        default: "",
        placeholder: "<!doctype html>\n<html>\n<head>…",
        help: "Open the page → Ctrl+U → copy all → paste. " + PRIVACY_NOTE,
      },
      {
        key: "robots",
        label: "robots.txt (optional — for crawler-access checks)",
        type: "textarea",
        rows: 6,
        default: "",
        placeholder: "User-agent: *\nDisallow:",
        help: "From https://yoursite.com/robots.txt — checks OAI-SearchBot, GPTBot, ClaudeBot, PerplexityBot and Googlebot.",
      },
      {
        key: "llms",
        label: "llms.txt (optional — if your site has one)",
        type: "textarea",
        rows: 5,
        default: "",
        placeholder: "# Site name\n\n> One-line summary…",
        help: "From https://yoursite.com/llms.txt — validates structure (title, summary, links).",
      },
    ],
    compute: computeAiReadiness,
    assumptions: [
      "Checks the signals answer engines actually use: crawler access (robots.txt), parseability (JSON-LD, headings, canonical), quotability (answer-first text, Q&A structure, tables) and trust signals (dates, authorship).",
      "robots.txt matching is simplified: exact bot names and the * wildcard are checked; a literal `Disallow: /` counts as blocked.",
      "This audits readiness, not actual citations — the full check is running your buyers' questions in ChatGPT/Perplexity/Gemini and counting who gets named.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "OpenAI — GPTBot, OAI-SearchBot, ChatGPT-User",
        url: "https://platform.openai.com/docs/bots",
      },
      { label: "llms.txt specification", url: "https://llmstxt.org" },
      {
        label: "Dark Visitors — AI crawler directory",
        url: "https://darkvisitors.com",
      },
      {
        label: "Free CLI version on GitHub",
        url: `${LITE_REPO}/tree/main/geo-audit-lite`,
      },
      {
        label: "Full AI visibility audit agent skill",
        url: AGENSI("geo-audit"),
      },
    ],
    sections: [
      {
        heading: "What answer engines actually check",
        paragraphs: [
          "Getting cited by ChatGPT, Perplexity or Google's AI Overviews comes down to four things. Can they reach the page (robots.txt lets their crawlers in)? Can they parse it (clean HTML, one H1, structured data)? Can they lift an answer from it (a direct answer up front, question-shaped headings, tables and lists)? And do they trust it (a named author, an Organization entity, visible dates)?",
          "The mechanics differ from classic SEO in one important way: the prize is not a position in a list of links — it's being named inside a composed answer. A page can rank #1 on Google and still be invisible to ChatGPT if its crawlers are blocked or the content can't be cleanly extracted.",
        ],
      },
      {
        heading: "The robots.txt mistake most sites make",
        paragraphs: [
          "Many sites added Disallow rules for AI bots during the 2023–24 scraping backlash — and now block themselves out of AI search. The key detail: OpenAI and Perplexity use separate bots for training and for search. Blocking GPTBot keeps your content out of training data; blocking OAI-SearchBot or PerplexityBot keeps you out of the answers.",
          "If you want citations without contributing to training data, allow the search and user-triggered bots (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-User) while keeping the training crawlers (GPTBot, ClaudeBot) disallowed.",
        ],
      },
      {
        heading: "Readiness vs. actual visibility",
        paragraphs: [
          "This tool audits whether your site can be cited — the infrastructure half of GEO. The other half is whether you actually are: take the questions your buyers ask, run them in ChatGPT, Perplexity, Gemini and Google AI, and count how often the answers name you versus your competitors.",
          "Agencies charge $300–1,000 for that full audit, then a monthly retainer to track it. The readiness fixes this tool flags are almost always the first items on their backlog — fix these before paying anyone.",
        ],
      },
    ],
    faq: [
      {
        q: "Does ChatGPT really respect robots.txt?",
        a: "Yes — OpenAI documents three crawlers that all honor it: OAI-SearchBot (search citations), GPTBot (training data) and ChatGPT-User (live fetch when a user asks about a URL). Blocking the wrong one silently removes you from ChatGPT's answers.",
      },
      {
        q: "Is llms.txt actually used by AI crawlers?",
        a: "Adoption is growing — Anthropic, docs platforms and dev-tool companies publish one, and several answer engines read it as a curated index. It's a one-time, ~30-line file, so the cost-benefit is strongly in favor of having it.",
      },
      {
        q: "What's the difference between SEO and GEO?",
        a: "SEO aims for a position in a list of links; GEO (generative engine optimization) aims for a mention inside a written answer. The foundations overlap — indexable, well-structured pages — but GEO weighs machine-readability (schema, llms.txt, crawler access) and third-party mentions much more heavily.",
      },
      {
        q: "Why paste instead of entering a URL?",
        a: "Two reasons: many sites block server-side scanners with bot protection, so a fetched page isn't what you actually serve; and pasting keeps everything in your browser — staging URLs and internal pages never touch a third-party scanner.",
      },
    ],
    related: [
      "security-headers-checker",
      "cors-config-checker",
      "secret-leak-scanner",
    ],
    updatedAt: UPDATED,
  },

  {
    slug: "json-formatter-validator",
    vertical: "devtools",
    name: "JSON Formatter & Validator",
    title: "JSON Formatter & Validator — Pretty-Print and Find Errors",
    seoTitle: "JSON Formatter & Validator Online — Free, Private",
    description:
      "Paste JSON to validate and pretty-print it — with error location (line and column) when it's broken, plus key count, depth and size stats. Runs entirely in your browser.",
    keywords: [
      "json formatter",
      "json validator",
      "json beautifier",
      "json pretty print",
      "validate json online",
      "json lint",
    ],
    fields: [
      {
        key: "json",
        label: "JSON to format or validate",
        type: "textarea",
        rows: 12,
        default: "",
        placeholder: '{"name":"example","items":[1,2,3]}',
        help: PRIVACY_NOTE,
      },
    ],
    compute: computeJson,
    assumptions: [
      "Strict JSON per RFC 8259 — comments, trailing commas, single quotes and unquoted keys are invalid (that's JSONC/JSON5, a different format).",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "RFC 8259 — The JSON Data Interchange Format",
        url: "https://www.rfc-editor.org/rfc/rfc8259",
      },
    ],
    sections: [
      {
        heading: "The five errors behind 95% of invalid JSON",
        paragraphs: [
          "Trailing commas (valid in JS objects, fatal in JSON), single-quoted strings, unquoted keys, comments, and a truncated paste from a log file. When this validator reports an error, the line/column it shows points at the first place parsing failed — which is usually a few characters after the actual mistake.",
          "If your file uses any of the above deliberately, it's probably JSONC or JSON5 — formats that look like JSON but allow comments and trailing commas. Config files for VS Code, tsconfig and many tools are JSONC, not JSON.",
        ],
      },
      {
        heading: "Why browser-side validation matters",
        paragraphs: [
          "API responses routinely contain tokens, user data and internal URLs. Server-side formatters send your payload to someone's backend — this one runs entirely in the tab you're looking at, so production payloads and signed responses stay private. Open DevTools → Network while you paste; nothing is sent.",
        ],
      },
    ],
    faq: [
      {
        q: "Why does my JSON fail with single quotes?",
        a: "JSON requires double-quoted strings and keys — {'a':1} is a JS object literal, not JSON. Use double quotes throughout.",
      },
      {
        q: "Are trailing commas allowed in JSON?",
        a: "No — [1,2,] is invalid JSON though valid JavaScript. JSONC/JSON5 (VS Code configs) do allow them.",
      },
      {
        q: "What's the biggest JSON this can handle?",
        a: "Comfortably into the tens of megabytes — it's bounded by your browser's memory, not a server limit. For multi-GB files, use a streaming tool like jq instead.",
      },
      {
        q: "How do I minify instead of format?",
        a: "Strip it in code (JSON.stringify(JSON.parse(x))) — this tool pretty-prints only, since that's what humans debugging payloads need.",
      },
    ],
    related: ["jwt-decoder", "regex-tester", "url-encoder-decoder"],
    updatedAt: UPDATED,
  },

  {
    slug: "cron-expression-parser",
    vertical: "devtools",
    name: "Cron Expression Parser",
    title: "Cron Expression Parser — Translate Cron to English",
    seoTitle: "Cron Expression Parser — Human-Readable Cron Explainer",
    description:
      "Paste a 5-field cron expression and get a plain-English schedule plus the next 5 run times — with a warning when the day-of-month/day-of-week OR-rule will surprise you.",
    keywords: [
      "cron expression parser",
      "cron to english",
      "crontab generator",
      "cron schedule explainer",
      "crontab calculator",
      "cron next run",
    ],
    fields: [
      {
        key: "expression",
        label: "Cron expression (min hour day month weekday)",
        type: "textarea",
        rows: 2,
        default: "30 9 * * 1-5",
        placeholder: "*/15 2 * * *",
        help: "Standard 5-field format. Run times are shown in your browser's local timezone — servers usually run in UTC.",
      },
    ],
    compute: computeCron,
    assumptions: [
      "Standard 5-field cron: minute hour day-of-month month day-of-week. Supports *, lists (1,2,3), ranges (1-5) and steps (*/15, 9-17/2).",
      "Names (MON, JAN) and macros (@daily, @hourly) are not supported — convert them to numbers first.",
      "When BOTH day-of-month and day-of-week are restricted, cron treats them as OR — one of the most common scheduling bugs.",
      "Next-run times are computed in your browser's local timezone; production crons typically run in server time (usually UTC).",
    ],
    sources: [
      {
        label: "crontab(5) man page",
        url: "https://man7.org/linux/man-pages/man5/crontab.5.html",
      },
    ],
    sections: [
      {
        heading: "The OR-rule that schedules jobs wrong",
        paragraphs: [
          "Setting both day-of-month and day-of-week is the classic cron trap: '0 9 1 * 5' does NOT mean '9am on the 1st if it's a Friday' — it means '9am on the 1st AND on every Friday'. Cron ORs the two fields when both are restricted. If you meant AND, run daily and check the condition inside the job.",
        ],
      },
      {
        heading: "Reading a cron line without counting fields",
        paragraphs: [
          "Minute, hour, day-of-month, month, day-of-week — five fields, left to right. Most mistakes come from miscounting: '30 9' is 9:30, not 30:09 (which doesn't exist). The other classic: 0-6 vs 0-7 for day-of-week — both 0 and 7 mean Sunday, so '1-5' is your Mon–Fri range.",
          "Step syntax: '*/15' means every 15 from the range start, '9-17/2' means 9, 11, 13, 15, 17. Try pasting '*/15 9-17 * * *' above and read the next runs — five seconds of experimenting builds more intuition than any table.",
        ],
      },
      {
        heading: "Timezones — the invisible bug",
        paragraphs: [
          "A cron fires in the timezone of whatever runs it. Your laptop's crontab uses local time; most servers default to UTC; CI systems have their own settings. '9:00 Monday' in UTC is 4am Eastern — the tool shows your local interpretation, so always check what timezone the actual scheduler uses.",
        ],
      },
    ],
    faq: [
      {
        q: "What does '0 9 * * 1-5' mean?",
        a: "9:00 AM, Monday through Friday — weekday-only schedules use the 5th field with ranges like 1-5.",
      },
      {
        q: "Why did my job run on BOTH the 1st and Fridays?",
        a: "Because cron ORs day-of-month and day-of-week when both are set. '0 9 1 * 5' = on the 1st of the month AND every Friday. For AND semantics, schedule daily and gate inside the script.",
      },
      {
        q: "How do I run something every 15 minutes?",
        a: "*/15 in the minute field: '*/15 * * * *'. For every 15 minutes only in working hours: '*/15 9-17 * * *'.",
      },
      {
        q: "Does cron support seconds?",
        a: "Standard cron doesn't — the 6-field variants (Quartz, systemd timers, some schedulers) add a leading seconds field. This parser covers the classic 5-field format.",
      },
    ],
    related: [
      "regex-tester",
      "json-formatter-validator",
      "github-actions-security-audit",
    ],
    updatedAt: UPDATED,
    deferCompute: true,
  },

  {
    slug: "regex-tester",
    vertical: "devtools",
    name: "Regex Tester",
    title: "Regex Tester — Match, Groups and Positions in Real Time",
    seoTitle: "Regex Tester Online — Live Match & Group Viewer",
    description:
      "Test a regular expression against your text with instant results: all matches, their positions, capture groups and flag support — runs locally, nothing sent anywhere.",
    keywords: [
      "regex tester",
      "regular expression tester",
      "regex tester online",
      "regex match groups",
      "javascript regex test",
      "regex101 alternative",
    ],
    fields: [
      {
        key: "pattern",
        label: "Pattern (without the / /)",
        type: "textarea",
        rows: 2,
        default: "\\b\\w+@\\w+\\.\\w+\\b",
        placeholder: "[A-Z]\\w+",
        help: "JavaScript regex syntax — lookahead, named groups and unicode all supported.",
      },
      {
        key: "flags",
        label: "Flags",
        type: "select",
        default: "g",
        options: [
          { value: "g", label: "g — all matches" },
          { value: "gi", label: "gi — all, case-insensitive" },
          { value: "gm", label: "gm — multiline ^$" },
          { value: "gs", label: "gs — dot matches newlines" },
          { value: "", label: "none — first match only" },
        ],
      },
      {
        key: "text",
        label: "Test string",
        type: "textarea",
        rows: 10,
        default: "",
        placeholder: "Paste the text to match against…",
        help: PRIVACY_NOTE,
      },
    ],
    compute: computeRegex,
    assumptions: [
      "JavaScript regex engine semantics — mostly compatible with PCRE, but watch for lookbehind support and subtle \\b / unicode differences.",
      "Matches are capped at 100 for display; the engine stops at the first 20 shown with group details.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "MDN — Regular expressions",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions",
      },
    ],
    sections: [
      {
        heading: "The flags that change everything",
        paragraphs: [
          "Most 'my regex works here but not there' bugs are flag differences. Without g, you get only the first match — test() and match() disagree. Without m, ^ and $ anchor only to the string ends, not each line. Without s, the dot stops at newlines — why '.*' fails on multi-line input.",
          "Case-insensitivity (i) is the other trap: it folds more than ASCII in Unicode mode, which is why [a-z] with i can match characters you didn't expect.",
        ],
      },
      {
        heading: "Capture groups: what the positions mean",
        paragraphs: [
          "Each match shows its index (0-based character position) and captured groups — the parts in parentheses, in order. Group 0 is always the full match. If a group is optional and didn't participate, it shows as undefined — the classic source of 'group 2 is empty' bugs.",
        ],
      },
      {
        heading: "JavaScript regex quirks worth knowing",
        paragraphs: [
          "JS supports lookahead and (in modern engines) lookbehind, named groups (?<name>…), and unicode-aware \\p{…} classes. What it lacks vs PCRE: \\z anchors (use $ with care), recursive patterns, and atomic groups — a pattern that works in PHP/Python may need adapting here.",
        ],
      },
    ],
    faq: [
      {
        q: "Why does my regex only match once?",
        a: "You need the g flag — without it exec() and match() return just the first match. Select 'g — all matches' above.",
      },
      {
        q: "What's the difference between match and test?",
        a: "test() returns true/false; match() returns the strings (or null). With g, match() returns all matches but loses capture groups — use matchAll() or exec() in a loop for groups.",
      },
      {
        q: "How do I match an email?",
        a: "For validation that isn't insane: \\b\\w+@\\w+\\.\\w+\\b catches most cases. The 'perfect' RFC email regex is thousands of characters — almost nobody actually needs it.",
      },
      {
        q: "Why does '.' not match my newline?",
        a: "The dot never matches \\n without the s (dotAll) flag. Use [\\s\\S] or enable 'gs' mode above.",
      },
    ],
    related: ["json-formatter-validator", "jwt-decoder", "secret-leak-scanner"],
    updatedAt: UPDATED,
  },

  {
    slug: "base64-encoder-decoder",
    vertical: "devtools",
    name: "Base64 Encoder & Decoder",
    title: "Base64 Encoder & Decoder — With Unicode Support",
    seoTitle: "Base64 Encode & Decode Online — Free, Private",
    description:
      "Encode text to Base64 or decode it back — proper UTF-8 handling so non-ASCII characters don't corrupt. Runs entirely in your browser.",
    keywords: [
      "base64 encoder",
      "base64 decoder",
      "base64 encode decode",
      "base64 to text",
      "text to base64",
      "decode base64 online",
    ],
    fields: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        default: "encode",
        options: [
          { value: "encode", label: "Encode → Base64" },
          { value: "decode", label: "Decode ← Base64" },
        ],
      },
      {
        key: "input",
        label: "Input",
        type: "textarea",
        rows: 8,
        default: "",
        placeholder: "Text to encode, or Base64 to decode…",
        help: PRIVACY_NOTE,
      },
    ],
    compute: computeBase64,
    assumptions: [
      "UTF-8 aware — emoji and non-ASCII text encode/decode correctly (the naive atob/btoa path corrupts them).",
      "Standard Base64 alphabet (+/=). Base64URL (- and _) used in JWTs and filenames isn't auto-detected — swap characters if decoding fails.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "RFC 4648 — Base64 encoding",
        url: "https://www.rfc-editor.org/rfc/rfc4648",
      },
    ],
    sections: [
      {
        heading: "Why Base64 makes things 33% bigger",
        paragraphs: [
          "Base64 stores 3 bytes in 4 ASCII-safe characters — it's a transport encoding for moving binary data through text-only channels (email, JSON, URLs, HTML attributes), not a compression or encryption format. Every API that embeds an image or file as a string pays that 33% tax.",
          "Which is also the answer to 'is Base64 secure?': it's obfuscation at best — anyone can decode it instantly. Never store secrets as 'encoded' Base64 and assume they're protected.",
        ],
      },
      {
        heading: "The Unicode trap in btoa/atob",
        paragraphs: [
          "The browser's built-in atob() and btoa() work on bytes, not characters — feed btoa() a string with anything above \\u00ff and it throws or corrupts. The correct path is TextEncoder → bytes → btoa for encoding, and atob → bytes → TextDecoder for decoding. This tool does exactly that, which is why '你好' and emoji round-trip correctly here.",
        ],
      },
      {
        heading: "Base64 vs Base64URL — the one-character difference",
        paragraphs: [
          "JWTs and URLs use Base64URL: the same encoding with +→-, /→_, and no = padding, so the output survives URLs and filenames unencoded. If a Base64 string with - or _ fails to decode, it's Base64URL — replace the characters and try again.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I decode Base64?",
        a: "Select 'Decode ← Base64' above and paste — whitespace is ignored. If it fails with weird characters, it's likely Base64URL: swap - for + and _ for /.",
      },
      {
        q: "Is Base64 encryption?",
        a: "No — it's encoding, not encryption. Anyone can decode it instantly; never treat Base64 as a way to hide secrets.",
      },
      {
        q: "Why is my decoded output garbled?",
        a: "Usually a charset issue — the tool decodes as UTF-8. If the source was encoded as Latin-1 or another legacy encoding, text will look wrong; binary data isn't meant to be read as text at all.",
      },
      {
        q: "Can I encode a file or image?",
        a: "This tool handles text. For files, your OS is faster: certutil -encode on Windows, base64 <file> on Linux/macOS.",
      },
    ],
    related: ["jwt-decoder", "url-encoder-decoder", "json-formatter-validator"],
    updatedAt: UPDATED,
  },

  {
    slug: "url-encoder-decoder",
    vertical: "devtools",
    name: "URL Encoder / Decoder / Analyzer",
    title: "URL Encoder, Decoder & Analyzer — Parse Any URL",
    seoTitle: "URL Encode Decode & Analyze — Free Online Tool",
    description:
      "Percent-encode or decode strings, and break any URL into protocol, host, path, query params and fragment — decoded params listed cleanly.",
    keywords: [
      "url encoder",
      "url decoder",
      "percent encode",
      "url encode decode online",
      "parse url online",
      "query string parser",
    ],
    fields: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        default: "analyze",
        options: [
          { value: "analyze", label: "Analyze — break URL into parts" },
          { value: "encode", label: "Encode → %-escaped" },
          { value: "decode", label: "Decode ← %-escaped" },
        ],
      },
      {
        key: "input",
        label: "URL or string",
        type: "textarea",
        rows: 6,
        default: "",
        placeholder: "https://example.com/search?q=hello%20world&lang=en",
        help: PRIVACY_NOTE,
      },
    ],
    compute: computeUrl,
    assumptions: [
      "Analyze mode parses via the WHATWG URL parser (same as your browser's new URL()).",
      "Encode uses encodeURIComponent — safe for query values, encodes reserved characters like / : ? & =.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "WHATWG URL Standard",
        url: "https://url.spec.whatwg.org/",
      },
    ],
    sections: [
      {
        heading: "encodeURIComponent vs encodeURI — the classic bug",
        paragraphs: [
          "encodeURIComponent escapes everything that could confuse a query string (including & = ? /), while encodeURI preserves URL structure characters. Pick wrong and your redirect breaks: a callback URL passed as a ?redirect= parameter MUST use encodeURIComponent, or the inner '?' and '&' leak into the outer query.",
          "Rule of thumb: encodeURIComponent for any value going INSIDE a URL; encodeURI only for whole-URL display encoding.",
        ],
      },
      {
        heading: "What percent-encoding actually does",
        paragraphs: [
          "URLs can only carry a limited ASCII set. Everything else — spaces, non-English characters, and characters with special meaning — gets percent-encoded: each byte becomes % followed by its hex value. ' ' → %20, 'ć' → %C4%87 (two UTF-8 bytes). Double-encoding is the classic bug: encode once, and %20 becomes %2520.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I decode a URL-encoded string?",
        a: "Select 'Decode' mode and paste — malformed input (a % not followed by two hex digits) will be flagged.",
      },
      {
        q: "Why does %20 keep appearing as %2520?",
        a: "That's double encoding — something encoded an already-encoded string. %2520 is literally the percent-escape of the text '%20'. Decode twice, or fix the source to encode once.",
      },
      {
        q: "What's the difference between a URL and URI?",
        a: "A URL is a URI that also tells you how to locate the resource (scheme + host). In daily work the terms are interchangeable; the standard that governs parsing is WHATWG URL.",
      },
      {
        q: "Why does analyze fail on 'example.com'?",
        a: "A URL needs a scheme — the parser can't guess it's a URL without 'https://'. Add the scheme, or use encode mode.",
      },
    ],
    related: [
      "base64-encoder-decoder",
      "json-formatter-validator",
      "security-headers-checker",
    ],
    updatedAt: UPDATED,
  },

  {
    slug: "uuid-generator",
    vertical: "devtools",
    name: "UUID Generator",
    title: "UUID Generator — Bulk v4 UUIDs, Cryptographically Random",
    seoTitle: "UUID Generator — Bulk Random UUIDs Online",
    description:
      "Generate up to 50 random UUIDs (v4) at once — cryptographically secure, instantly copyable, with uppercase option. No server, no tracking, just crypto.randomUUID().",
    keywords: [
      "uuid generator",
      "uuid v4 generator",
      "generate uuid online",
      "random uuid",
      "guid generator",
      "bulk uuid generator",
    ],
    fields: [
      {
        key: "count",
        label: "How many",
        type: "number",
        default: 10,
        min: 1,
        max: 50,
        step: 1,
      },
      {
        key: "format",
        label: "Format",
        type: "select",
        default: "lower",
        options: [
          { value: "lower", label: "lowercase (standard)" },
          { value: "upper", label: "UPPERCASE" },
        ],
      },
    ],
    compute: computeUuid,
    assumptions: [
      "UUIDs are generated by crypto.randomUUID() — a proper CSPRNG, not Math.random().",
      "v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y ∈ {8,9,a,b} — 122 bits of randomness.",
      PRIVACY_NOTE,
    ],
    sources: [
      {
        label: "RFC 9562 — UUIDs",
        url: "https://www.rfc-editor.org/rfc/rfc9562",
      },
    ],
    sections: [
      {
        heading: "Why you can just generate and not check",
        paragraphs: [
          "A v4 UUID has 122 random bits — the odds of a collision between two generated IDs are so low that 'generate and check for uniqueness' is actively wrong engineering. You'd need ~2.7×10¹⁸ UUIDs for a 50% collision chance; your database will run out of disk first. This is why UUIDs replaced sequences for distributed IDs.",
          "The practical caveat: UUIDs make lousy primary keys in B-tree indexes because random inserts fragment the index. UUIDv7 (time-ordered, new in RFC 9562) fixes this — use it where insert order matters.",
        ],
      },
      {
        heading: "v4 vs v7 — which UUID version",
        paragraphs: [
          "v4 (what this generates) is pure randomness — the right choice for most uses, universally supported. v7 embeds a millisecond timestamp in the first bits, making UUIDs sortable and index-friendly; it's the modern default for database keys. v1 (time+MAC) and v3/v5 (hash-based) are legacy — never use v1, it leaks your MAC address.",
        ],
      },
    ],
    faq: [
      {
        q: "Are these UUIDs safe to use?",
        a: "Yes — they're generated by crypto.randomUUID(), a cryptographically secure random source, not Math.random(). Suitable for session IDs, tokens and database keys.",
      },
      {
        q: "Can two UUIDs ever collide?",
        a: "Mathematically possible, practically impossible — ~122 bits of randomness means you'd need quintillions of UUIDs before a collision becomes likely. Don't check for uniqueness; it's a waste.",
      },
      {
        q: "UUID vs GUID — what's the difference?",
        a: "Nothing — GUID is Microsoft's name for the same RFC 4122/9562 identifier format. Same structure, different branding.",
      },
      {
        q: "Should I use UUIDs as database primary keys?",
        a: "v4 UUIDs work but fragment B-tree indexes due to random inserts. UUIDv7 (time-ordered) is the better modern choice for PKs — this generator produces v4.",
      },
    ],
    related: ["jwt-decoder", "base64-encoder-decoder", "secret-leak-scanner"],
    updatedAt: UPDATED,
    deferCompute: true,
  },

  {
    slug: "color-converter",
    vertical: "devtools",
    name: "Color Converter",
    title: "Color Converter — HEX, RGB & HSL with Contrast Check",
    seoTitle: "Color Converter — HEX ↔ RGB ↔ HSL + WCAG Contrast",
    description:
      "Convert any color between HEX, RGB and HSL — plus instant WCAG contrast ratios against white and black text so you know it's accessible.",
    keywords: [
      "color converter",
      "hex to rgb",
      "rgb to hsl",
      "hex to hsl",
      "color contrast checker",
      "wcag contrast ratio",
    ],
    fields: [
      {
        key: "color",
        label: "Color (any format)",
        type: "textarea",
        rows: 2,
        default: "#3b82f6",
        placeholder: "#3b82f6, rgb(59,130,246) or hsl(217,91%,60%)",
        help: "Accepts #hex (3 or 6 digits), rgb(), rgba(), hsl(), hsla().",
      },
    ],
    compute: computeColor,
    assumptions: [
      "sRGB color space throughout — the web standard.",
      "Contrast ratios per WCAG 2.x formula — AA requires ≥4.5:1 for normal text, ≥3:1 for large text.",
    ],
    sources: [
      {
        label: "WCAG — Contrast (Minimum)",
        url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
      },
    ],
    sections: [
      {
        heading: "When to use which format",
        paragraphs: [
          "HEX is for constants — '#3b82f6' is compact and what design tools emit. RGB is for manipulation — easy to alpha-blend (rgba), easy to loop. HSL is for humans — want a darker version? Drop L by 10%. Want a complementary hue? Add 180° to H. Professional palettes are authored in HSL and compiled to HEX.",
          "The converter shows all three because real-world work needs all three: the mockup gives you HEX, the animation needs RGB, and you figure out hover states in HSL.",
        ],
      },
      {
        heading: "The contrast numbers that matter",
        paragraphs: [
          "WCAG AA requires 4.5:1 for body text, 3:1 for large text (18pt+ or 14pt bold). AAA demands 7:1. The ratios here are computed against pure white and pure black text — for colored text-on-color checks, compute both colors and compare their luminances the same way.",
          "The classic failure: medium-gray text (#777) on white is only ~4.5:1 — technically passing, practically unreadable in sunlight. Design for 7:1 on anything that matters.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I convert HEX to RGB?",
        a: "Paste the hex value above — or mentally: each pair is one channel in base-16. #3b82f6 = rgb(59, 130, 246).",
      },
      {
        q: "What contrast ratio is accessible?",
        a: "WCAG AA: 4.5:1 for normal text, 3:1 for large text (18pt+). AAA: 7:1. Below 3:1 fails everywhere.",
      },
      {
        q: "Why does #48f work?",
        a: "3-digit hex is shorthand — each digit doubles: #48f = #4488ff. Supported here and in CSS.",
      },
      {
        q: "What about alpha/transparency?",
        a: "rgba() and hsla() inputs are accepted — the alpha is ignored for conversion since it's a separate channel. Compose it back in your CSS.",
      },
    ],
    related: [
      "json-formatter-validator",
      "url-encoder-decoder",
      "regex-tester",
    ],
    updatedAt: UPDATED,
  },
];
