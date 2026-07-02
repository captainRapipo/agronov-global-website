/* AGRONOV — cinematic golden-hour seascape.
   Refined canvas ambient background: gilded sky, bobbing sun with glitter
   reflection, layered turquoise swell, foam, silhouetted swaying palms, birds. */
(function () {
  "use strict";

  var canvas = document.getElementById("scene-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, DPR = 1, HORIZON = 0;
  var t = 0;
  var palms = [], rocks = [], birds = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function seed() {
    // Palms rise from the shoreline, clustered toward the edges so the
    // centre of the frame stays open for content.
    palms = [];
    var count = W < 680 ? 3 : 6;
    for (var i = 0; i < count; i++) {
      var edgeBias = Math.random() < 0.5
        ? rand(0.02, 0.24)
        : rand(0.76, 0.98);
      palms.push({
        x: edgeBias * W,
        h: rand(0.16, 0.28) * H,
        lean: rand(-0.12, 0.12),
        sway: rand(0.6, 1.4),
        phase: rand(0, Math.PI * 2),
        scale: rand(0.85, 1.15)
      });
    }

    rocks = [];
    var rc = Math.round(W / 12);
    for (var j = 0; j < rc; j++) {
      rocks.push({
        x: Math.random() * W,
        y: HORIZON + rand(-6, 30),
        r: rand(0.6, 2.4),
        a: rand(0.15, 0.5)
      });
    }

    birds = [];
    for (var k = 0; k < 5; k++) {
      birds.push({
        x: Math.random() * W,
        y: rand(H * 0.1, H * 0.34),
        s: rand(0.15, 0.4),
        span: rand(7, 13)
      });
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    HORIZON = Math.round(H * 0.66);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
    if (reduceMotion) draw();
  }

  function sunPos() {
    return {
      x: W * 0.5 + Math.sin(t * 0.0006) * (W * 0.14),
      y: H * 0.30 + Math.cos(t * 0.0006) * (H * 0.03)
    };
  }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, HORIZON + 20);
    g.addColorStop(0.00, "#f6a35f");   // warm amber crown
    g.addColorStop(0.30, "#f6c98b");
    g.addColorStop(0.58, "#f4ddbe");
    g.addColorStop(0.82, "#cfe6e6");   // cool haze
    g.addColorStop(1.00, "#eef4ec");   // pale horizon band
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HORIZON + 20);
  }

  function drawSun(s) {
    // Outer glow
    var glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, H * 0.42);
    glow.addColorStop(0, "rgba(255,236,190,0.85)");
    glow.addColorStop(0.25, "rgba(255,214,140,0.35)");
    glow.addColorStop(1, "rgba(255,214,140,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, HORIZON + 40);

    // Disc
    var r = Math.max(40, Math.min(W, H) * 0.075);
    var disc = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
    disc.addColorStop(0, "#fff6e2");
    disc.addColorStop(0.7, "#ffe08a");
    disc.addColorStop(1, "#ffcf66");
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fillStyle = disc;
    ctx.fill();
  }

  function drawPalm(p) {
    var sway = reduceMotion ? 0 : Math.sin(t * 0.0016 * p.sway + p.phase) * 0.04;
    ctx.save();
    ctx.translate(p.x, HORIZON + 6);
    ctx.rotate(p.lean + sway);
    ctx.scale(p.scale, p.scale);

    ctx.fillStyle = "rgba(18,44,52,0.92)";
    ctx.strokeStyle = "rgba(18,44,52,0.92)";

    // Trunk (tapered, slight curve)
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(2, -p.h * 0.55, 3, -p.h);
    ctx.lineTo(9, -p.h);
    ctx.quadraticCurveTo(8, -p.h * 0.55, 4, 0);
    ctx.closePath();
    ctx.fill();

    // Fronds
    var top = -p.h + 2, cx = 6;
    for (var i = 0; i < 7; i++) {
      var ang = (Math.PI * (i / 6)) - Math.PI * 0.05;
      var len = p.h * (0.55 + (i % 2) * 0.12);
      var dx = Math.cos(ang) * len;
      var dy = -Math.abs(Math.sin(ang)) * len * 0.5 - 6;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.quadraticCurveTo(cx + dx * 0.5, top + dy * 1.4, cx + dx, top + dy + Math.abs(dx) * 0.18);
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBeach() {
    var g = ctx.createLinearGradient(0, HORIZON - 18, 0, HORIZON + 34);
    g.addColorStop(0, "#f6e8c6");
    g.addColorStop(1, "#e6cfa0");
    ctx.fillStyle = g;
    ctx.fillRect(0, HORIZON - 14, W, 48);

    for (var i = 0; i < rocks.length; i++) {
      var r = rocks[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(120,96,58," + r.a + ")";
      ctx.fill();
    }
  }

  function waveLine(baseY, amp, freq, speed, color, lw) {
    ctx.beginPath();
    for (var x = 0; x <= W; x += 8) {
      var y =
        baseY +
        Math.sin((x + t * speed) * freq) * amp +
        Math.sin((x - t * speed * 0.6) * freq * 2.3) * (amp * 0.35);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  function drawOcean(s) {
    var g = ctx.createLinearGradient(0, HORIZON, 0, H);
    g.addColorStop(0, "#3fc9bd");
    g.addColorStop(0.5, "#1691a4");
    g.addColorStop(1, "#064e6b");
    ctx.fillStyle = g;
    ctx.fillRect(0, HORIZON, W, H - HORIZON);

    // Sun-glitter reflection column
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HORIZON, W, H - HORIZON);
    ctx.clip();
    var cols = 26;
    for (var i = 0; i < cols; i++) {
      var yy = HORIZON + (i / cols) * (H - HORIZON);
      var spread = 6 + i * 3.2;
      var wob = Math.sin(t * 0.02 + i * 0.7) * spread;
      var w = spread * (0.5 + Math.abs(Math.sin(t * 0.015 + i)) * 0.9);
      var alpha = 0.30 * (1 - i / cols);
      ctx.fillStyle = "rgba(255,231,176," + alpha.toFixed(3) + ")";
      ctx.fillRect(s.x + wob - w / 2, yy, w, 2.4);
    }
    ctx.restore();

    waveLine(HORIZON + 10, 3, 0.02, 0.35, "rgba(255,255,255,0.30)", 1.2);
    waveLine(HORIZON + 26, 5, 0.018, 0.5, "rgba(255,255,255,0.28)", 1.4);
    waveLine(HORIZON + 52, 9, 0.02, 0.8, "rgba(255,255,255,0.34)", 1.8);
    waveLine(HORIZON + 90, 13, 0.016, 1.05, "rgba(255,255,255,0.26)", 2);
    waveLine((HORIZON + H) * 0.5 + 30, 17, 0.014, 1.35, "rgba(3,60,80,0.22)", 3);
    waveLine(H - 40, 20, 0.013, 1.6, "rgba(3,50,70,0.20)", 3);
  }

  function drawBirds() {
    ctx.strokeStyle = "rgba(30,52,60,0.6)";
    ctx.lineWidth = 1.6;
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      var flap = reduceMotion ? 0 : Math.sin(t * 0.12 + b.x * 0.05) * (b.span * 0.4);
      ctx.beginPath();
      ctx.moveTo(b.x - b.span, b.y + flap);
      ctx.quadraticCurveTo(b.x, b.y - flap, b.x, b.y);
      ctx.quadraticCurveTo(b.x, b.y - flap, b.x + b.span, b.y + flap);
      ctx.stroke();
      if (!reduceMotion) {
        b.x += b.s;
        if (b.x - b.span > W + 20) {
          b.x = -20;
          b.y = rand(H * 0.1, H * 0.34);
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var s = sunPos();
    drawSky();
    drawSun(s);
    for (var i = 0; i < palms.length; i++) drawPalm(palms[i]);
    drawBeach();
    drawOcean(s);
    drawBirds();
  }

  function loop() {
    t += 1;
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  if (reduceMotion) draw();
  else loop();
})();
