/**
 * Lighthouse (mobile) on every route of a running build.
 *   npx next build && npx next start -p 3400
 *   node scripts/audit.mjs [baseUrl]        (default http://127.0.0.1:3400)
 * Runs each route three times and keeps the median-performance run (scores vary
 * run to run). Writes audit/lighthouse.json and prints one line per route.
 * The 404 route is left out: Lighthouse won't score a page that returns 404.
 */
import fs from "node:fs";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const base = process.argv[2] || "http://127.0.0.1:3400";
const routes = process.env.ROUTES ? process.env.ROUTES.split(",") : ["/", "/work", "/work/the-gardens", "/work/door", "/capabilities", "/studio", "/contact"];
const RUNS = Number(process.env.RUNS || 3);

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const out = [];
for (const route of routes) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push((await lighthouse(`${base}${route}`, { port: chrome.port, output: "json", logLevel: "error" })).lhr);
  runs.sort((x, y) => x.categories.performance.score - y.categories.performance.score);
  const lhr = runs[Math.floor(runs.length / 2)];
  const a = lhr.audits;
  const score = (k) => Math.round((lhr.categories[k].score ?? 0) * 100);
  const failing = Object.values(lhr.categories)
    .filter((c) => c.id !== "performance")
    .flatMap((c) => c.auditRefs.map((r) => a[r.id]).filter((x) => x.score !== null && x.score < 1 && x.scoreDisplayMode !== "informative" && x.scoreDisplayMode !== "notApplicable" && x.scoreDisplayMode !== "manual").map((x) => `${c.id}:${x.id}`))
    .filter((id) => !id.startsWith("agentic-browsing"));
  const lcpEl = a["lcp-breakdown-insight"]?.details?.items?.find((i) => i.type === "node");
  out.push({
    route,
    performance: score("performance"),
    accessibility: score("accessibility"),
    bestPractices: score("best-practices"),
    seo: score("seo"),
    lcp: Math.round(a["largest-contentful-paint"].numericValue),
    cls: +(a["cumulative-layout-shift"].numericValue ?? 0).toFixed(3),
    tbt: Math.round(a["total-blocking-time"].numericValue),
    fcp: Math.round(a["first-contentful-paint"].numericValue),
    lcpElement: lcpEl ? lcpEl.selector.split(" > ").pop() : null,
    failing,
    perfOpportunities: Object.values(a).filter((x) => x.details?.type === "opportunity" && (x.numericValue ?? 0) > 100).map((x) => `${x.id} ${Math.round(x.numericValue)}ms`),
  });
  console.log(JSON.stringify(out.at(-1)));
}
await chrome.kill();
fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync("audit/lighthouse.json", JSON.stringify(out, null, 2));
