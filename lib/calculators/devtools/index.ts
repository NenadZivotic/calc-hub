import type { CalculatorDef, ResultItem } from "../types";

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
];
