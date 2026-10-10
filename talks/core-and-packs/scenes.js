/* The one window of this talk, slide 07's terminal, typed as the levels talk types its windows. A
   slide names its scene in data-scene; a scene runs while its slide is on screen and stops when it
   leaves. Under reduced motion, and in a browser driven by a script (the PDF and card export, the
   verify suite), it paints one still frame instead, the finished terminal. The text it types is the
   tooling's, which is English in both languages. */
(function () {
  var still = navigator.webdriver || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ctx(el) {
    var alive = true;
    var c = {
      el: el,
      stop: function () { alive = false; },
      sl: function (ms) { return new Promise(function (res, rej) { setTimeout(function () { alive ? res() : rej("stop"); }, ms); }); },
      q: function (s) { return el.querySelector(s); },
      qa: function (s) { return Array.prototype.slice.call(el.querySelectorAll(s)); },
      ty: async function (node, t, ms) { for (var i = 0; i < t.length; i++) { node.textContent += t[i]; await c.sl(ms || 70); } }
    };
    return c;
  }

  // A terminal: the command is typed, then the lines it prints appear one by one. The markup
  // carries the whole picture, so a page that runs no script still shows it.
  function typed(speed, gap) {
    function cmd(c) { var m = c.q(".cmd"); if (m.dataset.t == null) m.dataset.t = m.textContent; return m; }
    return {
      reset: function (c) { cmd(c).textContent = ""; c.qa(".o").forEach(function (o) { o.classList.add("hid"); }); c.q(".cur").style.display = ""; },
      rest: function (c) { var m = cmd(c); m.textContent = m.dataset.t; c.qa(".o").forEach(function (o) { o.classList.remove("hid"); }); c.q(".cur").style.display = "none"; },
      run: async function (c) {
        var m = cmd(c);
        await c.sl(900); await c.ty(m, m.dataset.t, speed); await c.sl(500);
        c.q(".cur").style.display = "none";
        var os = c.qa(".o"); for (var i = 0; i < os.length; i++) { os[i].classList.remove("hid"); await c.sl(gap); }
        await c.sl(4200);
      }
    };
  }

  var S = {};
  S.take = typed(60, 480);

  Array.prototype.forEach.call(document.querySelectorAll(".slide[data-scene]"), function (slide) {
    var sc = S[slide.dataset.scene], el = slide.querySelector(".win"), cur = null;
    if (!sc || !el) return;
    function start() {
      if (cur) return;
      var c = ctx(el); cur = c;
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
