// Turns one instance — a map of path → Markdown — into the graph the example page draws.
//
// It reads the fixed shape and nothing else: YAML frontmatter as key/scalar or key/list, the
// H1 as the canonical name, the `>` tagline, `##` sections as heading plus text, a table by its
// header row. No schema is consulted. Types are folder names singularised by R7, ownership is
// nesting on disk (R5, R6), and every edge is a name in a file that resolves to another file's
// H1 — a name that resolves to nothing is an R4 error here, so the page can never draw a line
// to nowhere. CONVENTIONS.md in companygraph/meta-model is the source of the rule numbers.
//
// Pure: no filesystem, no network, so verify/instance.test.mjs can feed it fixture maps.

// The one string that is not in the instance. The example's own README calls itself "a
// fictional company", which is why this is the word.
export const ROOT_LABEL = "Fictional Company";

const singular = (folder) => {
  if (folder.endsWith("ies")) return folder.slice(0, -3) + "y";
  if (folder.endsWith("s")) return folder.slice(0, -1);
  return null;
};

function parseFrontmatter(lines) {
  if (lines[0] !== "---") return [{}, lines];
  const end = lines.indexOf("---", 1);
  const fields = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    fields[key] = raw.startsWith("[")
      ? raw.slice(1, raw.lastIndexOf("]")).split(",").map(s => s.trim()).filter(Boolean)
      : raw.trim();
  }
  return [fields, lines.slice(end + 1)];
}

function parseTable(lines) {
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
  const columns = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  return { columns, rows };
}

function parseBody(lines) {
  let name = "", tagline = "";
  const sections = [];
  let cur = null;
  const flush = () => {
    if (!cur) return;
    const tableLines = cur.lines.filter(l => l.trim().startsWith("|"));
    const textLines = cur.lines.filter(l => !l.trim().startsWith("|"));
    const section = { heading: cur.heading, text: textLines.join("\n").trim() };
    if (tableLines.length) section.table = parseTable(tableLines);
    sections.push(section);
  };
  for (const line of lines) {
    if (line.startsWith("# ") && !name) name = line.slice(2).trim();
    else if (line.startsWith("> ") && !tagline && !cur) tagline = line.slice(2).trim();
    else if (line.startsWith("## ")) { flush(); cur = { heading: line.slice(3).trim(), lines: [] }; }
    else if (cur) cur.lines.push(line);
  }
  flush();
  return { name, tagline, sections };
}

// A path is read pairwise: a folder, then the thing in it. `x.md` in a folder is an entity
// file; a directory `x` is an entity in folder form (its own file is `x/x.md`) and whatever
// follows it is a folder it owns.
function locate(path) {
  const parts = path.split("/");
  const chain = [];              // [{ folder, name, ownerId }]
  let ownerId = null;
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const folder = parts[i], item = parts[i + 1];
    const isFile = item.endsWith(".md");
    const name = isFile ? item.slice(0, -3) : item;
    const id = (ownerId ? ownerId + "/" : "") + folder + "/" + name;
    chain.push({ folder, name, ownerId, id, isFile });
    if (isFile) return { chain, self: chain[chain.length - 1] };
    if (i + 2 === parts.length - 1 && parts[i + 2] === name + ".md") {
      return { chain, self: chain[chain.length - 1] };
    }
    ownerId = id;
  }
  return null;
}

export function parseInstance(files) {
  const entities = [], typeMap = new Map();
  for (const [path, text] of [...files.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (!path.endsWith(".md") || path.split("/").pop() === "README.md") continue;
    const loc = locate(path);
    if (!loc) continue;
    const { self, chain } = loc;
    const type = singular(self.folder);
    if (!type) throw new Error(`R7: folder "${self.folder}" is not the plural of a type (${path})`);
    const ownerType = self.ownerId ? singular(chain[chain.length - 2].folder) : null;
    typeMap.set(type, { type, folder: self.folder, owner: ownerType });
    const lines = text.split("\n");
    const [fields, body] = parseFrontmatter(lines);
    const { name, tagline, sections } = parseBody(body);
    entities.push({ id: self.id, type, name, tagline, fields, sections,
                    owner: self.ownerId, path: "example/" + path });
  }
  entities.sort((a, b) => (a.id < b.id ? -1 : 1));

  const byName = new Map();
  for (const e of entities) {
    if (byName.has(e.name)) throw new Error(`R2: two entities share the name "${e.name}"`);
    byName.set(e.name, e.id);
  }
  const resolve = (value, where) => {
    if (!byName.has(value)) throw new Error(`R4: "${value}" in ${where} names no entity`);
    return byName.get(value);
  };

  const edges = [];
  for (const e of entities) {
    for (const [key, value] of Object.entries(e.fields)) {
      // A list names entities and every item must resolve (R4). A scalar is a reference only
      // when it happens to be a canonical name — `source: Local` is one, `location: Bergen` is
      // not — so it becomes an edge when it resolves and stays a fact when it does not.
      if (Array.isArray(value)) {
        for (const v of value) edges.push({ from: e.id, to: resolve(v, e.path), via: key, attrs: {} });
      } else if (byName.has(value)) {
        edges.push({ from: e.id, to: byName.get(value), via: key, attrs: {} });
      }
    }
    for (const s of e.sections) {
      if (!s.table) continue;
      for (const row of s.table.rows) {
        let to = null; const attrs = {}; let via = "";
        s.table.columns.forEach((col, i) => {
          const cell = row[i] ?? "";
          const resolved = byName.get(cell);
          if (resolved && !to) { to = resolved; via = `${s.heading}.${col}`; }
          else attrs[col] = resolved ?? cell;
        });
        if (!to) throw new Error(`R4: row "${row[0]}" in ${e.path} names no entity`);
        edges.push({ from: e.id, to, via, attrs });
      }
    }
  }
  edges.sort((a, b) => (a.from + a.via + a.to < b.from + b.via + b.to ? -1 : 1));

  const types = [...typeMap.values()].sort((a, b) => (a.type < b.type ? -1 : 1));
  return { commit: null, root: ROOT_LABEL, types, entities, edges };
}
