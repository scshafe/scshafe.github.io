#!/usr/bin/env node
// Checks the built site in dist/ (run after `astro build`; part of `pnpm run verify`).
//
//  - the files GitHub Pages and link previews need exist;
//  - every page has a language, one title, a description, a canonical URL and one h1;
//  - every internal link and asset resolves to a built file;
//  - nothing loads from another origin (fonts and images are self-hosted) and no
//    link uses plain http;
//  - nothing private leaks: the site writes about private projects, so an email
//    address, a tailnet name or address, a LAN address or a home-directory path in
//    any built file is a failure.
//
// Node's standard library only. Exit 1 with one line per problem.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);

if (!existsSync(root)) {
  console.error("check-site: dist/ is missing; run `astro build` first");
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

const files = walk(root);
const rel = (f) => relative(root, f).split("\\").join("/");

for (const need of [
  "index.html",
  "404.html",
  "projects/index.html",
  "rss.xml",
  "sitemap-index.xml",
  "robots.txt",
  "favicon.svg",
  "og.png",
]) {
  if (!existsSync(join(root, need))) fail(need, "missing from the build");
}

// A site path resolves if it names a file, or a directory with an index.html.
function resolves(path) {
  const clean = decodeURIComponent(path.split(/[?#]/)[0]);
  const target = join(root, clean);
  if (!target.startsWith(root)) return false;
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(join(target, "index.html"));
}

const TEXT = new Set([".html", ".xml", ".css", ".js", ".txt", ".svg", ".json"]);
const PRIVATE = [
  [/[A-Za-z0-9._%+-]+@(?!media\b|font-face\b|import\b|supports\b|keyframes\b|layer\b|property\b|container\b|page\b|charset\b|namespace\b)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/, "an email address"],
  [/\b[a-z0-9-]+\.[a-z0-9-]+\.ts\.net\b/i, "a tailnet host name"],
  [/\b100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.\d{1,3}\.\d{1,3}\b/, "a tailnet address"],
  [/\b(192\.168|10\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[01]))\.\d{1,3}\.\d{1,3}\b/, "a private network address"],
  [/(\/home\/[a-z_][a-z0-9_-]*|\/Users\/[A-Za-z][A-Za-z0-9._-]*)\//, "a home-directory path"],
];

for (const file of files) {
  const name = rel(file);
  const ext = extname(file);
  if (!TEXT.has(ext)) continue;
  const text = readFileSync(file, "utf8");

  for (const [re, what] of PRIVATE) {
    const m = text.match(re);
    if (m) fail(name, `contains ${what} (${m[0].slice(0, 3)}…)`);
  }

  if (ext !== ".html") continue;

  if (!/<html[^>]*\blang="[a-z-]+"/i.test(text)) fail(name, "no <html lang>");
  const titles = text.match(/<title>[^<]+<\/title>/g) ?? [];
  if (titles.length !== 1) fail(name, `${titles.length} <title> elements`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(text)) fail(name, "no meta description");
  if (!/<link rel="canonical" href="https:\/\/scshafe\.github\.io\//.test(text)) fail(name, "no canonical URL");
  const h1s = text.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(name, `${h1s.length} <h1> elements`);

  const base = posix.dirname("/" + name);
  for (const [, attr, url] of text.matchAll(/\b(href|src|srcset|poster)="([^"]*)"/g)) {
    if (url === "" ) {
      fail(name, `empty ${attr}`);
      continue;
    }
    if (url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("data:")) continue;
    if (/^http:\/\//.test(url)) {
      fail(name, `plain http link ${url}`);
      continue;
    }
    if (/^https:\/\//.test(url) || url.startsWith("//")) {
      // Links out are fine; loading anything from another origin is not.
      if (attr !== "href") fail(name, `loads ${url} from another origin`);
      continue;
    }
    const path = url.startsWith("/") ? url : posix.join(base, url);
    if (!resolves(path)) fail(name, `broken link ${url}`);
  }

  for (const [, tag] of text.matchAll(/<link\b([^>]*)>/g)) {
    if (/rel="(stylesheet|preload|modulepreload|icon)"/.test(tag) && /href="(https?:)?\/\//.test(tag))
      fail(name, `loads a resource from another origin: <link${tag}>`);
  }
}

const pages = files.filter((f) => f.endsWith(".html")).length;
if (problems.length) {
  for (const p of problems) console.error(`check-site: ${p}`);
  console.error(`check-site: ${problems.length} problem(s) in ${pages} pages`);
  process.exit(1);
}
console.log(`check-site: ok (${pages} pages, ${files.length} files)`);
