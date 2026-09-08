// What the two stage pages show, said in the graph. Both drew a model and described themselves
// to a machine only as a WebPage, so the data behind them was reachable by scraping a script
// element out of rendered HTML and no other way — which is the work these nodes exist to make
// unnecessary.
//
// The two are not the same kind of thing. `/example/` holds a company: an identity, profiles,
// experiences, skills, values, a vision, so it is a Dataset. `/model/` holds nine documents
// stating the structure a file must carry, which are records about structure rather than about
// a company, so it is a DefinedTermSet. Schema.org gives a term set no `distribution` — that
// property takes a DataDownload and belongs to Dataset alone — so the file hangs off `encoding`,
// which takes a MediaObject, and a DataDownload is not used there either because its own
// definition is "all or part of a Dataset in downloadable form".
//
// The terms are generated. A term set whose terms are absent names a vocabulary without naming
// a word of it, and nine names maintained beside a model that already holds them is the drift
// this family keeps removing. Each keeps the schema's own name and tagline: calling the term
// `Experience` rather than `Experience Schema` reads better and is a transformation the model
// never authorized.
//
// This renderer owns the tail of each graph, not the head. The four nodes before it —
// Organization, WebSite, WebPage, BreadcrumbList — are this site's own and stay hand-written,
// so the node is appended and the head is passed through untouched.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://companygraph.io";
const LICENSE = "https://www.apache.org/licenses/LICENSE-2.0";
const CREATOR = { "@id": `${SITE}/#organization` };

// The four nodes this site writes by hand, in the order every page carries them. The renderer
// replaces what follows and refuses a page whose head is not this, rather than appending to a
// graph it does not recognize.
const HEAD = ["Organization", "WebSite", "WebPage", "BreadcrumbList"];

export function terms(model, repo) {
  return model.entities.map((e) => ({
    "@type": "DefinedTerm",
    "@id": `${SITE}/model/#term-${e.id.split("/").pop()}`,
    name: e.name,
    description: e.tagline,
    termCode: e.id.split("/").pop(),
    url: `https://github.com/${repo}/blob/${model.commit}/${e.path}`,
    inDefinedTermSet: { "@id": `${SITE}/model/#vocabulary` },
  }));
}

function nodeFor(dir, data, repo) {
  if (dir === "example") {
    return {
      "@type": "Dataset",
      "@id": `${SITE}/example/#dataset`,
      name: "Beacon Systems — an example CompanyGraph instance",
      description: "A fictional company described in CompanyGraph: its identity, profiles, experiences, skills, values and vision.",
      url: `${SITE}/example/`,
      license: LICENSE,
      creator: CREATOR,
      isBasedOn: `https://github.com/${repo}`,
      distribution: {
        "@type": "DataDownload",
        contentUrl: `${SITE}/example.json`,
        encodingFormat: "application/json",
      },
    };
  }
  return {
    "@type": "DefinedTermSet",
    "@id": `${SITE}/model/#vocabulary`,
    name: "CompanyGraph core vocabulary",
    description: "The schemas a company is described in: one per type, each stating the structure its files must carry and how they refer to one another.",
    url: `${SITE}/model/`,
    license: LICENSE,
    creator: CREATOR,
    encoding: {
      "@type": "MediaObject",
      contentUrl: `${SITE}/model.json`,
      encodingFormat: "application/json",
    },
    hasDefinedTerm: terms(data.model, repo),
  };
}

const RE = /(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/;

export function writeJsonLd(data, { check = false, root = HERE, repo } = {}) {
  if (!repo) throw new Error("writeJsonLd needs the repo from source.json");
  const stale = [];
  for (const dir of ["example", "model"]) {
    if (!data[dir]) throw new Error(`no artifact for ${dir}`);
    const rel = `${dir}/index.html`;
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const m = RE.exec(page);
    if (!m) throw new Error(`${rel} carries no JSON-LD block`);
    const doc = JSON.parse(m[2]);
    if (!Array.isArray(doc["@graph"])) throw new Error(`${rel}'s JSON-LD has no @graph`);
    // A graph that does not begin with the four hand-written nodes is a shape this renderer
    // does not recognize — refused outright rather than quietly rewritten.
    const head = doc["@graph"].slice(0, HEAD.length).map((n) => n && n["@type"]);
    if (head.join() !== HEAD.join()) {
      throw new Error(`${rel}: @graph must begin with ${HEAD.join(", ")}, not ${head.join(", ") || "nothing"}`);
    }
    const node = nodeFor(dir, data, repo);
    const tail = doc["@graph"].slice(HEAD.length);
    // The head is this site's and is passed through; the tail is this renderer's and is
    // replaced. A single node carrying this renderer's own @id is its previous output, so a
    // second run overwrites it rather than appending — that is what makes the render
    // idempotent. Anything else after the head is someone's own work, and the remedy for the
    // stale check it would cause is `npm run pages`, which would delete it without a word. So
    // a graph carrying a node this renderer does not own is refused rather than rewritten.
    const foreign = tail.filter((n) => !n || n["@id"] !== node["@id"]);
    if (foreign.length) {
      throw new Error(`${rel}: @graph carries ${foreign.length} node(s) after ${HEAD.join(", ")} that this renderer does not own — ${foreign.map((n) => (n && n["@id"]) || "an untyped node").join(", ")}`);
    }
    doc["@graph"] = [...doc["@graph"].slice(0, HEAD.length), node];
    const text = JSON.stringify(doc, null, 2);
    const next = page.replace(RE, (all, open, _body, close) => open + text + close);
    // It has to parse after the write as well as before it: this rewrites a region inside a
    // document that the rest of the site, and every crawler, reads as JSON. Re-extracted from
    // the rewritten page rather than from `text`, because parsing what JSON.stringify just
    // returned proves only that JSON.stringify works.
    const after = RE.exec(next);
    if (!after) throw new Error(`${rel}: the JSON-LD block did not survive the write`);
    JSON.parse(after[2]);
    if (next === page) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, next);
  }
  return stale;
}
