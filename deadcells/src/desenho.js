// ===== Desenho: cena, herói, armas, inimigos, itens e efeitos (tudo em 320x180, ampliado na tela) =====

function draw() {
  let cx = Math.round(cam.x), cy = Math.round(cam.y);
  if (shake) { cx = clamp(cx + Math.round(rand(-shake, shake)), 0, MW * TS - W); cy = clamp(cy + Math.round(rand(-shake, shake) * .7), 0, MH * TS - H); }
  lc.globalCompositeOperation = 'source-over';
  lc.drawImage(L.cv, cx, cy, W, H, 0, 0, W, H);
  // salas secretas aparecem aos poucos quando achadas
  L.secrets.forEach(c => {
    if (c.reveal <= 0) return;
    const X = (c.x0 - 1) * TS, Y = (c.y0 - 1) * TS, w = (c.x1 - c.x0 + 3) * TS, h = (c.y1 - c.y0 + 3) * TS;
    lc.globalAlpha = c.reveal; lc.drawImage(L.cvS, X, Y, w, h, X - cx, Y - cy, w, h); lc.globalAlpha = 1;
  });

  // porta: brilho pulsando
  const pulse = .5 + .5 * Math.sin(T / 20), DOOR = curDoor();
  lc.fillStyle = `rgba(245,128,30,${.25 + .25 * pulse})`; lc.fillRect(DOOR.x - cx, DOOR.y - cy, DOOR.w, DOOR.h);
  lc.fillStyle = `rgba(255,210,63,${.2 + .2 * pulse})`; lc.fillRect(DOOR.x - cx + 3, DOOR.y - cy + 4, DOOR.w - 6, DOOR.h - 4);

  // chamas das tochas
  L.torches.forEach(([tx, ty]) => {
    const X = tx * TS - cx, Y = ty * TS - cy;
    if (X < -10 || X > W + 10 || Y < -10 || Y > H + 10) return;
    const h = 4 + ((T >> 2) + tx) % 3, F = L.flame;
    lc.fillStyle = F[3]; lc.fillRect(X + 2, Y + 3 - h + 2, 4, h);
    lc.fillStyle = F[2]; lc.fillRect(X + 3, Y + 3 - h, 2, h);
    lc.fillStyle = F[0]; lc.fillRect(X + 3, Y + 1, 2, 2);
  });
  // poças de gosma tóxica: superfície ondulando e brilho por cima
  L.pools.forEach(p => {
    const X0 = p.x0 * TS - cx, w = (p.x1 - p.x0 + 1) * TS, Y = p.y * TS - cy;
    if (X0 > W || X0 + w < 0) return;
    R(X0, Y + 2, w, H - Y, '#3c9a2a'); R(X0, Y + 6, w, H - Y, '#2f7a22');
    for (let x = 0; x < w; x++) {
      const wv = Math.round(Math.sin((x + T * .6) / 5) * 1.2 + Math.sin((x - T * .4) / 3) * .6);
      R(X0 + x, Y + 1 + wv, 1, 2, '#7dff4a'); R(X0 + x, Y + wv, 1, 1, '#d8ffb0');
    }
  });

  drawObstacles(cx, cy);
  drawPedestals(cx, cy);
  coins.forEach(c => drawCoin(c, cx, cy));
  drawGate(cx, cy);
  enemies.forEach(e => drawEnemy(e, cx, cy));
  drawPet(cx, cy);
  shots.forEach(b => drawShot(b, cx, cy));
  arrows.forEach(ar => drawArrow(ar, cx, cy));
  frags.forEach(f => { R(Math.round(f.x - cx), Math.round(f.y - cy), 2, 1, T % 2 ? '#ffd23f' : '#ffffff'); });
  blasts.forEach(b => drawBlast(b, cx, cy));

  // rastro do avanço da katana: silhuetas que somem
  ghosts.forEach(g => {
    lc.save(); lc.globalAlpha = g.life / 12 * .45;
    lc.translate(Math.round(g.x - cx), Math.round(g.y - cy) - 17); if (g.face < 0) lc.scale(-1, 1);
    lc.drawImage(spriteSil(heroIdx, g.pose, '#c8f8ff'), -17, -17); lc.restore();
  });
  // herói
  const hx = Math.round(pl.x + pl.w / 2 - cx), hy = Math.round(pl.y + pl.h - cy);
  if (mode === 'exit') drawExit(hx, hy);
  else if (mode !== 'won' && mode !== 'dead') {
    const pose = heroPose(), bob = pose === 'idle' ? (T >> 5) % 2 : 0;
    const blink = pl.inv > 0 && pl.hurt <= 0 && (T >> 2) % 2;
    const img = pl.hurt > 8 ? spriteSil(heroIdx, pose, T % 4 < 2 ? '#ff4d6d' : '#ffffff') : spriteImg(heroIdx, pose, bob);
    if (blink) lc.globalAlpha = .35;
    // posição da mão da frente (onde a arma fica presa)
    const PP = POSES[pose], wx = hx + pl.face * (PP.fh[0] + OX + 1 - 17 + .5), wy = hy - 17 + PP.fh[1] + PP.bob + bob + 1 - 17 + .5;
    const showW = pl.weapon && pl.roll <= 0 && pl.drink <= 0, behind = showW && !pl.atk && pl.carry > 95;
    if (behind) drawWeapon(pl.weapon, wx, wy, pl.carry, pl.face);
    lc.save();
    lc.translate(hx, hy - 17);
    if (pl.roll > 0) lc.rotate((1 - pl.roll / ROLL_T) * Math.PI * 2 * pl.face);
    if (pl.face < 0) lc.scale(-1, 1);
    lc.drawImage(img, -17, -17);
    const ca = pl.atk;
    if (ca && ca.heavy && ca.f < ca.s.wind && (T % 6 < 3 || ca.f > ca.s.wind - 8)) {
      const ready = ca.f > ca.s.wind - 8;
      lc.globalAlpha = ready ? .75 : .4;
      lc.drawImage(spriteSil(heroIdx, pose, ready ? '#ffffff' : '#ffd23f'), -17, -17);
      lc.globalAlpha = blink ? .35 : 1;
    }
    lc.restore();
    if (pl.drink > 0) {
      const P = POSES.drink, bx = hx + pl.face * (P.fh[0] + OX + 1 - 17), by = hy - 17 + P.fh[1] + 1 - 17;
      const tilt = pl.drink < DRINK_T - 8 ? -1 : 0;
      R(bx - 1, by - 3 + tilt, 3, 4, '#140a1f'); R(bx, by - 2 + tilt, 1, 2, '#ff4d6d'); R(bx, by - 4 + tilt, 1, 1, '#c8a26b');
      if (T % 3 === 0) addP(pl.x + pl.w / 2 + rand(-6, 6), pl.y + rand(4, 24), 0, rand(-.6, -.2), 14, ['#c8ffd8', '#4ade80']);
    } else if (showW && !behind) {
      const a = pl.atk, pull = a && a.s.ranged && a.f < a.s.wind ? 1 + 3 * a.f / a.s.wind : 0;
      drawWeapon(pl.weapon, wx, wy, weaponAngle(), pl.face, pull);
      if (!(a && a.s.ranged)) drawSlash(wx, wy);
    }
    lc.globalAlpha = 1;
  }

  parts.forEach(p => {
    const cols = p.col, c = cols[Math.min(cols.length - 1, Math.floor((1 - p.life / p.max) * cols.length))];
    lc.fillStyle = c; lc.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.size, p.size);
  });

  // sem escuridão nem neblina: só um brilho leve na porta e nas armas
  lc.globalCompositeOperation = 'lighter';
  lc.globalAlpha = .3 + .2 * pulse; lc.drawImage(GLOW_O, DOOR.x + 8 - cx - 36, DOOR.y + 16 - cy - 36, 72, 72);
  items.forEach(it => { lc.globalAlpha = .5 * shownAt(it.x, it.y); lc.drawImage(GLOW_O, it.x - cx - 18, it.y - it.lift + 2 - cy - 18, 36, 36); });
  // brilho verde das poças e dos canos; tochas com brilho próprio (torchGlow) no bioma que tiver
  lc.globalAlpha = .35 + .1 * pulse;
  L.pools.forEach(p => { const w = (p.x1 - p.x0 + 1) * TS; lc.drawImage(GLOW_G, p.x0 * TS - cx - 16, p.y * TS - cy - 30, w + 32, 50); });
  glowObstacles(cx, cy);
  L.pipes.forEach(([px, py]) => lc.drawImage(GLOW_G, px * TS + 4 - cx - 22, py * TS + 4 - cy - 16, 44, 44));
  if (L.torchGlow) {
    lc.globalAlpha = .3;
    L.torches.forEach(([tx, ty]) => lc.drawImage(L.torchGlow, tx * TS + 4 - cx - 16, ty * TS - cy - 16, 32, 32));
  }
  lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
  if (pl.weapon && WEAPONS[pl.weapon].combo[0].ranged && mouseScr && mode === 'play') {   // mira de qualquer arma de longe
    const mx = Math.round(mouseScr.x), my = Math.round(mouseScr.y), c = '#ffd23f';
    R(mx - 4, my, 3, 1, c); R(mx + 2, my, 3, 1, c); R(mx, my - 4, 1, 3, c); R(mx, my + 2, 1, 3, c);
  }
  L.secrets.forEach(c => { if (c.hint > 0) drawHint(c, cx, cy); });
  nums.forEach(n => drawNum(n, cx, cy));
  if (hurtFx) { lc.fillStyle = `rgba(255,40,70,${.28 * hurtFx})`; lc.fillRect(0, 0, W, H); }
  if (fade > 0) { lc.fillStyle = `rgba(0,0,0,${fade})`; lc.fillRect(0, 0, W, H); }
  else if (fade < 0) { lc.fillStyle = `rgba(255,246,216,${-fade})`; lc.fillRect(0, 0, W, H); }

  vc.imageSmoothingEnabled = false;
  vc.drawImage(low, 0, 0, view.width, view.height);
  updateTip();
  const cur = mode === 'play' ? 'none' : '';
  if (stageEl.style.cursor !== cur) stageEl.style.cursor = cur;
}

const R = (x, y, w, h, c) => { lc.fillStyle = c; lc.fillRect(x, y, w, h); };
// "?" em pixel art (5x7, desenhado em dobro) com contorno escuro, flutuando sobre a parede falsa
const HINT_Q = ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'];
function drawHint(c, cx, cy) {
  const [wx, a, b] = c.wall, X = Math.round((wx + .5) * TS - 5 - cx), Y = Math.round((a + b + 1) / 2 * TS - 7 - cy + Math.sin(T / 12) * 1.5);
  lc.globalAlpha = c.hint;
  [[-1, 0], [1, 0], [0, -1], [0, 1], [0, 0]].forEach(([ox, oy], i) => {
    const col = i < 4 ? '#140a1f' : T % 40 < 20 ? '#ffd23f' : '#ffe680';
    HINT_Q.forEach((row, y) => { for (let x = 0; x < 5; x++) if (row[x] === '#') R(X + x * 2 + ox, Y + y * 2 + oy, 2, 2, col); });
  });
  lc.globalAlpha = 1;
}
// arma desenhada pixel a pixel a partir da mão (x, y), girada pelo ângulo
function drawWeapon(id, x, y, ang, face, pull = 0) {
  const a = ang * Math.PI / 180, dx = Math.cos(a) * face, dy = Math.sin(a), nx = -dy, ny = dx;
  const p = (t, s, c) => R(Math.round(x + dx * t + nx * s), Math.round(y + dy * t + ny * s), 1, 1, c);
  if (id === 'espada') {
    for (let t = -3; t <= 0; t += .5) p(t, 0, '#6b4226');
    for (let s = -2; s <= 2; s += .5) p(1, s, '#d9a640');
    for (let t = 2; t <= 12; t += .5) { p(t, 0, '#a9b4be'); p(t, -.8, '#e8eef3'); }
    p(13, 0, '#ffffff'); p(12.5, -.6, '#ffffff');
    if (T % 40 < 4) p(6 + (T % 40) * 2, -.8, '#ffffff');
  } else if (id === 'martelo') {
    for (let t = -2; t <= 11; t += .5) { p(t, 0, '#6b4226'); p(t, .8, '#4a2c18'); }
    for (let t = 10; t <= 15; t += .5) for (let s = -3.5; s <= 3.5; s += .5) p(t, s, t > 14 ? '#c3ccd4' : t < 11 ? '#4a5158' : '#7d8790');
    for (let s = -3.5; s <= 3.5; s += .5) p(15.5, s, '#e3e9ee');
  } else if (id === 'arco') {
    // arco curvado para frente, perpendicular à mira; corda puxada (pull) com a flecha encaixada
    for (let s = -7; s <= 7; s += .5) { const t = 2.6 * (1 - (s / 7) * (s / 7)); p(t, s, '#8a5a2a'); p(t + .7, s, '#c08a4e'); }
    p(0, -7, '#d9a640'); p(0, 7, '#d9a640');
    for (let k = 0; k <= 1; k += .1) { p(-pull * k, -7 + 7 * k, '#e8e0d0'); p(-pull * k, 7 - 7 * k, '#e8e0d0'); }
    if (pull > 0) { for (let t = -pull; t <= 9; t += .5) p(t, 0, '#c8a26b'); p(9.5, 0, '#e3e9ee'); p(10, 0, '#ffffff'); p(-pull, -1, '#ff6b3d'); p(-pull, 1, '#ff6b3d'); }
  } else if (id === 'lanca') {
    // cabo comprido, borla vermelha e ponta de aço
    for (let t = -6; t <= 21; t += .5) { p(t, 0, '#7a4a26'); p(t, .7, '#4a2c18'); }
    p(20, 1.5, '#ff4d6d'); p(20.5, 2.2, '#ff4d6d'); p(19.5, 2, '#c8203f');
    for (let t = 21; t <= 27; t += .5) { const hw = (27 - t) * .45; for (let s = -hw; s <= hw; s += .5) p(t, s, s < 0 ? '#e8eef3' : '#a9b4be'); }
    p(27.5, 0, '#ffffff');
  } else if (id === 'besta') {
    // coronha, trilho de metal, arco curto na frente e o virote encaixado (some logo depois do disparo)
    for (let t = -4; t <= 10; t += .5) { p(t, 0, '#6b4226'); p(t, 1, '#4a2c18'); }
    for (let t = 1; t <= 10; t += .5) p(t, -.8, '#7d8790');
    for (let s = -6; s <= 6; s += .5) { const t = 9 - s * s / 16; p(t, s, '#3a4248'); p(t + .6, s, '#8a93a6'); }
    for (let k = 0; k <= 1; k += .1) { p(9 - 36 / 16 + (1 - 9 + 36 / 16) * k, -6 + 6 * k, '#e8e0d0'); p(9 - 36 / 16 + (1 - 9 + 36 / 16) * k, 6 - 6 * k, '#e8e0d0'); }
    const atk = pl.atk, fired = id === pl.weapon && atk && atk.f >= atk.s.wind;
    if (!fired) { for (let t = 1; t <= 11; t += .5) p(t, -1.5, '#5a3a24'); p(11.5, -1.5, '#c3ccd4'); p(12, -1.5, '#ffffff'); p(1, -2.2, '#f5801e'); }
  } else if (id === 'zarabatana') {
    // canudo de bambu com anéis e um bocal verde; o dardo aparece na ponta enquanto mira
    for (let t = -5; t <= 13; t += .5) { const ring = Math.round(t) % 4 === 0; p(t, 0, ring ? '#4f6b2a' : '#a8c86a'); p(t, .8, ring ? '#3a5020' : '#6f8c3e'); }
    p(-5.5, 0, '#2a6b1f'); p(-5.5, .8, '#2a6b1f'); p(13.5, 0, '#3a5020'); p(13.5, .8, '#3a5020');
    if (pull > 0) { p(14.5, .4, '#9dff6a'); p(15.5, .4, '#e3e9ee'); }
  } else if (id === 'katana') {
    // cabo trançado, guarda dourada e lâmina fina levemente curva
    for (let t = -5; t <= 0; t += .5) p(t, 0, Math.round(t * 2) % 2 ? '#c8203f' : '#2a2236');
    p(-5.5, 0, '#d9a640');
    for (let s = -1.5; s <= 1.5; s += .5) p(1, s, '#d9a640');
    for (let t = 2; t <= 17; t += .5) { const c = -(t - 2) * (t - 2) / 110; p(t, c, '#a9b4be'); p(t, c - .8, '#e8eef3'); }
    p(17.5, -2.3, '#ffffff');
    if (T % 50 < 5) p(4 + (T % 50) * 3, -1, '#ffffff');
  }
}
function drawArrow(ar, cx, cy) {
  const L = Math.hypot(ar.vx, ar.vy) || 1, ux = ar.vx / L, uy = ar.vy / L;
  const x = ar.x - cx, y = ar.y - cy;
  if (x < -12 || x > W + 12 || y < -12 || y > H + 12) return;
  if (ar.stuck && ar.stuck < 15 && T % 2) return;
  const P = (t, s, c) => R(Math.round(x + ux * t - uy * s), Math.round(y + uy * t + ux * s), 1, 1, c);
  if (ar.s.dart) {   // dardo: curto, ponta de metal e pena verde
    for (let t = -5; t <= 0; t += .5) P(t, 0, t > -1 ? '#ffffff' : t > -2 ? '#c3ccd4' : t < -3.5 ? '#9dff6a' : '#e8e0d0');
    P(-5, -.8, '#4fb83a'); P(-5, .8, '#4fb83a');
    return;
  }
  if (ar.s.dagger) {   // adaga: lâmina larga e cabo escuro
    for (let t = -6; t <= 0; t += .5) { const c = t > -.5 ? '#ffffff' : t > -3.5 ? '#e8eef3' : t > -4.5 ? '#d9a640' : '#2a2236'; P(t, 0, c); if (t > -3.5 && t < -.5) P(t, -.8, '#a9b4be'); }
    P(-4, -1.2, '#d9a640'); P(-4, 1.2, '#d9a640');
    return;
  }
  if (ar.heavy && !ar.stuck) for (let t = -10; t <= 1; t += .5) { R(Math.round(x + ux * t - uy), Math.round(y + uy * t + ux), 1, 1, '#ffd23f'); R(Math.round(x + ux * t + uy), Math.round(y + uy * t - ux), 1, 1, '#ffd23f'); }
  if (ar.s.bolt) { for (let t = -7; t <= 0; t += .5) { const c = t > -2 ? '#ffffff' : t > -3 ? '#c3ccd4' : t < -5.5 ? '#f5801e' : '#5a3a24'; R(Math.round(x + ux * t), Math.round(y + uy * t), 1, 1, c); R(Math.round(x + ux * t - uy * .8), Math.round(y + uy * t + ux * .8), 1, 1, c); } return; }
  for (let t = -9; t <= 0; t += .5) R(Math.round(x + ux * t), Math.round(y + uy * t), 1, 1, t > -1.5 ? '#ffffff' : t > -2.5 ? '#c3ccd4' : t < -7.5 ? '#ff6b3d' : '#c8a26b');
}
function weaponAngle() {
  const a = pl.atk;
  if (!a) return pl.carry;
  if (a.s.ranged) return a.aim;
  const s = a.s, f = a.f;
  if (f < s.wind) return s.arc[0] + (s.arc[0] < s.arc[1] ? -1 : 1) * 12 * (f / s.wind);
  if (f < s.wind + s.act) return s.arc[0] + (s.arc[1] - s.arc[0]) * ((f - s.wind + 1) / s.act);
  return s.arc[1];
}
// rastro do golpe (o "swoosh")
function drawSlash(px, py) {
  const a = pl.atk;
  if (!a) return;
  const s = a.s, f = a.f - s.wind;
  if (f < 0 || f > s.act + 5) return;
  if (s.dash && a.x0 !== undefined) {
    // risco de luz do ponto de partida até onde o herói está
    const fk = f >= s.act ? 1 - (f - s.act) / 6 : 1, sx = px - (pl.x + pl.w / 2 - a.x0), x0 = Math.round(Math.min(sx, px)), w = Math.round(Math.abs(px - sx)) + 1, y = Math.round(py);
    lc.globalAlpha = .5 * fk; R(x0, y - 2, w, 1, WEAPONS[pl.weapon].tint); R(x0, y + 1, w, 1, WEAPONS[pl.weapon].tint);
    lc.globalAlpha = fk; R(x0, y - 1, w, 2, '#ffffff');
    lc.globalAlpha = 1;
  }
  if (s.thrust) {
    const fk = f >= s.act ? 1 - (f - s.act) / 6 : 1, len = s.reach * Math.min(1, (f + 1) / s.act);
    lc.globalAlpha = fk;
    for (let r = 10; r <= len; r++) { const c = r > len - 6 ? '#ffffff' : WEAPONS[pl.weapon].tint; R(Math.round(px + r * pl.face), Math.round(py), 1, 1, c); if (r % 3 === 0) R(Math.round(px + r * pl.face), Math.round(py) - 1, 1, 1, '#8fa3b5'); }
    lc.globalAlpha = 1;
    return;
  }
  const cur = Math.min(1, (f + 1) / s.act), fk = f >= s.act ? 1 - (f - s.act) / 6 : 1;
  const a0 = s.arc[0], a1 = a0 + (s.arc[1] - a0) * cur, n = Math.ceil(Math.abs(a1 - a0) / 4);
  for (let i = 0; i <= n; i++) {
    const t = i / Math.max(1, n), ang = (a0 + (a1 - a0) * t) * Math.PI / 180, th = Math.round(1 + 3 * t * fk);
    lc.globalAlpha = fk * (.3 + .7 * t);
    const c = t > .75 ? '#ffffff' : t > .4 ? WEAPONS[pl.weapon].tint : '#8fa3b5';
    for (let r = s.reach - 4 - th; r <= s.reach - 4; r++) R(Math.round(px + Math.cos(ang) * r * pl.face), Math.round(py + Math.sin(ang) * r), 1, 1, c);
  }
  lc.globalAlpha = 1;
}
function drawPedestals(cx, cy) {
  L.pedestals.forEach(([tx, row]) => {
    const X = tx * TS + 4 - cx, Y = row * TS - cy;
    R(X - 6, Y - 6, 12, 6, '#1a404c'); R(X - 8, Y - 8, 16, 2, '#2c6470'); R(X - 8, Y - 8, 16, 1, '#4aa383'); R(X - 5, Y - 4, 10, 1, '#102a32'); R(X + 5, Y - 6, 1, 6, '#0d232a');
  });
  // balcões da lojinha: madeira com borda dourada
  L.shopItems.forEach(([tx]) => {
    const X = tx * TS + 4 - cx, Y = L.start.y - cy;
    R(X - 7, Y - 7, 14, 7, '#140a1f'); R(X - 6, Y - 6, 12, 6, '#7a4a26'); R(X - 6, Y - 4, 12, 1, '#4a2c18');
    R(X - 8, Y - 9, 16, 3, '#140a1f'); R(X - 7, Y - 8, 14, 1, '#d9a640'); R(X - 7, Y - 7, 14, 1, '#8c5a30');
  });
  chests.forEach(c => { const a = shownAt(c.x, c.y); if (a > 0) { lc.globalAlpha = a; drawChest(c, cx, cy); lc.globalAlpha = 1; } });
  items.forEach(it => {
    const a = shownAt(it.x, it.y);
    if (a <= 0) return;
    const X = it.x - cx, Y = it.y - cy - it.lift + Math.round(Math.sin(T / 18 + it.x) * 1.5);
    if (T % 9 === 0) addP(it.x + rand(-6, 6), it.y - it.lift + 4, 0, rand(-.5, -.2), 20, it.kind === 'potion' ? ['#ffd0da', '#ff4d6d'] : ['#fff6d8', '#ffd23f']);
    lc.globalAlpha = a;
    if (it.kind === 'potion') drawPotion(X, Y + 2);
    else drawWeapon(it.wid, X - 4, Y + 6, -55, 1);
    if (it.price) drawPrice(Math.round(X), Math.round(it.y - cy - it.lift - 16), it.price, canAfford(it.price));
    lc.globalAlpha = 1;
  });
  if (scrollFx) drawScroll(Math.round(scrollFx.x - cx), Math.round(scrollFx.y - cy), scrollFx.t);
}
// pergaminho enrolado: papel creme com laço roxo e as pontas de madeira (gira um pouco enquanto sobe)
function drawScroll(x, y, t) {
  const tilt = Math.round(Math.sin(t / 3) * 1);
  R(x - 7, y - 4 + tilt, 14, 8 - tilt * 2, '#140a1f');
  R(x - 6, y - 3 + tilt, 12, 6 - tilt * 2, '#f3e2b3'); R(x - 6, y - 3 + tilt, 12, 1, '#fff6d8'); R(x - 6, y + 2 - tilt, 12, 1, '#c9a96b');
  R(x - 8, y - 5, 2, 10, '#140a1f'); R(x + 6, y - 5, 2, 10, '#140a1f');
  R(x - 8, y - 4, 1, 8, '#8c5a30'); R(x + 7, y - 4, 1, 8, '#8c5a30');
  R(x - 1, y - 3 + tilt, 2, 6 - tilt * 2, '#a77bff'); R(x - 2, y + 2, 1, 2, '#a77bff'); R(x + 1, y + 2, 1, 2, '#7c4fd6');
}
// etiqueta de preço: moeda + número (amarelo se dá para comprar, vermelho se faltam moedas)
function drawPrice(x, y, price, ok) {
  const s = String(price), w = 6 + s.length * 4 - 1, x0 = x - Math.floor(w / 2);
  R(x0 - 2, y - 2, w + 4, 9, '#140a1f');
  R(x0, y, 4, 5, '#5a3f0a'); R(x0 + 1, y + 1, 2, 3, '#ffd23f'); R(x0 + 1, y + 1, 1, 1, '#fff6c2');
  for (let i = 0; i < s.length; i++) {
    const b = DIG[+s[i]];
    for (let k = 0; k < 15; k++) if (b[k] === '1') R(x0 + 6 + i * 4 + k % 3, y + Math.floor(k / 3), 1, 1, ok ? '#ffd23f' : '#ff4d6d');
  }
}
function drawPotion(x, y) {
  R(x - 3, y - 3, 7, 8, '#140a1f'); R(x - 2, y - 2, 5, 6, '#ff4d6d'); R(x - 2, y - 2, 5, 1, '#ff8fa3'); R(x - 1, y - 1, 1, 2, '#ffd0da');
  R(x - 2, y - 6, 5, 3, '#140a1f'); R(x - 1, y - 5, 3, 2, '#c8a26b');
}
// baú de madeira com cantoneiras douradas; a tampa abre para trás
// Baú de Poder: mesmo formato, em roxo com runas que brilham
const CHEST_WOOD = { body: '#7a4a26', bodyHi: '#a86a3a', band: '#4a2c18', trim: '#d9a640', lid: '#8c5a30', lidHi: '#b07a45', lock: '#ffd23f', inside: '#5a3a20', glow: '#ffd23f' };
const CHEST_POWER = { body: '#4a2a7a', bodyHi: '#6f45b0', band: '#2a1650', trim: '#c8b6ff', lid: '#5a33a0', lidHi: '#8a63d6', lock: '#e9dcff', inside: '#2a1650', glow: '#a77bff' };
function drawChest(c, cx, cy) {
  const X = Math.round(c.x - cx), Y = Math.round(c.y - cy), P = c.power ? CHEST_POWER : CHEST_WOOD;
  R(X - 8, Y - 9, 16, 9, '#140a1f'); R(X - 7, Y - 8, 14, 8, P.body); R(X - 7, Y - 8, 14, 1, P.bodyHi);
  R(X - 7, Y - 5, 14, 1, P.band); R(X - 7, Y - 8, 2, 8, P.trim); R(X + 5, Y - 8, 2, 8, P.trim);
  if (!c.open) {
    R(X - 8, Y - 13, 16, 5, '#140a1f'); R(X - 7, Y - 12, 14, 4, P.lid); R(X - 7, Y - 12, 14, 1, P.lidHi);
    R(X - 7, Y - 12, 2, 4, P.trim); R(X + 5, Y - 12, 2, 4, P.trim); R(X - 1, Y - 10, 2, 3, P.lock);
    if (c.power) {
      // runas pulsando na frente e faíscas subindo
      const on = (T >> 4) % 2 ? '#e9dcff' : '#a77bff';
      R(X - 4, Y - 3, 1, 2, on); R(X - 3, Y - 4, 1, 1, on); R(X + 3, Y - 3, 1, 2, on); R(X + 2, Y - 2, 1, 1, on);
      if (T % 10 === 0) addP(c.x + rand(-7, 7), c.y - 12, 0, rand(-.5, -.2), 22, ['#ffffff', '#e9dcff', '#a77bff']);
    }
    if (T % 50 < 4) R(X - 6 + (T % 50) * 3, Y - 12, 1, 1, '#ffffff');
  } else {
    const h = Math.round(4 + 3 * c.lid);
    R(X - 8, Y - 9 - h, 16, h, '#140a1f'); R(X - 7, Y - 8 - h, 14, h - 1, P.inside); R(X - 7, Y - 8 - h, 14, 1, P.lid);
    R(X - 6, Y - 8, 12, 2, P.glow);
  }
}
function drawCoin(c, cx, cy) {
  const x = Math.round(c.x - cx), y = Math.round(c.y - cy), f = (T + c.t * 3 >> 3) % 4;
  if (x < -4 || x > W + 4 || y < -4 || y > H + 4) return;
  if (c.t > COIN_LIFE - COIN_BLINK && T % (c.t > COIN_LIFE - 50 ? 4 : 8) < 3) return;
  const w = f === 0 ? 3 : f === 2 ? 1 : 2;
  R(x - (w >> 1) - 1, y - 2, w + 2, 5, '#5a3f0a'); R(x - (w >> 1), y - 1, w, 3, '#ffd23f'); if (w > 1) R(x - (w >> 1), y - 1, 1, 1, '#fff6c2');
}
// explosão: clarão branco, bola de fogo e anel se abrindo
function drawBlast(b, cx, cy) {
  const k = b.t / b.max, x = b.x - cx, y = b.y - cy, r = b.r * (.4 + k * .8);
  const disc = (rr, c) => { for (let dy = -Math.floor(rr); dy <= rr; dy++) { const w = Math.floor(Math.sqrt(Math.max(0, rr * rr - dy * dy))); R(Math.round(x) - w, Math.round(y) + dy, w * 2 + 1, 1, c); } };
  if (k < .15) disc(r * .8, '#ffffff');
  else if (k < .6) { lc.globalAlpha = .9; disc(r, '#e8431f'); disc(r * .72, '#ff8c1a'); disc(r * .45, '#ffd23f'); disc(r * .2, '#fff6c2'); lc.globalAlpha = 1; }
  else { lc.globalAlpha = 1 - k; const n = 28; for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2; R(Math.round(x + Math.cos(an) * r), Math.round(y + Math.sin(an) * r), 1, 1, '#ff8c1a'); } lc.globalAlpha = 1; }
}
function drawGate(cx, cy) {
  L.gates.forEach(g => {
    const X = g.tx * TS - cx, top = g.y0 * TS - cy, h = (g.y1 - g.y0 + 1) * TS, len = Math.round(h * (1 - g.lift));
    if (len <= 0 || X < -10 || X > W + 10) return;
    [1, 4, 7].forEach(bx => { R(X + bx - 1, top, 1, len, '#1b2226'); R(X + bx, top, 1, len, '#6b767c'); R(X + bx, top + len - 1, 1, 2, '#a9b4be'); });
    for (let y = top + 6; y < top + len - 3; y += 14) R(X, y, 8, 2, '#3a4248');
  });
}
function drawEnemy(e, cx, cy) {
  const X = Math.round(e.x + e.w / 2 - cx), B = Math.round(e.y + e.h - cy);
  if (X < -30 || X > W + 30 || B < -40 || B > H + 40) return;
  // Erro 404 sumido: só um chiado de pixels logo depois de sumir e logo antes de voltar
  if (e.hidden > 0) {
    if (e.hidden > 62 || e.hidden < 10) for (let i = 0; i < 6; i++) R(X + irand(-9, 9), B - irand(1, 14), irand(1, 3), 1, [e.pal.hi, e.pal.eye, '#ffffff'][i % 3]);
    return;
  }
  if (e.spawnT > 0) lc.globalAlpha = T % 4 < 2 ? .25 : .25 + .75 * (1 - e.spawnT / SPAWN_T);
  else if (e.type === 'ghost' && e.st === 'chase' && e.hideCd < 40 && T % 6 < 3) lc.globalAlpha = .45;   // vai sumir
  if (ETYPES[e.type].fly) drawFlyer(e, X, B); else drawBug(e, X, B);
  lc.globalAlpha = 1;
  if (e.spawnT > 0) return;
  // "!" de aviso: amarelo quando vai atacar, laranja quando acabou de te ver
  if (e.st === 'wind' || e.alert > 0) {
    const ey = B - (ETYPES[e.type].fly ? 28 : 32) - ((T >> 3) % 2), col = e.st === 'wind' ? (e.t > e.windLen - 10 && T % 4 < 2 ? '#ffffff' : '#ffd23f') : '#f5801e';
    R(X - 2, ey - 1, 5, 11, '#140a1f'); R(X - 1, ey, 3, 6, col); R(X - 1, ey + 7, 3, 2, col);
  }
  if (e.barT > 0) { const by = B - (ETYPES[e.type].fly ? 16 : 20); R(X - 9, by, 18, 3, '#140a1f'); R(X - 8, by + 1, Math.max(0, Math.round(16 * e.hp / e.max)), 1, e.poison > 0 ? '#9dff6a' : '#ff4d6d'); }
}
// bug: casco oval, cabeça na frente (e.face), patinhas animadas
function drawBug(e, X, B) {
  const f = e.face, white = e.flash > 0, pal = white ? WHITE_PAL : e.pal;
  const px = (x, y, c) => R(X + f * x, B + y, 1, 1, c);
  const lean = e.st === 'wind' ? (e.t > e.windLen - 10 ? -2 : -1) : e.st === 'lunge' ? 1 : 0;
  const hx = 8 + lean, hy = -6;
  const eyeC = e.st === 'wind' && T % 6 < 3 ? '#ffffff' : pal.eye;
  const walk = Math.floor(e.anim) % 2;
  for (let i = 0; i < 3; i++) {
    const lx = -7 + i * 6 + lean, ph = (walk + i) % 2;
    px(lx, -4, pal.dark); px(lx - 1 + ph, -3, pal.dark); px(lx - 1 + ph * 2, -2, pal.dark); px(lx - 2 + ph * 2, -1, pal.dark);
  }
  const sx = -2 + lean, sy = -9;
  for (let y = -7; y <= 4; y++) for (let x = -10; x <= 10; x++) {
    const d = x * x / 81 + y * y / 36;
    if (d <= 1) {
      let c = pal.shell;
      if (y >= 2) c = pal.belly; else if (y < -3 && x < 2 && x > -6) c = pal.hi;
      if (x === 0 && y < 2) c = pal.dark;
      if ((x === -5 && y === -1) || (x === 4 && y === -3) || (x === 3 && y === 0)) c = pal.dark;
      px(sx + x, sy + y, c);
    } else if (d <= 1.4) px(sx + x, sy + y, '#140a1f');
  }
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
    const d = x * x + y * y;
    if (d <= 10) px(hx + x, hy + y, pal.dark); else if (d <= 18) px(hx + x, hy + y, '#140a1f');
  }
  px(hx, hy - 2, eyeC); px(hx + 2, hy - 2, eyeC);
  const wig = Math.round(Math.sin(T / 9 + e.x));
  px(hx - 1, hy - 5, pal.dark); px(hx - 2 + wig, hy - 6, pal.dark); px(hx - 3 + wig, hy - 7, pal.eye);
  px(hx + 2, hy - 5, pal.dark); px(hx + 3 + wig, hy - 6, pal.dark); px(hx + 4 + wig, hy - 7, pal.eye);
  if (e.type === 'shooter') {
    // boca-canhão que brilha antes do disparo
    const glow = e.st === 'wind' ? (T % 4 < 2 ? '#ffffff' : pal.eye) : pal.belly;
    px(hx + 4, hy, '#140a1f'); px(hx + 5, hy, pal.dark); px(hx + 6, hy, glow); px(hx + 5, hy - 1, '#140a1f'); px(hx + 5, hy + 1, '#140a1f');
  } else {
    const m = e.st === 'lunge' ? 1 : (T >> 3) % 2;
    px(hx + 4, hy + 1 + m, '#e8e0f0'); px(hx + 5, hy + 2 + m, '#e8e0f0'); px(hx + 4, hy + 3, '#e8e0f0');
  }
  if (e.type === 'shield') {
    // escudo de correntes na frente; pisca branco quando bloqueia
    for (let y = -17; y <= -2; y++) {
      const c = e.blockT > 0 || white ? '#ffffff' : ((y + (T >> 3)) & 3) < 2 ? '#c8f8ff' : '#8a93a6';
      px(13 + lean, y, c); px(14 + lean, y, y % 3 === 0 ? '#5d6670' : c); px(15 + lean, y, '#140a1f');
    }
    px(13 + lean, -18, '#140a1f'); px(14 + lean, -18, '#140a1f'); px(13 + lean, -1, '#140a1f'); px(14 + lean, -1, '#140a1f');
  }
}
// bug voador: corpo pequeno, ferrão atrás e asas batendo
function drawFlyer(e, X, B) {
  const f = e.face, pal = e.flash > 0 ? WHITE_PAL : e.pal, cy = B - 5;
  const px = (x, y, c) => R(X + f * x, cy + y, 1, 1, c);
  const up = Math.floor(e.anim) % 2 === 0;
  lc.save(); lc.globalAlpha *= .75;
  (up ? [[-3, -5], [-2, -6], [-1, -7], [0, -7], [-2, -5], [-1, -6], [0, -6], [1, -6], [-1, -5], [0, -5]]
      : [[-4, -3], [-3, -3], [-2, -3], [-1, -4], [0, -4], [-3, -2], [-4, -2], [-5, -2]]).forEach(([x, y]) => px(x, y, '#d0ebff'));
  lc.restore();
  for (let y = -4; y <= 4; y++) for (let x = -7; x <= 5; x++) {
    const d = (x + 1) * (x + 1) / 36 + y * y / 16;
    if (d <= 1) px(x, y, y >= 2 ? pal.belly : y < -1 && x < 1 ? pal.hi : pal.shell);
    else if (d <= 1.4) px(x, y, '#140a1f');
  }
  px(-8, 1, '#ffd23f'); px(-9, 1, '#ffd23f'); px(-8, 2, '#140a1f');
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
    const d = x * x + y * y;
    if (d <= 5) px(6 + x, y, pal.dark); else if (d <= 10) px(6 + x, y, '#140a1f');
  }
  const eyeC = e.st === 'wind' && T % 6 < 3 ? '#ffffff' : pal.eye;
  px(6, -1, eyeC); px(8, -1, eyeC);
  px(9, 1, '#e8e0f0'); px(10, 2, '#e8e0f0');
}
function drawShot(b, cx, cy) {
  const x = Math.round(b.x - cx), y = Math.round(b.y - cy);
  if (x < -6 || x > W + 6 || y < -6 || y > H + 6) return;
  R(x - 2, y - 2, 5, 5, '#140a1f'); R(x - 1, y - 1, 3, 3, T % 4 < 2 ? '#ff4d6d' : '#fff176'); R(x, y, 1, 1, '#ffffff');
}
// números de dano em fonte de pixel 3x5
const DIG = ['111101101101111', '110010010010111', '111001111100111', '111001011001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
DIG['!'] = '010010010000010';
function drawNum(n, cx, cy) {
  const s = n.s, z = n.big ? 2 : 1, x0 = Math.round(n.x - cx - (s.length * 4 - 1) * z / 2), y0 = Math.round(n.y - cy);
  lc.globalAlpha = n.t > 35 ? (45 - n.t) / 10 : 1;
  for (const pass of [0, 1]) for (let i = 0; i < s.length; i++) {
    const b = DIG[s[i] === '!' ? '!' : +s[i]];
    for (let k = 0; k < 15; k++) if (b[k] === '1') {
      const x = x0 + (i * 4 + k % 3) * z, y = y0 + Math.floor(k / 3) * z;
      if (pass === 0) R(x - 1, y - 1, z + 2, z + 2, '#140a1f'); else R(x, y, z, z, n.col);
    }
  }
  lc.globalAlpha = 1;
}

function drawExit(hx, hy) {
  // raio de luz subindo do herói até o teto
  const beam = exitT < EXIT_GLOW ? exitT / EXIT_GLOW : exitT < EXIT_GONE ? 1 : Math.max(0, 1 - (exitT - EXIT_GONE) / 25);
  if (beam > 0) {
    const w = Math.max(1, Math.round(10 * beam * (exitT < EXIT_GONE ? 1 : beam)));
    lc.fillStyle = `rgba(255,210,63,${.25 * beam})`; lc.fillRect(hx - w, 0, w * 2, hy);
    lc.fillStyle = `rgba(255,246,216,${.55 * beam})`; lc.fillRect(hx - Math.ceil(w / 3), 0, Math.ceil(w / 3) * 2, hy);
  }
  if (exitT >= EXIT_GONE) return;
  const img = exitT < EXIT_GLOW
    ? (exitT % 6 < 3 ? spriteSil(heroIdx, 'idle') : spriteImg(heroIdx, 'idle'))
    : spriteSil(heroIdx, 'idle');
  const k = exitT < EXIT_GLOW ? 0 : (exitT - EXIT_GLOW) / (EXIT_GONE - EXIT_GLOW);
  lc.save();
  lc.translate(hx, hy);
  lc.scale((1 - k) * (pl.face < 0 ? -1 : 1), 1 + k * 1.8);
  lc.drawImage(img, -17, -34);
  lc.restore();
}
