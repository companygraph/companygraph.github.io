// The vendored copy is the deliverable — the pages load ../d3.v7.min.js, not the package — so
// the only thing that can go wrong silently is the two drifting apart. It sits at the root
// beside stage.css and stage.js, because more than one page loads it.
//
// This is the whole of what was verify/instance.test.mjs. The other 21 tests were the instance
// parser's, and they moved with the parser into companygraph-meta-model; a file called
// instance.test.mjs that tests d3 is how this repository's dependabot.yml came to describe the
// wrong file. What is left is not a claim about a parser at all — it is site infrastructure,
// and the name says so.
//
// The skip stays. In CI this now runs after `npm ci`, so it is live on every push; the guard
// is for a working copy that has not installed. On blust.ch the same test could never do
// anything — that site declares no d3, so the skip fired on every machine forever — which is
// why it was deleted there rather than carried along.
//
// Note this is not the same assertion as `design:check`, and both are wanted: design:check
// catches the vendored copy drifting from the *package's* copy, this catches it drifting from
// *node_modules/d3*, which is what a Dependabot d3 bump moves.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("the vendored d3 is the pinned package's build, byte for byte", (t) => {
  const packagedPath = new URL("../node_modules/d3/dist/d3.min.js", import.meta.url);
  if (!fs.existsSync(packagedPath)) return t.skip("node_modules not installed");
  const vendored = fs.readFileSync(new URL("../d3.v7.min.js", import.meta.url));
  const packaged = fs.readFileSync(packagedPath);
  assert.ok(vendored.equals(packaged), "d3.v7.min.js differs from node_modules/d3/dist/d3.min.js — copy it again");
});
