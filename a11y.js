/* ═══════════════════════  accessibility preferences  ══════════════════════
   Four independent switches, mirrored onto <html> as data attributes and
   remembered per browser. Nothing here changes the document's structure —
   only how it is painted.

   Loaded from <head> without defer so a visitor who asked for high contrast
   or larger text gets it on the first paint rather than after one. The panel
   itself is wired up once the document is parsed; pages that carry no panel
   (the accessibility statement) simply take the preferences and stop. */
(function () {
  "use strict";

  var root = document.documentElement;
  var SCALES = [1, 1.15, 1.3];
  var KEY = "agronov-a11y";

  var prefs = { hc: false, motion: false, links: false, scale: 0 };

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    for (var k in prefs) if (k in saved) prefs[k] = saved[k];
  } catch (e) { /* private mode — keep the defaults */ }

  if (!(prefs.scale >= 0 && prefs.scale < SCALES.length)) prefs.scale = 0;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  var panel = null, btn = null;

  function apply() {
    root.setAttribute("data-hc", prefs.hc ? "on" : "off");
    root.setAttribute("data-motion", prefs.motion ? "off" : "on");
    root.setAttribute("data-links", prefs.links ? "on" : "off");
    root.style.setProperty("--a11y-scale", String(SCALES[prefs.scale]));

    if (panel) {
      var toggles = panel.querySelectorAll("[data-toggle]");
      for (var i = 0; i < toggles.length; i++) {
        var on = prefs[toggles[i].getAttribute("data-toggle")];
        toggles[i].setAttribute("aria-pressed", on ? "true" : "false");
        toggles[i].querySelector(".state").textContent = on ? "On" : "Off";
      }

      var sizeBtn = panel.querySelector("[data-cycle]");
      sizeBtn.querySelector(".state").textContent = Math.round(SCALES[prefs.scale] * 100) + "%";
      sizeBtn.setAttribute("aria-pressed", prefs.scale ? "true" : "false");
    }

    window.dispatchEvent(new CustomEvent("agronov:prefs"));
  }

  // paint the page the way this visitor asked for it, straight away
  apply();

  function wire() {
    panel = document.getElementById("a11yPanel");
    btn = document.getElementById("a11yBtn");
    if (!panel || !btn) return;      // the statement page has no panel

    function open(state) {
      panel.hidden = !state;
      btn.setAttribute("aria-expanded", state ? "true" : "false");
      if (state) panel.querySelector(".a11y-opt").focus();
    }

    btn.addEventListener("click", function () { open(panel.hidden); });

    panel.addEventListener("click", function (e) {
      var hit = e.target.closest("[data-toggle],[data-cycle]");
      if (!hit) return;
      var key = hit.getAttribute("data-toggle");
      if (key) prefs[key] = !prefs[key];
      else prefs.scale = (prefs.scale + 1) % SCALES.length;
      apply();
      save();
    });

    var reset = document.getElementById("a11yReset");
    if (reset) {
      reset.addEventListener("click", function () {
        prefs = { hc: false, motion: false, links: false, scale: 0 };
        apply();
        save();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { open(false); btn.focus(); }
    });

    document.addEventListener("click", function (e) {
      if (!panel.hidden && !e.target.closest(".a11y")) open(false);
    });

    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
