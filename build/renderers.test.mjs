// The renderers are pure functions of the artifacts, so they are tested on fixtures rather
// than on the real files: a test that read model.json would pass for the wrong reason the day
// the model changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeBlock } from "./block.mjs";

const FIXTURE = {
  example: { commit: "0".repeat(40), root: "Someone", rootId: "identity", types: [], entities: [], edges: [] },
  model:   { commit: "0".repeat(40), root: "Core", rootId: null, types: [], entities: [], edges: [] },
};

const EMPTY = (marker, id) => `<p>before</p>
<!-- ${marker} · none -->
<script type="application/json" id="${id}" data-stage></script>
<!-- /${marker} -->
<p>after</p>
`;

function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-render-"));
  for (const [d, marker, id] of [["example", "example data", "example-data"], ["model", "model data", "model-data"]]) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, "index.html"), EMPTY(marker, id));
  }
  return dir;
}

test("writeBlock fills both blocks and leaves the rest of each page alone", () => {
  const dir = scratch();
  assert.deepEqual(writeBlock(FIXTURE, { check: false, root: dir }), []);
  for (const [d, name] of [["example", "example"], ["model", "model"]]) {
    const page = fs.readFileSync(path.join(dir, d, "index.html"), "utf8");
    assert.match(page, new RegExp(`<!-- ${name} data · 0{40} -->`));
    assert.ok(page.includes(JSON.stringify(FIXTURE[d])));
    assert.ok(page.startsWith("<p>before</p>"));
    assert.ok(page.trimEnd().endsWith("<p>after</p>"));
  }
});

test("writeBlock in check mode names every page that drifted", () => {
  const dir = scratch();
  assert.deepEqual(writeBlock(FIXTURE, { check: true, root: dir }).sort(),
    ["example/index.html", "model/index.html"]);
});

test("writeBlock reports nothing once the pages are written", () => {
  const dir = scratch();
  writeBlock(FIXTURE, { check: false, root: dir });
  assert.deepEqual(writeBlock(FIXTURE, { check: true, root: dir }), []);
});

import { writeJsonLd, terms } from "./jsonld.mjs";

const SCHEMAS = {
  ...FIXTURE,
  model: { ...FIXTURE.model, entities: [
    { id: "core/experience", type: "schema", name: "Experience Schema",
      tagline: "Required structure for experience files.", path: "core/experience-schema.md", sections: [] },
    { id: "core/skill", type: "schema", name: "Skill Schema",
      tagline: "Required structure for skill files.", path: "core/skill-schema.md", sections: [] },
  ] },
};

test("terms takes its code from the id and its url from the path", () => {
  const [first] = terms(SCHEMAS.model, "example/meta");
  assert.equal(first.name, "Experience Schema");
  assert.equal(first.description, "Required structure for experience files.");
  assert.equal(first.termCode, "experience");
  assert.equal(first.url,
    `https://github.com/example/meta/blob/${SCHEMAS.model.commit}/core/experience-schema.md`);
  assert.deepEqual(first.inDefinedTermSet, { "@id": "https://companygraph.io/model/#vocabulary" });
});

function ldScratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-ld-"));
  const doc = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": "https://companygraph.io/#organization", name: "CompanyGraph" },
    { "@type": "WebSite", "@id": "https://companygraph.io/#website", name: "CompanyGraph" },
    { "@type": "WebPage", "@id": "https://companygraph.io/model/#webpage", name: "Kept" },
    { "@type": "BreadcrumbList", "@id": "https://companygraph.io/model/#breadcrumb", itemListElement: [] },
  ] };
  for (const d of ["example", "model"]) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, "index.html"),
      `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  }
  return { dir, doc };
}

test("writeJsonLd appends its node and leaves the four existing ones untouched", () => {
  const { dir, doc } = ldScratch();
  writeJsonLd(SCHEMAS, { check: false, root: dir, repo: "example/meta" });
  const read = (d) => JSON.parse(fs.readFileSync(path.join(dir, d, "index.html"), "utf8")
    .match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/)[1])["@graph"];
  const model = read("model");
  assert.equal(model.length, 5, "four kept plus one appended");
  assert.deepEqual(model.slice(0, 4), doc["@graph"], "the existing nodes are untouched");
  assert.equal(model[4]["@type"], "DefinedTermSet");
  assert.equal(model[4].hasDefinedTerm.length, 2);
  assert.equal(model[4].encoding.contentUrl, "https://companygraph.io/model.json");
  const example = read("example");
  assert.equal(example[4]["@type"], "Dataset");
  assert.equal(example[4].distribution.contentUrl, "https://companygraph.io/example.json");
});

test("writeJsonLd is idempotent: a second run is byte-identical and check reports nothing", () => {
  // The guard's one-trailing-node case rests on this: a rerun's own previous node must be
  // recognized by @id and replaced, not mistaken for someone else's hand-written node. If it
  // were, either this would throw on the second run, or the file would drift on every render.
  const { dir } = ldScratch();
  writeJsonLd(SCHEMAS, { check: false, root: dir, repo: "example/meta" });
  const before = {
    example: fs.readFileSync(path.join(dir, "example", "index.html"), "utf8"),
    model: fs.readFileSync(path.join(dir, "model", "index.html"), "utf8"),
  };
  assert.deepEqual(writeJsonLd(SCHEMAS, { check: false, root: dir, repo: "example/meta" }), []);
  assert.equal(fs.readFileSync(path.join(dir, "example", "index.html"), "utf8"), before.example);
  assert.equal(fs.readFileSync(path.join(dir, "model", "index.html"), "utf8"), before.model);
  assert.deepEqual(writeJsonLd(SCHEMAS, { check: true, root: dir, repo: "example/meta" }), []);
});

test("writeJsonLd refuses a graph whose head is not the four it passes through", () => {
  // The guard exists so a differently shaped page is refused rather than having four
  // hand-written nodes silently replaced by one. A graph missing its BreadcrumbList is the
  // case that matters: the slice would keep three of them and drop the fourth.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-ld-bad-"));
  const doc = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": "https://companygraph.io/#organization", name: "CompanyGraph" },
    { "@type": "WebSite", "@id": "https://companygraph.io/#website", name: "CompanyGraph" },
    { "@type": "WebPage", "@id": "https://companygraph.io/model/#webpage", name: "Kept" },
  ] };
  for (const d of ["example", "model"]) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, "index.html"),
      `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  }
  assert.throws(() => writeJsonLd(SCHEMAS, { check: true, root: dir, repo: "example/meta" }),
    /must begin with/);
});

function ldBadScratch(graph) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-ld-bad-"));
  const doc = { "@context": "https://schema.org", "@graph": graph };
  for (const d of ["example", "model"]) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, "index.html"),
      `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  }
  return dir;
}

test("writeJsonLd refuses a graph whose head is the right length but the wrong order", () => {
  // Four nodes, all of them expected types, just not in the order this site always writes
  // them — the length check alone would let this through.
  const dir = ldBadScratch([
    { "@type": "Organization", "@id": "https://companygraph.io/#organization", name: "CompanyGraph" },
    { "@type": "WebSite", "@id": "https://companygraph.io/#website", name: "CompanyGraph" },
    { "@type": "BreadcrumbList", "@id": "https://companygraph.io/model/#breadcrumb", itemListElement: [] },
    { "@type": "WebPage", "@id": "https://companygraph.io/model/#webpage", name: "Kept" },
  ]);
  assert.throws(() => writeJsonLd(SCHEMAS, { check: true, root: dir, repo: "example/meta" }),
    /must begin with/);
});

test("writeJsonLd refuses a single trailing node it does not own, rather than replacing it", () => {
  // The case that matters: not two or more trailing nodes, but exactly one that is not this
  // renderer's own — the shape a page gets the moment someone hand-adds a fifth node after
  // the four. Identity, not count, is what tells this apart from a rerun's own previous
  // output, so the guard has to compare @id rather than just measuring the tail.
  const dir = ldBadScratch([
    { "@type": "Organization", "@id": "https://companygraph.io/#organization", name: "CompanyGraph" },
    { "@type": "WebSite", "@id": "https://companygraph.io/#website", name: "CompanyGraph" },
    { "@type": "WebPage", "@id": "https://companygraph.io/model/#webpage", name: "Kept" },
    { "@type": "BreadcrumbList", "@id": "https://companygraph.io/model/#breadcrumb", itemListElement: [] },
    { "@type": "Person", "@id": "https://blust.ch/#person", name: "Someone hand-written" },
  ]);
  assert.throws(() => writeJsonLd(SCHEMAS, { check: true, root: dir, repo: "example/meta" }),
    /does not own — https:\/\/blust\.ch\/#person/);
});

test("writeJsonLd refuses a graph carrying more than one node after the four it owns, rather than deleting the rest", () => {
  // Two trailing nodes, one of them carrying this renderer's own @id and one not: even the
  // node that would ordinarily be a safe rerun-replacement is refused here, because it is not
  // alone — the guard does not try to sort the trailing nodes into "mine" and "not mine" and
  // silently drop only the ones it doesn't recognize.
  const dir = ldBadScratch([
    { "@type": "Organization", "@id": "https://companygraph.io/#organization", name: "CompanyGraph" },
    { "@type": "WebSite", "@id": "https://companygraph.io/#website", name: "CompanyGraph" },
    { "@type": "WebPage", "@id": "https://companygraph.io/model/#webpage", name: "Kept" },
    { "@type": "BreadcrumbList", "@id": "https://companygraph.io/model/#breadcrumb", itemListElement: [] },
    { "@type": "DefinedTermSet", "@id": "https://companygraph.io/model/#vocabulary", name: "Prior run" },
    { "@type": "Person", "@id": "https://companygraph.io/#person", name: "Someone hand-written" },
  ]);
  assert.throws(() => writeJsonLd(SCHEMAS, { check: true, root: dir, repo: "example/meta" }),
    /does not own — .*#person/);
});
