// ===== Obstáculos do mapa: jatos de gosma, pingos do teto e tábuas podres (listas jets, drips e crumbles do bioma) =====
// jets: [coluna, linha do chão, altura em blocos, atraso]: grade no chão que borbulha (aviso) e depois solta um jato de gosma
// drips: [coluna, primeira linha aberta embaixo do teto, atraso]: cano no teto que incha uma gota grande e deixa cair
// crumbles: [coluna, linha, tamanho]: tábua podre que racha quando o herói pisa, cai e volta depois de um tempo
// o atraso (em passos de 1/60 s) desencontra os jatos e pingos vizinhos

const JET_CYCLE = 150, JET_WARN = 45, JET_ON = 50;
const DRIP_CYCLE = 110, DRIP_GROW = 50;
const CRUMBLE_SHAKE = 26, CRUMBLE_BACK = 180;
// aparência da tábua: madeira podre (padrão) ou outra que o bioma escolher em crumbleLook (ex.: ponte de ossos)
const ROTTEN = { top: '#a8955a', mid: '#6b5a2e', bot: '#3a3a1a', crack: '#2a2412', drip: '#5fd13a', bits: ['#8a7a3a', '#5a5a26', '#3a3a1a'] };

let crumbleSt = [], drops = [];

// chamado ao carregar o bioma (depois do makeMap): tábuas de volta no lugar e nenhum pingo no ar
function resetObstacles() {
  crumbleSt = L.crumbles.map(([x, y, len]) => ({ x, y, len, st: 'idle', t: 0 }));
  crumbleSt.forEach(c => setCrumble(c, PLAT));
  drops = [];
}
function setCrumble(c, v) { for (let x = c.x; x < c.x + c.len; x++) map[c.y][x] = v; }
const onCrumble = (c, o) => Math.floor((o.y + o.h) / TS) === c.y && o.x + o.w > c.x * TS && o.x < (c.x + c.len) * TS;
// chão que não serve de "último chão firme" (para onde o herói volta quando cai): tábua podre ou perto de um jato
const unsafeGround = o => crumbleSt.some(c => c.st !== 'gone' && onCrumble(c, o)) ||
  L.jets.some(([col, row]) => Math.floor((o.y + o.h) / TS) === row && Math.abs(o.x + o.w / 2 - (col * TS + 4)) < 16);

// altura atual do jato em pixels (0 = desligado)
function jetH([, , len, off]) {
  const t = (T + off) % JET_CYCLE, on = t - JET_WARN;
  if (on < 0 || on >= JET_ON) return 0;
  return Math.round(len * TS * Math.min(1, on / 6, (JET_ON - on) / 8));
}
const jetWarn = ([, , , off]) => (T + off) % JET_CYCLE < JET_WARN;
const nearCam = x => x > cam.x - 40 && x < cam.x + W + 40;

function hurtByHazard(x) {
  if (mode !== 'play' || pl.inv > 0) return;
  hurtPlayer(TOXIC_DMG, Math.sign(pl.x + pl.w / 2 - x) || -pl.face);
}

function updateObstacles() {
  // jatos
  L.jets.forEach(j => {
    const [col, row] = j, X = col * TS + 4, Y = row * TS, h = jetH(j);
    if (jetWarn(j)) {
      if (T % 5 === 0) addP(X + rand(-3, 3), Y - 1, rand(-.2, .2), rand(-.9, -.4), irand(8, 14), ['#e9ffe0', '#b5ff7a'], 0, irand(1, 2));
      return;
    }
    if (!h) return;
    if ((T + j[3]) % JET_CYCLE === JET_WARN && nearCam(X)) sfx.gush();
    if (T % 2 === 0) addP(X + rand(-3, 3), Y - h, rand(-1, 1), rand(-1.6, -.4), irand(10, 18), POISON, .12, irand(1, 2));
    if (overlap({ x: X - 3, y: Y - h, w: 6, h }, pl)) hurtByHazard(X);
  });
  // pingos: a gota incha no cano e cai quando fica grande
  L.drips.forEach(([col, row, off]) => {
    if ((T + off) % DRIP_CYCLE === DRIP_GROW) drops.push({ x: col * TS + 4, y: row * TS + 4, vy: 0 });
  });
  drops.forEach(d => {
    d.vy = Math.min(6, d.vy + .22); d.y += d.vy;
    const hit = tile(Math.floor(d.x / TS), Math.floor((d.y + 3) / TS)) !== AIR;
    if (hit || d.y > MH * TS) {
      d.dead = true;
      for (let i = 0; i < 8; i++) addP(d.x, Math.floor((d.y + 3) / TS) * TS, rand(-1, 1), rand(-1.6, -.4), irand(10, 18), POISON, .12, 1);
      if (nearCam(d.x)) sfx.drip();
    } else if (overlap({ x: d.x - 2, y: d.y - 2, w: 4, h: 5 }, pl) && mode === 'play' && pl.inv <= 0) {
      d.dead = true; splash(d.x, d.y); hurtByHazard(d.x);
    }
  });
  drops = drops.filter(d => !d.dead);
  // tábuas podres
  crumbleSt.forEach(c => {
    c.t++;
    if (c.st === 'idle') {
      if (mode === 'play' && pl.ground && onCrumble(c, pl)) { c.st = 'shake'; c.t = 0; sfx.crack(); }
    } else if (c.st === 'shake') {
      if (T % 4 === 0) addP(rand(c.x * TS, (c.x + c.len) * TS), (c.y + 1) * TS, rand(-.2, .2), rand(.2, .6), 16, (L.crumbleLook || ROTTEN).bits, .1);
      if (c.t >= CRUMBLE_SHAKE) {
        c.st = 'gone'; c.t = 0; setCrumble(c, AIR); sfx.crack();
        for (let i = 0; i < c.len * 4; i++) addP(rand(c.x * TS, (c.x + c.len) * TS), c.y * TS + rand(0, 3), rand(-.6, .6), rand(-.8, .4), irand(24, 40), (L.crumbleLook || ROTTEN).bits, .14, 2);
      }
    } else if (c.t >= CRUMBLE_BACK && !overlap({ x: c.x * TS, y: c.y * TS, w: c.len * TS, h: TS }, pl)) {
      c.st = 'idle'; c.t = 0; setCrumble(c, PLAT);
      for (let i = 0; i < c.len * 3; i++) addP(rand(c.x * TS, (c.x + c.len) * TS), c.y * TS + 2, rand(-.3, .3), rand(-.5, -.1), irand(10, 20), DUST, .02);
    }
  });
}

function drawObstacles(cx, cy) {
  L.jets.forEach(j => {
    const [col, row] = j, X = col * TS - cx, Y = row * TS - cy, h = jetH(j);
    if (X < -12 || X > W + 12) return;
    // grade de metal no chão (pisca verde no aviso)
    R(X - 1, Y, 10, 2, '#4f5a3c'); R(X - 1, Y, 10, 1, '#6f7d55');
    [1, 4, 7].forEach(i => R(X + i - 1, Y, 1, 2, '#141d10'));
    if (jetWarn(j) && T % 8 < 4) R(X, Y - 1, 8, 1, '#7dff4a');
    if (!h) return;
    for (let y = 0; y < h; y++) {
      const wv = Math.round(Math.sin((y + T * 1.5) / 3) * .8);
      R(X + 1 + wv, Y - y - 1, 6, 1, '#3c9a2a'); R(X + 2 + wv, Y - y - 1, 4, 1, '#5fd13a'); R(X + 3 + wv, Y - y - 1, 2, 1, '#b5ff7a');
    }
    R(X, Y - h - 2, 8, 3, '#7dff4a'); R(X + 1, Y - h - 3, 6, 2, '#d8ffb0');
  });
  L.drips.forEach(([col, row, off]) => {
    const X = col * TS - cx, Y = row * TS - cy;
    if (X < -10 || X > W + 10) return;
    R(X + 1, Y - 2, 6, 3, '#4f5a3c'); R(X + 1, Y - 2, 1, 3, '#6f7d55'); R(X + 2, Y + 1, 4, 1, '#2c3a22');
    const t = (T + off) % DRIP_CYCLE;
    if (t < DRIP_GROW) { const s = 1 + Math.floor(3 * t / DRIP_GROW); R(X + 4 - (s >> 1), Y + 2, s, s + 1, '#5fd13a'); R(X + 4 - (s >> 1), Y + 2, 1, 1, '#d8ffb0'); }
  });
  drops.forEach(d => { const X = Math.round(d.x - cx), Y = Math.round(d.y - cy); R(X - 1, Y - 2, 3, 5, '#5fd13a'); R(X, Y - 3, 1, 1, '#5fd13a'); R(X - 1, Y - 1, 1, 2, '#d8ffb0'); });
  // tábua podre: rachaduras e (na madeira) limo pingando; tremendo antes de cair
  const K = L.crumbleLook || ROTTEN;
  crumbleSt.forEach(c => {
    if (c.st === 'gone') return;
    const sh = c.st === 'shake' ? Math.round(rand(-1, 1)) : 0, X = c.x * TS - cx + sh, Y = c.y * TS - cy, w = c.len * TS;
    if (X > W || X + w < 0) return;
    R(X, Y, w, 1, K.top); R(X, Y + 1, w, 2, K.mid); R(X, Y + 3, w, 1, K.bot);
    for (let i = 3; i < w; i += 7) R(X + i, Y + 1, 1, 2, K.crack);
    if (K.drip) { R(X + 2, Y + 3, 1, 2, K.drip); R(X + w - 3, Y + 3, 1, 3, K.drip); }
  });
}
// brilho verde dos jatos ligados e dos pingos caindo
function glowObstacles(cx, cy) {
  L.jets.forEach(j => { const h = jetH(j); if (h) lc.drawImage(GLOW_G, j[0] * TS + 4 - cx - 14, j[1] * TS - h - cy - 10, 28, h + 20); });
  drops.forEach(d => lc.drawImage(GLOW_G, d.x - cx - 8, d.y - cy - 8, 16, 16));
}
