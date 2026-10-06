// Render the built worker to a static site in `out/` for GitHub Pages.
//
// Usage: npm run build && node scripts/export-static.mjs
//   SITE_ORIGIN  public origin, e.g. https://stella-67.github.io
//   BASE_PATH    sub-path the site is served under, e.g. /transcoder-reasoning-blog
//
// The worker emits root-absolute URLs (/_next/..., /paper.pdf, ...). When the
// site lives under a sub-path, every such URL in the HTML, CSS and JS is
// prefixed with BASE_PATH. HTML and the embedded RSC payload are rewritten the
// same way, so hydration still matches.
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "dist/client");
const outDir = path.join(root, "out");
const origin = (process.env.SITE_ORIGIN ?? "http://localhost").replace(/\/$/, "");
const base = (process.env.BASE_PATH ?? "").replace(/\/$/, "");

const { default: worker } = await import(path.join(root, "dist/server/index.js"));
const url = new URL(origin);
const response = await worker.fetch(
  new Request(`${origin}/`, {
    headers: { accept: "text/html", host: url.host, "x-forwarded-host": url.host, "x-forwarded-proto": url.protocol.slice(0, -1) },
  }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);
if (response.status !== 200) throw new Error(`render failed: HTTP ${response.status}`);
const html = await response.text();

await rm(outDir, { recursive: true, force: true });
await cp(clientDir, outDir, { recursive: true });
await rm(path.join(outDir, "_headers"), { force: true });

// Names served from the site root: `_next`, `paper.pdf`, `paper-figures`, ...
const rootNames = (await readdir(clientDir)).filter((name) => name !== "_headers");
const escaped = rootNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const rootUrl = new RegExp(`(["'\`(]|\\\\")/(${escaped.join("|")})(?=[/"'\`?#)\\\\]|$)`, "g");

function rebase(text) {
  if (!base) return text;
  return text
    .replace(rootUrl, (_, lead, name) => `${lead}${base}/${name}`)
    // Vite's dynamic-import preload helper resolves deps as "/" + dep.
    .replace(/(function\(\w+\)\{return)`\/`\+(\w+)\}/g, `$1\`${base}/\`+$2}`)
    .replaceAll(`${origin}/`, `${origin}${base}/`)
    .replaceAll(`${origin}${base}${base}/`, `${origin}${base}/`);
}

async function rebaseTree(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await rebaseTree(file);
    else if (/\.(js|css|json)$/.test(entry.name) && !entry.name.endsWith(".map")) {
      const text = await readFile(file, "utf8");
      const next = rebase(text);
      if (next !== text) await writeFile(file, next);
    }
  }
}

await rebaseTree(path.join(outDir, "_next"));
await writeFile(path.join(outDir, "index.html"), rebase(html));
await writeFile(path.join(outDir, ".nojekyll"), "");
console.log(`exported ${outDir} (origin ${origin}, base "${base}")`);
