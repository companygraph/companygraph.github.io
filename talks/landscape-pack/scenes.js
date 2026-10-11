/* The window of this talk that moves: slide 11's tabs, which step through the pictures the MCP
   server draws. A slide names its scene in data-scene; a scene runs while its slide is on screen and
   stops when it leaves. Under reduced motion, and in a browser driven by a script (the PDF and card
   export, the verify suite), it paints one still frame instead: the first tab. */
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

  var S = {};

  // The server's pictures on slide 11: tabs in the window's bar, each showing one picture. While
  // the slide is shown they advance on their own, until a viewer picks one, by click or by the
  // arrow keys, and then they stay where the viewer put them. The still frame is the first tab.
  function selectTab(win, i) {
    var tabs = Array.prototype.slice.call(win.querySelectorAll('[role="tab"]'));
    tabs.forEach(function (t, k) {
      var on = k === i, panel = document.getElementById(t.getAttribute("aria-controls"));
      t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      if (panel) panel.hidden = !on;
    });
    return tabs[i];
  }
  Array.prototype.forEach.call(document.querySelectorAll(".win[data-tabs]"), function (win) {
    var tabs = Array.prototype.slice.call(win.querySelectorAll('[role="tab"]'));
    function pick(i, focus) { win.dataset.held = "1"; var t = selectTab(win, (i + tabs.length) % tabs.length); if (focus) t.focus(); }
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { pick(k, false); });
      t.addEventListener("keydown", function (e) {
        var to = e.key === "ArrowRight" ? k + 1 : e.key === "ArrowLeft" ? k - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
        if (to === null) return;
        e.preventDefault(); e.stopPropagation(); pick(to, true);
      });
    });
  });
  S.tabs = {
    reset: function (c) { if (!c.el.dataset.held) selectTab(c.el, 0); },
    rest: function (c) { if (!c.el.dataset.held) selectTab(c.el, 0); },
    run: async function (c) {
      var n = c.qa('[role="tab"]').length;
      for (var i = 1; i <= n; i++) {
        await c.sl(6500);
        if (c.el.dataset.held) throw "held";
        selectTab(c.el, i % n);
      }
    }
  };

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
