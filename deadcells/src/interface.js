// ===== Interface: HUD, telas (título, pausa, teste, derrota, vitória), teclado e mouse; o jogo começa aqui =====

// ---------- interface
const $ = id => document.getElementById(id);
const fmt = f => { const s = Math.floor(f / 60); return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; };
// tempos do ranking com décimos: 2m 05,3s
const fmtR = f => { const d = Math.floor(f / 6), s = Math.floor(d / 10); return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')},${d % 10}s`; };
// o cronômetro mostra o tempo da fase atual
function renderTimer() { $('timer').textContent = `${PHASES[phase].name} · ${fmt(playT - phaseT0)}`; }
// um aviso de cada vez; com wait = true ele espera o aviso atual terminar
const bannerQ = [];
function banner(title, sub, wait) {
  const hud = $('hud');
  if (wait && hud.querySelector('.banner')) { bannerQ.push([title, sub]); return; }
  hud.querySelectorAll('.banner').forEach(b => b.remove());
  const d = document.createElement('div'); d.className = 'banner';
  d.innerHTML = sub ? `${title}<small>${sub}</small>` : title;
  hud.appendChild(d);
  d.addEventListener('animationend', () => { d.remove(); if (bannerQ.length && mode === 'play') banner(...bannerQ.shift(), true); });
}
function renderHp() {
  $('hpFill').style.transform = `scaleX(${pl.hp / pl.max})`;
  $('hpBar').style.width = Math.min(82, 58 * pl.max / 100) + '%';
  $('hpNum').textContent = `${pl.hp}/${pl.max}`;
  $('pot').innerHTML = `<b></b>Poção de cura ×${pl.potions} <kbd>Q</kbd>`;
  $('pot').classList.toggle('empty', pl.potions <= 0);
  $('hWeapon').textContent = (pl.weapon ? WEAPONS[pl.weapon].name : 'sem arma') + (pl.dmgMul > 1 ? ` · dano ×${fmtMul(pl.dmgMul)}` : '');
}
// ficha da arma quando o herói chega perto dela
let tipItem = null;
function updateTip() {
  const it = mode === 'play' ? nearItem() : null, tip = $('tip');
  if (it !== tipItem) {
    tipItem = it; tip.hidden = !it;
    if (it) {
      const choice = it.group && it.group !== 'start' ? 'Escolha: pegar este item faz a outra opção do baú sumir.' : '';
      $('tipAct').textContent = it.tx !== undefined ? 'abrir' : 'pegar';
      $('tipStats').innerHTML = ''; $('tipHeavy').innerHTML = ''; $('tipNote').textContent = '';
      if (it === L.petCage) {
        $('tipAct').textContent = 'soltar';
        $('tipName').textContent = 'Alfredão'; $('tipDesc').textContent = 'Um periquito preso na gaiola. Solte e ele lutará ao seu lado a partir de agora!';
      } else if (it.tx !== undefined) {
        if (it.potions) { $('tipName').textContent = 'Baú'; $('tipDesc').textContent = it.potions > 1 ? `Guarda ${it.potions} poções de cura.` : 'Guarda 1 poção de cura.'; }
        else if (it.power) { $('tipName').textContent = 'Baú de Poder'; $('tipDesc').textContent = 'Guarda um Pergaminho de Poder: +20% de vida máxima e dano ×1,5 com qualquer arma.'; }
        else { $('tipName').textContent = 'Baú'; $('tipDesc').textContent = 'Guarda uma arma nova e uma poção de cura. Você só pode levar uma das duas.'; }
      } else if (it.kind === 'potion') {
        $('tipName').textContent = 'Poção de cura'; $('tipDesc').textContent = 'Enche toda a vida quando você bebe (Q).';
        $('tipNote').textContent = choice;
      } else {
        const w = WEAPONS[it.wid];
        $('tipName').textContent = w.name; $('tipDesc').textContent = w.desc;
        $('tipHeavy').innerHTML = `Botão direito: <b>${w.heavyName}</b>, ${w.heavyDesc}`;
        $('tipStats').innerHTML = w.stats.map(([k, v]) => `<span>${k}</span><i>${'■'.repeat(v)}${'□'.repeat(3 - v)}</i>`).join('');
        $('tipNote').textContent = [w.note, choice].filter(Boolean).join(' ');
      }
      if (it.price) {
        $('tipAct').textContent = `comprar por ${it.price} moedas`;
        if (!canAfford(it.price)) $('tipNote').textContent = [$('tipNote').textContent, `Você tem ${coinCount} moedas: faltam ${it.price - coinCount}.`].filter(Boolean).join(' ');
      }
    }
  }
  if (it) {
    // abre acima do item; se não couber (item perto do topo da tela), abre embaixo; nunca sai pelas laterais
    const hud = $('hud'), sw = hud.clientWidth, shh = hud.clientHeight, k = sw / W, lift = it.lift || 14;
    const tw = tip.offsetWidth, th = tip.offsetHeight, gap = 4;
    const cxp = (it.x - cam.x) * k, above = (it.y - lift - 16 - cam.y) * k - th, below = (it.y + 2 - cam.y) * k;
    tip.style.left = clamp(cxp - tw / 2, gap, sw - tw - gap) + 'px';
    tip.style.top = clamp(above >= gap ? above : below, gap, shh - th - gap) + 'px';
  }
}
function renderCoins() { $('coinN').textContent = testMode ? '∞' : coinCount; const el = $('coins'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function flashPot() { const el = $('pot'); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
function renderHero() {
  const c = CHARS[heroIdx];
  $('plate').style.setProperty('--c', c.color);
  $('hName').textContent = c.name; renderHp();
  document.querySelectorAll('.pick').forEach((b, i) => b.setAttribute('aria-pressed', i === heroIdx));
  $('startBtn').textContent = `Jogar com ${c.name}`;
}
// tela de escolha de herói
function select(i) {
  if (mode !== 'title' || i === heroIdx || i < 0 || i >= CHARS.length) return;
  heroIdx = i; renderHero(); sfx.select();
}
function showPicker() {
  mode = 'title'; keys.clear();
  ['pauseScreen', 'testScreen', 'winScreen', 'deadScreen'].forEach(id => $(id).hidden = true);
  $('titleScreen').hidden = false; renderHero();
  $('startBtn').focus({ preventScroll: true });
}
const pickCanvases = [];
CHARS.forEach((c, i) => {
  const b = document.createElement('button');
  b.className = 'pick'; b.style.setProperty('--c', c.color);
  const cv = document.createElement('canvas'); cv.width = cv.height = SW + 2;
  pickCanvases.push(cv);
  const nm = document.createElement('b'); nm.textContent = c.name;
  const k = document.createElement('kbd'); k.textContent = i + 1;
  b.append(k, cv, nm);
  b.addEventListener('click', () => { if (heroIdx === i) startGame(); else select(i); });
  $('picks').appendChild(b);
});
// o herói escolhido fica correndo no cartão; os outros ficam parados
function drawPicks() {
  pickCanvases.forEach((cv, i) => {
    const pose = i === heroIdx ? ['run1', 'run2', 'run3', 'run4'][(T >> 3) % 4] : 'idle';
    const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(spriteImg(i, pose), 0, 0);
  });
}
function startGame() {
  ac();
  ['titleScreen', 'pauseScreen', 'testScreen', 'winScreen', 'deadScreen', 'scrollPop'].forEach(id => $(id).hidden = true);
  bannerQ.length = 0; testMode = false; renderTest();   // recomeçar sai do ambiente de teste
  Object.assign(pl, { max: 100, dmgMul: 1, scrolls: 0 });   // partida nova: sem os bônus dos pergaminhos
  resetLevel(); resetPlayer(); renderHp(); renderCoins(); playT = 0; phase = 0; phaseT0 = 0; splits = []; renderTimer(); parts = []; fade = 1; hitstop = 0; shake = 0; hurtFx = 0;
  mode = 'play';
  banner(L.name, L.sub);
}
function pause() { if (mode !== 'play') return; mode = 'pause'; $('pauseScreen').hidden = false; $('resumeBtn').focus({ preventScroll: true }); }
function resume() { if (mode !== 'pause') return; mode = 'play'; $('pauseScreen').hidden = true; $('testScreen').hidden = true; keys.clear(); }
// menu de teste (dentro da pausa): um botão por bioma, as lojas separadas
function showTest() { $('pauseScreen').hidden = true; $('testScreen').hidden = false; $('testScreen').querySelector('button').focus({ preventScroll: true }); }
function hideTest() { $('testScreen').hidden = true; $('pauseScreen').hidden = false; $('testBtn').focus({ preventScroll: true }); }
Object.entries(BIOMES).forEach(([id, B]) => {
  const b = document.createElement('button');
  b.className = 'ghost'; b.textContent = B.name;
  b.addEventListener('click', () => testGo(id));
  $(B.shop ? 'testShops' : 'testBiomes').appendChild(b);
});
function win() {
  mode = 'exit'; exitT = 0; keys.clear(); renderTimer();
  Object.assign(pl, { vx: 0, vy: 0, roll: 0 });
  sfx.teleport();
}
function showDead() { $('deadWhere').textContent = `${PHASES[phase].name} · ${L.name}`; $('deadCoins').textContent = coinCount; $('deadScreen').hidden = false; $('retryBtn').focus({ preventScroll: true }); }
// fim do jogo: fecha a última fase e mostra o ranking de cada fase feita nesta partida
// (o do jogo inteiro só aparece quando houver mais de uma fase)
function showWin() {
  mode = 'won'; sfx.win();
  finishPhase();
  const cols = splits.map(s => ({ title: PHASES[s.i].name, k: s.i + 1, pos: s.pos }));
  if (PHASES.length > 1 && splits[0].i === 0) cols.push({ title: 'Jogo inteiro', k: 'total', pos: testMode ? -1 : addRank('total', playT) });
  $('winRanks').innerHTML = cols.map(c => {
    const r = loadRank(c.k);
    const rows = r.map((e, i) => `<li${i === c.pos ? ' class="me"' : ''}><span>${i + 1}º</span><b>${fmtR(e.t)}</b><i>${e.hero}</i></li>`).join('');
    return `<div class="rank"><h3>${c.title}</h3><ol>${rows || '<li class="none">sem tempos ainda</li>'}</ol></div>`;
  }).join('');
  $('winTime').textContent = fmtR(playT); $('winCoins').textContent = coinCount;
  $('winNote').hidden = !testMode;
  $('winScreen').hidden = false; $('againBtn').focus({ preventScroll: true });
}

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (e.target.closest && e.target.closest('button') && (k === ' ' || k === 'enter')) return;
  if (k === 'escape' || k === 'p') { if (!$('testScreen').hidden) hideTest(); else if (mode === 'pause') resume(); else pause(); e.preventDefault(); return; }
  if (k === 'm') { $('snd').click(); return; }
  if (k === 'f') { toggleFs(); return; }
  if (mode === 'title') {
    if (k >= '1' && k <= '5') select(+k - 1);
    else if (k === 'arrowright' || k === 'd') select((heroIdx + 1) % CHARS.length);
    else if (k === 'arrowleft' || k === 'a') select((heroIdx + CHARS.length - 1) % CHARS.length);
    else if (k === ' ' || k === 'enter') startGame();
    else return;
    e.preventDefault(); return;
  }
  if (mode !== 'play') {
    if ((k === ' ' || k === 'enter') && (mode === 'won' || (mode === 'dead' && !$('deadScreen').hidden))) { startGame(); e.preventDefault(); }
    return;
  }
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
  if (e.repeat) return;
  keys.add(k);
  if (k === ' ' || k === 'w' || k === 'arrowup') pl.buf = BUFFER;
  if (k === 'd' || k === 'arrowright') lastDir = 1;
  if (k === 'a' || k === 'arrowleft') lastDir = -1;
  if (k === 'shift' || k === 'l') roll();
  if (k === 'j') { pl.atkBuf = 10; aimPt = null; }
  if (k === 'k') { pl.heavyBuf = 12; aimPt = null; }
  if (k === 'q') startDrink();
  if (k === 'e') pickItem();
});
// posição do mouse convertida para coordenadas do mapa
function toScreen(e) {
  const r = view.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
$('stage').addEventListener('pointerdown', e => {
  if ((e.button !== 0 && e.button !== 2) || mode !== 'play') return;
  mouseScr = toScreen(e); aimPt = { x: cam.x + mouseScr.x, y: cam.y + mouseScr.y };
  if (e.button === 2) pl.heavyBuf = 12; else pl.atkBuf = 10;
  e.preventDefault();
});
// o menu do botão direito "roubava" o soltar das teclas e o herói ficava andando sozinho
addEventListener('contextmenu', e => { if (mode === 'play' || e.target.closest('.stage')) e.preventDefault(); });
$('stage').addEventListener('pointermove', e => { mouseScr = toScreen(e); });
$('stage').addEventListener('pointerleave', () => { mouseScr = null; });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
$('startBtn').addEventListener('click', startGame);
$('againBtn').addEventListener('click', startGame);
$('restartBtn').addEventListener('click', startGame);
$('pauseHeroBtn').addEventListener('click', showPicker);
$('winHeroBtn').addEventListener('click', showPicker);
$('retryBtn').addEventListener('click', startGame);
$('deadHeroBtn').addEventListener('click', showPicker);
function toggleFs() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else $('stage').requestFullscreen?.().catch(() => {});
}
$('fs').addEventListener('click', e => { toggleFs(); e.currentTarget.blur(); });
document.addEventListener('fullscreenchange', () => { $('fs').textContent = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia'; resize(); });
$('resumeBtn').addEventListener('click', resume);
$('testBtn').addEventListener('click', showTest);
$('scrollPop').addEventListener('animationend', e => { e.currentTarget.hidden = true; });
$('testBackBtn').addEventListener('click', hideTest);
$('snd').addEventListener('click', e => {
  soundOn = !soundOn;
  e.currentTarget.setAttribute('aria-pressed', soundOn);
  e.currentTarget.textContent = 'Som: ' + (soundOn ? 'ligado' : 'desligado');
  e.currentTarget.blur();
});

resetLevel(); resetPlayer(); renderHero(); drawPicks(); resize();
$('startBtn').focus({ preventScroll: true });
requestAnimationFrame(frame);
