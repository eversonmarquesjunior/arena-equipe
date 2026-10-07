// ===== Heróis em pixel art (usados pela Arena e pela Masmorra) =====
// Pixel-art team sprites. Canvas 32x32 per sprite, character faces right.
const SW = 32, SH = 32, OX = 4;
const OUTLINE = [22, 16, 30];
const sh = (c, f) => c.map(v => Math.max(0, Math.min(255, Math.round(v * f))));

class Grid {
  constructor() { this.p = new Map(); this.fx = new Map(); }
  set(x, y, c, fx = false) {
    x = Math.round(x) + OX; y = Math.round(y);
    if (x < 0 || y < 0 || x >= SW || y >= SH) return;
    (fx ? this.fx : this.p).set(y * SW + x, c);
  }
  del(x, y) { this.p.delete(y * SW + x + OX); }
  rect(x0, y0, x1, y1, c, fx) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, c, fx); }
  line(x0, y0, x1, y1, c, fx) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c, fx);
  }
  segs(list, map, dy) { for (const [y, a, b, ch] of list) this.rect(a, y + dy, b, y + dy, map[ch]); }
}

const POSES = {
  idle:   { legs: 'n', bob: 0, back: [6, 16, 6, 21], bh: [6, 22], front: [16, 16, 16, 21], fh: [16, 22] },
  windup: { legs: 'w', bob: 1, back: [6, 16, 5, 20], bh: [5, 21], front: [16, 15, 18, 10], fh: [18, 8] },
  attack: { legs: 'w', bob: 0, back: [6, 16, 4, 19], bh: [3, 20], front: [16, 16, 21, 16], fh: [22, 16] },
  cast:   { legs: 'w', bob: 0, back: [8, 17, 19, 18], bh: [20, 18], front: [16, 16, 21, 14], fh: [22, 13] },
  slam:   { legs: 'w', bob: 2, back: [6, 16, 4, 20], bh: [3, 21], front: [16, 17, 19, 23], fh: [20, 24] },
  draw:   { legs: 'w', bob: 0, back: [9, 16, 14, 17], bh: [15, 17], front: [16, 16, 21, 16], fh: [22, 16], backFront: true },
  loose:  { legs: 'w', bob: 0, back: [6, 16, 4, 19], bh: [3, 20], front: [16, 16, 21, 16], fh: [22, 16] },
  summon: { legs: 'w', bob: 0, back: [8, 16, 6, 11], bh: [5, 9], front: [15, 16, 17, 11], fh: [17, 9] },
  hurt:   { legs: 'n', bob: 1, back: [6, 16, 4, 20], bh: [3, 21], front: [16, 16, 18, 20], fh: [18, 21] },
};

const CHARS = [
  {
    id: 'lucas', name: 'Lucas', cls: 'Guerreiro', power: 'Adagas Explosivas', color: '#ff6b3d',
    skin: [238, 196, 170], hair: [36, 28, 26], hairD: [18, 13, 13],
    top: [44, 44, 52], pants: [30, 30, 36], shoe: [26, 26, 30], sole: [235, 235, 235], sleeve: 1,
    hairSegs: [
      [2, 9, 9, 'h'], [2, 11, 12, 'h'], [2, 14, 14, 'h'],
      [3, 8, 15, 'H'], [4, 7, 16, 'H'], [5, 7, 17, 'H'], [6, 7, 17, 'H'],
      [7, 7, 10, 'H'], [7, 12, 13, 'H'], [7, 15, 16, 'H'],
      [8, 7, 9, 'H'], [9, 7, 9, 'H'], [10, 7, 8, 'H'], [11, 8, 8, 'h'],
      [3, 8, 8, 'h'], [3, 11, 11, 'h'], [4, 10, 10, 'h'], [4, 13, 13, 'h'], [5, 9, 9, 'h'], [5, 15, 15, 'h'], [6, 12, 12, 'h'],
    ],
    windPose: 'windup', atkPose: 'attack',
    details(g, b, c) {
      g.rect(9, 15 + b, 14, 15 + b, [62, 62, 74]);
      g.rect(9, 21 + b, 14, 21 + b, sh(c.top, 0.75));
      [[10, 16], [10, 17], [11, 18], [13, 16], [13, 17], [12, 18]].forEach(([x, y]) => g.set(x, y + b, [205, 205, 210]));
      g.rect(11, 19 + b, 12, 20 + b, [245, 245, 245]);
    },
    weapon(g, pose, hx, hy) {
      const blade = [205, 215, 230], edge = [255, 255, 255], hilt = [150, 90, 40];
      if (pose === 'idle' || pose === 'hurt') { g.rect(hx - 1, hy + 2, hx + 2, hy + 2, [220, 170, 60]); g.rect(hx, hy + 3, hx, hy + 6, blade); g.rect(hx + 1, hy + 3, hx + 1, hy + 5, edge); }
      if (pose === 'windup') { g.rect(hx - 1, hy - 1, hx + 2, hy - 1, [220, 170, 60]); g.rect(hx, hy - 5, hx, hy - 2, blade); g.rect(hx + 1, hy - 4, hx + 1, hy - 2, edge); g.set(hx, hy + 2, hilt); }
    },
  },
  {
    id: 'stefanye', name: 'Stefanye', cls: 'Maga', power: 'Pássaros de Fogo', color: '#ffa52e',
    skin: [236, 192, 162], hair: [32, 22, 20], hairD: [16, 10, 10],
    top: [30, 30, 38], pants: [72, 104, 156], shoe: [236, 236, 236], sole: [190, 190, 200], sleeve: 0.4, trim: [245, 125, 30],
    glasses: true,
    hairSegs: [
      [3, 9, 14, 'H'], [4, 8, 15, 'H'], [5, 7, 16, 'H'], [5, 11, 11, 'h'],
      [6, 7, 10, 'H'], [6, 13, 17, 'H'],
      ...[7, 8, 9, 10, 11, 12, 13].map(y => [y, 6, 9, 'H']),
      ...[7, 8, 9, 10, 11, 12, 13].map(y => [y, 16, 17, 'H']),
      ...[8, 9, 10, 11, 12].map(y => [y, 9, 9, 'h']),
      [14, 6, 9, 'H'], [14, 16, 17, 'H'], [15, 5, 8, 'H'], [15, 16, 18, 'H'], [16, 6, 9, 'H'], [16, 17, 18, 'H'],
      [17, 5, 8, 'H'], [17, 16, 18, 'H'], [18, 6, 8, 'H'], [18, 17, 18, 'H'], [19, 5, 7, 'H'], [19, 16, 17, 'H'],
      [20, 6, 7, 'h'], [20, 17, 17, 'h'], [15, 5, 5, 'h'], [17, 5, 5, 'h'], [16, 18, 18, 'h'],
    ],
    windPose: 'cast', atkPose: 'cast',
    details(g, b) {
      g.rect(10, 15 + b, 13, 15 + b, [52, 52, 64]);
      g.rect(9, 15 + b, 9, 15 + b, [245, 125, 30]); g.rect(14, 15 + b, 14, 15 + b, [245, 125, 30]);
      g.set(13, 17 + b, [235, 235, 235]); g.set(14, 17 + b, [180, 180, 190]);
      g.rect(8, 22 + b, 15, 22 + b, [60, 88, 136]);
    },
    weapon(g, pose, hx, hy) {
      const wood = [120, 78, 46], woodL = [160, 110, 64];
      const sx = hx + 2, top = pose === 'cast' ? hy - 8 : pose === 'summon' ? hy - 3 : hy - 13, bot = Math.min(29, hy + 9);
      g.rect(sx, top, sx, bot, wood); g.rect(sx, top, sx, top + 3, woodL);
      g.rect(sx - 1, top - 1, sx + 1, top - 1, [200, 150, 60]);
      g.rect(sx - 1, top - 4, sx + 1, top - 2, [255, 140, 40]); g.set(sx, top - 3, [255, 235, 140]);
      if (pose === 'cast' || pose === 'summon') { g.rect(sx - 2, top - 3, sx - 2, top - 3, [255, 200, 90], true); g.set(sx + 2, top - 3, [255, 200, 90], true); g.set(sx, top - 6, [255, 200, 90], true); }
    },
  },
  {
    id: 'pedro', name: 'Pedro', cls: 'Tanque', power: 'Soco Sísmico', color: '#c9a36b',
    skin: [226, 178, 142], hair: [38, 30, 26], hairD: [20, 15, 13], beard: [66, 50, 40],
    top: [240, 240, 238], pants: [52, 66, 102], shoe: [44, 36, 32], sole: [30, 26, 24], sleeve: 1,
    glasses: true, fists: true,
    hairSegs: [
      [4, 9, 14, 'H'], [5, 8, 15, 'H'], [6, 7, 16, 'H'], [7, 7, 13, 'H'],
      [8, 7, 9, 'H'], [9, 7, 9, 'H'], [10, 7, 8, 'H'], [11, 8, 8, 'h'], [4, 9, 9, 'h'], [6, 16, 16, 'h'],
    ],
    beardSegs: [[11, 9, 9], [11, 12, 14], [12, 9, 12], [12, 14, 15], [13, 9, 15], [14, 10, 13]],
    windPose: 'windup', atkPose: 'slam',
    details(g, b) {
      const s = [196, 198, 206];
      g.rect(8, 15 + b, 8, 22 + b, s); g.rect(9, 22 + b, 15, 22 + b, s);
      g.set(10, 15 + b, s); g.set(13, 15 + b, s);
      [17, 19, 21].forEach(y => g.set(12, y + b, [170, 172, 182]));
      [[10, 16], [10, 17], [11, 18], [13, 16], [13, 17], [12, 18]].forEach(([x, y]) => g.set(x, y + b, [34, 34, 38]));
      g.rect(11, 19 + b, 12, 20 + b, [250, 250, 250]); g.set(12, 19 + b, [245, 125, 30]);
    },
    weapon() {},
  },
  {
    id: 'natalia', name: 'Natália', cls: 'Arqueira', power: 'Flechas Elétricas', color: '#5ee6ff',
    skin: [240, 198, 170], hair: [84, 54, 36], hairD: [52, 32, 22], hairL: [176, 124, 78],
    top: [28, 28, 34], pants: [24, 24, 28], shoe: [16, 16, 18], sole: [10, 10, 12], sleeve: 1, boots: true,
    hairSegs: [
      [3, 9, 14, 'H'], [4, 8, 15, 'H'], [5, 7, 16, 'H'], [6, 7, 16, 'H'],
      [7, 7, 12, 'H'], [7, 16, 16, 'H'], [8, 7, 10, 'H'], [8, 11, 11, 'H'], [8, 16, 16, 'H'],
      [9, 7, 9, 'H'], [10, 7, 9, 'H'], [11, 7, 9, 'H'], [9, 16, 16, 'H'], [10, 16, 16, 'H'], [11, 16, 16, 'H'],
      [12, 7, 9, 'H'], [12, 16, 17, 'H'], [13, 6, 9, 'H'], [13, 16, 17, 'H'],
      [14, 6, 9, 'L'], [14, 16, 18, 'L'], [15, 6, 8, 'L'], [15, 17, 18, 'L'], [16, 7, 7, 'L'], [16, 18, 18, 'L'],
      [5, 12, 13, 'h'], [6, 11, 11, 'h'], [9, 9, 9, 'h'], [10, 9, 9, 'h'], [11, 9, 9, 'h'],
      [3, 7, 8, 'R'], [2, 7, 7, 'W'], [4, 6, 6, 'P'], [5, 6, 6, 'R'], [6, 5, 5, 'P'], [7, 5, 5, 'R'], [8, 6, 6, 'W'], [9, 5, 5, 'P'],
    ],
    windPose: 'draw', atkPose: 'draw',
    details(g, b) {
      const coral = [244, 112, 92], coralD = [206, 82, 70];
      g.rect(10, 15 + b, 13, 21 + b, coral);
      g.set(10, 17 + b, coralD); g.set(13, 19 + b, coralD); g.set(11, 21 + b, coralD);
      [[10, 15], [10, 16], [11, 17], [13, 15], [13, 16], [12, 17]].forEach(([x, y]) => g.set(x, y + b, [70, 190, 90]));
      g.rect(11, 18 + b, 12, 19 + b, [250, 250, 250]);
      g.set(9, 20 + b, [230, 185, 70]); g.set(14, 20 + b, [230, 185, 70]);
    },
    weapon(g, pose, hx, hy) {
      const wood = [60, 80, 120], gold = [240, 200, 90], elec = [150, 240, 255];
      const drawn = pose === 'draw' || pose === 'loose';
      const cx = hx + 2, cy = hy + 1, half = drawn ? 8 : 6;
      let top, bot;
      for (let dy = -half; dy <= half; dy++) {
        const a = Math.abs(dy);
        const x = cx + (a <= half * 0.5 ? 1 : a <= half * 0.8 ? 0 : -1);
        g.set(x, cy + dy, a === half ? gold : wood);
        if (dy === -half) top = [x, cy + dy]; if (dy === half) bot = [x, cy + dy];
      }
      const sc = [230, 240, 255];
      if (pose === 'draw') {
        g.line(top[0], top[1], hx - 7, cy, sc, true); g.line(bot[0], bot[1], hx - 7, cy, sc, true);
        g.line(hx - 7, cy, hx + 5, cy, [230, 210, 160], true);
        g.set(hx + 6, cy, elec, true); g.set(hx + 5, cy - 1, elec, true); g.set(hx + 5, cy + 1, elec, true); g.set(hx + 7, cy, [255, 255, 255], true);
      } else {
        g.line(top[0], top[1], bot[0], bot[1], sc, true);
      }
    },
  },
  {
    id: 'junior', name: 'Junior', cls: 'Feiticeiro', power: 'Bolas de Fogo', color: '#ff4a2e',
    skin: [236, 188, 156], hair: [96, 64, 42], hairD: [66, 42, 28], hairL: [140, 100, 66], beard: [82, 54, 36],
    top: [36, 42, 66], pants: [40, 44, 58], shoe: [62, 52, 46], sole: [220, 220, 220], sleeve: 0.35,
    hairSegs: [
      [3, 10, 13, 'H'], [4, 8, 15, 'H'], [5, 7, 16, 'H'], [6, 6, 17, 'H'], [7, 6, 11, 'H'],
      [8, 6, 9, 'H'], [9, 7, 9, 'H'], [10, 7, 9, 'H'], [11, 7, 8, 'H'], [12, 8, 8, 'h'],
      [4, 10, 13, 'L'], [5, 12, 15, 'L'], [6, 14, 16, 'L'], [7, 6, 7, 'h'], [8, 6, 6, 'h'],
    ],
    beardSegs: [[10, 9, 9], [11, 9, 10], [11, 12, 15], [12, 9, 12], [12, 14, 15], [13, 9, 15], [14, 10, 14]],
    windPose: 'cast', atkPose: 'cast',
    details(g, b) {
      g.rect(10, 15 + b, 13, 15 + b, [56, 64, 96]);
      g.rect(11, 17 + b, 13, 19 + b, [232, 122, 42]); g.set(12, 18 + b, [40, 40, 44]);
      g.rect(8, 15 + b, 8, 22 + b, sh([36, 42, 66], 0.75));
    },
    weapon(g, pose, hx, hy, bh) {
      if (pose !== 'cast' && pose !== 'summon') return;
      [[hx, hy], bh].forEach(([x, y]) => {
        g.set(x + 2, y - 1, [255, 90, 30], true); g.set(x + 1, y - 2, [255, 170, 40], true);
        g.set(x + 2, y - 3, [255, 230, 120], true); g.set(x, y - 1, [255, 120, 40], true);
      });
    },
  },
];

function buildSprite(c, poseName, extraBob = 0) {
  const P = POSES[poseName];
  const g = new Grid();
  const b = P.bob + extraBob;
  const skinD = sh(c.skin, 0.82);
  const off = ([x, y]) => [x, y + b];

  const drawArm = (seg, hand, back) => {
    const [x0, y0, x1, y1] = seg;
    const sleeve = back ? sh(c.top, 0.72) : c.top;
    const skin = back ? skinD : c.skin;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n) + b;
      let col = i / n <= c.sleeve ? sleeve : skin;
      if (c.trim && i / n <= c.sleeve && (i + 1) / n > c.sleeve) col = c.trim;
      g.rect(x, y, x + 1, y + 1, col);
    }
    const [hx, hy] = off(hand);
    if (c.fists) { g.rect(hx, hy, hx + 2, hy + 2, back ? [110, 118, 132] : [150, 160, 176]); g.set(hx + 1, hy, back ? [140, 148, 160] : [205, 212, 225]); g.set(hx + 2, hy + 1, [95, 102, 116]); }
    else g.rect(hx, hy, hx + 1, hy + 1, skin);
  };

  if (!P.backFront) drawArm(P.back, P.bh, true);

  // legs
  const top = 23 + b;
  const legs = P.legs === 'n' ? [[8, 10], [13, 15]] : [[6, 8], [15, 17]];
  const shoes = P.legs === 'n' ? [[8, 11], [13, 16]] : [[6, 9], [15, 18]];
  legs.forEach(([a, z], i) => {
    const col = i === 0 ? sh(c.pants, 0.8) : c.pants;
    g.rect(a, top, z, 29, col);
    if (c.boots) g.rect(a, 25, z, 29, i === 0 ? sh(c.shoe, 0.8) : c.shoe);
  });
  g.rect(8, top, 15, top + 1, c.pants);
  shoes.forEach(([a, z]) => { g.rect(a, 30, z, 30, c.shoe); g.rect(a, 31, z, 31, c.sole); });

  // torso
  g.rect(8, 15 + b, 15, 22 + b, c.top);
  g.rect(8, 15 + b, 8, 22 + b, sh(c.top, 0.8));
  c.details(g, b, c);

  // neck + head
  g.rect(11, 14 + b, 12, 14 + b, skinD);
  g.rect(8, 6 + b, 15, 13 + b, c.skin);
  g.del(15, 13 + b); g.set(15, 11 + b, c.skin); g.set(16, 10 + b, c.skin);
  g.rect(9, 13 + b, 14, 13 + b, sh(c.skin, 0.94));
  g.set(9, 10 + b, skinD);
  const eye = [30, 22, 34];
  const hurt = poseName === 'hurt';
  g.set(12, 10 + b, eye); g.set(14, 10 + b, eye);
  if (!hurt) { g.set(12, 9 + b, [250, 250, 250]); g.set(14, 9 + b, [250, 250, 250]); }
  g.set(13, 12 + b, poseName === 'idle' ? skinD : [140, 60, 60]);
  g.set(11, 11 + b, [240, 160, 150]);

  const map = { H: c.hair, h: c.hairD, L: c.hairL || c.hair, R: [245, 125, 30], P: [240, 110, 170], W: [250, 250, 250] };
  if (c.beardSegs) g.segs(c.beardSegs.map(s => [...s, 'b']), { b: c.beard }, b);
  g.segs(c.hairSegs, map, b);
  if (c.glasses) {
    const gl = [26, 20, 30], lens = [196, 226, 250];
    g.rect(11, 8 + b, 12, 8 + b, gl); g.rect(14, 8 + b, 15, 8 + b, gl);
    g.set(13, 9 + b, gl); g.set(10, 9 + b, gl);
    g.rect(11, 9 + b, 12, 10 + b, lens); g.rect(14, 9 + b, 15, 10 + b, lens);
    g.set(12, 10 + b, eye); g.set(14, 10 + b, eye);
    g.rect(11, 11 + b, 12, 11 + b, gl); g.rect(14, 11 + b, 15, 11 + b, gl);
  }

  if (P.backFront) drawArm(P.back, P.bh, true);
  drawArm(P.front, P.fh, false);
  const [hx, hy] = off(P.fh);
  c.weapon(g, P.wp || poseName, hx, hy, off(P.bh));
  return g;
}

function drawSprite(ctx, c, pose, x, y, scale, opts = {}) {
  const g = buildSprite(c, pose, opts.bob || 0);
  const flash = opts.flash || opts.sil;
  const px = (k, col) => {
    const X = k % SW, Y = Math.floor(k / SW);
    ctx.fillStyle = opts.sil ? opts.sil : flash ? '#fff' : `rgb(${col[0]},${col[1]},${col[2]})`;
    ctx.fillRect(x + X * scale, y + Y * scale, scale, scale);
  };
  ctx.fillStyle = `rgb(${OUTLINE.join(',')})`;
  for (const k of g.p.keys()) {
    const X = k % SW, Y = Math.floor(k / SW);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = X + dx, ny = Y + dy;
      if (nx < 0 || ny < 0 || nx >= SW || ny >= SH || !g.p.has(ny * SW + nx)) {
        if (!flash) ctx.fillRect(x + nx * scale, y + ny * scale, scale, scale);
      }
    }
  }
  for (const [k, col] of g.p) px(k, col);
  for (const [k, col] of g.fx) px(k, col);
}
