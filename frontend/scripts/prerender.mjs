import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { render, routes } from "../.ssr/entry-server.js";

const site = process.env.SITE_URL?.replace(/\/$/, "");
if (site) {
  const url = new URL(site);
  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw Error(
      "SITE_URL must be your public HTTPS origin, without a path or credentials.",
    );
}
const escape = (s) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const base = await readFile("dist/index.html", "utf8");
for (const route of routes) {
  let html = base
    .replace(/<title>.*?<\/title>/, `<title>${escape(route.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escape(route.description)}" />`,
    )
    .replace("noindex, follow", site ? "index, follow" : "noindex, follow")
    .replace(
      '<div id="root"></div>',
      `<div id="root" data-prerendered="true">${render(route.path)}</div>`,
    );
  const url = site ? site + route.path : null;
  const meta = `<meta property="og:title" content="${escape(route.title)}" /><meta property="og:description" content="${escape(route.description)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="Ahead" /><meta name="twitter:card" content="summary" />`;
  const canonical = url
    ? `<link rel="canonical" href="${escape(url)}" /><meta property="og:url" content="${escape(url)}" />`
    : "";
  const structured = url
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": route.path === "/" ? "WebSite" : "WebPage", name: route.title, description: route.description, url }).replaceAll("<", "\\u003c")}</script>`
    : "";
  html = html.replace("</head>", `${meta}${canonical}${structured}</head>`);
  const folder = resolve("dist", `.${route.path}`);
  await mkdir(folder, { recursive: true });
  await writeFile(resolve(folder, "index.html"), html);
}
await mkdir("dist/app", { recursive: true });
await writeFile(
  "dist/app/index.html",
  base.replace(
    /<title>.*?<\/title>/,
    "<title>Forecast workspace | Ahead</title>",
  ),
);
await writeFile(
  "dist/fallback404.html",
  base
    .replace(/<title>.*?<\/title>/, "<title>Page not found | Ahead</title>")
    .replace(
      '<div id="root"></div>',
      '<div id="root"><main><h1>Page not found</h1><a href="/">Return to Ahead</a></main></div>',
    ),
);
await writeFile(
  "dist/robots.txt",
  site
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${site}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site ? routes.map((r) => `<url><loc>${escape(site + r.path)}</loc></url>`).join("") : ""}</urlset>`,
);
console.log(
  `Prerendered ${routes.length} public routes. ${site ? "Public SEO configured for " + site : "Local build: noindex. Set SITE_URL to your HTTPS domain before publishing."}`,
);
