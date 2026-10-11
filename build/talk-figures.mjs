// Writes each talk picture into its slide, between `<!-- picture: <name> -->` and
// `<!-- /picture: <name> -->`, as the figure chat.js draws: the Processes page's form, with the
// picture's own shape, so chat.js captions it and gives its reading line in either language.
// A picture `npm run pictures` drew from what would go into it now is inlined whole; one it did
// not is left for chat.js to draw, and named, since only `npm run pictures` can draw it again.
import fs from "node:fs";
import path from "node:path";
import { keptPicture, picturePath } from "@robertblust/design/pictures";
import { TALK_PICTURES, pictureJson } from "./talk-pictures.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** @param {string} root @param {import("./talk-pictures.mjs").TalkPicture} p @param {string[]} stale */
function figure(root, p, stale) {
  const picture = JSON.parse(fs.readFileSync(path.join(root, pictureJson(p.page, p.name)), "utf8"));
  const svg = keptPicture(root, p.page, p.name, picture);
  if (!svg) stale.push(picturePath(p.page, p.name));
  // A `<` is written as its escape, so no title can close the script it sits in.
  const json = JSON.stringify(picture).replace(/</g, "\\u003c");
  return [
    `<figure class="rbchat-diagram" data-diagram data-model="${esc(p.model)}" data-picture="${esc(p.name)}">`,
    `        <figcaption><span>${esc(picture.title ?? "")}</span><button class="rbchat-diagram-full" type="button" aria-label="Open full screen">⤢</button></figcaption>`,
    svg ? `        <div class="rbchat-diagram-box" data-drawn>${svg}</div>` : `        <div class="rbchat-diagram-box"></div>`,
    `        <script type="application/json">${json}</script>`,
    `      </figure>`,
  ].join("\n");
}

/** @param {{ check?: boolean; root: string }} o @returns {string[]} the pages that are not as they would be written */
export function writeTalkFigures({ check = false, root }) {
  const stale = [], changed = [];
  for (const page of [...new Set(TALK_PICTURES.map((p) => p.page))]) {
    const file = path.join(root, page), before = fs.readFileSync(file, "utf8");
    let next = before;
    for (const p of TALK_PICTURES.filter((x) => x.page === page)) {
      const start = `<!-- picture: ${p.name} -->`, end = `<!-- /picture: ${p.name} -->`;
      const re = new RegExp(`${start}[\\s\\S]*?${end}`);
      if (!re.test(next)) throw new Error(`${page} has no ${start} … ${end} block`);
      next = next.replace(re, () => `${start}\n      ${figure(root, p, stale)}\n      ${end}`);
    }
    if (next !== before) { changed.push(page); if (!check) fs.writeFileSync(file, next); }
  }
  if (stale.length) console.error(`  ✗ ${stale.join(", ")} not drawn from what the slide shows now — run: npm run pictures, then npm run pages`);
  return check ? [...changed, ...(stale.length ? stale : [])] : [];
}

export const TALK_PAGES = [...new Set(TALK_PICTURES.map((p) => p.page))];
