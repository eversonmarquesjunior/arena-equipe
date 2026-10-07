// ===== Tela: resolução, utilidades, canvases e sprites prontos dos heróis =====

const W = 320, H = 180, TS = 8;
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- canvases
const low = document.createElement('canvas'); low.width = W; low.height = H;
const lc = low.getContext('2d');
const view = document.getElementById('view'); const vc = view.getContext('2d');
const stageEl = document.getElementById('stage');
function resize() {
  const r = view.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  view.width = Math.max(W, Math.round(r.width * dpr));
  view.height = Math.round(view.width * H / W);
}
addEventListener('resize', resize);

// sprite pronto (com contorno) num canvas 34x34, em cache
const sprCache = new Map();
function spriteImg(ci, pose, bob = 0) {
  const key = ci + pose + bob;
  let cv = sprCache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = cv.height = SW + 2;
  const ctx = cv.getContext('2d'), g = buildSprite(CHARS[ci], pose, bob);
  ctx.fillStyle = `rgb(${OUTLINE.join(',')})`;
  for (const k of g.p.keys()) {
    const X = k % SW, Y = Math.floor(k / SW);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = X + dx, ny = Y + dy;
      if (nx < 0 || ny < 0 || nx >= SW || ny >= SH || !g.p.has(ny * SW + nx)) ctx.fillRect(nx + 1, ny + 1, 1, 1);
    }
  }
  for (const m of [g.p, g.fx]) for (const [k, c] of m) { ctx.fillStyle = `rgb(${c.join(',')})`; ctx.fillRect(k % SW + 1, Math.floor(k / SW) + 1, 1, 1); }
  sprCache.set(key, cv);
  return cv;
}

function spriteSil(ci, pose, col = '#fff6d8') {
  const key = 'sil' + ci + pose + col;
  let cv = sprCache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = cv.height = SW + 2;
  const ctx = cv.getContext('2d');
  ctx.drawImage(spriteImg(ci, pose), 0, 0);
  ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = col; ctx.fillRect(0, 0, cv.width, cv.height);
  sprCache.set(key, cv);
  return cv;
}

// ---------- brilho suave (porta e armas nos pedestais)
function radial(r, stops) {
  const c = document.createElement('canvas'); c.width = c.height = r * 2;
  const x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c;
}
const GLOW_O = radial(64, [[0, 'rgba(255,170,80,.6)'], [.45, 'rgba(245,128,30,.2)'], [1, 'rgba(245,128,30,0)']]);
const GLOW_G = radial(64, [[0, 'rgba(160,255,90,.55)'], [.5, 'rgba(95,209,58,.18)'], [1, 'rgba(95,209,58,0)']]);
const GLOW_R = radial(64, [[0, 'rgba(255,110,100,.6)'], [.5, 'rgba(255,60,60,.18)'], [1, 'rgba(255,60,60,0)']]);
