# SEO — the head contract

*2026-08-25. The same spec `blust.ch` and `guestgraph.io` carry, because the three sites
share a head and drifted the same way. What differs here is how much of it went missing,
and how recently.*

## The problem, measured

1. **The landing page has no head left.** No `<link rel="canonical">`, no
   `<meta name="description">`, no `og:site_name`, no `og:image:alt`, no `og:locale`, no
   structured data. The other five pages carry all six. This is not old debt — the landing
   page was re-aimed recently, and the rework took the head with it. Every check stayed
   green throughout, because none of them looked at any of this.

   That is the whole argument for this spec, on the one page that matters most
   commercially. `og:title`, `og:image` and `twitter:card` survived, so the share preview
   still looks right — which is exactly why nobody noticed.

2. **`/talks/` is missing `og:site_name`, `og:image:alt` and `og:locale`.** Same shape,
   smaller blast radius.

3. **`/billing/`, `/privacy/` and `/example/` declare `isPartOf` a `#website` node that no
   page carries.** Google resolves `@graph` within one document, so the reference resolves
   to nothing.

4. **The suite has no crawl-map check at all** — no sitemap assertion, no `robots.txt`
   assertion. `blust.ch`'s already had one. On `guestgraph.io` the absence had already cost
   two 404 sitemaps in production, named to every crawler on every fetch.

## What "good Google support" means here

**1. A canonical URL** — absolute, byte-identical to `og:url`.

**2. A title and a description** — present, within the lengths Google renders (65 / 200).

**3. Structured data that resolves.** Every `@id` a page references defined on that page;
every same-origin URL in it fetchable. The types:

- `Organization` and `WebSite` on every page, so `isPartOf` and `publisher` have targets.
- `WebPage` per page.
- `BreadcrumbList` on every nested page — the one type here that earns a visible Google
  result: the path above a search hit instead of a bare URL.
- `SoftwareSourceCode` on the landing page, with `codeRepository` and `license`. Both
  checked rather than assumed: `companygraph/meta-model` is public and its licence field
  reads `Apache-2.0`. Deliberately **not** `SoftwareApplication` — that rich result wants
  offers and ratings, and this project has neither. Claiming the type without them
  describes a product that does not exist.

**4. Sitemaps that resolve, both directions.** Every URL the sitemap lists is a real page,
and every sitemap `robots.txt` names is a real file.

## Non-goals, and why

**`hreflang` is not applicable, and adding it would be wrong.** These pages are bilingual
through `data-de` swapped in by `applyLang()` at runtime — one URL per page. `hreflang`
announces *another address* for the other language, and there is none. Pointing it at the
same URL is inert at best and an invitation to treat one page as two at worst. `og:locale`
plus `og:locale:alternate` describes one document carrying two languages, which is what
this is. Revisit the day `/de/` URLs ship.

**No `VideoObject` on the talk pages.** There is no video — the deck is HTML with
synthesized narration clips. Marking it up as video is structured data that contradicts the
page, which is what manual actions are for.

**The deck's twelve `<h1>` stay.** One per slide is what a slide is.

**No keyword pages.** "Every role, every rule." is not a query anyone types. That is a
content decision, not a metadata one, and no tag compensates for it.

## The check is the deliverable

`verify/check.mjs` gains `seo` on every page and the crawl-map block this suite never had.
Written before the fixes and run first. The landing page, exactly as `main` carries it,
fails with:

```
✗ /
    seo: no canonical; no meta description; no og:site_name; no og:locale;
         no og:image:alt; no application/ld+json
```

That line is the deliverable. The tags are just what makes it pass.
