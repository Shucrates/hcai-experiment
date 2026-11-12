/* ============================================================
   Landing-screen paper plane, drawn as a grid of glyphs on a canvas.
   - Cells "materialize": each appears at a random moment as noise, then settles.
   - The plane bobs up and down (pitching with the motion) while wind
     streaks rush past right-to-left, so it reads as flying forward.
   - away() flies it off the top-right; back() brings it in again.
   ============================================================ */
function skyPlane(canvas) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  const COLS = 54, ROWS = 36, CELL = 5.6;          // plane grid
  const PW = COLS * CELL, PH = ROWS * CELL;
  const DARK = "#191918", MID = "#82807b", LIGHT = "#d6d3cc", WIND = "rgba(130,128,123,";
  const NOISE = "·:+*x%#";

  /* Plane faces in grid space (0..1). Pointing right, three-quarter view. */
  const FACES = [
    { c: LIGHT, p: [[0.00, 0.50], [1.00, 0.04], [0.37, 0.62]] },               // far wing
    { c: DARK,  p: [[0.40, 0.66], [1.00, 0.04], [0.74, 1.00]] },               // near wing (crease gap at the fold)
    { c: MID,   p: [[0.36, 0.64], [0.55, 0.78], [0.42, 0.97]] },               // keel tucked under
  ];
  const inside = (x, y, poly) => {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

  /* Rasterise faces into cells; supersample to find edge cells and dither them. */
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    let face = -1, cover = 0;
    for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
      const x = (c + (sx + 0.5) / 3) / COLS, y = (r + (sy + 0.5) / 3) / ROWS;
      for (let f = FACES.length - 1; f >= 0; f--) if (inside(x, y, FACES[f].p)) { cover++; if (face < 0) face = f; break; }
    }
    if (!cover) continue;
    const h = hash(c, r);
    if (cover < 9 && h > cover / 9 + 0.15) continue;           // ragged, dithered edges
    let color = FACES[face].c;
    if (color === DARK && h < 0.07) color = MID;                // speckle like print
    else if (color === LIGHT && h < 0.05) color = MID;
    cells.push({ x: c * CELL, y: r * CELL, color, glyph: h < 0.04 ? "+" : "×",
      // appear roughly tail-to-nose with randomness
      delay: 0.15 + (c / COLS) * 0.7 + Math.random() * 0.9 });
  }

  /* Wind streaks (screen space, move right-to-left). */
  let W = 0, H = 0;
  let SKY = 240;                                    // visible sky box height, read from .sky on resize
  const streaks = [];
  const HEADING = -0.42;                              // nose points up-right (radians)
  const newStreak = (anyX) => ({
    x: anyX ? -W * 0.3 + Math.random() * W * 1.6 : W * 1.3 + Math.random() * 60,
    y: H - SKY * 1.15 + Math.random() * SKY * 1.5,   
    len: 2 + Math.floor(Math.random() * 7),
    v: 90 + Math.random() * 200, a: 0.12 + Math.random() * 0.4,
  });
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight; SKY = canvas.parentElement.clientHeight || SKY;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    streaks.length = 0;
    for (let i = 0; i < Math.round(W / 9); i++) streaks.push(newStreak(true));
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement);

  let t0 = performance.now(), awayAt = null, raf = 0;
  function frame(now) {
    if (!canvas.isConnected) { ro.disconnect(); return; }
    const t = reduce ? 99 : (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);

    /* flight state */
    let fx = 0, fy = 0, rot = 0, gust = 1;
    if (awayAt != null) {
      const k = (now - awayAt) / 1000;
      fx = 1100 * k * k; fy = -500 * k * k; rot = -0.25 * Math.min(k * 3, 1); gust = 1 + k * 6;
    }
    const bob = reduce ? 0 : Math.sin(t * 1.7) * 11;
    const pitch = reduce ? 0 : Math.cos(t * 1.7) * -0.07;     // nose up while climbing

    /* wind: dashes streaming back along the flight line (opposite to heading) */
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(HEADING); ctx.translate(-W / 2, -H / 2);
    for (const s of streaks) {
      if (!reduce) s.x -= s.v * gust * (1 / 60);
      if (s.x + s.len * 7 < -W * 0.3) Object.assign(s, newStreak(false));
      ctx.fillStyle = WIND + s.a + ")";
      for (let i = 0; i < s.len; i++) ctx.fillRect(s.x + i * 7, s.y, 4, 1.5);
    }
    ctx.restore();

    /* plane */
    ctx.save();
    ctx.translate(W / 2 + fx, H - SKY / 2 + bob + fy);  // canvas extends above the sky box
    ctx.rotate(pitch + rot);
    ctx.translate(-PW / 2, -PH / 2);
    ctx.font = "700 7.5px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    for (const cl of cells) {
      const age = t - cl.delay;
      if (age < 0) continue;
      let g = cl.glyph, col = cl.color, a = 1, ox = 0;
      if (age < 0.35) {                                   // materializing: noise, fade, drift in
        g = NOISE[(Math.random() * NOISE.length) | 0];
        a = age / 0.35; col = age < 0.18 ? LIGHT : col; ox = (1 - a) * 10;
      } else if (Math.random() < 0.0015) {                // occasional shimmer
        g = NOISE[(Math.random() * NOISE.length) | 0];
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = col;
      ctx.fillText(g, cl.x + CELL / 2 + ox, cl.y + CELL / 2);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    if (!reduce || awayAt != null) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    away() { awayAt = performance.now(); if (reduce) { canvas.style.transition = "opacity .3s"; canvas.style.opacity = 0; } },
    back() {
      awayAt = null; t0 = performance.now(); canvas.style.opacity = 1;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    },
  };
}
