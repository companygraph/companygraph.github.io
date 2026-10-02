// The schemas an instance is written against: its core, vendored at `<units>/core/`, and the
// pack folders its `.companygraph/manifest.json` lists, vendored beside it at `<units>/<pack>/`.
// Core's files travel under bare keys and a pack's under `<pack>/<file>`, which is how the
// parser tells them apart (R20) and how meta-model's own `readInstance` hands them over.
// `read(sub)` returns the files under one folder of the instance's repository with that
// prefix stripped, whether from a checkout or from GitHub.
export async function readSchemas(read, { instance = "" } = {}) {
  const manifest = JSON.parse(
    (await read(`${instance}.companygraph/manifest.json`, { file: true })) ?? "{}");
  const units = manifest.units ?? "meta";
  const schemas = new Map(await read(`${instance}${units}/core/`));
  for (const pack of manifest.packs ?? [])
    for (const [file, text] of await read(`${instance}${units}/${pack}/`)) schemas.set(`${pack}/${file}`, text);
  return schemas;
}
