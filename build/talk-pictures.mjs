// The pictures the talks show, each one the MCP server's own drawing of a model the site pins.
// A slide that says “this is how the server draws it” shows the server's code drawing it, not a
// copy: `build.mjs` builds a snapshot of the pinned instance with the server package's own
// `buildSnapshot` and asks its `diagram` for each picture here, writing what it answered beside
// the talk as `<talk>/pictures/<name>.json`; `pages.mjs` writes that into the slide as a figure
// chat.js draws, and `npm run pictures` draws it once, as it draws the Processes page's.
//
// `from` names the artifact whose instance is drawn, `company` for CompanyGraph's own model and
// `example` for the example company, and `model` is where a node links, relative to the talk.
// `browser: true` marks a picture chat.js draws in the visitor's browser instead, when its tab is
// first shown: Mermaid paints a class, sequence or state diagram partly in colors that are no token,
// and the marks before a person's or a system's name the same, so drawn once it would be right in one
// theme only, and the build refuses it. A flowchart without marks paints tokens alone and is drawn
// at build.

/** @typedef {{ page: string; name: string; from: "company" | "example"; model: string; request: Record<string, string>; browser?: boolean }} TalkPicture */

/** @type {TalkPicture[]} */
export const TALK_PICTURES = [
  // The context map around Checking: the contexts it depends on and how, as the rows of its
  // `## Relationships` and every other context's say.
  { page: "talks/software-pack/index.html", name: "context-map", from: "company", model: "../../", request: { shape: "context", id: "01a10042-5ce7-7756-9ce4-1cf2a4435aa2" } },
  // The aggregate Checking holds, Check run, three ways: what it holds and emits, the flow of a
  // command it handles to the events it answers with, and the states a run ends in.
  { page: "talks/software-pack/index.html", name: "aggregate", from: "company", model: "../../", browser: true, request: { shape: "aggregate", id: "01a10042-5d16-7600-aa84-b9739571a03f" } },
  { page: "talks/software-pack/index.html", name: "flow", from: "company", model: "../../", browser: true, request: { shape: "flow", id: "01a10042-5d16-7600-aa84-b9739571a03f" } },
  { page: "talks/software-pack/index.html", name: "lifecycle", from: "company", model: "../../", browser: true, request: { shape: "lifecycle", id: "01a10042-5d16-7600-aa84-b9739571a03f" } },
  // The example company's organization, its disciplinary line and staff, and one team drawn on its
  // own, where the server draws an arrow for each row of the team's `## Direction`.
  { page: "talks/organization-pack/index.html", name: "organization", from: "example", model: "../../example/", browser: true, request: { shape: "organization" } },
  { page: "talks/organization-pack/index.html", name: "team", from: "example", model: "../../example/", browser: true, request: { shape: "organization", id: "01a1152c-3863-79ba-8430-755ed2dec49c" } },
  // The MCP server in its landscape: what it runs on, what it takes data from and gives it to, the
  // service it provides and what it holds; and what it holds among every system that holds the same.
  { page: "talks/landscape-pack/index.html", name: "system", from: "company", model: "../../", browser: true, request: { shape: "system", id: "01a1256e-8662-7925-9097-a884e87a2658" } },
  { page: "talks/landscape-pack/index.html", name: "holds", from: "company", model: "../../", browser: true, request: { shape: "holds", id: "01a1256e-8662-7925-9097-a884e87a2658" } },
  // One use case of our own model in its scope with its actor, the subfunction it includes and its
  // feature, then as its scenario, and what that feature is held to.
  { page: "talks/requirements-pack/index.html", name: "usecase", from: "company", model: "../../", browser: true, request: { shape: "usecase", id: "01a1312c-5cfc-7c71-bd35-b7da880c4254" } },
  { page: "talks/requirements-pack/index.html", name: "scenario", from: "company", model: "../../", browser: true, request: { shape: "scenario", id: "01a1312c-5cfc-7c71-bd35-b7da880c4254" } },
  { page: "talks/requirements-pack/index.html", name: "requirements", from: "company", model: "../../", browser: true, request: { shape: "requirements", id: "01a0c29a-9610-7599-88be-da45e0941d77" } },
];

// What a picture is written as: the shape chat.js captions it by, and the server's answer
// without the fields only the server's own clients read.
/** @param {{ shape: string }} request @param {{ title: string | null; mermaid: string; nodes: { node: string; id: string; title: string }[] }} drawn */
export const pictureOf = (request, drawn) => ({
  shape: request.shape, title: drawn.title, mermaid: drawn.mermaid,
  nodes: drawn.nodes.map(({ node, id, title }) => ({ node, id, title })),
});

export const pictureJson = (page, name) => page.replace(/index\.html$/, `pictures/${name}.json`);
