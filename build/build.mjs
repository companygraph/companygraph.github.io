// Writes the example instance and the model vocabulary into their pages as data blocks, or
// checks that the blocks there still match — `npm run example` and `npm run example:check`.
// One script for both: one pin (`source.json`, at the repository root) names one commit of
// `companygraph/meta-model`, and both `example/index.html` and `model/index.html` are drawn
// from that same commit — the instance from `example/`, the vocabulary from `core/`.
//
// Each is read at exactly the commit source.json names: from a local checkout when
// META_MODEL points at one whose HEAD is that commit, otherwise from GitHub — one call to the
// git trees API for the whole file list, shared by both targets, then the raw files each
// target needs. No tarball, so nothing to untar, and no dependency. GITHUB_TOKEN is sent if
// present and never printed.
//
// The block is fenced by markers that name the commit, the way the token block is fenced by
// its version: a reader of the HTML can see which state of the model the page shows, and the
// check can find the block without parsing the page.
//
// The parser comes from `companygraph-meta-model`, pinned by tag — the same repository this
// script fetches `core/` and `example/` from, and the repository that defines the conventions
// the parser implements. That is the point of it living there: its CI fails if it cites a rule
// `core/CONVENTIONS.md` does not define, which nothing could check while the two were apart.
// (The data above is still pinned separately, by commit SHA in `source.json`. Moving that onto
// the package too is a change of its own — a SHA is invisible to Dependabot, so a model change
// reaches this site with no tripwire at all.)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseInstance, parseSchemas } from "companygraph-meta-model/instance";

const here = path.dirname(fileURLToPath(import.meta.url));
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(here, "..", "source.json"), "utf8"));

// One entry per generated page. `sub` is the folder inside the meta-model checkout each
// target reads; `readLocal`/`readRemote` return its files with that prefix stripped, so the
// two parsers see the same shape of map regardless of where the files came from. `finish`,
// when present, adjusts the parsed data before it is written — the model target uses it to
// turn each edge's field name into the label the shared stage draws (spec §4), and to read
// each schema in the card's order rather than the file's: R9 fixes `## File Location` first
// in a schema file, because the path is what lets a type be singular while its folder is
// plural — a contract for the agent that checks the file. On the card it is the technical
// footnote, so it goes last. The content is untouched; only the order the card reads it in
// changes, and the schema files keep the shape the conventions require. The example target
// needs no such step, so it carries none.
const TARGETS = [
  { dir: "example", id: "example-data", marker: "example data", parse: parseInstance, sub: "example/model/" },
  {
    dir: "model", id: "model-data", marker: "model data", parse: parseSchemas, sub: "core/",
    finish(data) {
      for (const e of data.edges) e.label = e.via;
      for (const en of data.entities) {
        const i = en.sections.findIndex((s) => s.heading === "File Location");
        if (i >= 0) en.sections.push(...en.sections.splice(i, 1));
      }
    },
  },
];

async function readLocal(sub) {
  const dir = process.env.META_MODEL;
  const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== commit) throw new Error(`META_MODEL is at ${head.slice(0, 7)}, source.json pins ${commit.slice(0, 7)}`);
  const root = path.join(dir, sub);
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

// The trees API listing is the whole repository at `commit`, so it is fetched once per run —
// not once per target — and cached here; each target then just filters the entries it owns.
let tree = null;
async function fetchTree() {
  if (tree) return tree;
  const headers = { "user-agent": "companygraph.io example build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`, { headers });
  if (!res.ok) throw new Error(`trees API: HTTP ${res.status}`);
  const { tree: entries, truncated } = await res.json();
  if (truncated) throw new Error("trees API truncated the listing");
  tree = { entries, headers };
  return tree;
}

async function readRemote(sub) {
  const { entries, headers } = await fetchTree();
  const files = new Map();
  for (const e of entries) {
    if (e.type !== "blob" || !e.path.startsWith(sub)) continue;
    const raw = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${e.path}`, { headers });
    if (!raw.ok) throw new Error(`${e.path}: HTTP ${raw.status}`);
    files.set(e.path.slice(sub.length), await raw.text());
  }
  return files;
}

const check = process.argv.includes("--check");
let allMatch = true;

for (const target of TARGETS) {
  const files = process.env.META_MODEL ? await readLocal(target.sub) : await readRemote(target.sub);
  const data = { ...target.parse(files), commit };
  if (target.finish) target.finish(data);

  // `data-stage` is how the shared stage script finds the block — it queries the attribute,
  // not an id, so one script serves both pages. The START pattern tolerates a block written
  // before the attribute existed so the first run after the move still finds it to replace;
  // what is written back always carries it.
  const START = new RegExp(`<!-- ${target.marker} · (?:[0-9a-f]+|none) -->\\n<script type="application\\/json" id="${target.id}"(?: data-stage)?>`);
  const END = `</script>\n<!-- /${target.marker} -->`;
  const block = `<!-- ${target.marker} · ${commit} -->\n<script type="application/json" id="${target.id}" data-stage>${JSON.stringify(data)}${END}`;

  const PAGE = path.join(here, "..", target.dir, "index.html");
  const page = fs.readFileSync(PAGE, "utf8");
  const start = page.search(START), end = page.indexOf(END);
  if (start < 0 || end < 0) throw new Error(`${target.dir}/index.html has no data block markers`);
  const current = page.slice(start, end + END.length);

  if (check) {
    if (current === block) {
      console.log(`  ✓ ${target.dir}/index.html shows ${repo}@${commit.slice(0, 7)}`);
    } else {
      console.log(`  ✗ ${target.dir}/index.html no longer matches ${repo}@${commit.slice(0, 7)} — run: npm run example`);
      allMatch = false;
    }
    continue;
  }
  fs.writeFileSync(PAGE, page.slice(0, start) + block + page.slice(end + END.length));
  console.log(`  wrote ${target.dir}/index.html: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
}

if (check && !allMatch) process.exit(1);
