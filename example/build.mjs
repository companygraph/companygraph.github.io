// Writes the example instance into example/index.html as a data block, or checks that the
// block there still matches — `npm run example` and `npm run example:check`.
//
// The instance is read at exactly the commit source.json names: from a local checkout when
// META_MODEL points at one whose HEAD is that commit, otherwise from GitHub — one call to the
// git trees API for the file list, then the raw files. No tarball, so nothing to untar, and
// no dependency. GITHUB_TOKEN is sent if present and never printed.
//
// The block is fenced by markers that name the commit, the way the token block is fenced by
// its version: a reader of the HTML can see which state of the model the page shows, and the
// check can find the block without parsing the page.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseInstance } from "./instance.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(here, "index.html");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(here, "source.json"), "utf8"));
const START = /<!-- example data · (?:[0-9a-f]+|none) -->\n<script type="application\/json" id="example-data">/;
const END = "</script>\n<!-- /example data -->";

async function readLocal(dir) {
  const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== commit) throw new Error(`META_MODEL is at ${head.slice(0, 7)}, source.json pins ${commit.slice(0, 7)}`);
  const root = path.join(dir, "example");
  const files = new Map();
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else files.set(path.relative(root, p).split(path.sep).join("/"), fs.readFileSync(p, "utf8"));
    }
  };
  walk(root);
  return files;
}

async function readRemote() {
  const headers = { "user-agent": "companygraph.io example build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const tree = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`, { headers });
  if (!tree.ok) throw new Error(`trees API: HTTP ${tree.status}`);
  const { tree: entries, truncated } = await tree.json();
  if (truncated) throw new Error("trees API truncated the listing");
  const files = new Map();
  for (const e of entries) {
    if (e.type !== "blob" || !e.path.startsWith("example/")) continue;
    const raw = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${e.path}`, { headers });
    if (!raw.ok) throw new Error(`${e.path}: HTTP ${raw.status}`);
    files.set(e.path.slice("example/".length), await raw.text());
  }
  return files;
}

const files = process.env.META_MODEL ? await readLocal(process.env.META_MODEL) : await readRemote();
const data = { ...parseInstance(files), commit };
const block = `<!-- example data · ${commit} -->\n<script type="application/json" id="example-data">${JSON.stringify(data)}${END}`;

const page = fs.readFileSync(PAGE, "utf8");
const start = page.search(START), end = page.indexOf(END);
if (start < 0 || end < 0) throw new Error("example/index.html has no data block markers");
const current = page.slice(start, end + END.length);

if (process.argv.includes("--check")) {
  if (current === block) { console.log(`  ✓ example/index.html shows ${repo}@${commit.slice(0, 7)}`); process.exit(0); }
  console.log(`  ✗ example/index.html no longer matches ${repo}@${commit.slice(0, 7)} — run: npm run example`);
  process.exit(1);
}
fs.writeFileSync(PAGE, page.slice(0, start) + block + page.slice(end + END.length));
console.log(`  wrote ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
