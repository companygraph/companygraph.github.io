// Renders the three artifacts into every region of this site derived from the model —
// `npm run pages` and `npm run pages:check`.
//
// No network and no parser: everything here is a pure function of three committed files. The
// model pages' renderers come from @robertblust/design, which the sites that draw a model share,
// so this runs after `npm ci` has put the package on disk. The model pages draw
// CompanyGraph's own model, `company.json`; the JSON-LD graphs read all three.
//
// The pin guard is what would otherwise be a sentence in AGENTS.md saying which command to run
// first. An artifact that declares its own commit cannot be rendered stale, so the order of
// `npm run build` and `npm run pages` is enforced by the data rather than remembered.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePrinciples } from "@robertblust/design/render/principles";
import { writeTeam } from "@robertblust/design/render/team";
import { processDiagram } from "companygraph-mcp-server/diagram";
import { writeSurfaces } from "@robertblust/design/render/surfaces";
import { writeHome } from "@robertblust/design/render/home";
import { loadGerman } from "@robertblust/design/render/german";
import { writeQuestionsDe } from "@robertblust/design/render/questions";
import { writeIdPages } from "@robertblust/design/render/ids";
import { writeJsonLd } from "./jsonld.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));
// Which pin each artifact is built from, so each is held to its own commit.
const ARTIFACTS = { example: "meta-model", model: "meta-model", company: "mental-model" };
const { repo, commit } = PINS["meta-model"];

const data = {};
for (const [name, pinName] of Object.entries(ARTIFACTS)) {
  const pin = PINS[pinName];
  const file = path.join(ROOT, `${name}.json`);
  if (!fs.existsSync(file)) {
    console.error(`  ✗ ${name}.json is missing — run: npm run build`);
    process.exit(1);
  }
  data[name] = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data[name].commit !== pin.commit) {
    // An artifact with no commit at all is the same failure as one at the wrong commit, and
    // the remedy is the same, so it prints rather than throwing on the slice inside its own
    // message.
    const at = typeof data[name].commit === "string" ? data[name].commit.slice(0, 7) : "no commit";
    console.error(`  ✗ ${name}.json is at ${at}, source.json's ${pinName} pin is ${pin.commit.slice(0, 7)} — run: npm run build`);
    process.exit(1);
  }
}

const check = process.argv.includes("--check");
const german = loadGerman(path.join(ROOT, "build", "principles.de.json"));
// The model's question titles in German, which the chat offers on a German page: made by the
// German pipeline in build/questions.de.json, held to the exact English as the principles are,
// and written to the questions.de.json the chat's tag names.
const questionsGerman = loadGerman(path.join(ROOT, "build", "questions.de.json"));
const RENDERERS = [
  (d, o) => writeJsonLd(d, { ...o, repo }),
  (d, o) => writePrinciples(d.company, { ...o, root: ROOT, de: german.de }),
  (d, o) => writeQuestionsDe(d.company, { ...o, root: ROOT, de: questionsGerman.de }),
  // The order the boards argue in: the work first, then how an outsider joins it. Core gives a
  // process no rank, so the page names it.
  // Each board shows its process as the chat draws it, from the same drawer, over the artifact
  // at the commit source.json pins, so the picture moves only when the pin does.
  // Its nodes link to the home page, which draws the company.
  (d, o) => writeTeam(d.company, { ...o, root: ROOT, order: ["Deciding", "Delivery", "Contribution", "Feature request", "Answering", "Narrating"], diagram: (data, p) => processDiagram(data, p.id), model: "../" }),
  (d, o) => writeSurfaces(d.company, { ...o, root: ROOT }),
  (d, o) => writeHome(d.company, { ...o, root: ROOT, de: german.de, heading: { en: "{n} values, each with the thing <em>we never do</em>.", de: "{n} Werte – jeder mit dem, <em>was wir nie tun</em>." } }),
  // One redirect page per entity of the company with a stable id, sending the reader on to its
  // place on the home page's stage, which draws company.json. The example and the core
  // vocabulary are not the company's entities and get none.
  (d, o) => writeIdPages(d.company, { ...o, root: ROOT, origin: "https://companygraph.io", stage: "/" }),
];

const stale = RENDERERS.flatMap((write) => write(data, { check }));

const unused = german.unused();
if (unused.length) {
  console.error(`  ✗ build/principles.de.json holds German for English the model no longer says:\n${unused.map((en) => `    "${en}"`).join("\n")}`);
  process.exit(1);
}
const unusedQuestions = questionsGerman.unused();
if (unusedQuestions.length) {
  console.error(`  ✗ build/questions.de.json holds German for a question the model no longer asks:\n${unusedQuestions.map((en) => `    "${en}"`).join("\n")}`);
  process.exit(1);
}

if (check) {
  if (stale.length) {
    console.error(`  ✗ ${stale.join(", ")} no longer match the artifacts — run: npm run pages`);
    process.exit(1);
  }
  console.log(`  ✓ every derived region matches the artifacts at ${repo}@${commit.slice(0, 7)}`);
} else {
  console.log(`  wrote every derived region from the artifacts at ${repo}@${commit.slice(0, 7)}`);
}
