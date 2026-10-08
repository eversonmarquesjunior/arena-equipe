// ===== Alfredão: o periquito preso na gaiola da entrada do Ossuário (petCage do bioma) =====
// solto (E perto da gaiola), ele segue o herói até o fim da fase e dá rasantes nos bugs, como o Prazo Estourado
// morreu, ele volta para a gaiola; ao passar de fase, ele fica para trás

// desenho virado para a direita, 12 x 8; dois quadros de asa
const PET_COLORS = { G: '#7ed321', g: '#4f9a1a', H: '#a6e84a', W: '#ffffff', K: '#141414', B: '#ecc8b0', b: '#c98a70', Y: '#ffd23f', P: '#f0a0a0', w: '#3f8a1a' };
const PET_FRAMES = [
  ['....ww......',
   '...www..HHH.',
   '..gwwwGHHWKB',
   '.gGGGGGHHHBb',
   'ggGGYGGGGHb.',
   'g.gGYYGGGG..',
   '....gGGGG...',
   '.....P..P...'],
  ['............',
   '........HHH.',
   '..ggGGGHHWKB',
   '.gGGGGGHHHBb',
   'ggGwwYGGGHb.',
   'g.gwwwYGGG..',
   '...www.GG...',
   '.....P..P...'],
];
// rasante: dano (multiplicado pelos Pergaminhos de Poder como as armas), empurrão e alcance
const PET_HIT = { dmg: 14, stop: 2, shake: 1, kb: 1.5, ranged: true };
const PET_RANGE = 130, PET_CD = 70;

let pet = null;           // { x, y, vx, vy, face, st: 'follow' | 'wind' | 'dive' | 'rest', t, cd, target, bit }
let petCageOpen = false;

function freePet() {
  const C = L.petCage;
  petCageOpen = true;
  pet = { x: C.tx * TS + 4, y: C.row * TS + C.len + 10, vx: 0, vy: -1.5, face: 1, st: 'follow', t: 0, cd: 60, target: null, bit: false };
  burst(pet.x, pet.y, 22, ['#ffffff', '#a6e84a', '#ffd23f'], 1.8, 0, [12, 24]);
  sfx.secret();
  banner('Alfredão se juntou a você!', '');
}
// gaiola de pé no chão da entrada? (para o E e para a ficha)
const nearPetCage = () => {
  const C = L.petCage;
  if (!C || petCageOpen || mode !== 'play') return null;
  C.x = C.tx * TS + 4; C.y = C.floor * TS; C.lift = 56;   // x, y e lift: onde a ficha abre
  return Math.abs(pl.x + pl.w / 2 - C.x) < 18 && Math.abs(pl.y + pl.h - C.y) < 14 ? C : null;
};

function updatePet() {
  if (!pet) return;
  const p = pet, hx = pl.x + pl.w / 2, hy = pl.y;
  p.t++; if (p.cd > 0) p.cd--;
  const steer = (tx, ty, max, k = .1) => {
    p.vx += (clamp((tx - p.x) * .08, -max, max) - p.vx) * k;
    p.vy += (clamp((ty - p.y) * .08, -max, max) - p.vy) * k;
  };
  // ficou muito longe (caiu num buraco, porta...): reaparece no ombro do herói
  if (Math.hypot(hx - p.x, hy - p.y) > 260) { Object.assign(p, { x: hx - pl.face * 14, y: hy - 8, vx: 0, vy: 0, st: 'follow' }); burst(p.x, p.y, 10, ['#ffffff', '#a6e84a'], 1.2); }
  if (p.st === 'follow') {
    steer(hx - pl.face * 14, hy - 8 + Math.sin(p.t / 14) * 3, 2.6);
    p.face = Math.abs(p.vx) > .3 ? Math.sign(p.vx) : pl.face;
    if (p.cd <= 0) {
      // o bug mais perto do herói, dentro do alcance
      let best = null, bd = PET_RANGE;
      enemies.forEach(e => {
        if (!targetable(e)) return;
        const d = Math.hypot(e.x + e.w / 2 - hx, e.y + e.h / 2 - (pl.y + 14));
        if (d < bd && Math.abs(e.y - pl.y) < 90) { bd = d; best = e; }
      });
      if (best) { p.target = best; p.st = 'wind'; p.t = 0; sfx.warn(); }
    }
  } else if (p.st === 'wind') {
    // sobe um pouco antes de mergulhar
    p.vx *= .8; p.vy = p.vy * .8 - .12;
    if (p.target) p.face = Math.sign(p.target.x + p.target.w / 2 - p.x) || p.face;
    if (p.t >= 14) {
      const e = p.target;
      if (!e || !targetable(e)) { p.st = 'follow'; p.cd = 20; return; }
      const dx = e.x + e.w / 2 - p.x, dy = e.y + e.h / 2 - p.y, d = Math.hypot(dx, dy) || 1;
      p.vx = dx / d * 4.4; p.vy = dy / d * 4.4; p.st = 'dive'; p.t = 0; p.bit = false; sfx.bite();
    }
  } else if (p.st === 'dive') {
    if (p.t % 2 === 0) addP(p.x, p.y, 0, 0, 10, ['#a6e84a', '#4f9a1a']);
    const box = { x: p.x - 6, y: p.y - 4, w: 12, h: 8 };
    if (!p.bit) {
      const e = enemies.find(o => targetable(o) && overlap(box, o));
      if (e) { p.bit = true; hitEnemy(e, PET_HIT, Math.sign(p.vx) || 1, false, false); p.vx *= -.4; p.vy = -2; }
    }
    if (p.t >= 30 || p.bit) { p.st = 'rest'; p.t = 0; }
  } else if (p.st === 'rest') {
    p.vx *= .9; p.vy = p.vy * .9 - .06;
    if (p.t >= 20) { p.st = 'follow'; p.t = 0; p.cd = PET_CD; p.target = null; }
  }
  // voa por cima de tudo (não colide com o mapa)
  p.x += p.vx; p.y += p.vy;
}

function drawPetSprite(x, y, face, frame) {
  const F = PET_FRAMES[frame], X = Math.round(x), Y = Math.round(y) - 4;
  F.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = row[i]; if (c !== '.') R(face > 0 ? X - 6 + i : X + 5 - i, Y + j, 1, 1, PET_COLORS[c]); } });
}
function drawPet(cx, cy) {
  // gaiola da entrada: com o Alfredão dentro (pulando no poleiro) ou aberta e vazia
  const C = L.petCage;
  if (C) {
    const X = C.tx * TS + 4 - cx, Y = C.row * TS - cy;
    if (X > -20 && X < W + 20) {
      for (let y = 0; y < C.len; y += 3) R(X - (y / 3 % 2), Y + y, 2, 2, '#7a5a52');
      const gy = Y + C.len;
      R(X - 6, gy, 12, 1, '#9a7468'); R(X - 7, gy + 1, 14, 1, '#9a7468'); R(X - 7, gy + 16, 14, 2, '#9a7468');
      (petCageOpen ? [-7, 5] : [-7, -4, -1, 2, 5]).forEach(bx => R(X + bx, gy + 1, 1, 16, '#7a5a52'));
      if (petCageOpen) R(X + 6, gy + 1, 5, 1, '#9a7468');   // portinha aberta
      else drawPetSprite(X, gy + 9 - ((T >> 4) % 2), (T >> 7) % 2 ? -1 : 1, 0);
    }
  }
  if (pet) drawPetSprite(pet.x - cx, pet.y - cy, pet.face, pet.st === 'dive' ? 0 : (T >> 2) % 2);
}
