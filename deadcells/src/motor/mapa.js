// ===== Mapa: cada bioma tem o seu próprio mapa, montado a partir do arquivo dele em src/biomas/ =====

const AIR = 0, SOLID = 1, PLAT = 2;
const BOTTOM = Infinity;   // carve(..., BOTTOM): escava até o fim do mapa (buraco sem fundo)

// biomas, na ordem em que os arquivos são carregados (é a ordem do menu de teste)
// cada bioma diz onde o herói começa (start) e onde fica a porta de saída (door); para onde ela leva vem de PHASES (fases.js)
// shop = é uma loja (aparece separado no menu de teste)
const BIOMES = {};
const BIOME_LISTS = ['torches', 'windows', 'barrels', 'chains', 'pipes', 'pools', 'secrets', 'chests', 'gates', 'pedestals', 'shopItems', 'encounters', 'ambushes', 'jets', 'drips', 'crumbles'];
function defBiome(id, B) {
  BIOME_LISTS.forEach(k => { B[k] = B[k] || []; });
  B.id = id; BIOMES[id] = B;
}

// mapa do bioma carregado agora (o loadBiome troca os três)
let map = null, MW = 0, MH = 0;
// fora do mapa: laterais e teto sólidos, embaixo é vazio (cair = voltar ao último chão seguro)
const tile = (tx, ty) => tx < 0 || tx >= MW || ty < 0 ? SOLID : ty >= MH ? AIR : map[ty][tx];

// tudo começa sólido e as salas são "escavadas" pela função build do bioma
function makeMap(B) {
  const m = Array.from({ length: B.h }, () => new Uint8Array(B.w).fill(SOLID));
  const fill = (x0, y0, x1, y1, v) => {
    for (let y = Math.max(0, y0); y <= Math.min(B.h - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(B.w - 1, x1); x++) m[y][x] = v;
  };
  B.build({ fill, carve: (x0, y0, x1, y1) => fill(x0, y0, x1, y1, AIR), plat: (x, y, len) => fill(x, y, x + len - 1, y, PLAT) });
  return m;
}

// salas secretas: a passagem é uma parede falsa (dá para atravessar) e a sala só aparece quando o herói entra
const secretIn = (B, x, y) => B.secrets.find(c => x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1);

// ---------- portões: a colisão é ligada à parte; no desenho pré-renderizado as passagens aparecem abertas
function setGate(g, closed) { g.closed = closed; for (let y = g.y0; y <= g.y1; y++) map[y][g.tx] = closed ? SOLID : AIR; }

// ---------- desenho do mapa (pré-renderizado uma vez por bioma)
// dois desenhos: um com as salas secretas escondidas (cv) e outro com tudo à mostra (cvS)
function renderBiome(B) {
  if (B.cv) return;
  const grid = makeMap(B), canvas = () => { const c = document.createElement('canvas'); c.width = B.w * TS; c.height = B.h * TS; return c; };
  B.cv = canvas(); B.cvS = canvas();
  buildLevel(B.cv, B, (x, y) => secretIn(B, x, y) ? SOLID : grid[y][x], true);
  buildLevel(B.cvS, B, (x, y) => grid[y][x], false);
}
// view(x, y): que bloco desenhar; hide: esconde a decoração que fica dentro das salas secretas
function buildLevel(cv, B, view, hide) {
  const b = cv.getContext('2d'), C = B.pal;
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const r = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
  const open = (x, y) => x >= 0 && y >= 0 && x < B.w && y < B.h && view(x, y) !== SOLID;
  const shown = (x, y) => !hide || !secretIn(B, x, y);
  const depth = (x, y) => {
    for (let d = 1; d <= 3; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (open(x + dx, y + dy)) return d;
    return 4;
  };
  const bricks = (X, Y, ty, base, mortar) => {
    r(X, Y, TS, TS, base); r(X, Y, TS, 1, mortar); r(X, Y + 4, TS, 1, mortar);
    const o = (ty % 2) * 4; r(X + o, Y + 1, 1, 3, mortar); r(X + (o + 4) % 8, Y + 5, 1, 3, mortar);
  };
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
    const t = view(x, y), X = x * TS, Y = y * TS;
    if (t !== SOLID) {
      const patch = ((x >> 2) * 7 + (y >> 2) * 13) % 5 === 0;
      bricks(X, Y, y, patch ? C.bgPatch : C.bg, C.bgMortar);
      if (rnd() < .3) r(X + irand(1, 6), Y + irand(1, 6), 1, 1, C.bgSpeck);
      // esgoto: manchas de limo escorrendo pelas paredes do fundo
      if (C.slime && rnd() < .04) { const h = irand(2, 7); r(X + irand(1, 6), Y, 1, h, C.slime); }
      if (t === PLAT) {
        r(X, Y, TS, 1, '#c28a52'); r(X, Y + 1, TS, 2, '#80552f'); r(X, Y + 3, TS, 1, '#4a2f1c');
        if (x % 2 === 0) r(X + 1, Y + 1, 1, 1, '#2b1a10');
        if (view(x - 1, y) !== PLAT) { r(X + 1, Y + 4, 2, 1, '#3a2618'); r(X + 2, Y + 5, 2, 1, '#3a2618'); r(X + 3, Y + 6, 2, 1, '#3a2618'); }
        if (view(x + 1, y) !== PLAT) { r(X + 5, Y + 4, 2, 1, '#3a2618'); r(X + 4, Y + 5, 2, 1, '#3a2618'); r(X + 3, Y + 6, 2, 1, '#3a2618'); }
      }
      continue;
    }
    const d = depth(x, y);
    if (d >= 4) { r(X, Y, TS, TS, C.d4); continue; }
    if (d === 3) { r(X, Y, TS, TS, C.d3); if (rnd() < .2) r(X + irand(0, 6), Y + irand(0, 6), 2, 1, C.d3Speck); continue; }
    if (d === 2) { bricks(X, Y, y, C.d2, C.d2Mortar); continue; }
    bricks(X, Y, y, C.wall, C.wallMortar);
    if (rnd() < .5) r(X + irand(1, 6), Y + irand(1, 6), 1, 1, C.wallSpeck);
    if (open(x, y - 1)) {
      r(X, Y, TS, 1, C.top); r(X, Y + 1, TS, 1, C.top2);
      for (let i = 0; i < TS; i++) if (rnd() < .3) r(X + i, Y + 2, 1, irand(1, 2), C.top2);
    }
    if (open(x, y + 1)) { r(X, Y + 7, TS, 1, C.under); if (rnd() < .4) r(X + irand(0, 7), Y + 8, 1, irand(1, 3), C.drip); }
    if (open(x - 1, y)) r(X, Y, 1, TS, C.lit);
    if (open(x + 1, y)) r(X + 7, Y, 1, TS, C.shade);
  }
  // fundo próprio do bioma (por exemplo, os arcos iluminados do Ossuário): px(x, y, cor) pinta um pixel só onde é vazio
  if (B.backdrop) B.backdrop((x, y, c) => { const tx = x >> 3, ty = y >> 3; if (tx >= 0 && ty >= 0 && tx < B.w && ty < B.h && view(tx, ty) === AIR) r(x, y, 1, 1, c); });
  // canos redondos do esgoto: aro de pedra, boca escura e gosma escorrendo da borda de baixo
  B.pipes.forEach(([px, py]) => {
    const X = px * TS + 4, Y = py * TS + 4;
    for (let y = -13; y <= 13; y++) for (let x = -13; x <= 13; x++) {
      const d = Math.hypot(x, y);
      if (d > 13) continue;
      r(X + x, Y + y, 1, 1, d > 11 ? '#2c3a22' : d > 9 ? ((Math.atan2(y, x) * 4 / Math.PI + 8) | 0) % 2 ? '#7d8f62' : '#93a676' : y > 4 ? '#5fd13a' : '#141d10');
    }
    for (let i = 0; i < 4; i++) { const sx = X - 6 + i * 4, h = irand(3, 9); r(sx, Y + 9, 2, h, '#5fd13a'); r(sx, Y + 9 + h, 2, 1, '#b5ff7a'); }
  });
  // janelas em arco com grades
  B.windows.forEach(([wx, wy]) => {
    const X = wx * TS, Y = wy * TS;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 24; x++) {
      const dx = x - 11.5, dy = y - 12, inArch = y >= 12 || dx * dx + dy * dy <= 144, inRim = y >= 12 ? x === 0 || x === 23 : dx * dx + dy * dy > 110;
      if (!inArch) continue;
      r(X + x, Y + y, 1, 1, inRim ? '#1a404c' : y < 18 ? '#0a1d25' : '#050d12');
    }
    [6, 12, 18].forEach(bx => r(X + bx, Y + 3, 1, 37, '#1f3d47'));
    r(X - 1, Y + 38, 26, 2, '#265a66');
  });
  // correntes penduradas no teto
  B.chains.forEach(([cx, cy, n]) => {
    if (!shown(cx, cy)) return;
    const X = cx * TS + 4;
    for (let y = 0; y < n * TS; y += 4) {
      if ((y >> 2) % 2) { r(X, cy * TS + y, 1, 4, '#7f8a90'); }
      else { r(X - 1, cy * TS + y, 1, 4, '#55606a'); r(X + 1, cy * TS + y, 1, 4, '#55606a'); r(X, cy * TS + y, 1, 1, '#55606a'); r(X, cy * TS + y + 3, 1, 1, '#55606a'); }
    }
  });
  // suportes das tochas
  B.torches.forEach(([tx, ty]) => { const X = tx * TS, Y = ty * TS; r(X + 3, Y + 4, 2, 6, '#3a3530'); r(X + 2, Y + 3, 4, 2, '#6b5a48'); r(X + 2, Y + 9, 4, 1, '#3a3530'); });
  // barris
  B.barrels.forEach(([bx, by]) => {
    if (!shown(bx, by)) return;
    const X = bx * TS, Y = (by + 1) * TS - 10;
    if (B.barrel === 'metal') {
      // barril de metal enferrujado vazando gosma
      r(X + 1, Y, 6, 10, '#4f5a3c'); r(X, Y + 2, 8, 6, '#4f5a3c');
      r(X + 2, Y + 1, 1, 8, '#6f7d55'); r(X + 6, Y + 1, 1, 8, '#343d27');
      r(X, Y + 2, 8, 1, '#8a6a2a'); r(X, Y + 7, 8, 1, '#8a6a2a'); r(X + 1, Y, 6, 1, '#5fd13a');
      r(X + 3, Y + 4, 2, 2, '#ffd23f'); r(X + 2, Y + 1, 1, 3, '#5fd13a');
      return;
    }
    r(X + 1, Y, 6, 10, '#6a4428'); r(X, Y + 2, 8, 6, '#6a4428');
    r(X + 2, Y + 1, 1, 8, '#8c5e38'); r(X + 6, Y + 1, 1, 8, '#4a2e1a');
    r(X, Y + 2, 8, 1, '#2e3238'); r(X, Y + 7, 8, 1, '#2e3238'); r(X + 1, Y, 6, 1, '#4a2e1a');
  });
  // porta de saída
  const { x: DX, y: DY } = B.door;
  r(DX - 3, DY - 4, 22, 36, '#2c6470'); r(DX - 2, DY - 3, 20, 35, '#1a404c');
  r(DX, DY, 16, 32, '#03070a'); r(DX - 4, DY + 30, 24, 2, '#4aa383');
  r(DX + 7, DY - 3, 2, 2, '#f5801e');
  // enfeites só deste bioma (por exemplo, o tapete da lojinha)
  if (B.decor) B.decor(r);
}
