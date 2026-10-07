// ===== Fases: cada fase é uma sequência de biomas (com a Lojinha no meio) que termina num chefe =====
// a partida é uma só: armas, moedas e pergaminhos passam de uma fase para a outra; morreu, volta para a Fase 1
// cada fase tem o próprio cronômetro e o próprio ranking (por enquanto guardado só neste navegador)

const PHASES = [
  // planejado: Masmorra → Esgoto Tóxico → Lojinha → Ossuário → Sala Segura → Sala do Chefe 1
  { name: 'Fase 1', biomes: ['masmorra', 'esgoto', 'loja'] },
];
PHASES.forEach((P, i) => P.biomes.forEach(b => { BIOMES[b].phase = i; }));

// para onde a porta leva: o próximo bioma da mesma fase ou o primeiro da fase seguinte; null = fim do jogo
function nextBiome(b) {
  const P = PHASES[BIOMES[b].phase], i = P.biomes.indexOf(b);
  if (i < P.biomes.length - 1) return P.biomes[i + 1];
  const N = PHASES[BIOMES[b].phase + 1];
  return N ? N.biomes[0] : null;
}

// fase atual, quando ela começou (em playT) e as fases já concluídas nesta partida: { i, t, pos }
// (i = índice da fase, t = tempo, pos = posição no ranking, -1 = ficou de fora ou modo teste)
let phase = 0, phaseT0 = 0, splits = [];
// fecha a fase atual: guarda o tempo dela, põe no ranking (fora do modo teste) e passa para a próxima
function finishPhase() {
  const t = playT - phaseT0, s = { i: phase, t, pos: testMode ? -1 : addRank(phase + 1, t) };
  splits.push(s); phase++; phaseT0 = playT;
  return s;
}

// ranking local: os 5 melhores tempos de cada fase (e do jogo inteiro), com o herói usado
// k = número da fase (1, 2...) ou 'total'
const RANK_N = 5;
const rankKey = k => k === 'total' ? 'masmorra-ranking-total' : 'masmorra-ranking-fase' + k;
function loadRank(k) {
  try { const r = JSON.parse(localStorage.getItem(rankKey(k))); return Array.isArray(r) ? r : []; } catch (e) { return []; }
}
// guarda o tempo (em passos de 1/60 s) e diz em que posição ele entrou (0 = primeiro; -1 = ficou de fora)
function addRank(k, t) {
  const r = loadRank(k), e = { t, hero: CHARS[heroIdx].name, d: Date.now() };
  r.push(e); r.sort((a, b) => a.t - b.t); r.length = Math.min(r.length, RANK_N);
  try { localStorage.setItem(rankKey(k), JSON.stringify(r)); } catch (err) {}
  return r.indexOf(e);
}
