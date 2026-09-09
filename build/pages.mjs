// Renders the two artifacts into every region of this site derived from the model —
// `npm run pages` and `npm run pages:check`.
//
// Node built-ins only, and no network. That is the property worth keeping: the parser is a
// dependency and is not on disk until `npm ci` has run, so a check that needed it could not run
// in the cheap half of CI. Everything here is a pure function of two committed files.
//
// The pin guard is what would otherwise be a sentence in AGENTS.md saying which command to run
// first. An artifact that declares its own commit cannot be rendered stale, so the order of
// `npm run build` and `npm run pages` is enforced by the data rather than remembered.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonLd } from "./jsonld.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));

const data = {};
for (const name of ["example", "model"]) {
  const file = path.join(ROOT, `${name}.json`);
  if (!fs.existsSync(file)) {
    console.error(`  ✗ ${name}.json is missing — run: npm run build`);
    process.exit(1);
  }
  data[name] = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data[name].commit !== commit) {
    // An artifact with no commit at all is the same failure as one at the wrong commit, and
    // the remedy is the same, so it prints rather than throwing on the slice inside its own
    // message.
    const at = typeof data[name].commit === "string" ? data[name].commit.slice(0, 7) : "no commit";
    console.error(`  ✗ ${name}.json is at ${at}, source.json pins ${commit.slice(0, 7)} — run: npm run build`);
    process.exit(1);
  }
}

const check = process.argv.includes("--check");
const RENDERERS = [(d, o) => writeJsonLd(d, { ...o, repo })];

const stale = RENDERERS.flatMap((write) => write(data, { check }));

if (check) {
  if (stale.length) {
    console.error(`  ✗ ${stale.join(", ")} no longer match the artifacts — run: npm run pages`);
    process.exit(1);
  }
  console.log(`  ✓ every derived region matches the artifacts at ${repo}@${commit.slice(0, 7)}`);
} else {
  console.log(`  wrote every derived region from the artifacts at ${repo}@${commit.slice(0, 7)}`);
}
