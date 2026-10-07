// ===== Herói: movimento, colisão, ataques, projéteis, poção e dano =====

// ---------- jogador
const RUN = 1.9, ACC_G = .38, ACC_A = .24, FRIC = .34;
const GRAV = .32, MAXFALL = 6;   // inimigos e moedas
// herói: gravidade menor e pulo mais lento, quase na mesma altura de antes, mas fica mais tempo no ar
const P_GRAV = .24, JUMP = 4.2, JUMP2 = 3.7, P_MAXFALL = 5.2;
const COYOTE = 6, BUFFER = 7, ROLL_T = 20, ROLL_SPD = 3.4, ROLL_CD = 28;
const pl = { x: 0, y: 0, w: 10, h: 28, vx: 0, vy: 0, face: 1, ground: false, coyote: 0, buf: 0, jumps: 0, cut: false, roll: 0, rollCd: 0, drop: 0, anim: 0, land: 0, safe: null,
  hp: 100, max: 100, dmgMul: 1, scrolls: 0, inv: 0, hurt: 0, weapon: null, atk: null, atkBuf: 0, heavyBuf: 0, combo: 0, comboT: 0, potions: 1, drink: 0, carry: 50 };

// coloca o herói no começo do bioma carregado (chame depois do resetLevel)
function resetPlayer() {
  Object.assign(pl, { x: L.start.x, y: L.start.y - pl.h, vx: 0, vy: 0, face: 1, ground: false, roll: 0, rollCd: 0, drop: 0, jumps: 0, buf: 0, safe: { x: L.start.x, y: L.start.y - pl.h },
    hp: pl.max, inv: 0, hurt: 0, atk: null, atkBuf: 0, heavyBuf: 0, combo: 0, comboT: 0, potions: 1, drink: 0 });
  snapCam();
}

const keys = new Set();
const held = act => {
  if (act === 'left') return keys.has('a') || keys.has('arrowleft');
  if (act === 'right') return keys.has('d') || keys.has('arrowright');
  if (act === 'down') return keys.has('s') || keys.has('arrowdown');
  if (act === 'jump') return keys.has(' ') || keys.has('w') || keys.has('arrowup');
};
let lastDir = 0;
function inputDir() {
  const r = held('right'), l = held('left');
  return r && l ? lastDir : r ? 1 : l ? -1 : 0;
}
const onPlat = () => {
  const by = Math.floor((pl.y + pl.h) / TS);
  let p = false;
  for (let tx = Math.floor(pl.x / TS); tx <= Math.floor((pl.x + pl.w - .01) / TS); tx++) { const t = tile(tx, by); if (t === SOLID) return false; if (t === PLAT) p = true; }
  return p;
};

// colisão com o mapa, serve para o herói e para os inimigos (o = {x, y, w, h, vx, vy})
function moveX(o, dx) {
  o.x += dx;
  const t0 = Math.floor(o.y / TS), t1 = Math.floor((o.y + o.h - .01) / TS);
  const tx = dx > 0 ? Math.floor((o.x + o.w - .01) / TS) : Math.floor(o.x / TS);
  for (let ty = t0; ty <= t1; ty++) if (tile(tx, ty) === SOLID) {
    o.x = dx > 0 ? tx * TS - o.w : (tx + 1) * TS; o.vx = 0; return true;
  }
  return false;
}
function moveY(o, dy) {
  const prevBot = o.y + o.h;
  o.y += dy;
  const l = Math.floor(o.x / TS), r = Math.floor((o.x + o.w - .01) / TS);
  if (dy > 0) {
    const ty = Math.floor((o.y + o.h) / TS);
    for (let tx = l; tx <= r; tx++) {
      const t = tile(tx, ty);
      if (t === SOLID || (t === PLAT && !(o.drop > 0) && prevBot <= ty * TS + .01)) { o.y = ty * TS - o.h; return true; }
    }
  } else if (dy < 0) {
    const ty = Math.floor(o.y / TS);
    for (let tx = l; tx <= r; tx++) if (tile(tx, ty) === SOLID) { o.y = (ty + 1) * TS; o.vy = 0; return false; }
  }
  return false;
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function jump(v, double) {
  pl.vy = -v; pl.cut = true; pl.buf = 0; pl.ground = false; pl.coyote = 0;
  if (pl.roll) { pl.roll = 0; }
  const fx = pl.x + pl.w / 2, fy = pl.y + pl.h;
  if (double) { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; addP(fx, fy, Math.cos(a) * 1.4, Math.sin(a) * .5, 14, [CHARS[heroIdx].color, '#ffffff']); } sfx.djump(); }
  else { dust(fx, fy, 6); sfx.jump(); }
}

function updatePlayer() {
  const dir = inputDir();
  if (pl.rollCd > 0) pl.rollCd--;
  if (pl.drop > 0) pl.drop--;
  if (pl.land > 0) pl.land--;
  if (pl.inv > 0) pl.inv--;
  if (pl.atkBuf > 0) pl.atkBuf--;
  if (pl.heavyBuf > 0) pl.heavyBuf--;
  if (pl.comboT > 0) pl.comboT--;

  if (pl.roll > 0) {
    pl.roll--;
    pl.vx = pl.face * ROLL_SPD * (pl.roll > 4 ? 1 : .55);
    if (pl.ground && T % 3 === 0) dust(pl.x + pl.w / 2, pl.y + pl.h, 1, -pl.face);
  } else if (pl.drink > 0) {
    pl.vx += clamp(-pl.vx, -.4, .4);
    if (pl.drink % 12 === 0) sfx.gulp();
    if (--pl.drink === 0) finishDrink();
  } else if (pl.hurt > 0) {
    pl.hurt--;
    pl.vx *= pl.ground ? .8 : .98;
  } else {
    // atacando: o herói trava a direção e quase não anda (só o passo do golpe)
    const atk = pl.atk;
    if (dir && !atk) pl.face = dir;
    const target = atk ? 0 : dir * RUN;
    const acc = atk ? (pl.ground ? .5 : .05) : pl.ground ? (dir ? ACC_G : FRIC) : ACC_A;
    pl.vx += clamp(target - pl.vx, -acc, acc);
  }
  updateAttack();

  if (pl.ground) { pl.coyote = COYOTE; pl.jumps = 1; } else if (pl.coyote > 0) pl.coyote--;
  if (pl.buf > 0 && pl.hurt <= 0 && pl.drink <= 0) {
    pl.buf--;
    if (held('down') && pl.ground && onPlat()) { pl.drop = 10; pl.buf = 0; pl.ground = false; pl.coyote = 0; }
    else if (pl.coyote > 0) jump(JUMP, false);
    else if (pl.jumps > 0) { pl.jumps--; jump(JUMP2, true); }
  }
  // soltar o pulo cedo = pulo mais baixo
  if (pl.cut && !held('jump') && pl.vy < -1.6) { pl.vy *= .45; pl.cut = false; }
  const hang = Math.abs(pl.vy) < .7 && held('jump') ? .6 : 1;
  pl.vy = Math.min(P_MAXFALL, pl.vy + P_GRAV * hang);

  moveX(pl, pl.vx);
  const wasGround = pl.ground, fallV = pl.vy;
  pl.ground = moveY(pl, pl.vy);
  if (pl.ground) {
    pl.vy = 0;
    if (!wasGround && fallV > 2) {
      const k = clamp((fallV - 2) / (P_MAXFALL - 2), 0, 1);
      dust(pl.x + pl.w / 2, pl.y + pl.h, 4 + Math.round(k * 10)); sfx.land(k); pl.land = 5 + Math.round(k * 5);
    }
    // guarda o último chão firme (longe da beirada) para quando cair no buraco
    const by = Math.floor((pl.y + pl.h) / TS), firm = tx => tile(tx, by) !== AIR;
    if (firm(Math.floor(pl.x / TS) - 1) && firm(Math.floor((pl.x + pl.w) / TS) + 1)) pl.safe = { x: pl.x, y: pl.y };
  }

  pl.anim = pl.ground && Math.abs(pl.vx) > .3 ? pl.anim + Math.abs(pl.vx) * .085 : 0;
  // arma: guarda para frente parado; inclinada para trás correndo ou no ar (gira suave entre as duas)
  if (pl.weapon) {
    const w = WEAPONS[pl.weapon], moving = !pl.ground || Math.abs(pl.vx) > .3;
    pl.carry += ((moving ? w.run : w.idle) - pl.carry) * .2;
  }
  if (pl.ground && Math.abs(pl.vx) > 1 && !pl.roll && T % 9 === 0) dust(pl.x + pl.w / 2 - pl.face * 3, pl.y + pl.h, 1, -pl.face);

  if (pl.y > MH * TS + 30) {
    sfx.fall(); fade = 1;
    Object.assign(pl, { x: pl.safe.x, y: pl.safe.y, vx: 0, vy: 0, roll: 0 });
    snapCam();
  }
  // gosma tóxica: espirra, machuca e devolve o herói ao último chão firme
  const pool = poolAt(pl);
  if (pool) {
    splash(pl.x + pl.w / 2, pool.y * TS);
    Object.assign(pl, { x: pl.safe.x, y: pl.safe.y, vx: 0, vy: 0, roll: 0, atk: null });
    snapCam(); fade = .7;
    hurtPlayer(TOXIC_DMG, pl.face);
    pl.vx = 0; pl.vy = 0;   // sem o empurrão do dano: o herói volta parado no chão firme
    if (mode !== 'play') return;
  }
  const D = curDoor();
  if (pl.x + pl.w > D.x + 4 && pl.x < D.x + D.w - 4 && pl.y + pl.h > D.y && pl.y < D.y + D.h) win();
}

function roll() {
  if (mode !== 'play' || pl.roll > 0 || pl.rollCd > 0 || pl.hurt > 0 || pl.drink > 0) return;
  const dir = inputDir();
  if (dir) pl.face = dir;
  pl.roll = ROLL_T; pl.rollCd = ROLL_T + ROLL_CD; pl.atk = null; sfx.roll();
  dust(pl.x + pl.w / 2, pl.y + pl.h, 5, -pl.face);
}

// ---------- ataque do herói
function startAttack(i, heavy) {
  const w = WEAPONS[pl.weapon];
  i %= w.combo.length;
  // arco + clique: vira e mira no ponto clicado; o resto golpeia para onde o herói está virado
  let aim = 0;
  if (aimPt && w.combo[0].ranged) {
    const dx = aimPt.x - (pl.x + pl.w / 2), dy = aimPt.y - (pl.y + 10);
    if (Math.abs(dx) > 2) pl.face = dx < 0 ? -1 : 1;
    aim = Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI;
  }
  const s = heavy ? w.heavy : w.combo[i];
  pl.atk = { s, i, f: 0, hit: new Set(), aim, heavy: !!heavy }; pl.atkBuf = 0; pl.heavyBuf = 0; aimPt = null;
  if (heavy) sfx.charge(s.wind / 60); else if (s.ranged) sfx.draw();
}
// carregando: faíscas puxadas para o herói; perto do fim, um brilho avisa que está pronto
function chargeFx(a) {
  const s = a.s, cx = pl.x + pl.w / 2, cy = pl.y + 12, col = WEAPONS[pl.weapon].tint;
  if (a.f % 2 === 0) { const an = rand(0, Math.PI * 2), d = rand(12, 20); addP(cx + Math.cos(an) * d, cy + Math.sin(an) * d, -Math.cos(an) * d / 10, -Math.sin(an) * d / 10, 10, ['#ffffff', '#ffd23f', col]); }
  if (a.f === s.wind - 8) { burst(cx, cy, 12, ['#ffffff', '#ffd23f'], 1.6, 0, [8, 14]); sfx.ready(); }
}
function shootArrow(a, i = 0) {
  const s = a.s, r = a.aim * Math.PI / 180, ox = pl.x + pl.w / 2 + pl.face * 6, oy = pl.y + 12;
  arrows.push({ x: ox, y: oy, vx: Math.cos(r) * pl.face * s.speed, vy: Math.sin(r) * s.speed, s, life: 90, stuck: 0, hit: new Set(), heavy: a.heavy });
  if (s.dart) { sfx.puff(); burst(ox, oy, a.heavy ? 6 : 3, ['#ffffff', '#c8ffb0', '#9dff6a'], 1, 0, [5, 10]); if (a.heavy && i === 0) shake = Math.max(shake, 1); return; }
  if (a.heavy) { sfx.big(); burst(ox, oy, 10, ['#ffffff', '#ffd23f'], 1.6); shake = Math.max(shake, 2); }
  if (s.bolt) sfx.crank(); else sfx.twang();
}
function updateArrows() {
  arrows.forEach(ar => {
    if (ar.stuck) { ar.stuck--; return; }
    ar.life--;
    // dois passos por quadro para não atravessar paredes finas nem bugs
    for (let k = 0; k < 2 && ar.life > 0; k++) {
      ar.x += ar.vx / 2; ar.y += ar.vy / 2;
      if (tile(Math.floor(ar.x / TS), Math.floor(ar.y / TS)) === SOLID) {
        ar.stuck = 50; ar.life = 0; sfx.thunk();
        burst(ar.x, ar.y, 5, DUST, 1, .05, [6, 12]);
        return;
      }
      const e = enemies.find(o => targetable(o) && !ar.hit.has(o) && ar.x > o.x - 2 && ar.x < o.x + o.w + 2 && ar.y > o.y - 7 && ar.y < o.y + o.h + 2);
      if (e) {
        ar.hit.add(e);
        const ok = hitEnemy(e, ar.s, ar.vx < 0 ? -1 : 1, ar.heavy, ar.s.alwaysCrit);
        if (ok && ar.s.alwaysCrit) sfx.crit();
        if (ar.s.explode) explodeAt(ar.x, ar.y, ar.s.explode, e);   // explode mesmo se bateu no escudo
        if (!ok || !ar.s.pierce) { ar.life = 0; ar.gone = true; return; }   // bateu no escudo, ou flecha comum: some; a perfurante segue
      }
    }
    ar.vy += ar.s.dart ? .02 : ar.s.dagger ? .03 : .05;
    const trail = ar.s.dart ? ['#e9ffe0', '#9dff6a'] : ar.s.dagger ? ['#ffffff', '#c8f8ff'] : ar.heavy ? ['#ffffff', '#ffd23f', '#f5801e'] : ['#fff6d8', '#e6d2a0'];
    if (ar.life > 0 && (ar.heavy || T % 2 === 0)) addP(ar.x - ar.vx * .6, ar.y - ar.vy * .6, 0, 0, ar.heavy ? 12 : 6, trail);
  });
  arrows = arrows.filter(ar => !ar.gone && (ar.life > 0 || ar.stuck > 0) && ar.y < MH * TS + 20);
}
// explosão: dano em área + estilhaços para todos os lados (o bug atingido direto não leva de novo)
const FRAG_S = { dmg: 5, kb: .8, stop: 1, shake: 0, ranged: true };
function explodeAt(x, y, ex, skip) {
  blasts.push({ x, y, r: ex.r, t: 0, max: 18 });
  burst(x, y, 18, ['#fff6c2', '#ffd23f', '#ff8c1a', '#e8431f'], 2.4, .04, [10, 22]);
  burst(x, y, 10, SMOKE, 1.2, -.02, [16, 28], 2);
  sfx.boom(ex.r > 30 ? 1.3 : .8); shake = Math.max(shake, ex.r > 30 ? 6 : 4);
  const blastS = { dmg: ex.dmg, kb: 2.5, stop: 2, shake: 0, ranged: true };
  enemies.forEach(e => {
    if (e === skip || !targetable(e)) return;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (Math.hypot(cx - x, cy - y) <= ex.r + e.w / 2) hitEnemy(e, blastS, Math.sign(cx - x) || 1);
  });
  for (let i = 0; i < ex.frags; i++) {
    const an = i / ex.frags * Math.PI * 2 + rand(-.2, .2), sp = rand(2.8, 3.6);
    frags.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: irand(14, 20), skip });
  }
}
function updateFrags() {
  frags.forEach(f => {
    f.x += f.vx; f.y += f.vy; f.vy += .08; f.life--;
    if (tile(Math.floor(f.x / TS), Math.floor(f.y / TS)) === SOLID) { f.life = 0; return; }
    const e = enemies.find(o => o !== f.skip && targetable(o) && f.x > o.x - 1 && f.x < o.x + o.w + 1 && f.y > o.y - 4 && f.y < o.y + o.h + 1);
    if (e) { hitEnemy(e, FRAG_S, Math.sign(f.vx) || 1); f.life = 0; }
  });
  frags = frags.filter(f => f.life > 0);
  blasts.forEach(b => b.t++);
  blasts = blasts.filter(b => b.t < b.max);
}

function updateAttack() {
  if (!pl.weapon || pl.roll > 0 || pl.hurt > 0 || pl.drink > 0) return;
  const a = pl.atk;
  if (!a) {
    if (pl.heavyBuf > 0) startAttack(0, true);
    else if (pl.atkBuf > 0) startAttack(pl.comboT > 0 ? pl.combo : 0);
    return;
  }
  const s = a.s, len = WEAPONS[pl.weapon].combo.length, nextI = a.heavy ? 0 : (a.i + 1) % len;
  a.f++;
  if (a.heavy && a.f < s.wind) chargeFx(a);
  if (s.ranged) {
    // burst: vários disparos seguidos (Rajada Tripla da zarabatana)
    const k = a.f - s.wind, [n, gap] = s.burst || [1, 1];
    if (k >= 0 && k % gap === 0 && k / gap < n) shootArrow(a, k / gap);
  } else {
    if (a.f === s.wind) { (s.slam ? sfx.heavy : s.dash ? sfx.dash : sfx.swing)(); if (a.heavy) sfx.big(); if (pl.ground) pl.vx = pl.face * s.step; if (s.dash) a.x0 = pl.x + pl.w / 2; }
    // Katana: o golpe é um avanço rápido (para se bater num escudo de frente)
    if (s.dash && !a.blocked && a.f >= s.wind && a.f < s.wind + s.act) {
      const last = a.f === s.wind + s.act - 1;
      pl.vx = pl.face * (last ? 1.2 : s.dash); pl.vy = Math.min(pl.vy, .3);
      ghosts.push({ x: pl.x + pl.w / 2, y: pl.y + pl.h, face: pl.face, pose: heroPose(), life: 12 });
    }
    if (a.f >= s.wind && a.f < s.wind + s.act) hitCheck(a);
    if (s.daggers && a.f === s.wind + s.act - 1) throwDaggers(s.daggers);
  }
  if (s.slam && a.f === s.wind + s.act - 1 && pl.ground) {
    const gx = pl.x + pl.w / 2 + pl.face * (s.reach - 6);
    dust(gx, pl.y + pl.h, 10, pl.face); dust(gx, pl.y + pl.h, 6, -pl.face); shake = Math.max(shake, 2);
    if (s.quake) {
      // onda de choque no chão para os dois lados
      const fx = pl.x + pl.w / 2, fy = pl.y + pl.h;
      for (let d = 6; d <= s.reach; d += 4) [-1, 1].forEach(sd => { dust(fx + sd * d, fy, 2, sd); addP(fx + sd * d, fy - 1, sd * rand(.2, .6), rand(-2.4, -1), irand(14, 24), ['#d8cdbf', '#a8998a', '#7d6e62'], .18, 2); });
    }
  }
  // apertar de novo durante a recuperação emenda o próximo golpe do combo
  if (a.f >= s.wind + s.act && pl.atkBuf > 0 && nextI !== 0) { startAttack(nextI); return; }
  if (a.f >= s.wind + s.act + s.rec) { pl.atk = null; pl.combo = nextI; pl.comboT = nextI ? 22 : 0; }
}
function atkBox(s) {
  const cx = pl.x + pl.w / 2;
  if (s.both) return { x: cx - s.reach, y: pl.y - s.up, w: s.reach * 2, h: pl.h + s.up };
  return { x: pl.face > 0 ? cx - 4 : cx - s.reach, y: pl.y - s.up, w: s.reach + 4, h: pl.h + s.up };
}
function hitCheck(a) {
  const box = atkBox(a.s);
  const px = pl.x + pl.w / 2;
  const targets = enemies.filter(e => targetable(e) && !a.hit.has(e) && overlap(box, e));
  // Lança de Guerra: 2 ou mais bugs no mesmo golpe = crítico (dano dobrado)
  const crit = a.s.crit && targets.length + a.hit.size >= 2;
  if (crit && targets.length && !a.critFx) { a.critFx = true; sfx.crit(); shake = Math.max(shake, 4); }
  targets.forEach(e => { a.hit.add(e); if (!hitEnemy(e, a.s, Math.sign(e.x + e.w / 2 - px) || pl.face, a.heavy, crit) && a.s.dash) a.blocked = true; });
}
// Chuva de Adagas: leque de adagas saindo da altura da cintura
function throwDaggers(n) {
  const ox = pl.x + pl.w / 2 + pl.face * 6, oy = pl.y + 15;
  for (let i = 0; i < n; i++) {
    const r = (-14 + i * 28 / (n - 1)) * Math.PI / 180;
    arrows.push({ x: ox, y: oy, vx: Math.cos(r) * pl.face * DAGGER_S.speed, vy: Math.sin(r) * DAGGER_S.speed, s: DAGGER_S, life: 70, stuck: 0, hit: new Set(), heavy: false });
  }
  burst(ox, oy, 10, ['#ffffff', '#c8f8ff', '#8a93a6'], 1.6, 0, [6, 12]);
  sfx.knives();
}
// herói está esquivando? (rolando, ou no meio do avanço da katana)
const dodging = () => pl.roll > 0 || !!(pl.atk && pl.atk.s.dash && !pl.atk.blocked && pl.atk.f >= pl.atk.s.wind && pl.atk.f < pl.atk.s.wind + pl.atk.s.act + 2);
function addNum(v, x, y, col, big) { nums.push({ s: String(v), x: x + rand(-3, 3), y, col, t: 0, big }); }

// ---------- poção de cura
const DRINK_T = 40;
function startDrink() {
  if (mode !== 'play' || pl.drink > 0 || pl.atk || pl.roll > 0 || pl.hurt > 0) return;
  if (pl.potions <= 0 || pl.hp >= pl.max) { sfx.nope(); flashPot(); return; }
  pl.drink = DRINK_T; pl.atkBuf = 0; pl.heavyBuf = 0;
}
function finishDrink() {
  // a poção sempre enche a vida toda, não importa quanto falte
  const h = pl.max - pl.hp;
  pl.potions--; pl.hp += h;
  addNum(h, pl.x + pl.w / 2, pl.y - 4, '#4ade80');
  burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 22, ['#ffffff', '#c8ffd8', '#4ade80'], 1.6, -.03, [14, 26]);
  sfx.heal(); renderHp();
}

function hurtPlayer(dmg, dir) {
  pl.hp = Math.max(0, pl.hp - dmg); pl.inv = 60; pl.hurt = 16; pl.atk = null; pl.roll = 0; pl.drink = 0;
  pl.vx = dir * 2.6; pl.vy = -2.6; pl.ground = false;
  addNum(dmg, pl.x + pl.w / 2, pl.y - 4, '#ff4d6d');
  burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 14, ['#ffffff', '#ff4d6d', '#8a1f33'], 1.8, .08, [10, 20]);
  shake = Math.max(shake, 5); hitstop = Math.max(hitstop, 5); hurtFx = 1; sfx.hurt(); renderHp();
  if (pl.hp <= 0) die();
}
function die() {
  mode = 'dead'; deadT = 0; keys.clear();
  const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2;
  burst(cx, cy, 34, [CHARS[heroIdx].color, '#ffffff', '#ff4d6d'], 2.4, .06, [16, 32], 2);
  burst(cx, cy, 20, SMOKE, 1.3, -.01, [20, 34], 2);
  sfx.die();
}
