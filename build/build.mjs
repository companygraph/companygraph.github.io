// Writes the example instance, the model vocabulary and CompanyGraph's own instance out as
// three committed artifacts, `example.json`, `model.json` and `company.json`, or checks that
// those files still match what their pins parse to — `npm run build` and `npm run build:check`.
// This is the only script in this repository that reaches the network or the parser;
// everything derived from the files it writes is rendered by `build/pages.mjs` without
// touching either. `source.json`, at the repository root, holds the site's pins by name, and
// each target names the pin it is drawn from: `example.json` and `model.json` come from the
// `meta-model` pin's one commit of `companygraph/meta-model` — the example from `example/`, the
// vocabulary from `core/` — and `company.json` from the `mental-model` pin's commit of
// `companygraph/mental-model`.
//
// Each is read at exactly the commit its pin names: from a local checkout when the pin's
// variable (`META_MODEL` for `meta-model`, `MENTAL_MODEL` for `mental-model`) points at one
// whose HEAD is that commit, otherwise from GitHub — one call to the git trees API per pinned
// commit for the whole file list, shared by every target on that pin, then the raw files each
// target needs. No tarball, so nothing to untar, and no dependency. GITHUB_TOKEN is sent if
// present and never printed.
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
const PINS = JSON.parse(fs.readFileSync(path.join(here, "..", "source.json"), "utf8"));

// The checkout a pin may be read from instead of GitHub, by the variable that names it.
const LOCAL_ENV = { "meta-model": "META_MODEL", "mental-model": "MENTAL_MODEL" };

// One entry per generated page. `pin` names the entry of `source.json` it is drawn from, and
// `sub` is the folder inside that pin's checkout each target reads; `readLocal`/`readRemote`
// return its files with that prefix stripped, so the parsers see the same shape of map
// regardless of where the files came from. `finish`,
// when present, adjusts the parsed data before it is written — the model target uses it to
// turn each edge's field name into the label the shared stage draws (spec §4), and to read
// each schema in the card's order rather than the file's: R9 fixes `## File Location` first
// in a schema file, because the path is what lets a type be singular while its folder is
// plural — a contract for the agent that checks the file. On the card it is the technical
// footnote, so it goes last. The content is untouched; only the order the card reads it in
// changes, and the schema files keep the shape the conventions require. The example target
// needs no such step, so it carries none.
const TARGETS = [
  { dir: "example", pin: "meta-model", parse: parseInstance, sub: "example/model/", schemas: "core/" },
  {
    dir: "model", pin: "meta-model", parse: parseSchemas, sub: "core/",
    finish(data) {
      for (const e of data.edges) e.label = e.via;
      for (const en of data.entities) {
        const i = en.sections.findIndex((s) => s.heading === "File Location");
        if (i >= 0) en.sections.push(...en.sections.splice(i, 1));
      }
    },
  },
  // CompanyGraph's own instance, drawn on the landing page. An instance carries the core it is
  // written against, vendored at `meta/core/`, so its schemas are read from the same commit as
  // its pages, as blust.ch reads the reference instance. It is the one artifact from another
  // repository, so it names that repository: `card.js` and `stage.js` link a card to its file
  // through `repo` and fall back to the meta-model without it. The other two need no `repo`,
  // because that fallback is already theirs.
  { dir: "company", pin: "mental-model", parse: parseInstance, sub: "model/", schemas: "meta/core/", repo: true },
];

async function readLocal({ commit, env }, sub) {
  const dir = process.env[env];
  const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== commit) throw new Error(`${env} is at ${head.slice(0, 7)}, source.json pins ${commit.slice(0, 7)}`);
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

// The trees API listing is the whole repository at one commit, so it is fetched once per
// pinned commit per run — not once per target — and cached here; each target then just
// filters the entries it owns.
const trees = new Map();
async function fetchTree({ repo, commit }) {
  const key = `${repo}@${commit}`;
  if (trees.has(key)) return trees.get(key);
  const headers = { "user-agent": "companygraph.io example build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`, { headers });
  if (!res.ok) throw new Error(`trees API for ${repo}: HTTP ${res.status}`);
  const { tree: entries, truncated } = await res.json();
  if (truncated) throw new Error(`trees API truncated the listing for ${repo}`);
  const value = { entries, headers };
  trees.set(key, value);
  return value;
}

async function readRemote(pin, sub) {
  const { repo, commit } = pin;
  const { entries, headers } = await fetchTree(pin);
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
  const pin = { ...PINS[target.pin], env: LOCAL_ENV[target.pin] };
  const { repo, commit } = pin;
  const read = (sub) => (process.env[pin.env] ? readLocal : readRemote)(pin, sub);
  const files = await read(target.sub);
  // The example is read beside the core it is written against: at 0.22.0 the parser resolves
  // a reference by the type its schema declares, so the schemas travel with the pages. The
  // model target parses the schemas themselves and names none.
  const schemas = target.schemas ? await read(target.schemas) : undefined;
  // `sub` goes to the parser too: an entity's `path` is what the page turns into a link to
  // the file on GitHub, and it has to be the path in the repository the files came from. The
  // parser used to hardcode `example/model/`, which happened to be right here and was a 404 on
  // every sibling site.
  const data = { ...target.parse(files, { sub: target.sub, schemas }), commit, ...(target.repo ? { repo } : {}) };
  if (target.finish) target.finish(data);

  const OUT = path.join(here, "..", `${target.dir}.json`);
  const text = JSON.stringify(data, null, 2) + "\n";

  if (check) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (current === text) {
      console.log(`  ✓ ${target.dir}.json is ${repo}@${commit.slice(0, 7)}: ${data.entities.length} entities, ${data.edges.length} edges`);
    } else {
      console.log(`  ✗ ${target.dir}.json is not what ${repo}@${commit.slice(0, 7)} parses to — run: npm run build`);
      allMatch = false;
    }
    continue;
  }
  fs.writeFileSync(OUT, text);
  console.log(`  wrote ${target.dir}.json: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
}

if (check && !allMatch) process.exit(1);
