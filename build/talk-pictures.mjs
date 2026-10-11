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
// so drawn once it would be right in one theme only, and the build refuses it. A flowchart paints
// tokens alone and is drawn at build.

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
];

// What a picture is written as: the shape chat.js captions it by, and the server's answer
// without the fields only the server's own clients read.
/** @param {{ shape: string }} request @param {{ title: string | null; mermaid: string; nodes: { node: string; id: string; title: string }[] }} drawn */
export const pictureOf = (request, drawn) => ({
  shape: request.shape, title: drawn.title, mermaid: drawn.mermaid,
  nodes: drawn.nodes.map(({ node, id, title }) => ({ node, id, title })),
});

export const pictureJson = (page, name) => page.replace(/index\.html$/, `pictures/${name}.json`);
