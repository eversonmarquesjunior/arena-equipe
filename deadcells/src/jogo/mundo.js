// ===== Mundo: carregar biomas, encontros, emboscadas, reinício da partida e câmera =====

// troca o bioma atual: mapa, portões, itens dos pedestais e da loja, baús
function loadBiome(b) {
  biome = b; L = BIOMES[b];
  renderBiome(L);
  map = makeMap(L); MW = L.w; MH = L.h;
  resetObstacles();
  L.gates.forEach(g => setGate(g, g.closed));
  items = L.pedestals.map(([tx, row, wid]) => ({ kind: 'weapon', x: tx * TS + 4, y: row * TS, wid, group: 'start', lift: 18 }));
  L.shopItems.forEach(([tx, kind, wid, price]) => items.push({ kind, wid, price, x: tx * TS + 4, y: L.start.y, lift: 20 }));
  chests = L.chests.map(c => ({ ...c, x: c.tx * TS + 4, y: c.row * TS, open: false, lid: 0 }));
}

// encontros e emboscadas do bioma atual
function updateEncounters() {
  const px = pl.x + pl.w / 2;
  L.encounters.forEach(en => { if (!en.done && px > en.at * TS) { en.done = true; en.list.forEach(([t, x, r]) => spawnEnemy(t, x, r)); } });
  L.ambushes.forEach(a => {
    if (a.state === 'idle' && px > a.at * TS) {
      a.state = 'active'; a.wave = 0; a.delay = 40;
      a.gates.forEach(i => setGate(L.gates[i], true)); sfx.gate(); shake = Math.max(shake, 3);
      banner('Emboscada!', 'derrote todos os bugs para abrir os portões');
    } else if (a.state === 'active') {
      if (a.delay > 0) { if (--a.delay === 0) a.waves[a.wave].forEach(([t, x, r]) => spawnEnemy(t, x, r, a)); return; }
      if (enemies.some(e => e.amb === a)) return;
      a.wave++;
      if (a.wave < a.waves.length) { a.delay = 50; banner(`Onda ${a.wave + 1} de ${a.waves.length}`, 'mais bugs chegando'); }
      else { a.state = 'done'; a.gates.forEach(i => setGate(L.gates[i], false)); sfx.gate(); sfx.win(); banner('Sala liberada!', 'os portões se abriram'); }
    }
  });
}
// poça tóxica em que o objeto (herói ou bug) afundou
const poolAt = o => L.pools.find(p => o.y + o.h > p.y * TS + 3 && o.x + o.w / 2 > p.x0 * TS && o.x + o.w / 2 < (p.x1 + 1) * TS);

// partida nova: zera o estado de todos os biomas e volta para a Masmorra
function resetLevel() {
  enemies = []; shots = []; mugs = []; arrows = []; nums = []; coins = []; frags = []; blasts = []; seenTypes = new Set();
  coinCount = 0;
  Object.values(BIOMES).forEach(B => {
    B.encounters.forEach(en => en.done = false);
    B.ambushes.forEach(a => { a.state = 'idle'; a.wave = 0; a.delay = 0; });
    B.gates.forEach(g => { g.closed = !!g.start; g.lift = g.start ? 0 : 1; });
    B.secrets.forEach(c => { c.found = false; c.reveal = 0; c.hint = 0; });
  });
  pl.weapon = null; ghosts = []; scrollFx = null; pet = null; petCageOpen = false;
  loadBiome('masmorra');
}
// o herói passa pela porta e aparece no próximo bioma: a ordem vem de PHASES (fases.js)
function enterBiome(b) {
  const done = BIOMES[b].phase !== phase ? finishPhase() : null;   // passou para a próxima fase
  loadBiome(b); mode = 'play';
  const start = L.start;
  enemies = []; shots = []; mugs = []; arrows = []; frags = []; blasts = []; ghosts = []; scrollFx = null;
  coins = [];   // moedas que ficaram no chão se perdem
  Object.assign(pl, { x: start.x, y: start.y - pl.h, vx: 0, vy: 0, face: 1, atk: null, roll: 0, hurt: 0, drink: 0, inv: 0, burn: 0, atkBuf: 0, heavyBuf: 0 });
  pl.safe = { x: pl.x, y: pl.y };
  if (pet) Object.assign(pet, { x: pl.x - 10, y: pl.y - 8, vx: 0, vy: 0, st: 'follow', target: null, gone: false });   // o Alfredão entrou na porta junto
  snapCam(); fade = -.8; keys.clear(); bannerQ.length = 0; renderTimer();
  burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 26, ['#ffffff', '#ffd23f', CHARS[heroIdx].color], 2, 0, [12, 24]);
  sfx.teleport();
  if (testMode) banner('Teste: ' + L.name, 'moedas infinitas · Esc > Teste para trocar de bioma');
  else if (done) {
    banner(`${PHASES[done.i].name} concluída!`, `tempo: ${fmtR(done.t)}` + (done.pos >= 0 ? ` · ${done.pos + 1}º lugar no ranking` : ''));
    banner(L.name, L.sub, true);
  } else banner(L.name, L.sub);
}
// menu de teste: teleporta direto para o bioma escolhido, mantendo a arma atual
function testGo(b) {
  const w = pl.weapon;
  ['pauseScreen', 'testScreen'].forEach(id => $(id).hidden = true);
  resetLevel(); resetPlayer();
  pl.weapon = w; if (w) pl.carry = WEAPONS[w].idle;
  testMode = true;
  phase = BIOMES[b].phase; phaseT0 = playT; splits = [];   // o cronômetro da fase recomeça no bioma escolhido
  // com arma na mão, o portão da sala inicial já começa aberto
  BIOMES[b].gates.forEach(g => { if (g.start) { g.closed = false; g.lift = 1; } });
  renderHp(); renderCoins(); renderTest();
  enterBiome(b);
}
function renderTest() { $('testBadge').hidden = !testMode; }

// câmera: horizontal segue o herói; vertical só muda quando ele pisa num chão novo
// (no pulo ela fica parada, a não ser que ele caia abaixo do último chão ou chegue perto do topo da tela)
const CAM_FEET = 116, CAM_TOP = 28;
function camTarget() {
  cam.look += (pl.face * 30 - cam.look) * .04;
  const feet = pl.y + pl.h;
  if (pl.ground || feet > cam.floor) cam.floor = feet;
  const ty = Math.min(cam.floor - CAM_FEET, pl.y - CAM_TOP);
  return [clamp(pl.x + pl.w / 2 - W / 2 + cam.look, 0, MW * TS - W), clamp(ty, 0, MH * TS - H)];
}
function snapCam() { cam.look = pl.face * 30; cam.floor = pl.y + pl.h; [cam.x, cam.y] = camTarget(); }
