// ===== Som: efeitos sintetizados na hora com Web Audio (sem arquivos de áudio) =====

// ---------- som
let AC = null, soundOn = true;
function ac() {
  if (!soundOn) return null;
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume().catch(() => {});
  return AC;
}
function tone(f, dur, type = 'square', vol = .05, slide = 0, delay = 0) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
let noiseBuf = null;
function noise(dur, vol = .15, freq = 1200, delay = 0) {
  const a = ac(); if (!a) return;
  if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = a.currentTime + delay, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * .2), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + dur + .02);
}
const sfx = {
  jump() { tone(330, .1, 'square', .035, 260); },
  djump() { tone(520, .12, 'square', .035, 420); tone(780, .08, 'triangle', .03, 300, .05); },
  land(k) { noise(.1, .06 + .08 * k, 700); },
  roll() { noise(.22, .09, 1600); },
  select() { tone(660, .06, 'square', .04); tone(990, .09, 'square', .04, 0, .06); },
  fall() { tone(500, .4, 'triangle', .05, -380); },
  teleport() { tone(220, .7, 'sawtooth', .035, 900); tone(440, .7, 'triangle', .04, 1200, .05); },
  zap() { tone(1400, .18, 'square', .04, -900); noise(.25, .1, 4000); },
  swing() { noise(.09, .07, 5000); tone(700, .06, 'triangle', .02, -400); },
  heavy() { noise(.2, .1, 1600); tone(150, .16, 'triangle', .05, -60); },
  hit(k = 1) { noise(.12, .12 * k, 2400); tone(140, .1, 'square', .05 * k, -60); },
  kill() { noise(.3, .16, 1500); tone(300, .25, 'square', .04, -220); },
  hurt() { tone(220, .18, 'square', .06, -140); noise(.15, .12, 900); },
  alert() { tone(900, .05, 'square', .03); tone(1300, .06, 'square', .03, 0, .05); },
  warn() { tone(520, .1, 'sawtooth', .03, 260); },
  bite() { noise(.12, .1, 3000); tone(380, .08, 'square', .03, -200); },
  draw() { tone(180, .18, 'triangle', .025, 120); },
  charge(d) { tone(160, d, 'sawtooth', .03, 640); tone(320, d, 'triangle', .02, 1100); },
  ready() { tone(1320, .06, 'square', .04); tone(1760, .08, 'square', .03, 0, .05); },
  big() { noise(.45, .22, 900); tone(80, .45, 'triangle', .12, -40); },
  twang() { tone(620, .09, 'triangle', .05, -380); noise(.06, .05, 6000); },
  thunk() { noise(.06, .08, 1200); tone(240, .05, 'square', .025, -100); },
  coin(i = 0) { tone(1320 + (i % 4) * 110, .05, 'square', .025); tone(1760 + (i % 4) * 110, .07, 'square', .02, 0, .04); },
  chest() { noise(.2, .08, 800); [392, 523, 659, 784].forEach((f, i) => tone(f, .12, 'triangle', .045, 0, .1 + i * .07)); },
  power() { [392, 494, 587, 784, 988].forEach((f, i) => tone(f, .2, 'triangle', .05, 0, i * .08)); tone(196, .6, 'sawtooth', .03, 400); noise(.4, .08, 5000, .1); },
  secret() { [659, 784, 988, 1318].forEach((f, i) => tone(f, .16, 'triangle', .045, 0, i * .09)); },
  boom(k = 1) { noise(.35 * k + .1, .2 * k, 1400); tone(110, .25, 'triangle', .1 * k, -60); },
  crit() { tone(1600, .06, 'square', .05); tone(2200, .1, 'square', .04, 0, .05); noise(.08, .1, 6000); },
  splash() { noise(.3, .12, 900); tone(160, .25, 'sine', .05, -90); tone(420, .12, 'sine', .03, 300, .08); },
  puff() { noise(.07, .07, 3200); tone(880, .05, 'sine', .025, -300); },
  poison() { tone(300, .12, 'sine', .035, 180); tone(420, .1, 'sine', .025, 160, .06); },
  dash() { noise(.12, .09, 7000); tone(1100, .08, 'triangle', .025, -700); },
  knives() { [0, .03, .06, .09, .12].forEach(d => noise(.06, .06, 6500, d)); tone(1700, .06, 'square', .02); },
  buy() { tone(1320, .05, 'square', .035); tone(1760, .05, 'square', .035, 0, .05); [523, 659, 784, 1046].forEach((f, i) => tone(f, .1, 'triangle', .045, 0, .1 + i * .06)); },
  crank() { tone(240, .05, 'square', .03); tone(200, .05, 'square', .03, 0, .07); },
  spawn() { tone(200, .15, 'square', .03, 600); noise(.1, .05, 3000); },
  clink() { tone(1500, .05, 'square', .05); tone(1100, .08, 'triangle', .04, 0, .03); },
  glitch() { tone(1800, .04, 'square', .03); tone(600, .04, 'square', .03, 0, .04); tone(1200, .04, 'square', .03, 0, .08); },
  spit() { tone(320, .14, 'sawtooth', .05, -180); noise(.12, .08, 1800); },
  pickup() { [523, 784, 1046].forEach((f, i) => tone(f, .1, 'square', .045, 0, i * .07)); },
  gate() { noise(.8, .14, 400); tone(70, .7, 'sawtooth', .05, 20); },
  heal() { [523, 659, 880].forEach((f, i) => tone(f, .12, 'triangle', .05, 200, i * .08)); },
  gulp() { tone(260, .08, 'sine', .05, -80); tone(220, .08, 'sine', .05, -60, .14); },
  nope() { tone(180, .1, 'square', .04, -40); },
  die() { [392, 330, 262, 196].forEach((f, i) => tone(f, .24, 'triangle', .06, 0, i * .16)); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .16, 'square', .05, 0, i * .1)); },
};
