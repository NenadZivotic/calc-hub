import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const authPath = join(
  process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"),
  "com.vercel.cli",
  "Data",
  "auth.json",
);
const auth = JSON.parse(readFileSync(authPath, "utf8"));
const token = auth.token;
const project = JSON.parse(readFileSync(".vercel/project.json", "utf8"));

const res = await fetch(
  `https://api.vercel.com/v9/projects/${project.projectId}?teamId=${project.orgId}`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ssoProtection: null, passwordProtection: null }),
  },
);

const body = await res.json();
console.log("status:", res.status);
console.log("ssoProtection:", JSON.stringify(body.ssoProtection ?? null));
console.log(
  "passwordProtection:",
  JSON.stringify(body.passwordProtection ?? null),
);
console.log("message:", body.error?.message ?? "ok");
