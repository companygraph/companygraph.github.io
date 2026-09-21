// What the stage pages show, said in the graph. Each drew a model and described itself to a
// machine only as a WebPage, so the data behind them was reachable by scraping a script
// element out of rendered HTML and no other way — which is the work these nodes exist to make
// unnecessary.
//
// They are not all the same kind of thing. `/example/` holds a company: an identity, profiles,
// experiences, skills, values, a vision, so it is a Dataset. `/model/` holds nine documents
// stating the structure a file must carry, which are records about structure rather than about
// a company, so it is a DefinedTermSet. Schema.org gives a term set no `distribution` — that
// property takes a DataDownload and belongs to Dataset alone — so the file hangs off `encoding`,
// which takes a MediaObject, and a DataDownload is not used there either because its own
// definition is "all or part of a Dataset in downloadable form". The landing page holds
// CompanyGraph itself, described in its own vocabulary, which is a company again and so a
// Dataset like the example, under the instance's own license rather than the meta-model's.
//
// The terms are generated. A term set whose terms are absent names a vocabulary without naming
// a word of it, and nine names maintained beside a model that already holds them is the drift
// this family keeps removing. Each keeps the schema's own name and tagline: calling the term
// `Experience` rather than `Experience Schema` reads better and is a transformation the model
// never authorized.
//
// One node is the same on every page: the Dataset for CompanyGraph's own model, `company.json`,
// which every page names in its footer. It is written from one definition into every graph the
// site carries, decks included: a node typed once per page is a node that can differ between
// them.
//
// This renderer owns the tail of each graph, not the head. The nodes before it are this site's
// own and stay hand-written, so the node is appended and the head is passed through untouched.
// Each page names its head: the stage pages open with Organization, WebSite, WebPage,
// BreadcrumbList, and the landing page, which has no breadcrumb, with the person, the
// organization, the website, the software and the page.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://companygraph.io";
const LICENSE = "https://www.apache.org/licenses/LICENSE-2.0";
// companygraph/mental-model is CC BY 4.0, not the meta-model's Apache 2.0.
const INSTANCE_LICENSE = "https://creativecommons.org/licenses/by/4.0/";
const CREATOR = { "@id": `${SITE}/#organization` };

// Every page that carries a graph, the nodes it writes by hand in the order it carries them,
// and the artifact whose own node follows them, if any. The renderer replaces what follows the
// head and refuses a page whose head is not its own, rather than appending to a graph it does
// not recognize. The stage pages come first, so a stage page's refusal is what a broken fixture
// reports first. A page with a graph that is not listed here fails the test that reads every
// page, rather than going without the company's node quietly.
const PAGE_HEAD = ["Organization", "WebSite", "WebPage", "BreadcrumbList"];
export const PAGES = [
  { file: "example/index.html", head: PAGE_HEAD, own: "example" },
  { file: "model/index.html", head: PAGE_HEAD, own: "model" },
  { file: "index.html", head: ["Person", "Organization", "WebSite", "SoftwareSourceCode", "WebPage"] },
  { file: "billing/index.html", head: PAGE_HEAD },
  { file: "privacy/index.html", head: PAGE_HEAD },
  { file: "principles/index.html", head: PAGE_HEAD },
  { file: "team/index.html", head: PAGE_HEAD },
  { file: "talks/index.html", head: PAGE_HEAD },
  { file: "talks/intro/index.html", head: PAGE_HEAD },
];

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
  if (dir === "company") {
    return {
      "@type": "Dataset",
      "@id": `${SITE}/#dataset`,
      // As the example's: the name comes from the instance, and so does the repository, which
      // the artifact names because it is not the meta-model.
      name: `${data.company.root} — the company described in CompanyGraph`,
      description: "CompanyGraph described in the vocabulary it publishes: its direction, the roles and processes it works by, and what it builds.",
      url: `${SITE}/`,
      license: INSTANCE_LICENSE,
      creator: CREATOR,
      isBasedOn: `https://github.com/${data.company.repo}`,
      distribution: {
        "@type": "DataDownload",
        contentUrl: `${SITE}/company.json`,
        encodingFormat: "application/json",
      },
    };
  }
  if (dir === "example") {
    return {
      "@type": "Dataset",
      "@id": `${SITE}/example/#dataset`,
      // The company's name comes from the instance, not from here, so a re-pin that renames it
      // upstream carries the new name onto the page instead of leaving a claim nothing checks.
      name: `${data.example.root} — an example CompanyGraph instance`,
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

export function writeJsonLd(data, { check = false, root = HERE, repo, pages = PAGES } = {}) {
  if (!repo) throw new Error("writeJsonLd needs the repo from source.json");
  for (const key of ["example", "model", "company"]) if (!data[key]) throw new Error(`no artifact for ${key}`);
  const stale = [];
  for (const { file: rel, head: HEAD, own } of pages) {
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
    const nodes = [...(own ? [nodeFor(own, data, repo)] : []), nodeFor("company", data, repo)];
    const ids = new Set(nodes.map((n) => n["@id"]));
    const tail = doc["@graph"].slice(HEAD.length);
    // The head is this site's and is passed through; the tail is this renderer's and is
    // replaced. A node carrying one of this renderer's own @ids is its previous output, so a
    // second run overwrites it rather than appending — that is what makes the render
    // idempotent. Anything else after the head is someone's own work, and the remedy for the
    // stale check it would cause is `npm run pages`, which would delete it without a word. So
    // a graph carrying a node this renderer does not own is refused rather than rewritten.
    const foreign = tail.filter((n) => !n || !ids.has(n["@id"]));
    if (foreign.length) {
      throw new Error(`${rel}: @graph carries ${foreign.length} node(s) after ${HEAD.join(", ")} that this renderer does not own — ${foreign.map((n) => (n && n["@id"]) || "an untyped node").join(", ")}`);
    }
    doc["@graph"] = [...doc["@graph"].slice(0, HEAD.length), ...nodes];
    // The terms carry upstream `name` and `description` text into a script element, and a
    // `</` inside a JSON string would end that element early in the browser while the JSON
    // still parses. The re-parse below cannot see it: it re-extracts on a newline before
    // `</script>`, which an injection inside a string would not carry. `\u003c` is a valid
    // JSON escape for `<`, so the block still parses to identical data.
    const text = JSON.stringify(doc, null, 2).replace(/</g, "\\u003c");
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
