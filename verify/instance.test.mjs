// The parser reads an instance by the fixed shape alone — no schema — so these fixtures are
// small maps of path → Markdown, and every rule the spec names has a fixture that breaks it.
import test from "node:test";
import assert from "node:assert/strict";
import { parseInstance, ROOT_LABEL } from "../example/instance.mjs";

const valid = new Map([
  ["README.md", "# Example instance\n\nIgnored: a README is never an entity.\n"],
  ["values/craftsmanship.md", "# Craftsmanship\n\n> We ship one thing.\n\n## In practice\n\nRefusing a deadline.\n"],
  ["skills/java-programming.md", "---\ngroup: Programming Languages\n---\n\n# Java Programming\n\n> JVM services.\n\n## In practice\n\nReading the stack trace.\n"],
  ["proficiency-levels/proficient.md", "---\nrank: 30\n---\n\n# Proficient\n\n> Exercises judgment.\n\n## What it means\n\nMakes calls.\n"],
  ["profiles/mira-halvorsen/mira-halvorsen.md",
   "---\nemail: mira@example.invalid\nlocation: Bergen\n---\n\n# Mira Halvorsen\n\n> Backend engineer.\n\n## Skills\n\n| Skill | Level | Evidence |\n| --- | --- | --- |\n| Java Programming | Proficient | Owned the JVM services. |\n\n## Summary\n\nEight years.\n"],
  ["profiles/mira-halvorsen/experiences/2022-beacon-systems.md",
   "---\nstart: 2022-02\norganisation: Beacon Systems\nskills: [Java Programming]\n---\n\n# Splitting the billing domain\n\n> Ongoing.\n\n## Achievements\n\n- Split one service.\n"],
]);

test("the root label is the one invented string", () => {
  assert.equal(parseInstance(valid).root, ROOT_LABEL);
  assert.equal(ROOT_LABEL, "Fictional Company");
});

test("types come from folders, singular by R7, with their owner", () => {
  const { types } = parseInstance(valid);
  assert.deepEqual(types, [
    { type: "experience", folder: "experiences", owner: "profile" },
    { type: "proficiency-level", folder: "proficiency-levels", owner: null },
    { type: "profile", folder: "profiles", owner: null },
    { type: "skill", folder: "skills", owner: null },
    { type: "value", folder: "values", owner: null },
  ]);
});

test("an entity is its H1, tagline, fields, sections and path; a README is not one", () => {
  const { entities } = parseInstance(valid);
  assert.equal(entities.length, 5);
  const java = entities.find(e => e.id === "skills/java-programming");
  assert.deepEqual(java, {
    id: "skills/java-programming", type: "skill", name: "Java Programming",
    tagline: "JVM services.", fields: { group: "Programming Languages" },
    sections: [{ heading: "In practice", text: "Reading the stack trace." }],
    owner: null, path: "example/skills/java-programming.md",
  });
});

test("the folder form names the entity by its folder and owns what nests inside it", () => {
  const { entities } = parseInstance(valid);
  const mira = entities.find(e => e.name === "Mira Halvorsen");
  assert.equal(mira.id, "profiles/mira-halvorsen");
  assert.equal(mira.path, "example/profiles/mira-halvorsen/mira-halvorsen.md");
  const exp = entities.find(e => e.type === "experience");
  assert.equal(exp.owner, "profiles/mira-halvorsen");
  assert.equal(exp.id, "profiles/mira-halvorsen/experiences/2022-beacon-systems");
});

test("a table section is kept as rows, and its body text is empty", () => {
  const mira = parseInstance(valid).entities.find(e => e.name === "Mira Halvorsen");
  const skills = mira.sections.find(s => s.heading === "Skills");
  assert.deepEqual(skills.table, {
    columns: ["Skill", "Level", "Evidence"],
    rows: [["Java Programming", "Proficient", "Owned the JVM services."]],
  });
  assert.equal(skills.text, "");
});

test("a frontmatter list that names entities becomes edges", () => {
  const { edges } = parseInstance(valid);
  const e = edges.find(x => x.via === "skills");
  assert.deepEqual(e, {
    from: "profiles/mira-halvorsen/experiences/2022-beacon-systems",
    to: "skills/java-programming", via: "skills", attrs: {},
  });
});

test("a table row's first resolving cell is the edge; other cells are attrs, resolved where they can be", () => {
  const { edges } = parseInstance(valid);
  const e = edges.find(x => x.via === "Skills.Skill");
  assert.deepEqual(e, {
    from: "profiles/mira-halvorsen", to: "skills/java-programming", via: "Skills.Skill",
    attrs: { Level: "proficiency-levels/proficient", Evidence: "Owned the JVM services." },
  });
});

test("a name that resolves to nothing is an R4 error", () => {
  const broken = new Map(valid);
  broken.set("profiles/mira-halvorsen/experiences/2022-beacon-systems.md",
    "---\nstart: 2022-02\nskills: [Kotlin]\n---\n\n# Splitting\n\n> x\n");
  assert.throws(() => parseInstance(broken), /^Error: R4: .*Kotlin/);
});

test("a root folder that is not a plural is an R7 error", () => {
  const broken = new Map(valid);
  broken.set("value/humility.md", "# Humility\n\n> x\n");
  assert.throws(() => parseInstance(broken), /^Error: R7: .*value/);
});

test("output is deterministic regardless of map order", () => {
  const shuffled = new Map([...valid.entries()].reverse());
  assert.deepEqual(parseInstance(shuffled), parseInstance(valid));
});
