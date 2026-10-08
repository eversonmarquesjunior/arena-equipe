// ===== Inimigos: os bugs, como pensam, atacam, levam dano e soltam moedas =====

// ---------- inimigos
// cada tipo de bug tem cor, vida, dano e comportamento próprios (os nomes vêm da Arena)
const PALS = {
  bug: { shell: '#7b4fc9', hi: '#b197f5', dark: '#24123f', belly: '#4a2f7d', eye: '#ff4d6d' },
  shield: { shell: '#3e9e5a', hi: '#86e39a', dark: '#0f2e1b', belly: '#2b6a3e', eye: '#ffd23f' },
  ghost: { shell: '#b8862f', hi: '#f0cf7a', dark: '#352408', belly: '#7a5a1c', eye: '#5ee6ff' },
  flyer: { shell: '#2f7fb8', hi: '#86c8f0', dark: '#0c2438', belly: '#1f5579', eye: '#ff8c1a' },
  shooter: { shell: '#c9413b', hi: '#f59a7a', dark: '#360d0d', belly: '#852a26', eye: '#fff176' },
};
const ETYPES = {
  bug: { coins: [3, 5], name: 'Bug de Produção', hp: 50, w: 18, h: 14, dmg: 15, speed: 1.25, wind: 30 },
  shield: { coins: [6, 8], name: 'Link Quebrado', hp: 70, w: 18, h: 14, dmg: 18, speed: .85, wind: 24 },
  ghost: { coins: [5, 7], name: 'Erro 404', hp: 45, w: 18, h: 14, dmg: 15, speed: 1.1, wind: 26 },
  flyer: { coins: [3, 4], name: 'Prazo Estourado', hp: 30, w: 14, h: 10, dmg: 12, fly: true, wind: 26 },
  shooter: { coins: [4, 6], name: 'Arquivo Corrompido', hp: 40, w: 18, h: 14, dmg: 12, speed: .7, wind: 32 },
};
const WHITE_PAL = { shell: '#fff', hi: '#fff', dark: '#fff', belly: '#fff', eye: '#fff' };
const E_LUNGE = 14, E_REST = 36, SPAWN_T = 36;
let seenTypes = new Set(), shots = [];
function spawnEnemy(type, tx, row, amb) {
  const k = ETYPES[type];
  const e = { type, pal: PALS[type], x: tx * TS + 4 - k.w / 2, y: k.fly ? row * TS : row * TS - k.h, w: k.w, h: k.h, vx: 0, vy: 0,
    face: pl.x < tx * TS ? -1 : 1, hp: k.hp, max: k.hp, st: k.fly ? 'hover' : 'patrol', t: 0, lost: 0, cd: 60, flash: 0, barT: 0, alert: 0,
    anim: 0, ground: false, dead: false, bit: false, spawnT: SPAWN_T, amb, hideCd: irand(150, 220), hidden: 0, turnT: 0, blockT: 0, windLen: k.wind, homeY: row * TS,
    drop: k.fly ? Infinity : 0 };   // voadores atravessam as plataformas de madeira
  enemies.push(e);
  burst(e.x + e.w / 2, e.y + e.h / 2, 16, [e.pal.hi, e.pal.shell, '#ffffff'], 1.6, 0, [12, 22]);
  sfx.spawn();
  // primeira vez que um tipo aparece: mostra o nome dele
  if (!seenTypes.has(type)) { seenTypes.add(type); banner(k.name, '', true); }
}
// pode ser atingido? (não enquanto surge nem quando o Erro 404 está sumido)
const targetable = e => !e.dead && e.spawnT <= 0 && e.hidden <= 0;
// tem chão em algum lugar abaixo da beirada? (se não, é um buraco sem fundo)
function floorBelow(e, dir) {
  const tx = Math.floor((e.x + (dir > 0 ? e.w + 1 : -1)) / TS);
  for (let ty = Math.floor((e.y + e.h + 1) / TS); ty < MH; ty++) if (tile(tx, ty) !== AIR) return true;
  return false;
}
// tem buraco logo à frente?
const ledge = (e, dir) => tile(Math.floor((e.x + (dir > 0 ? e.w + 1 : -1)) / TS), Math.floor((e.y + e.h + 1) / TS)) === AIR;

function updateEnemy(e) {
  if (e.spawnT > 0) { e.spawnT--; if (T % 3 === 0) addP(e.x + rand(0, e.w), e.y + rand(0, e.h), 0, -.4, 10, [e.pal.hi, '#ffffff']); return; }
  e.t++;
  if (e.poison > 0) { e.poison--; e.barT = Math.max(e.barT, 2); if (T % 5 === 0 && e.hidden <= 0) addP(e.x + rand(2, e.w - 2), e.y + rand(0, e.h / 2), rand(-.1, .1), rand(-.6, -.3), irand(14, 22), POISON); }
  if (e.flash > 0) e.flash--;
  if (e.barT > 0) e.barT--;
  if (e.cd > 0) e.cd--;
  if (e.alert > 0) e.alert--;
  if (e.blockT > 0) e.blockT--;
  if (ETYPES[e.type].fly) { updateFlyer(e); return; }
  if (e.type === 'ghost' && updateGhost(e)) return;
  const k = ETYPES[e.type];
  const dx = (pl.x + pl.w / 2) - (e.x + e.w / 2), dy = (pl.y + pl.h) - (e.y + e.h);
  const sees = mode === 'play' && Math.abs(dx) < 150 && Math.abs(dy) < 48;
  const hunting = mode === 'play' && Math.abs(dx) < 260 && Math.abs(dy) < 96;   // já perseguindo, só desiste bem mais longe
  let target = null;
  if (e.st === 'patrol') {
    target = e.face * .45;
    if (e.ground && ledge(e, e.face)) { e.face *= -1; target = 0; }
    if (sees) { e.st = 'chase'; e.t = 0; e.lost = 0; e.face = Math.sign(dx) || e.face; e.vy = -1.8; e.alert = 30; sfx.alert(); }
  } else if (e.st === 'chase') {
    if (e.type === 'shield') {
      // o escudo vira devagar: dá tempo de rolar e atacar pelas costas
      if (Math.abs(dx) > 6 && Math.sign(dx) !== e.face) { if (++e.turnT > 28) { e.face = -e.face; e.turnT = 0; } } else e.turnT = 0;
    } else if (Math.abs(dx) > 6) e.face = Math.sign(dx);
    if (e.type === 'shooter') {
      // mantém distância: foge se o herói chega perto, se aproxima se ele está longe
      const ad = Math.abs(dx);
      target = ad < 60 ? -Math.sign(dx) * k.speed : ad > 130 ? Math.sign(dx) * k.speed : 0;
      if (e.ground && target && ledge(e, Math.sign(target))) target = 0;
      if (sees && e.cd <= 0 && e.ground && Math.abs(dy) < 70) { e.st = 'wind'; e.t = 0; e.windLen = k.wind; sfx.warn(); }
    } else {
      target = Math.abs(dx) > 14 ? e.face * k.speed : 0;
      // na beirada: desce atrás do herói se lá embaixo tiver chão; só para diante de buraco sem fundo
      if (e.ground && ledge(e, e.face) && !(dy > -8 && floorBelow(e, e.face))) target = 0;
      if (Math.abs(dx) < 34 && Math.abs(dy) < 20 && e.cd <= 0 && e.ground && Math.sign(dx) === e.face) { e.st = 'wind'; e.t = 0; e.windLen = k.wind; sfx.warn(); }
    }
    e.lost = sees ? 0 : e.lost + 1;
    if (!hunting || e.lost > 240) { e.st = 'patrol'; e.t = 0; }
  } else if (e.st === 'wind') {
    target = 0;
    if (e.type === 'shooter' && Math.abs(dx) > 6) e.face = Math.sign(dx);
    if (e.t >= e.windLen) {
      if (e.type === 'shooter') { shoot(e); e.st = 'rest'; e.t = 0; e.restLen = 24; }
      else { e.st = 'lunge'; e.t = 0; e.vx = e.face * (e.type === 'shield' ? 2.6 : 3.6); e.vy = -1.4; e.bit = false; sfx.bite(); }
    }
  } else if (e.st === 'lunge') {
    if (e.ground && ledge(e, e.face) && !floorBelow(e, e.face)) e.vx = 0;
    if (e.ground && e.t > 3) e.vx *= .9;
    // rolando (ou ainda invencível) o bote passa direto: esquiva
    if (!e.bit && mode === 'play' && overlap(e, pl)) { e.bit = true; if (!dodging() && pl.inv <= 0) hurtPlayer(k.dmg, e.face); }
    if (e.t >= E_LUNGE) { e.st = 'rest'; e.t = 0; e.restLen = E_REST; }
  } else if (e.st === 'rest') {
    target = 0;
    if (e.t >= e.restLen) { e.st = 'chase'; e.t = 0; e.cd = e.type === 'shooter' ? 100 : 50; }
  } else if (e.st === 'hurt') {
    if (e.ground) e.vx *= .85;
    if (e.t >= 16) { e.st = 'chase'; e.t = 0; e.cd = Math.max(e.cd, 20); }
  }
  if (target !== null) e.vx += clamp(target - e.vx, -.15, .15);
  e.vy = Math.min(MAXFALL, e.vy + GRAV);
  if (moveX(e, e.vx)) {
    if (e.st === 'patrol') e.face *= -1;
    else if (e.st === 'chase' && e.ground && e.type !== 'shooter') e.vy = -5;   // pula paredes de até 4 blocos atrás do herói
  }
  e.ground = moveY(e, e.vy);
  if (e.ground) e.vy = 0;
  if (Math.abs(e.vx) > .2) e.anim += Math.abs(e.vx) * .25;
  if (e.y > MH * TS + 20) e.dead = true;
  // bug que cai na gosma derrete (sem moedas)
  const pool = poolAt(e);
  if (pool && !e.dead) { e.dead = true; splash(e.x + e.w / 2, pool.y * TS); burst(e.x + e.w / 2, e.y + e.h / 2, 12, [e.pal.hi, e.pal.shell], 1.4, .05, [10, 20]); }
}
const TOXIC_DMG = 15;
function splash(x, y) {
  for (let i = 0; i < 18; i++) addP(x + rand(-4, 4), y, rand(-1.4, 1.4), rand(-3, -1), irand(14, 26), POISON, .15, 2);
  sfx.splash();
}

// Arquivo Corrompido: cospe um bloco de dados na direção do herói
function shoot(e) {
  const ox = e.x + e.w / 2 + e.face * 12, oy = e.y + 6, a = Math.atan2(pl.y + 14 - oy, pl.x + pl.w / 2 - ox);
  shots.push({ x: ox, y: oy, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, life: 160, dmg: ETYPES.shooter.dmg });
  e.vx = -e.face * .8; sfx.spit();
  burst(ox, oy, 6, [e.pal.eye, e.pal.shell], 1.2, 0, [6, 12]);
}
function updateShots() {
  shots.forEach(b => {
    b.x += b.vx; b.y += b.vy; b.life--;
    if (T % 2 === 0) addP(b.x, b.y, 0, 0, 8, ['#fff176', '#ff4d6d', '#852a26']);
    if (tile(Math.floor(b.x / TS), Math.floor(b.y / TS)) === SOLID) { b.life = 0; burst(b.x, b.y, 6, ['#fff176', '#ff4d6d'], 1.2, .05, [6, 12]); }
    // rolando, o disparo atravessa o herói
    else if (mode === 'play' && !dodging() && pl.inv <= 0 && b.x > pl.x - 1 && b.x < pl.x + pl.w + 1 && b.y > pl.y && b.y < pl.y + pl.h) { b.life = 0; hurtPlayer(b.dmg, b.vx < 0 ? -1 : 1); }
  });
  shots = shots.filter(b => b.life > 0);
}

// Erro 404: some por um tempo e reaparece atrás do herói; devolve true enquanto está sumido
function updateGhost(e) {
  if (e.hidden > 0) {
    if (--e.hidden === 0) reappear(e);
    return true;
  }
  if (e.st === 'chase' && mode === 'play' && e.ground && --e.hideCd <= 0) {
    e.hidden = 70; e.vx = 0;
    addNum('404', e.x + e.w / 2, e.y - 6, e.pal.hi);
    burst(e.x + e.w / 2, e.y + e.h / 2, 18, [e.pal.hi, e.pal.eye, '#ffffff'], 1.8, 0, [10, 20]);
    sfx.glitch();
    return true;
  }
  return false;
}
function spotFree(x, y, e) {
  for (let ty = Math.floor(y / TS); ty <= Math.floor((y + e.h - .01) / TS); ty++)
    for (let tx = Math.floor(x / TS); tx <= Math.floor((x + e.w - .01) / TS); tx++) if (tile(tx, ty) === SOLID) return false;
  const gy = Math.floor((y + e.h + 1) / TS);
  return tile(Math.floor(x / TS), gy) !== AIR && tile(Math.floor((x + e.w) / TS), gy) !== AIR;
}
function reappear(e) {
  const bx = pl.x + pl.w / 2 - pl.face * 30 - e.w / 2, by = pl.y + pl.h - e.h;
  if (mode === 'play' && pl.ground && spotFree(bx, by, e)) { e.x = bx; e.y = by; e.vy = 0; }
  e.face = pl.x + pl.w / 2 > e.x + e.w / 2 ? 1 : -1;
  e.st = 'wind'; e.t = 0; e.windLen = ETYPES.ghost.wind; e.hideCd = irand(200, 280);
  burst(e.x + e.w / 2, e.y + e.h / 2, 18, [e.pal.hi, e.pal.eye, '#ffffff'], 1.8, 0, [10, 20]);
  sfx.glitch(); sfx.warn();
}

// Prazo Estourado: voa acima do herói e mergulha nele (com aviso)
function updateFlyer(e) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, px = pl.x + pl.w / 2, py = pl.y + 12;
  const dx = px - cx, dy = py - cy, sees = mode === 'play' && Math.abs(dx) < 170 && Math.abs(dy) < 110;
  e.anim += .5;
  const steer = (tx, ty, max) => {
    e.vx += (clamp((tx - cx) * .05, -max, max) - e.vx) * .1;
    e.vy += (clamp((ty - cy) * .05, -max, max) - e.vy) * .1;
  };
  if (e.st === 'hover') {
    if (sees) {
      if (!e.alerted) { e.alerted = true; e.alert = 30; sfx.alert(); }
      e.face = Math.sign(dx) || e.face;
      steer(px - e.face * 40, py - 44 + Math.sin(e.t / 18) * 6, 1.4);
      if (e.cd <= 0 && Math.abs(dx) < 80 && dy > 10) { e.st = 'wind'; e.t = 0; sfx.warn(); }
    } else {
      if (e.t % 120 === 0) e.face *= -1;
      steer(cx + e.face * 20, e.homeY + Math.sin(e.t / 25) * 8, .6);
    }
  } else if (e.st === 'wind') {
    e.vx *= .8; e.vy = e.vy * .8 - .05;
    if (e.t >= e.windLen) {
      const L = Math.hypot(dx, dy) || 1;
      e.vx = dx / L * 3.6; e.vy = dy / L * 3.6; e.face = Math.sign(dx) || e.face;
      e.st = 'dive'; e.t = 0; e.bit = false; sfx.bite();
    }
  } else if (e.st === 'dive') {
    if (!e.bit && mode === 'play' && overlap(e, pl)) { e.bit = true; if (!dodging() && pl.inv <= 0) hurtPlayer(ETYPES.flyer.dmg, Math.sign(e.vx) || 1); }
    if (e.t >= 34) { e.st = 'rest'; e.t = 0; }
  } else if (e.st === 'rest') {
    e.vx *= .9; e.vy = e.vy * .9 - .04;
    if (e.t >= 40) { e.st = 'hover'; e.t = 0; e.cd = 90; }
  } else if (e.st === 'hurt') {
    e.vx *= .88; e.vy *= .88;
    if (e.t >= 14) { e.st = 'hover'; e.t = 0; e.cd = Math.max(e.cd, 30); }
  }
  const hitX = moveX(e, e.vx), hitY = moveY(e, e.vy);
  if (hitY) e.vy = -.5;
  if ((hitX || hitY) && e.st === 'dive') { e.st = 'rest'; e.t = 0; dust(cx, e.y + e.h, 4); }
}

function hitEnemy(e, s, dir, heavy, crit) {
  // Link Quebrado: qualquer golpe de frente bate no escudo, até o carregado; só leva dano pelas costas
  // (uma arma futura com breaksShield vai poder furar a guarda)
  if (e.type === 'shield' && dir === -e.face && !(s.breaksShield || (pl.weapon && WEAPONS[pl.weapon].breaksShield))) {
    e.blockT = 10; e.vx += dir * .6;
    burst(e.x + e.w / 2 - dir * 12, e.y + 6, 8, ['#ffffff', '#c8f8ff', '#8a93a6'], 1.8, .05, [6, 12]);
    sfx.clink(); hitstop = Math.max(hitstop, 3); shake = Math.max(shake, 1);
    if (!s.ranged) pl.vx = -dir * 1.8;
    return false;
  }
  // envenenado (zarabatana): qualquer golpe causa o dobro de dano
  const pois = e.poison > 0;
  const dmg = Math.round(s.dmg * pl.dmgMul * rand(.9, 1.1) * (crit ? 2 : 1) * (pois ? 2 : 1));   // dmgMul: Pergaminhos de Poder
  e.hp -= dmg; e.flash = 7; e.barT = 160;
  if (s.poison) {
    if (!pois) { burst(e.x + e.w / 2, e.y + e.h / 2, 12, POISON, 1.4, -.02, [12, 22]); sfx.poison(); }
    e.poison = s.poison;
  }
  if (e.type !== 'shield') e.face = -dir;
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  if (crit) { addNum(dmg + '!', ex, e.y - 10, '#ff8c1a', true); burst(ex, ey, 12, ['#ffffff', '#ffd23f', '#ff8c1a'], 2.6, 0, [8, 16]); }
  else addNum(dmg, ex, e.y - 6, pois ? '#9dff6a' : s.dmg >= 18 ? '#ffd23f' : '#ffffff');
  burst(ex - dir * 4, ey, 8, ['#ffffff', '#ffd23f', e.pal.hi], 2, .05, [6, 14]);
  burst(ex, ey, 5, [e.pal.shell, e.pal.dark], 1.4, .15, [12, 22]);
  hitstop = Math.max(hitstop, s.stop); shake = Math.max(shake, s.shake); sfx.hit(s.dmg >= 18 ? 1.4 : 1);
  // golpes fortes interrompem o ataque; golpes leves só empurram um pouco quando ele já está atacando
  const busy = e.st === 'wind' || e.st === 'lunge' || e.st === 'dive';
  if (s.kb >= 3 || !busy) {
    e.st = 'hurt'; e.t = 0; e.vx = dir * s.kb * (ETYPES[e.type].fly ? .8 : 1); e.vy = ETYPES[e.type].fly ? -1 : -Math.min(3, s.kb * .5);
  } else e.vx += dir * s.kb * .3;
  if (e.hp <= 0) killEnemy(e);
  return true;
}
function killEnemy(e) {
  e.dead = true;
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  burst(ex, ey, 26, [e.pal.hi, e.pal.shell, e.pal.belly, e.pal.dark], 2.2, .12, [16, 30], 2);
  burst(ex, ey, 14, SMOKE, 1.2, -.01, [14, 26], 2);
  sfx.kill(); shake = Math.max(shake, 3); hitstop = Math.max(hitstop, 6);
  const [a, b] = ETYPES[e.type].coins;
  for (let i = irand(a, b); i > 0; i--) coins.push({ x: ex, y: ey, w: 3, h: 3, vx: rand(-1.6, 1.6), vy: rand(-3.2, -1.6), t: 0, ground: false });
}
