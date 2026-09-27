/* ══════════════════════  the parcel and its QR code  ══════════════════════

   A voxel renderer in oblique projection: every cube is projected from its
   eight corners and its faces are kept or dropped by the sign of their
   projected area. The box itself is plain cardboard; everything printed on
   it — the Prime tape, the arrow, the address label, the flap marks — is
   painted into the plane of a face, so it shears with the box exactly as
   printing would. The truck under it is built from the same blocks.

   The same cubes are also the QR code. Interpolating each projected corner
   toward the corners of a flat square collapses a cube into a pixel, so one
   value moving from 0 to 1 turns the parcel into the code and back.        */
(function () {
  "use strict";

  var cv = document.getElementById("voxel");
  if (!cv || !cv.getContext) return;

  var ctx = cv.getContext("2d");
  var btn = document.getElementById("sceneBtn");
  var hint = document.getElementById("sceneHint");
  var status = document.getElementById("sceneStatus");
  var caption = document.getElementById("sceneCaption");
  var hit = document.getElementById("sceneHit");
  var icoQr = btn.querySelector(".ico-qr");
  var icoBox = btn.querySelector(".ico-box");

  // where the drawing goes when it is the code and someone clicks it
  var STORE = "https://www.amazon.com/sp?ie=UTF8&seller=A1PSSP1I3UBATU";

  var COPY = {
    box: {
      label: "Open the box to reveal the QR code for our Amazon storefront",
      hint: "Open the Box",
      caption: "There’s a code inside — it opens",
      status: "Showing the package.",
      title: "Show the QR code"
    },
    code: {
      label: "Pack it back up and show the package again",
      hint: "Pack It Back Up",
      caption: "Scan it, or tap the code — it opens",
      status: "Showing a QR code that opens the AGRONOV Global storefront on Amazon.",
      title: "Open our Amazon storefront"
    }
  };

  /* The code for https://www.amazon.com/sp?ie=UTF8&seller=A1PSSP1I3UBATU
     (version 5, error correction Q) baked in at build time, so the page
     never asks the network for it. */
  var QR = [
"1111111001011101100010011010101111111",
"1000001010110000010111100100101000001",
"1011101001001100101101101101001011101",
"1011101011000100110011001101101011101",
"1011101010010110110010001010001011101",
"1000001000001111100100110000001000001",
"1111111010101010101010101010101111111",
"0000000011000001110110100111100000000",
"0101111011111110001110011100111011010",
"0001100100110000001100110110011111111",
"0011111111010000001001010100111001001",
"0110000010000101001110100010011010101",
"1011111100101111111000001000101100101",
"0100000001101011000011111001110110110",
"0010011111010011001000000011010101111",
"0010110010011100100101110000000001111",
"1010101010010000100111111101001000111",
"0100000110010000001000110111010000010",
"1101001101000101011101101101001101001",
"1111100010101010001100110111100001011",
"0101011011101101000010010010111011000",
"0011000010010100011000111111110111110",
"1101101001111001100001111101011011011",
"1000100010101010011010001101100101111",
"1110011111101111111010110100100111111",
"1010110100111110111010111110110101011",
"1101111011010000110011101011001011111",
"1011010111010110101011001001110100111",
"1001111010100011111101110101111110000",
"0000000011100010000110100010100011110",
"1111111000101101001001110010101011101",
"1000001010100101101100110101100011011",
"1011101010001111000101100011111110010",
"1011101011011001111000001001001101000",
"1011101000010100110110010001000010111",
"1000001010101011110111011010011011111",
"1111111001111000100001110000100011001"
  ];
  var N = QR.length;

  /* ── colour ─────────────────────────────────────────────────────────── */

  function rgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }

  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function css(c) {
    return "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")";
  }

  function tone(c, k) {
    return [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
  }

  var WHITE = [255, 255, 255], BLACK = [0, 0, 0];

  var CARD = rgb("#c99b62");        // the corrugated board

  var INK = "#2b2f38";              // what Amazon prints on a box
  var PRIME_TAPE = "#333d47";
  var PRIME_BLUE = "#1eb0e8";
  var SMILE_ORANGE = "#f2900f";
  var PAPER = "#f6f3ec";

  /* The code's ink: warm near the middle, deep cardboard brown at the rim,
     with a little per-module jitter so it still reads as a pile of parcel
     pixels. Every tone stays under 20% relative luminance, which keeps each
     module past 4.5:1 against the white page — enough for a phone to lock
     on. The three finder patterns are always the darkest tone. */
  var QR_WARM = rgb("#8f5613");
  var QR_DEEP = rgb("#33261a");
  var QR_EYE = rgb("#241a12");

  function qrInk(c, r) {
    if ((c < 7 && r < 7) || (c >= N - 7 && r < 7) || (c < 7 && r >= N - 7)) return QR_EYE;

    var h = (N - 1) / 2;
    var dx = (c - h) / h, dy = (r - h) / h;
    var d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 1.05);
    var base = mix(QR_WARM, QR_DEEP, d * d);

    var j = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
    j = (j - Math.floor(j) - 0.5) * 0.12;
    return mix(base, j > 0 ? WHITE : BLACK, Math.abs(j));
  }

  /* ── the box, in voxels ─────────────────────────────────────────────── */

  // a shipping box: long, a little less deep, lower again
  var BW = 17, BD = 11, BH = 9;
  var BZ = 2.15;                              // it rides on a pallet
  var CX = BW / 2, CY = BD / 2;               // the middle of its footprint

  var voxels = [];

  function buildBox() {
    voxels = [];
    for (var i = 0; i < BW; i++) {
      for (var j = 0; j < BD; j++) {
        for (var k = 0; k < BH; k++) {
          // only the shell can ever be seen, from any angle
          if (k !== BH - 1 && i !== 0 && i !== BW - 1 && j !== 0 && j !== BD - 1) continue;

          // a little tonal noise so the board reads as board
          var n = Math.sin(i * 12.9898 + j * 4.1414 + k * 78.233) * 43758.5453;
          n = (n - Math.floor(n) - 0.5) * 0.016;
          voxels.push({ i: i, j: j, k: k, c: tone(CARD, 1 + n) });
        }
      }
    }
  }

  /* ── camera ─────────────────────────────────────────────────────────── */

  var rot = 0, cosR = 1, sinR = 0;
  var S = 1, M = 1, OX = 0, OY = 0, size = 0, dpr = 1;

  function setRot(a) {
    rot = a;
    cosR = Math.cos(a);
    sinR = Math.sin(a);
  }

  /* An oblique projection rather than a true isometric one: the parcel's
     length maps to pure screen horizontal, so it stands square on the page
     instead of running away down a diagonal. Depth recedes at thirty
     degrees and height stays vertical. */
  var UX = 0.5, UY = 0;             // one unit along the line
  var VX = -0.3, VY = 0.21;         // one unit across it
  var WZ = 0.46;                    // one unit up

  // and the ray that projects to nothing, which is what depth is measured on
  var DX = UX / -VX, DZ = VY / WZ;

  // the box keeps a rotation hook, but it is left at zero: square on reads
  // best, and the printing on the faces is laid out for this one view
  function px(x, y, z) {
    var dx = x - CX, dy = y - CY;
    var rx = dx * cosR - dy * sinR;
    var ry = dx * sinR + dy * cosR;
    return [OX + (rx * UX + ry * VX) * S, OY + (rx * UY + ry * VY) * S - z * WZ * S];
  }

  function pxs(x, y, z) {
    var dx = x - CX, dy = y - CY;
    return [OX + (dx * UX + dy * VX) * S, OY + (dx * UY + dy * VY) * S - z * WZ * S];
  }

  var PJ = px;                      // whichever of the two is in force

  function depth(x, y, z) {
    var dx = x - CX, dy = y - CY;
    var rx = dx * cosR - dy * sinR;
    var ry = dx * sinR + dy * cosR;
    return rx * DX + ry + z * DZ;
  }

  // the six faces of a unit cube, wound so that a positive projected area
  // means the face is turned toward us
  var CORNERS = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
  ];
  var FACES = [
    { v: [4, 5, 6, 7], n: null },   // top
    { v: [7, 6, 2, 3], n: Math.PI / 2 },   // +y
    { v: [6, 5, 1, 2], n: 0 },   // +x
    { v: [5, 4, 0, 1], n: -Math.PI / 2 },   // -y
    { v: [4, 7, 3, 0], n: Math.PI }    // -x
  ];

  // how bright a face is, given where its normal ends up once the box turns
  var LIGHT = 1.25;
  function shade(n) {
    if (n === null) return 1.16;                       // the lid catches the sky
    return 0.60 + 0.40 * (0.5 + 0.5 * Math.cos(n + rot - LIGHT));
  }

  /* ── printing on a face ─────────────────────────────────────────────── */

  /* Maps the unit square onto a face of the box and hands the drawing
     routine a space measured in voxels, so nothing is stretched by the
     face's own proportions. Returns false when the face is turned away. */
  function onFace(g, o, u, v, w, h, draw) {
    var p0 = PJ(o[0], o[1], o[2]);
    var pu = PJ(o[0] + u[0], o[1] + u[1], o[2] + u[2]);
    var pv = PJ(o[0] + v[0], o[1] + v[1], o[2] + v[2]);
    var ux = pu[0] - p0[0], uy = pu[1] - p0[1];
    var vx = pv[0] - p0[0], vy = pv[1] - p0[1];
    if (ux * vy - uy * vx <= 0) return false;

    g.save();
    g.transform(ux / w, uy / w, vx / h, vy / h, p0[0], p0[1]);
    g.beginPath();
    g.rect(0, 0, w, h);
    g.clip();
    draw(g, w, h);
    g.restore();
    return true;
  }

  // text measured in voxels, drawn at a large nominal size so the glyph
  // rasteriser still has something to work with under a heavy transform
  function label(g, str, x, y, cap, colour, weight, align, spacing) {
    g.save();
    g.translate(x, y);
    g.scale(cap / 100, cap / 100);
    g.font = (weight || 600) + " 100px Sora, system-ui, sans-serif";
    g.fillStyle = colour;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";

    if (spacing) {
      var total = 0, i;
      for (i = 0; i < str.length; i++) total += g.measureText(str[i]).width + spacing * 100;
      var cx = align === "center" ? -total / 2 : align === "right" ? -total : 0;
      for (i = 0; i < str.length; i++) {
        g.fillText(str[i], cx, 0);
        cx += g.measureText(str[i]).width + spacing * 100;
      }
    } else {
      g.textAlign = align || "left";
      g.fillText(str, 0, 0);
    }
    g.restore();
  }

  // a row of bars standing in for text too small to set
  function fakeText(g, x, y, w, h, colour, seed) {
    g.fillStyle = colour;
    var cx = x;
    while (cx < x + w) {
      var n = Math.sin(seed++ * 91.7) * 43758.5453;
      var word = (0.06 + (n - Math.floor(n)) * 0.16) * w;
      if (cx + word > x + w) word = x + w - cx;
      g.fillRect(cx, y, word, h);
      cx += word + w * 0.045;
    }
  }

  function barcode(g, x, y, w, h, seed) {
    g.fillStyle = "#1b1f26";
    var cx = x;
    while (cx < x + w) {
      var n = Math.sin(seed++ * 57.3) * 43758.5453;
      n = n - Math.floor(n);
      var bar = 0.006 + n * 0.016;
      if (n > 0.45) g.fillRect(cx, y, bar * w, h);
      cx += bar * w * 1.8;
    }
  }

  var swoosh = null;
  function swooshPath() {
    if (!swoosh) {
      swoosh = new Path2D("M0 26.46C0.13 24.19 2.2 21.73 4.28 20.62C6.36 19.52 2.59 15.43 12.45 19.84C22.31 24.25 43.77 37.55 63.42 47.08C83.07 56.61 108.3 68.09 130.35 77.04C152.4 85.99 175.75 94.16 195.72 100.78C215.69 107.39 224.51 110.57 250.19 116.73C275.88 122.89 315.5 132.36 349.81 137.74C384.11 143.13 422.83 147.02 456.03 149.03C489.23 151.04 517.06 151.23 549.03 149.81C581 148.38 622.11 143.64 647.86 140.47C673.61 137.29 682.94 135.02 703.5 130.74C724.06 126.46 749.74 120.62 771.21 114.79C792.67 108.95 812.26 102.66 832.3 95.72C852.33 88.78 879.25 76.52 891.44 73.15C903.63 69.78 902.4 74.38 905.45 75.49C908.5 76.59 908.69 77.95 909.73 79.77C910.77 81.58 911.87 83.98 911.67 86.38C911.48 88.78 911.09 91.18 908.56 94.16C906.03 97.15 909.01 96.37 896.5 104.28C883.98 112.19 852.59 131.45 833.46 141.63C814.33 151.82 802.85 157.13 781.71 165.37C760.57 173.61 728.66 184.44 706.61 191.05C684.57 197.67 671.01 200.84 649.42 205.06C627.82 209.27 601.82 213.68 577.04 216.34C552.27 219 523.22 220.62 500.78 221.01C478.34 221.4 462.13 220.17 442.41 218.68C422.7 217.19 404.09 215.5 382.49 212.06C360.89 208.63 335.02 203.57 312.84 198.05C290.66 192.54 268.74 185.6 249.42 178.99C230.09 172.37 215.89 166.86 196.89 158.37C177.89 149.87 155.71 139.3 135.41 128.02C115.11 116.73 95.2 104.6 75.1 90.66C54.99 76.72 26.72 53.76 14.79 44.36C2.85 34.95 5.97 37.22 3.5 34.24C1.04 31.26 -0.13 28.73 0 26.46Z M925.29 180.54C922.63 181.13 921.53 179.44 920.62 178.21C919.71 176.98 916.67 182.56 919.84 173.15C923.02 163.75 934.37 137.55 939.69 121.79C945.01 106.03 949.48 88.72 951.75 78.6C954.02 68.48 953.7 66.15 953.31 61.09C952.92 56.03 951.82 51.49 949.42 48.25C947.02 45.01 944.42 43.39 938.91 41.63C933.4 39.88 925.49 38.39 916.34 37.74C907.2 37.09 900.45 36.71 884.05 37.74C867.64 38.78 829.7 43.39 817.9 43.97C806.1 44.55 814.14 42.28 813.23 41.25C812.32 40.21 811.35 39.82 812.45 37.74C813.55 35.67 815.76 31.91 819.84 28.79C823.93 25.68 830.16 22.24 836.96 19.07C843.77 15.89 848.96 12.78 860.7 9.73C872.44 6.68 893.26 2.33 907.39 0.78C921.53 -0.78 935.28 0 945.53 0.39C955.77 0.78 962.06 1.88 968.87 3.11C975.68 4.35 981.91 6.03 986.38 7.78C990.86 9.53 993.51 9.47 995.72 13.62C997.92 17.77 999.29 25.88 999.61 32.68C999.94 39.49 1000.32 42.41 997.67 54.47C995.01 66.54 988 92.41 983.66 105.06C979.31 117.7 975.81 122.7 971.6 130.35C967.38 138 964.2 143.58 958.37 150.97C952.53 158.37 942.09 169.78 936.58 174.71C931.06 179.64 927.95 179.96 925.29 180.54Z");
    }
    return swoosh;
  }

  // the swoosh drawn into a box `w` voxels wide, its own proportions kept
  function drawSwoosh(g, x, y, w, colour) {
    g.save();
    g.translate(x, y);
    g.scale(w / 1000, w / 1000);
    g.fillStyle = colour;
    g.fill(swooshPath());
    g.restore();
  }

  /* — the Prime tape, repeated along whichever run of it we are on — */
  function primeTape(g, w, h, along) {
    g.fillStyle = PRIME_TAPE;
    g.fillRect(0, 0, w, h);

    // a paler edge where the tape catches the light
    g.fillStyle = "rgba(255,255,255,0.07)";
    g.fillRect(0, 0, w, h * 0.14);
    g.fillStyle = "rgba(0,0,0,0.16)";
    g.fillRect(0, h * 0.86, w, h * 0.14);

    var run = along === "u" ? w : h;
    var step = 7.2;
    for (var s = -step; s < run + step; s += step) {
      g.save();
      if (along === "u") g.translate(s, h / 2);
      else { g.translate(w / 2, s); g.rotate(-Math.PI / 2); }

      // prime wordmark with its swoosh
      label(g, "prime", -3.1, 0.1, 1.15, "#ffffff", 600, "left", 0);
      drawSwoosh(g, -3.05, 0.4, 2.6, PRIME_BLUE);

      // the little play badge and its two lines of small print
      g.beginPath();
      g.arc(1.1, -0.05, 0.48, 0, Math.PI * 2);
      g.fillStyle = "#efe6d2";
      g.fill();
      g.beginPath();
      g.moveTo(0.97, -0.26);
      g.lineTo(1.34, -0.05);
      g.lineTo(0.97, 0.16);
      g.closePath();
      g.fillStyle = PRIME_TAPE;
      g.fill();

      fakeText(g, 1.78, -0.34, 1.9, 0.14, "rgba(255,255,255,0.62)", s + 3);
      fakeText(g, 1.78, -0.06, 1.6, 0.14, "rgba(255,255,255,0.62)", s + 11);
      g.restore();
    }
  }

  /* — the address label stuck on the lid — */
  function shippingLabel(g) {
    var w = 6.4, h = 4.2;
    g.fillStyle = PAPER;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,0,0,0.16)";
    g.lineWidth = 0.06;
    g.strokeRect(0.03, 0.03, w - 0.06, h - 0.06);

    // carrier band
    g.fillStyle = "#1b1f26";
    g.fillRect(0.28, 0.3, w - 0.56, 0.52);
    label(g, "PRIORITY", 0.44, 0.71, 0.36, PAPER, 600, "left", 0.02);
    label(g, "1 of 1", w - 0.44, 0.71, 0.3, PAPER, 500, "right", 0);

    // who it is going to
    fakeText(g, 0.3, 1.06, 2.1, 0.14, "#9aa0a8", 2);
    label(g, "AGRONOV GLOBAL", 0.3, 1.72, 0.38, "#1b1f26", 600, "left", 0.01);
    fakeText(g, 0.3, 1.94, 3.4, 0.15, "#585d65", 7);
    fakeText(g, 0.3, 2.2, 2.6, 0.15, "#585d65", 13);

    barcode(g, 0.3, 2.62, w - 0.6, 1.0, 5);
    fakeText(g, 0.3, 3.86, 2.2, 0.14, "#7b8088", 21);
  }

  /* — everything printed on the box, face by face — */
  function decals(g, a) {
    if (a <= 0.01) return;

    var TW = 3.0;                       // tape width, in voxels
    var t0 = CY - TW / 2;               // it runs down the middle of the lid

    g.save();
    g.globalAlpha = a;

    // ── the lid ──
    onFace(g, [0, 0, BZ + BH], [BW, 0, 0], [0, BD, 0], BW, BD, function (c) {
      // flap seam under the tape
      c.strokeStyle = "rgba(0,0,0,0.14)";
      c.lineWidth = 0.08;
      c.beginPath();
      c.moveTo(0, CY); c.lineTo(BW, CY);
      c.stroke();

      c.save();
      c.translate(0, t0);
      c.beginPath(); c.rect(0, 0, BW, TW); c.clip();
      c.translate(0, 0);
      primeTape(c, BW, TW, "u");
      c.restore();
    });

    /* ── the two long faces ──
       Printed the way a real one is: the arrow struck large in black, a
       barcode panel beside it and the flap registration marks in the
       corners. No orange — that lives on the tape. */
    var longFace = function (c, w, h) {
      var m = 0.7, arm = 1.15;
      c.strokeStyle = "rgba(24,24,24,0.72)";
      c.lineWidth = 0.16;
      c.lineCap = "butt";
      [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]]
        .forEach(function (k) {
          c.beginPath();
          c.moveTo(k[0] + k[2] * arm, k[1]);
          c.lineTo(k[0], k[1]);
          c.lineTo(k[0], k[1] + k[3] * arm);
          c.stroke();
        });

      // the barcode panel
      c.strokeStyle = "rgba(24,24,24,0.8)";
      c.lineWidth = 0.13;
      c.strokeRect(1.4, 1.0, 4.2, 1.8);
      barcode(c, 1.7, 1.22, 3.6, 1.36, 31);

      // the address label, stuck up in the corner beside the arrow
      c.save();
      c.translate(w - 7.4, 0.85);
      c.scale(1.03, 1.03);
      shippingLabel(c);
      c.restore();

      // and the arrow, struck across the board below them
      drawSwoosh(c, 1.7, h * 0.62, 9.4, "#1c1c1c");
      label(c, "amazon.com", w - 1.5, h - 0.95, 0.48, "rgba(24,24,24,0.5)", 500, "right", 0.02);
    };

    onFace(g, [0, BD, BZ + BH], [BW, 0, 0], [0, 0, -BH], BW, BH, longFace);
    onFace(g, [BW, 0, BZ + BH], [-BW, 0, 0], [0, 0, -BH], BW, BH, longFace);

    // ── the two short ends: the tape wraps down them ──
    var endFace = function (c, w, h) {
      c.save();
      c.translate(w / 2 - TW / 2, 0);
      c.beginPath(); c.rect(0, 0, TW, h); c.clip();
      primeTape(c, TW, h, "v");
      c.restore();

      // this way up
      for (var s = 0; s < 2; s++) {
        c.save();
        c.translate(0.9 + s * 1.15, h * 0.62);
        c.fillStyle = "rgba(30,34,42,0.72)";
        c.fillRect(-0.11, -1.1, 0.22, 2.1);
        c.beginPath();
        c.moveTo(0, -1.75); c.lineTo(0.45, -1.0); c.lineTo(-0.45, -1.0);
        c.closePath();
        c.fill();
        c.restore();
      }
    };

    onFace(g, [BW, BD, BZ + BH], [0, -BD, 0], [0, 0, -BH], BD, BH, endFace);
    onFace(g, [0, 0, BZ + BH], [0, BD, 0], [0, 0, -BH], BD, BH, endFace);

    g.restore();
  }

  /* ── blocks ───────────────────────────────────────────────────────── */

  // an axis-aligned block, its faces kept or dropped and lit like the box
  function slab(g, x0, y0, z0, x1, y1, z1, base, topBoost) {
    var c = [], n;
    for (n = 0; n < 8; n++) {
      c[n] = PJ(CORNERS[n][0] ? x1 : x0, CORNERS[n][1] ? y1 : y0, CORNERS[n][2] ? z1 : z0);
    }
    for (var f = 0; f < FACES.length; f++) {
      var v = FACES[f].v;
      var a0 = c[v[0]], a1 = c[v[1]], a2 = c[v[2]], a3 = c[v[3]];
      if ((a1[0] - a0[0]) * (a2[1] - a1[1]) - (a1[1] - a0[1]) * (a2[0] - a1[0]) <= 0) continue;
      var k = FACES[f].n === null ? (topBoost || 1.16) : shade(FACES[f].n);
      quad(g, [a0, a1, a2, a3], css(tone(base, k)));
    }
  }


  /* ── the truck, and the pallet it has picked up ────────────────────────
     The forks alone read as two loose planks, because the parcel hides all
     but their tips. Give them a pallet to carry and the whole thing reads
     at once: the load sits proud of the box on every side, the forks
     disappear into the gaps between its stringers, and the only yellow left
     in the open is the stretch between the pallet and the pump body. */
  var JACK = rgb('#f0b21c');
  var JACK_DEEP = rgb('#c9930f');
  var TYRE = rgb('#2c3037');
  var WOOD = rgb('#c9ae86');
  var WOOD_DEEP = rgb('#a98d64');

  var PX0 = -1.5, PX1 = BW + 1.5;             // the pallet, proud of the parcel
  var PY0 = -1.4, PY1 = BD + 1.4;
  var STR_Z = 0.62, DECK0 = 1.42, DECK1 = BZ; // stringers, then the deck

  var FY = 3.1, FW = 2.2;                     // forks, in the gaps between them
  var FX0 = -6.6, FX1 = BW + 0.4;
  var FZ0 = 0.76, FZ1 = 1.42;
  var BX1 = FX0 + 0.9, BX0 = BX1 - 5.2;       // the pump body
  var HTOP = 9.9;                             // the top of the handle

  function palletJack(g) {
    // what the whole thing stands on
    var sh = pxs(CX, CY, 0.04);
    g.save();
    if (typeof g.filter === 'string') g.filter = 'blur(' + (S * 0.34).toFixed(1) + 'px)';
    g.globalAlpha *= 0.16;
    g.fillStyle = '#11151b';
    g.beginPath();
    g.ellipse(sh[0] - S * 1.6, sh[1] + S * 0.2, S * 8.2, S * 1.25, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // castors, the body above them, and the pump housing on top of that
    slab(g, BX0 + 0.7, CY - 1.5, 0, BX0 + 2.3, CY + 1.5, 1.25, TYRE, 1.1);
    slab(g, BX0, CY - FY - FW / 2, 0.3, BX1, CY + FY + FW / 2, 3.3, JACK, 1.13);
    slab(g, BX0 + 1.1, CY - 1.9, 3.3, BX1 - 0.5, CY + 1.9, 5.1, JACK_DEEP, 1.08);

    // the forks, out in the open only between the body and the load
    slab(g, FX0, CY - FY - FW / 2, FZ0, FX1, CY - FY + FW / 2, FZ1, JACK, 1.16);
    slab(g, FX0, CY + FY - FW / 2, FZ0, FX1, CY + FY + FW / 2, FZ1, JACK, 1.16);

    // the pallet: three stringers back to front, then the deck over them
    var bands = [[PY0, PY0 + 1.7], [CY - 0.85, CY + 0.85], [PY1 - 1.7, PY1]];
    for (var i = 0; i < bands.length; i++) {
      slab(g, PX0 + 0.2, bands[i][0], STR_Z, PX1 - 0.2, bands[i][1], DECK0, WOOD_DEEP, 1.1);
    }
    slab(g, PX0, PY0, DECK0, PX1, PY1, DECK1, WOOD, 1.13);

    // the gaps between its boards, on whatever of the deck the parcel leaves
    onFace(g, [PX0, PY0, DECK1], [PX1 - PX0, 0, 0], [0, PY1 - PY0, 0],
      PX1 - PX0, PY1 - PY0, function (c, w, h) {
        c.strokeStyle = 'rgba(90,70,44,0.28)';
        c.lineWidth = 0.16;
        for (var y = h / 7; y < h - 0.1; y += h / 7) {
          c.beginPath();
          c.moveTo(0, y);
          c.lineTo(w, y);
          c.stroke();
        }
      });

    // the tiller, and the loop at the top of it
    var h0 = pxs(BX0 + 1.7, CY, 5.1);
    var h1 = pxs(BX0 - 0.9, CY, HTOP);
    g.save();
    g.strokeStyle = '#242830';
    g.lineCap = 'round';
    g.lineWidth = S * 0.5;
    g.beginPath();
    g.moveTo(h0[0], h0[1]);
    g.lineTo(h1[0], h1[1]);
    g.stroke();
    var ang = Math.atan2(h1[1] - h0[1], h1[0] - h0[0]);
    g.lineWidth = S * 0.3;
    g.beginPath();
    g.ellipse(h1[0] + Math.cos(ang) * S * 0.72, h1[1] + Math.sin(ang) * S * 0.72,
      S * 0.82, S * 0.52, ang, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }

  // the truck the parcel is parked on, drawn under it
  function groundLayer(g, a) {
    if (a <= 0.01) return;
    PJ = pxs;                                   // the truck does not turn
    g.save();
    g.globalAlpha = a;
    palletJack(g);
    g.restore();
    PJ = px;
  }

  /* ── layout ─────────────────────────────────────────────────────────── */


  /* The parcel is measured at its widest moment, so turning it never makes
     the scene grow, shrink or clip. Only the cross-section of the line is
     counted, never its length — that is meant to leave the page. */
  function extent() {
    var pts = [], i, j, k;
    for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) for (k = 0; k < 2; k++) {
pts.push([i * BW, j * BD, BZ + k * BH]);
    }

    // the truck and its load: the body, the pallet, and the tiller top
    pts.push([BX0, CY - FY - FW / 2, 0], [PX1, PY0, 0],
      [BX0, CY + FY + FW / 2, 0], [PX1, PY1, 0],
      [PX0, PY0, DECK1], [PX1, PY1, DECK1],
      [BX0 - 3.6, CY, HTOP], [BX0 + 0.6, CY, HTOP]);

    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (i = 0; i < pts.length; i++) {
      var X = (pts[i][0] - CX) * UX + (pts[i][1] - CY) * VX;
      var Y = (pts[i][1] - CY) * VY - pts[i][2] * WZ;
      if (X < minX) minX = X;
      if (X > maxX) maxX = X;
      if (Y < minY) minY = Y;
      if (Y > maxY) maxY = Y;
    }

    return {
      w: maxX - minX, h: maxY - minY,
      cx: (minX + maxX) / 2, cy: (minY + maxY) / 2
    };
  }

  var span = null, W = 0, H = 0, qx0 = 0, qy0 = 0;

  function layout() {
    W = Math.max(240, Math.round(cv.clientWidth));
    H = Math.max(200, Math.round(cv.clientHeight));
    size = Math.min(W, H);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // the code takes 80% of the shorter side, leaving a quiet zone of more
    // than the four modules a scanner needs on every edge
    M = (size * 0.8) / N;
    qx0 = (W - N * M) / 2;
    qy0 = (H - N * M) / 2;

    if (!span) span = extent();
    // a narrow page gives the parcel a bigger share of its width
    S = Math.min((W * 0.95) / span.w, (H * 0.9) / span.h);
    OX = W / 2 - span.cx * S;
    OY = H / 2 - span.cy * S;

  }

  /* Pair each cube with a module of the code. Both sets are walked in
     reading order, so the box settles into the code instead of scattering;
     whatever is left over shrinks away into the middle. Redone whenever the
     box has been turned, since the order depends on where things are now. */
  var targets = [], extras = 0;

  function pair() {
    targets = [];
    var c, r, i;
    for (r = 0; r < N; r++) {
      for (c = 0; c < N; c++) {
        if (QR[r].charAt(c) === "1") targets.push({ c: c, r: r, ink: qrInk(c, r) });
      }
    }

    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, v;
    for (i = 0; i < voxels.length; i++) {
      v = voxels[i];
      var p = px(v.i + 0.5, v.j + 0.5, BZ + v.k + 1);
      v.sx = p[0];
      v.sy = p[1];
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }

    var spanX = Math.max(1, maxX - minX), spanY = Math.max(1, maxY - minY);
    for (i = 0; i < voxels.length; i++) {
      v = voxels[i];
      v.q = null;
      v.d = (v.sy - minY) / spanY;
      v.key = Math.round(v.d * (N - 1)) * 1e4 + ((v.sx - minX) / spanX) * 100;
    }

    var order = voxels.slice().sort(function (a, b) { return a.key - b.key; });
    var n = Math.min(order.length, targets.length);
    for (i = 0; i < n; i++) {
      var tg = targets[i];
      var slot = order[Math.floor((i * order.length) / targets.length)];
      slot.q = tg;
      slot.qx = qx0 + tg.c * M;
      slot.qy = qy0 + tg.r * M;
    }
    extras = targets.length - n;         // modules with no cube to become them
  }

  /* ── painting ───────────────────────────────────────────────────────── */

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function quad(g, p, colour) {
    g.fillStyle = colour;
    g.beginPath();
    g.moveTo(p[0][0], p[0][1]);
    g.lineTo(p[1][0], p[1][1]);
    g.lineTo(p[2][0], p[2][1]);
    g.lineTo(p[3][0], p[3][1]);
    g.closePath();
    g.fill();
    // the same colour stroked over the seam kills canvas' hairline gaps
    g.strokeStyle = colour;
    g.lineWidth = 1;
    g.stroke();
  }

  // the code has to be exact to scan, so the settled state is drawn as
  // snapped rectangles rather than as collapsed cubes
  function crispCode(g) {
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        if (QR[r].charAt(c) !== "1") continue;
        var x = Math.round(qx0 + c * M), y = Math.round(qy0 + r * M);
        g.fillStyle = css(qrInk(c, r));
        g.fillRect(x, y, Math.round(qx0 + (c + 1) * M) - x, Math.round(qy0 + (r + 1) * M) - y);
      }
    }
  }

  // the parcel on its own — the cubes, and everything printed on them
  function drawParcel(g, t) {
    // sort the cubes back to front for this angle
    for (var i = 0; i < voxels.length; i++) {
      var v = voxels[i];
      v.z = depth(v.i + 0.5, v.j + 0.5, BZ + v.k + 0.5);
    }
    var order = voxels.slice().sort(function (a, b) { return a.z - b.z; });

    var corner = [];
    for (i = 0; i < order.length; i++) {
      v = order[i];
      var tp = ease(Math.min(1, Math.max(0, (t - v.d * 0.3) / 0.7)));
      var fading = !v.q;
      var alpha = fading ? 1 - tp : 1;
      if (alpha <= 0.01) continue;

      var f, n;
      for (n = 0; n < 8; n++) {
        corner[n] = px(v.i + CORNERS[n][0], v.j + CORNERS[n][1], BZ + v.k + CORNERS[n][2]);
      }

      // where it is heading, and how far it has got
      if (tp > 0) {
        var bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9;
        for (n = 0; n < 8; n++) {
          if (corner[n][0] < bx0) bx0 = corner[n][0];
          if (corner[n][0] > bx1) bx1 = corner[n][0];
          if (corner[n][1] < by0) by0 = corner[n][1];
          if (corner[n][1] > by1) by1 = corner[n][1];
        }
        var bw = Math.max(0.001, bx1 - bx0), bh = Math.max(0.001, by1 - by0);
        var gx = v.q ? v.qx : OX - M / 2;
        var gy = v.q ? v.qy : OY - M / 2;
        var hop = -Math.sin(tp * Math.PI) * S * 0.5 * (0.4 + v.d);
        var k = fading ? 1 - tp : 1;

        for (n = 0; n < 8; n++) {
          var nx = (corner[n][0] - bx0) / bw, ny = (corner[n][1] - by0) / bh;
          var tx = gx + M / 2 + (nx - 0.5) * M * k;
          var ty = gy + M / 2 + (ny - 0.5) * M * k;
          corner[n] = [
            corner[n][0] + (tx - corner[n][0]) * tp,
            corner[n][1] + (ty - corner[n][1]) * tp + hop
          ];
        }
      }

      g.globalAlpha = alpha;
      for (f = 0; f < FACES.length; f++) {
        var idx = FACES[f].v;
        var a0 = corner[idx[0]], a1 = corner[idx[1]], a2 = corner[idx[2]], a3 = corner[idx[3]];
        var cross = (a1[0] - a0[0]) * (a2[1] - a1[1]) - (a1[1] - a0[1]) * (a2[0] - a1[0]);
        if (cross <= 0 && tp < 0.5) continue;          // turned away
        var col = tone(v.c, shade(FACES[f].n));
        quad(g, [a0, a1, a2, a3], css(v.q ? mix(col, v.q.ink, tp) : col));
      }
      g.globalAlpha = 1;
    }

    // printed last, over the board, and gone the moment it starts to break up
    decals(g, 1 - t / 0.22);
  }

  /* One frame of the whole scene. The conveyor is laid down first, the
     parcel rides on top of it — bobbing a little, the way a box does on
     rollers — and the near rail is painted back over the parcel so it
     really does sit down inside the frame. */
  function paint(g, t) {
    g.clearRect(0, 0, W, H);
    if (t >= 1) { crispCode(g); return; }

    var a = Math.max(0, 1 - t / 0.3);
    groundLayer(g, a);

    drawParcel(g, t);

    // modules with no cube of their own rise into place
    if (extras > 0 && t > 0) {
      var tp2 = ease(Math.min(1, t));
      g.globalAlpha = tp2;
      for (var i = targets.length - extras; i < targets.length; i++) {
        var e = targets[i];
        var s = M * tp2;
        g.fillStyle = css(e.ink);
        g.fillRect(qx0 + e.c * M + (M - s) / 2, qy0 + e.r * M + (M - s) / 2, s, s);
      }
      g.globalAlpha = 1;
    }
  }

  /* ── state ──────────────────────────────────────────────────────────── */

  var showing = 0;                       // 0 = parcel, 1 = code
  var t = 0, from = 0, to = 0, t0 = 0, raf = 0;
  var DUR = 950;

  function still() {
    return document.documentElement.getAttribute("data-motion") === "off" ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function frame(now) {
    raf = 0;

    if (from !== to) {
      var k = Math.min(1, (now - t0) / DUR);
      t = from + (to - from) * k;
      paint(ctx, t);
      if (k < 1) { raf = requestAnimationFrame(frame); return; }
      from = to;
      t = to;
      if (t >= 1) { paint(ctx, 1); return; }
    }

    // settled on the parcel: nothing moves, so paint it once and stop
    if (t === 0) paint(ctx, 0);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function redraw() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (t >= 1) paint(ctx, 1, 0);
    else kick();
  }

  function toggle() {
    showing = showing ? 0 : 1;
    var c = showing ? COPY.code : COPY.box;

    btn.setAttribute("aria-pressed", showing ? "true" : "false");
    btn.setAttribute("aria-label", c.label);
    hint.textContent = c.hint;
    if (caption) caption.textContent = c.caption;
    if (icoQr) icoQr.classList.toggle("is-off", !!showing);
    if (icoBox) icoBox.classList.toggle("is-off", !showing);
    status.textContent = c.status;
    if (hit) {
      hit.title = c.title;
      hit.classList.toggle("is-code", !!showing);
    }

    pair();

    if (still()) {
      from = to = t = showing;
      redraw();
      return;
    }

    from = t;
    to = showing;
    t0 = performance.now();
    kick();
  }

  btn.addEventListener("click", toggle);

  /* On the parcel, a click turns it over. On the code, the drawing *is* the
     code — so a click from a desktop, where there is no second camera to
     scan with, goes where the code points. */
  if (hit) {
    hit.title = COPY.box.title;
    hit.addEventListener('click', function () {
      if (showing) window.open(STORE, '_blank', 'noopener');
      else toggle();
    });
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { layout(); pair(); redraw(); }, 140);
  });

  // the panel's "stop animations" switch reaches in here too
  window.addEventListener("agronov:prefs", function () { redraw(); });

  setRot(rot);
  buildBox();
  layout();
  pair();
  kick();

  // the printing uses the page's own typeface, so redraw once it lands
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (t === 0) redraw(); });
  }
})();
