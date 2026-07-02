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
    var count = W < 680 ? 5 : 9;
    for (var i = 0; i < count; i++) {
      var slot = (i + 0.5) / count;             // even spacing across shoreline
      palms.push({
        x: (slot + rand(-0.045, 0.045)) * W,
        h: rand(0.11, 0.19) * H,
        sway: rand(0.6, 1.3),
        phase: rand(0, Math.PI * 2),
        scale: rand(0.8, 1.2)
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

  function drawTree(p) {
    var sway = reduceMotion ? 0 : Math.sin(t * 0.0016 * p.sway + p.phase) * 0.03;
    ctx.save();
    ctx.translate(p.x, HORIZON + 8);
    ctx.rotate(sway);
    ctx.scale(p.scale, p.scale);

    var th = p.h; // trunk height

    // Trunk (tapered, slightly curved)
    ctx.fillStyle = "#8a5a2b";
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(-2, -th * 0.5, -3, -th);
    ctx.lineTo(3, -th);
    ctx.quadraticCurveTo(2, -th * 0.5, 5, 0);
    ctx.closePath();
    ctx.fill();

    // Bushy canopy — cluster of green puffs
    var cy = -th - 4;
    var r = th * 0.42;
    var puffs = [
      [0, 6, r * 1.05], [-r * 0.82, 2, r * 0.82], [r * 0.82, 2, r * 0.82],
      [-r * 0.46, -r * 0.58, r * 0.72], [r * 0.46, -r * 0.58, r * 0.72],
      [0, -r * 0.86, r * 0.74]
    ];
    var i;
    ctx.fillStyle = "#2f7d32"; // shadow layer
    for (i = 0; i < puffs.length; i++) {
      ctx.beginPath();
      ctx.arc(puffs[i][0], cy + puffs[i][1] + 3, puffs[i][2], 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#40a340"; // mid layer
    for (i = 0; i < puffs.length; i++) {
      ctx.beginPath();
      ctx.arc(puffs[i][0], cy + puffs[i][1], puffs[i][2] * 0.92, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#59ba59"; // highlight
    ctx.beginPath();
    ctx.arc(-r * 0.32, cy - r * 0.42, r * 0.52, 0, Math.PI * 2);
    ctx.fill();

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
    for (var i = 0; i < palms.length; i++) drawTree(palms[i]);
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
