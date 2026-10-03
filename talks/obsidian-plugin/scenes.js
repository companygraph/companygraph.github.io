/* The windows of this talk, animated. Each feature slide names its scene in data-scene; a scene
   runs while its slide is on screen and stops when it leaves. Under reduced motion, and in a
   browser driven by a script (the PDF and card export, the verify suite), a scene paints one
   still frame instead, the one that shows what the slide is about. The text a scene writes is
   the plugin's and the model's, which are English in both languages. */
(function () {
  var still = navigator.webdriver || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ctx(win) {
    var alive = true;
    var c = {
      win: win,
      stop: function () { alive = false; },
      sl: function (ms) { return new Promise(function (res, rej) { setTimeout(function () { alive ? res() : rej("stop"); }, ms); }); },
      q: function (s) { return win.querySelector(s); },
      qa: function (s) { return Array.prototype.slice.call(win.querySelectorAll(s)); },
      ty: async function (el, t, ms) { for (var i = 0; i < t.length; i++) { el.textContent += t[i]; await c.sl(ms || 85); } },
      bk: async function (el, n) { for (; n > 0; n--) { el.textContent = el.textContent.slice(0, -1); await c.sl(45); } },
      // Where an element sits inside the window, in the window's own pixels: the deck is a
      // scaled plane, so a client rect is divided back by the scale.
      box: function (el) {
        var w = win.getBoundingClientRect(), r = el.getBoundingClientRect(), s = w.width / win.offsetWidth || 1;
        return { x: (r.left - w.left) / s, y: (r.top - w.top) / s, w: r.width / s, h: r.height / s };
      },
      // Places an absolutely positioned element at a point given in the window's pixels,
      // whichever element inside the window it is positioned against.
      place: function (el, x, y) {
        var o = el.offsetParent && el.offsetParent !== win ? c.box(el.offsetParent) : { x: 0, y: 0 };
        el.style.left = (x - o.x) + "px"; el.style.top = (y - o.y) + "px";
      },
      go: async function (el, dx, dy) {
        var b = c.box(el), p = c.q(".pt");
        p.style.left = (b.x + b.w * (dx == null ? 0.5 : dx)) + "px"; p.style.top = (b.y + b.h * (dy == null ? 0.5 : dy)) + "px";
        await c.sl(850);
      },
      away: function () { var p = c.q(".pt"); p.style.left = "110%"; p.style.top = "110%"; },
      tap: async function () { var p = c.q(".pt"); p.style.transform = "scale(.8)"; await c.sl(170); p.style.transform = ""; await c.sl(220); },
      note: function (t, ms) { var n = c.q(".no"); n.textContent = t; n.style.opacity = 1; if (!still) setTimeout(function () { n.style.opacity = 0; }, ms || 2000); },
      show: function (el, on, how) { el.style.display = on ? (how || "block") : "none"; },
      // A list under an element, as a completion popup or a picker stands under the line.
      list: function (pop, items, on, under) {
        pop.innerHTML = items.map(function (x, i) { return '<div class="' + (i === on ? "on" : "") + '">' + x + "</div>"; }).join("");
        pop.style.display = "block";
        var b = c.box(under); c.place(pop, b.x, b.y + b.h + 4);
      },
      palette: async function (t) {
        var p = c.q(".pal"), i = c.q(".pal .in"), it = c.q(".pal .it");
        i.textContent = ""; it.textContent = ""; p.style.display = "block"; await c.sl(400);
        await c.ty(i, t, 55); it.textContent = "CompanyGraph: " + t; await c.sl(700); p.style.display = "none";
      },
      status: function (ok, text) {
        var d = c.q(".wst .dot"), t = c.q(".wst .stt");
        if (d) d.className = "dot" + (ok ? "" : " bad");
        if (t) t.textContent = text || (ok ? "CompanyGraph: complies" : "CompanyGraph: 1 failure");
      },
      fade: async function (el, html) { el.style.opacity = 0; await c.sl(320); el.innerHTML = html; el.style.opacity = 1; }
    };
    return c;
  }

  var S = {};

  S.compliance = (function () {
    var OK = '<p style="margin-top:.8em"><i class="dot" style="display:inline-block"></i> The instance complies.</p><p class="dim" style="margin-top:.5em">Every change checks the whole model, because a reference crosses files.</p>';
    var BAD = '<div style="margin-top:.8em;border-left:3px solid var(--warn);padding-left:.7em"><div class="src">decisions/</div><div class="src">2026-vendored-core.md</div><div class="dim">line 7</div><div>by names “Architect”, and no role has that name</div></div><p class="dim" style="margin-top:.9em">Copy report</p>';
    function fail(c) { var v = c.q(".v"); v.className = "v bad"; c.q(".gm").classList.add("on"); c.status(false); }
    return {
      reset: function (c) { var v = c.q(".v"); v.textContent = ""; v.className = "v"; c.q(".gm").classList.remove("on"); c.status(true); c.q(".pn").innerHTML = OK; },
      rest: function (c) { c.q(".v").textContent = "Architect"; fail(c); c.q(".pn").innerHTML = BAD; },
      run: async function (c) {
        var v = c.q(".v");
        await c.sl(900); await c.ty(v, "Architect", 110); await c.sl(700); fail(c); await c.fade(c.q(".pn"), BAD);
        await c.sl(3400); v.className = "v"; await c.bk(v, 9); await c.ty(v, "Owner", 120); await c.sl(500);
        v.className = "v lk"; c.q(".gm").classList.remove("on"); c.status(true); await c.fade(c.q(".pn"), OK); await c.sl(1600);
      }
    };
  })();

  S.references = (function () {
    var A = '<div class="ph1">Implementer</div><div class="pq">The seat that turns one task brief into a tested commit and a report, and nothing beyond the brief.</div><div class="ph2">What it takes</div><div class="pp">A task brief that is the whole of its requirements, the interfaces earlier tasks produced, the repository\'s own agent file and a path for the report.</div>';
    var B = '<div class="src">' + ['<span class="d">---</span>', '<span class="k">owner:</span> <span class="lk">Controller</span>', '<span class="k">executed-by:</span>', '  - <span class="lk">Controller</span>',
      '  - <span class="lk">Implementer</span>', '  - <span class="lk">Reviewer</span>', '  - <span class="lk">Writer</span>', '  - <span class="lk">Translator</span>', '<span class="d">---</span>', '', '<span class="h"># Implement</span>']
      .map(function (x, i) { return '<div class="l"' + (i === 4 ? ' style="background:var(--press)"' : "") + ">" + x + "</div>"; }).join("") + "</div>";
    function g(t) { return '<div class="dim" style="margin-top:.8em">' + t + "</div>"; }
    function r(n, w, cls) { return '<div class="ref ' + (cls || "") + '"><span class="lk">' + n + '</span> <span class="dim">' + w + "</span></div>"; }
    var PA = g("Named by") + r("Implement", "executed-by", "t1") + r("AI Agent", "roles") + r("An agent's commit is authored…", "Bears on · Entity") + g("Names") + '<div class="dim">Nothing</div>';
    var PB = g("Names") + r("Controller", "owner, executed-by") + r("Implementer", "executed-by") + r("Reviewer", "executed-by") + r("Writer", "executed-by") + r("Translator", "executed-by");
    function a(c) { c.q(".page").innerHTML = A; c.q(".pn").innerHTML = PA; c.q(".tab").textContent = "implementer.md"; }
    return {
      reset: function (c) { a(c); c.away(); },
      rest: function (c) { a(c); c.q(".t1").classList.add("hit"); },
      run: async function (c) {
        await c.sl(1400); var t = c.q(".t1"); await c.go(t, 0.3); t.classList.add("hit"); await c.sl(300); await c.tap();
        c.q(".tab").textContent = "implement.md"; c.fade(c.q(".page"), B); await c.fade(c.q(".pn"), PB);
        await c.sl(3200); c.away(); await c.sl(600);
      }
    };
  })();

  S.brief = (function () {
    function chip(t) { return '<span class="chip">§ ' + t + "</span>"; }
    function card(n, d) { return '<div class="bcard"><div class="bhead"><span class="lab">decision</span><span class="breq">● required</span></div><div><span class="lab">section</span> <span class="bname">' + n + '</span></div><div>' + d + "</div></div>"; }
    function rule(h) { return '<div class="brule">' + h + "</div>"; }
    function row(k, n, x, id) { return '<div class="grow"' + (id ? ' data-g="' + id + '"' : "") + '><span class="dim">›</span><span class="lab">' + k + "</span><span>" + n + '</span><span class="ct">' + x + "</span></div>"; }
    var Q = card("The question", "What had to be decided, and why then") + '<div class="lab" style="margin-top:.8em">The rule for this</div>'
      + rule(chip("The question") + " names what had to be decided and what made it have to be decided then, and states no reason; the reasons are " + chip("Why") + ".")
      + '<div class="lab" style="margin-top:.8em">Other rules</div>' + row("Title", "Decision", 1) + row("Section", "Why", 1) + row("Section", "Consequences", 1) + row("Fields", "Frontmatter", 5);
    var W = card("Why", "What turned it: the reason the chosen option won") + '<div class="lab" style="margin-top:.8em">The rules for this</div>'
      + rule(chip("The question") + " … the reasons are " + chip("Why") + ".")
      + rule(chip("Why") + " gives the reason the chosen option won, concretely enough to tell whether it would still win today.")
      + '<div class="lab" style="margin-top:.8em">Other rules</div>' + row("Title", "Decision", 1) + row("Section", "Consequences", 1, "cq")
      + '<div class="gopen" style="display:none">' + chip("Consequences") + " names what the company is now committed to and what it gave up…</div>" + row("Fields", "Frontmatter", 5);
    function at(c, i) { var l = c.qa(".ed .l")[i]; c.q(".cur.mv").style.top = (l.offsetTop + 16) + "px"; }
    return {
      reset: function (c) { at(c, 5); c.q(".pn").innerHTML = Q; c.away(); },
      rest: function (c) { at(c, 12); c.q(".pn").innerHTML = W; c.q(".gopen").style.display = "block"; },
      run: async function (c) {
        await c.sl(2600);
        for (var i = 6; i <= 12; i++) { at(c, i); await c.sl(230); if (i === 11) await c.fade(c.q(".pn"), W); }
        await c.sl(1400); await c.go(c.q('[data-g="cq"]'), 0.4); await c.tap(); c.q(".gopen").style.display = "block"; await c.sl(3000); c.away(); await c.sl(500);
      }
    };
  })();

  S.completion = (function () {
    var K = ["Architecture", "Terms", "Vocabulary"], St = ["Proposed", "Standing", "Revised", "Dropped"];
    var O = ["A company we have never met keeps its own model", "A company keeps its model with whichever agent it chooses", "Every gate an agent's work passes is held by a person", "Core holds a company without running out of vocabulary"];
    function clear(c) { ["a", "b", "c"].forEach(function (k) { var e = c.q("." + k); e.textContent = ""; e.className = k; }); ["L5", "L6", "L7"].forEach(function (k) { c.q("." + k).classList.add("hid"); }); c.q(".pop").style.display = "none"; }
    function set(e, t) { e.textContent = t; e.classList.add("lk"); }
    return {
      reset: clear,
      rest: function (c) {
        clear(c); set(c.q(".a"), "Architecture"); ["L5", "L6", "L7"].forEach(function (k) { c.q("." + k).classList.remove("hid"); });
        set(c.q(".b"), "Standing"); c.list(c.q(".pop"), O, 2, c.q(".L7"));
      },
      run: async function (c) {
        var p = c.q(".pop"), a = c.q(".a"), b = c.q(".b"), cc = c.q(".c");
        await c.sl(900); c.list(p, K, -1, a.parentNode); await c.sl(1100); c.list(p, K, 0, a.parentNode); await c.sl(700); p.style.display = "none"; set(a, "Architecture");
        await c.sl(700); c.q(".L5").classList.remove("hid"); c.list(p, St, -1, c.q(".L5")); await c.sl(900); await c.ty(b, "St", 180);
        c.list(p, ["Standing"], 0, c.q(".L5")); await c.sl(700); p.style.display = "none"; set(b, "Standing");
        await c.sl(700); c.q(".L6").classList.remove("hid"); c.q(".L7").classList.remove("hid"); c.list(p, O, -1, c.q(".L7")); await c.sl(1000);
        for (var i = 0; i < 3; i++) { c.list(p, O, i, c.q(".L7")); await c.sl(500); }
        await c.sl(500); p.style.display = "none"; set(cc, O[2]); await c.sl(2200);
      }
    };
  })();

  S.properties = (function () {
    var R = [["id", "01a0dd52-bc30-73db…", 0], ["source", "Local", 1], ["decided", "2026-09-30", 0], ["kind", "Architecture", 1], ["status", "Proposed", 1]];
    function row(r, id) { return '<div class="prow"><span class="dim">' + r[0] + "</span><span" + (id ? ' class="' + id + (r[2] ? " lk" : "") + '"' : r[2] ? ' class="lk"' : "") + ">" + r[1] + "</span></div>"; }
    var F = ['by <span class="k">· required</span>', "serves", "upholds", "supersedes", '<span class="dim">Another property…</span>'];
    function draw(c, extra) { c.q(".rows").innerHTML = R.map(function (r) { return row(r); }).join("") + (extra || ""); }
    return {
      reset: function (c) { draw(c); c.q(".pop").style.display = "none"; c.status(false); c.away(); },
      rest: function (c) { draw(c); c.status(false); c.list(c.q(".pop"), F, 0, c.q(".add")); },
      run: async function (c) {
        var p = c.q(".pop");
        await c.sl(1200); await c.go(c.q(".add"), 0.3); await c.tap(); c.list(p, F, 0, c.q(".add")); await c.sl(1600); await c.tap(); p.style.display = "none";
        draw(c, row(["by", "", 1], "bv")); var v = c.q(".bv"); await c.sl(300);
        c.list(p, ["Owner", "Implementer", "Planner", "Reviewer", "Specifier"], -1, v.parentNode); c.away();
        await c.ty(v, "Ow", 200); c.list(p, ["Owner"], 0, v.parentNode); await c.sl(800); p.style.display = "none"; v.textContent = "Owner"; c.status(true); await c.sl(2400);
      }
    };
  })();

  S.links = (function () {
    var A = '<div class="src">' + ['<span class="d">---</span>', '<span class="k">decided:</span> 2026-08-25', '<span class="k">kind:</span> <span class="lk">Architecture</span>', '<span class="k">status:</span> <span class="lk">Standing</span>',
      '<span class="k">by:</span> <span class="lk ow">Owner</span>', '<span class="k">upholds:</span>', '  - <span class="lk">Run on what we publish</span>', '<span class="k">supersedes:</span>', '  - <span class="un">Core is copied by hand</span>', '<span class="d">---</span>']
      .map(function (x) { return '<div class="l">' + x + "</div>"; }).join("") + "</div>";
    var B = '<div class="ph1">Owner</div><div class="pq">The seat that decides what the project is for, says the last word on every page, and is the only one that merges, tags and releases.</div>';
    function a(c) { c.q(".page").innerHTML = A; c.q(".tab").textContent = "2026-vendored-core.md"; c.q(".kbd").style.display = "none"; c.q(".tip").style.display = "none"; c.status(false); }
    function tip(c) { var u = c.q(".un"), b = c.box(u), t = c.q(".tip"); t.style.display = "block"; c.place(t, b.x, b.y + b.h + 4); }
    return {
      reset: function (c) { a(c); c.away(); },
      rest: function (c) { a(c); tip(c); },
      run: async function (c) {
        await c.sl(1000); await c.go(c.q(".un"), 0.3); tip(c); await c.sl(2000); c.q(".tip").style.display = "none";
        var o = c.q(".ow"), b = c.box(o), k = c.q(".kbd"); await c.go(o, 0.4); k.style.display = "block"; c.place(k, b.x - 10, b.y - b.h - 6); await c.sl(500); await c.tap(); k.style.display = "none";
        c.q(".tab").textContent = "owner.md"; await c.fade(c.q(".page"), B); c.away(); await c.sl(2600);
        await c.fade(c.q(".page"), A); c.q(".tab").textContent = "2026-vendored-core.md"; await c.sl(600);
      }
    };
  })();

  S.sections = {
    reset: function (c) { c.q(".miss").style.display = "block"; c.q(".got").classList.add("hid"); c.q(".got").style.display = "none"; c.status(false); c.away(); },
    rest: function (c) { S.sections.reset(c); },
    run: async function (c) {
      await c.sl(1600); await c.go(c.q(".miss"), 0.3); await c.tap();
      c.q(".miss").style.display = "none"; var g = c.q(".got"); g.style.display = "block"; g.classList.remove("hid"); c.status(true); c.away(); await c.sl(2800);
    }
  };

  S.rename = (function () {
    function a(c) { c.qa(".n").forEach(function (n) { n.textContent = "Implementer"; n.classList.remove("hit"); }); c.q(".p1").textContent = "roles/implementer.md"; c.q(".md").style.display = "none"; c.q(".nv").textContent = ""; }
    return {
      reset: a,
      rest: function (c) { a(c); c.q(".md").style.display = "flex"; c.q(".nv").textContent = "Builder"; },
      run: async function (c) {
        await c.sl(1000); await c.palette("Rename entity"); c.q(".md").style.display = "flex"; await c.sl(500); await c.ty(c.q(".nv"), "Builder", 120); await c.sl(600);
        c.q(".md").style.display = "none";
        var ns = c.qa(".n"); for (var i = 0; i < ns.length; i++) { ns[i].classList.add("hit"); ns[i].textContent = "Builder"; await c.sl(450); }
        c.q(".p1").textContent = "roles/builder.md"; c.note("Renamed in every file that names it"); await c.sl(3200);
      }
    };
  })();

  S.ids = (function () {
    var O = "01a0dd52-bc30-73db-a8ef-876d2acf120d";
    function a(c) { c.q(".iv").textContent = O; c.q(".md").style.display = "none"; }
    return {
      reset: function (c) { a(c); c.away(); },
      rest: function (c) { a(c); c.q(".md").style.display = "flex"; },
      run: async function (c) {
        var r = c.q(".idr");
        await c.sl(1000); await c.go(c.q(".iv"), 0.3); await c.tap(); c.note("Entity id copied"); await c.sl(1800);
        var xs = [-8, 8, -5, 5, 0]; for (var i = 0; i < xs.length; i++) { r.style.transform = "translateX(" + xs[i] + "px)"; await c.sl(70); }
        c.note("The id is locked: it is set once"); await c.sl(2200); c.away();
        await c.palette("Give this page a fresh id"); c.q(".md").style.display = "flex"; await c.sl(900); await c.go(c.q(".okb")); await c.tap();
        c.q(".md").style.display = "none"; c.q(".iv").textContent = "01a0f3c1-77e2-7a10-9c4d-5b2e8f1d0a63"; c.note("Fresh id written and copied"); c.away(); await c.sl(2600);
      }
    };
  })();

  S.instance = (function () {
    var F = [".claude/skills/", ".companygraph/manifest.json", ".github/workflows/", "meta/core/", "model/identity.md", "model/vision.md", "model/brand.md", "AGENTS.md", "CLAUDE.md"];
    function tree(c) { var t = c.q(".tree"); if (!t) { t = document.createElement("div"); t.className = "tree"; c.q(".ed").insertBefore(t, c.q(".page")); } return t; }
    function idle(c) { tree(c).innerHTML = '<div class="dir">empty vault</div>'; c.q(".page").innerHTML = ""; c.q(".wst .dot").className = "dot off"; c.q(".wst .stt").textContent = "Not an instance: the plugin stays idle"; c.q(".md").style.display = "none"; c.q(".nm").textContent = ""; }
    function done(c) {
      tree(c).innerHTML = F.map(function (f) { return '<div class="' + (/\/$/.test(f) ? "dir" : "") + '">' + f + "</div>"; }).join("");
      c.q(".page").innerHTML = '<div class="ph1">Beacon</div><div class="src dim">model/identity.md</div>'; c.status(true);
    }
    return {
      reset: idle,
      rest: function (c) { idle(c); done(c); },
      run: async function (c) {
        await c.sl(1000); await c.palette("Make this vault an instance"); c.q(".md").style.display = "flex"; await c.sl(500); await c.ty(c.q(".nm"), "Beacon", 130); await c.sl(800);
        c.q(".md").style.display = "none"; var t = tree(c); t.innerHTML = "";
        for (var i = 0; i < F.length; i++) { var d = document.createElement("div"); d.textContent = F[i]; if (/\/$/.test(F[i])) d.className = "dir"; t.appendChild(d); await c.sl(260); }
        done(c); await c.sl(3000);
      }
    };
  })();

  S.form = (function () {
    var A = ["| Type | Entity | Owner | How |", "| --- | --- | --- | --- |", "| concept | Core | | changed it |", "| concept | Pin | | made it |", "| concept | Instance | | changed it |"];
    var B = ["| Type    | Entity   | Owner | How        |", "| ------- | -------- | ----- | ---------- |", "| concept | Core     |       | changed it |", "| concept | Pin      |       | made it    |", "| concept | Instance |       | changed it |"];
    function draw(c, x, pad) { c.q(".tbl").innerHTML = x.map(function (r) { return '<div class="l' + (pad ? " pad" : "") + '">' + r + "</div>"; }).join(""); }
    function s(c, n) { c.q(".wst .dot").className = "dot" + (n ? " bad" : ""); c.q(".git").textContent = n ? "git: " + n + " lines changed" : "git: no change"; }
    return {
      reset: function (c) { draw(c, A); s(c, 0); c.q(".tab").textContent = "2026-vendored-core.md"; },
      rest: function (c) { draw(c, A); s(c, 0); c.note("Written back in the form when the note was left"); },
      run: async function (c) {
        await c.sl(1800); draw(c, B, true); s(c, 5); c.note("The table editor padded every column"); await c.sl(3000);
        c.q(".tab").textContent = "identity.md"; await c.sl(900); draw(c, A); s(c, 0); c.q(".tab").textContent = "2026-vendored-core.md";
        c.note("Written back in the form when the note was left", 2600); await c.sl(2600);
      }
    };
  })();

  Array.prototype.forEach.call(document.querySelectorAll(".slide[data-scene]"), function (slide) {
    var sc = S[slide.dataset.scene], win = slide.querySelector(".win"), cur = null;
    if (!sc || !win) return;
    function start() {
      if (cur) return;
      var c = ctx(win); cur = c;
      sc.reset(c);
      if (still) { sc.rest(c); return; }
      (async function () { try { for (;;) { sc.reset(c); await sc.run(c); await c.sl(2400); } } catch (e) {} })();
    }
    function stop() { if (cur) { cur.stop(); cur = null; } }
    // Shown is what counts, whether the deck made the slide active or a phone scrolled it
    // into view: on a desk an inactive slide is display:none and never intersects.
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.4 }).observe(slide);
  });
})();
