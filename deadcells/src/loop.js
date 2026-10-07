// ===== Laço do jogo: 60 passos de lógica por segundo (fixos) e um desenho por quadro da tela =====

// ---------- loop
function update() {
  T++;
  // pausa no impacto: congela tudo por alguns quadros para o golpe "pesar"
  if (hitstop > 0) { hitstop--; return; }
  if (mode === 'title' && T % 8 === 0) drawPicks();
  if (mode === 'exit') updateExit();
  if (mode === 'dead' && ++deadT === 80) showDead();
  if (mode === 'play') { updateEncounters(); updateSecrets(); }
  if (mode === 'play' || mode === 'dead' || mode === 'exit') { enemies.forEach(updateEnemy); enemies = enemies.filter(e => !e.dead); updateArrows(); updateShots(); updateFrags(); updateCoins(); }
  chests.forEach(c => { if (c.open && c.lid < 1) c.lid = Math.min(1, c.lid + .15); });
  updateScroll();
  // portões: abrem devagar (sobem) e fecham rápido (descem)
  L.gates.forEach(g => {
    const want = g.closed ? 0 : 1;
    if (g.lift === want) return;
    g.lift = want ? Math.min(1, g.lift + .02) : Math.max(0, g.lift - .1);
    if (T % 3 === 0) addP(g.tx * TS + rand(0, 8), g.y0 * TS, rand(-.2, .2), rand(.2, .6), 20, DUST, .05);
  });
  ghosts.forEach(g => g.life--); ghosts = ghosts.filter(g => g.life > 0);
  nums.forEach(n => { n.t++; n.y -= Math.max(0, 1.1 - n.t * .06); });
  nums = nums.filter(n => n.t < 45);
  shake *= .85; if (shake < .3) shake = 0;
  hurtFx *= .9; if (hurtFx < .02) hurtFx = 0;
  if (mode === 'play') {
    playT++;
    updatePlayer();
    const [tx, ty] = camTarget();
    cam.x += (tx - cam.x) * .12;
    cam.y += (ty - cam.y) * (!pl.ground && pl.vy > 3 ? .25 : .06);
    if (T % 30 === 0) renderTimer();
  }
  // poeira flutuante no ar (como esporos)
  if (T % 6 === 0) {
    const x = cam.x + rand(0, W), y = cam.y + rand(0, H);
    if (tile(Math.floor(x / TS), Math.floor(y / TS)) !== SOLID) addP(x, y, rand(-.12, .12), rand(-.18, -.05), irand(120, 220), L.spores);
  }
  L.torches.forEach(([tx, ty]) => { if (T % 7 === (tx % 7)) addP(tx * TS + 4 + rand(-1, 1), ty * TS, rand(-.1, .1), rand(-.6, -.3), irand(14, 26), L.flame); });
  // gotas de gosma caindo dos canos e bolhas subindo das poças
  L.pipes.forEach(([px, py], i) => { if (T % 23 === i * 5) addP(px * TS + 4 + rand(-6, 6), py * TS + 4 + 13, 0, .3, 60, ['#b5ff7a', '#5fd13a'], .08, 1); });
  L.pools.forEach(p => { if (T % 9 === 0) addP(rand(p.x0 * TS, (p.x1 + 1) * TS), p.y * TS + 1, rand(-.05, .05), rand(-.5, -.2), irand(10, 18), ['#e9ffe0', '#b5ff7a'], 0, irand(1, 2)); });
  if (T % 5 === 0) { const D = curDoor(); addP(D.x + rand(2, 14), D.y + D.h - 2, rand(-.1, .1), rand(-.5, -.2), irand(30, 50), ['#ffd23f', '#f5801e', '#7a2a2a']); }
  parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--; });
  parts = parts.filter(p => p.life > 0);
  if (parts.length > 900) parts.splice(0, parts.length - 900);
  fade *= .92; if (Math.abs(fade) < .02) fade = 0;
}

function updateExit() {
  exitT++;
  const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2;
  if (exitT < EXIT_GONE) {
    const D = curDoor();
    pl.x += (D.x + D.w / 2 - pl.w / 2 - pl.x) * .15;
    const a = rand(0, Math.PI * 2), d = rand(14, 22);
    addP(cx + Math.cos(a) * d, cy + Math.sin(a) * d, -Math.cos(a) * d / 12, -Math.sin(a) * d / 12, 12, ['#ffffff', '#ffd23f', CHARS[heroIdx].color]);
  }
  if (exitT === EXIT_GONE) {
    burst(cx, cy, 30, ['#ffffff', '#ffd23f', '#f5801e', CHARS[heroIdx].color], 2.2, 0, [14, 28]);
    for (let i = 0; i < 16; i++) addP(cx + rand(-2, 2), cy, rand(-.2, .2), rand(-4, -2), irand(18, 30), ['#ffffff', '#ffd23f']);
    fade = -.6; sfx.zap();
  }
  if (exitT >= EXIT_END) { const nx = L.next; if (nx) enterBiome(nx); else showWin(); return; }
  const [tx, ty] = camTarget();
  cam.x += (tx - cam.x) * .08; cam.y += (ty - cam.y) * .08;
}

function heroPose() {
  if (pl.hurt > 0) return 'hurt';
  if (pl.drink > 0) return 'drink';
  if (pl.roll > 0) return 'roll';
  if (pl.atk) { const s = pl.atk.s, f = pl.atk.f; return f < s.wind ? s.pw : f < s.wind + s.act ? s.pa : s.pr; }
  if (!pl.ground) return pl.vy < -.5 ? 'jump' : 'fall';
  if (pl.land > 0) return 'run2';
  if (Math.abs(pl.vx) > .3) return ['run1', 'run2', 'run3', 'run4'][Math.floor(pl.anim) % 4];
  return 'idle';
}

let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  if (mode === 'pause') acc = 0;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  draw();
  requestAnimationFrame(frame);
}
