// ===== Itens: moedas, armas no chão, loja, baús, Pergaminho de Poder e salas secretas =====

const COIN_LIFE = 600, COIN_BLINK = 150;   // 10 s no chão; pisca nos últimos 2,5 s
function updateCoins() {
  const px = pl.x + pl.w / 2, py = pl.y + pl.h / 2;
  coins.forEach(c => {
    // moeda que ninguém pega pisca e some depois de uns segundos
    if (++c.t > COIN_LIFE) { c.got = true; addP(c.x, c.y, 0, -.4, 10, SMOKE); return; }
    const dx = px - c.x, dy = py - c.y, d = Math.hypot(dx, dy);
    if (mode === 'play' && c.t > 20 && d < 40) {
      // ímã: voa até o herói
      c.x += dx / d * Math.min(d, 2 + c.t * .05); c.y += dy / d * Math.min(d, 2 + c.t * .05);
      if (d < 7) { c.got = true; coinCount++; sfx.coin(coinCount); renderCoins(); addP(c.x, c.y, 0, -.6, 10, ['#fff6c2', '#ffd23f']); }
      return;
    }
    c.vy = Math.min(MAXFALL, c.vy + .25);
    moveX(c, c.vx);
    const vy = c.vy;
    if (moveY(c, c.vy)) { c.vy = vy > 1 ? -vy * .45 : 0; c.vx *= .8; }
    if (c.y > MH * TS + 10) c.got = true;
  });
  coins = coins.filter(c => !c.got);
}

const canAfford = price => testMode || coinCount >= price;
// item ou baú fechado mais perto do herói (no mesmo chão)
function nearItem() {
  const cage = nearPetCage(); if (cage) return cage;
  let best = null, bd = 14;
  const px = pl.x + pl.w / 2, feet = pl.y + pl.h;
  items.forEach(it => { const d = Math.abs(px - it.x); if (d < bd && Math.abs(feet - it.y) < 14) { bd = d; best = it; } });
  if (!best) { bd = 20; chests.forEach(c => { const d = Math.abs(px - c.x); if (!c.open && d < bd && Math.abs(feet - c.y) < 14) { bd = d; best = c; } }); }
  return best;
}
// quanto do baú/item aparece (0 dentro de uma sala secreta ainda não achada)
const shownAt = (x, y) => { const c = secretIn(L, Math.floor(x / TS), Math.floor((y - 4) / TS)); return c ? c.reveal : 1; };
function openChest(c) {
  c.open = true; sfx.chest(); shake = Math.max(shake, 2);
  if (c.power) {
    // o pergaminho salta do baú; no alto do salto ele se abre e aplica o poder
    burst(c.x, c.y - 8, 24, ['#ffffff', '#e9dcff', '#a77bff', '#ffd23f'], 2, -.02, [14, 26]);
    scrollFx = { x: c.x, y: c.y - 10, vy: -3.6, t: 0 };
    return;
  }
  burst(c.x, c.y - 8, 24, ['#ffffff', '#ffd23f', '#f5801e'], 2, -.02, [14, 26]);
  // baú de poções: solta as poções no chão, sem escolha (dá para pegar todas)
  if (c.potions) {
    for (let i = 0; i < c.potions; i++) items.push({ kind: 'potion', x: c.x + (i - (c.potions - 1) / 2) * 14, y: c.y, lift: 26 });
    banner('Baú aberto!', c.potions > 1 ? `${c.potions} poções de cura` : '1 poção de cura');
    return;
  }
  const g = 'chest' + c.tx;
  items.push({ kind: 'weapon', wid: c.wid, x: c.x - 12, y: c.y, group: g, lift: 26 });
  items.push({ kind: 'potion', x: c.x + 12, y: c.y, group: g, lift: 26 });
  banner('Baú aberto!', 'escolha: a arma nova ou uma poção de cura');
}
// Pergaminho de Poder: melhora o herói (não a arma), então vale para qualquer arma até o fim da partida
const SCROLL_HP = 1.2, SCROLL_DMG = 1.5;
let scrollFx = null;   // pergaminho saltando do Baú de Poder
function updateScroll() {
  const s = scrollFx;
  if (!s) return;
  s.t++; s.y += s.vy; s.vy += .12;
  if (T % 2 === 0) addP(s.x + rand(-3, 3), s.y + rand(-2, 2), 0, rand(-.3, 0), 14, ['#ffffff', '#e9dcff', '#a77bff']);
  if (s.vy >= 0) { scrollFx = null; applyScroll(s.x, s.y); }
}
function applyScroll(x, y) {
  const oldMax = pl.max, oldMul = pl.dmgMul;
  pl.max = Math.round(pl.max * SCROLL_HP); pl.hp += pl.max - oldMax; pl.dmgMul = +(pl.dmgMul * SCROLL_DMG).toFixed(2); pl.scrolls++;
  burst(x, y, 34, ['#ffffff', '#e9dcff', '#a77bff', '#ffd23f'], 2.6, 0, [16, 30], 2);
  burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 20, ['#ffffff', '#e9dcff', '#a77bff'], 1.6, -.03, [14, 26]);
  shake = Math.max(shake, 4); sfx.power(); renderHp();
  const bar = $('hpBar'); bar.classList.remove('grow'); void bar.offsetWidth; bar.classList.add('grow');   // a barra de vida cresce e brilha
  // cartão do pergaminho saltando na tela com os bônus aplicados
  $('scrollHp').textContent = `${oldMax} → ${pl.max}`;
  $('scrollDmg').textContent = `×${fmtMul(oldMul)} → ×${fmtMul(pl.dmgMul)}`;
  const el = $('scrollPop'); el.hidden = false; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
const fmtMul = m => String(+m.toFixed(2)).replace('.', ',');
function pickItem() {
  const it = nearItem();
  if (!it || mode !== 'play') return;
  if (it === L.petCage) { freePet(); return; }
  if (it.tx !== undefined) { openChest(it); return; }
  if (it.price) {
    if (!canAfford(it.price)) {
      sfx.nope(); const el = $('coins'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      banner('Moedas insuficientes', `faltam ${it.price - coinCount} moedas para este item`);
      return;
    }
    if (!testMode) coinCount -= it.price; renderCoins(); sfx.buy();
    burst(it.x, it.y - it.lift - 10, 16, ['#fff6c2', '#ffd23f', '#5a3f0a'], 1.6, .05, [10, 20]);
  }
  items = items.filter(o => o !== it);
  // escolha: as outras opções do mesmo grupo se desfazem
  if (it.group) {
    items.filter(o => o.group === it.group).forEach(o => burst(o.x, o.y - o.lift + 2, 18, SMOKE, 1.2, -.01, [14, 24], 2));
    items = items.filter(o => o.group !== it.group);
    if (it.group === 'start') { setGate(L.gates[0], false); sfx.gate(); shake = Math.max(shake, 2); }
  }
  burst(it.x, it.y - it.lift + 2, 20, ['#ffffff', '#ffd23f', it.kind === 'potion' ? '#ff4d6d' : WEAPONS[it.wid].tint], 1.8);
  sfx.pickup();
  if (it.kind === 'potion') {
    pl.potions++; renderHp(); flashPot();
    banner(it.price ? 'Poção comprada!' : 'Poção de cura', `agora você tem ${pl.potions} (Q para beber)`);
    return;
  }
  if (it.price) {
    const old = pl.weapon;
    pl.weapon = it.wid; pl.atk = null; pl.combo = 0; pl.carry = WEAPONS[it.wid].idle;
    if (old) items.push({ kind: 'weapon', x: pl.x + pl.w / 2 - pl.face * 14, y: it.y, wid: old, lift: 12 });
    renderHp();
    banner(WEAPONS[it.wid].name + ' comprada!', old ? 'a arma antiga ficou no chão' : 'arma equipada');
    return;
  }
  const old = pl.weapon;
  pl.weapon = it.wid; pl.atk = null; pl.combo = 0; pl.carry = WEAPONS[it.wid].idle;
  if (old && it.group !== 'start') items.push({ kind: 'weapon', x: pl.x + pl.w / 2 - pl.face * 14, y: it.y, wid: old, lift: 12 });
  renderHp();
  banner(WEAPONS[it.wid].name, it.group === 'start' ? 'o portão se abriu' : old ? 'a arma antiga ficou no chão' : 'arma equipada');
}
function updateSecrets() {
  const tx = Math.floor((pl.x + pl.w / 2) / TS), ty = Math.floor((pl.y + pl.h / 2) / TS);
  L.secrets.forEach(c => {
    if (!c.found && mode === 'play' && tx >= c.x0 && tx <= c.x1 && ty >= c.y0 && ty <= c.y1) {
      c.found = true; sfx.secret(); banner('Sala secreta!', 'você achou um baú escondido');
    }
    if (c.found) c.reveal = Math.min(1, c.reveal + .05);
    // dica: um "?" surge na parede falsa quando o herói passa perto (e some quando ele se afasta)
    const [wx, a, b] = c.wall, near = !c.found && Math.abs(pl.x + pl.w / 2 - (wx + .5) * TS) < 72 && Math.abs(pl.y + pl.h / 2 - (a + b + 1) / 2 * TS) < 56;
    c.hint = near ? Math.min(1, c.hint + .08) : Math.max(0, c.hint - .05);
  });
}
