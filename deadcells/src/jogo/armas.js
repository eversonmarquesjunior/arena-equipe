// ===== Armas: golpes, combos e ataques carregados =====

// ---------- armas
// arc: ângulo da arma (graus; 0 = para frente, -90 = para cima) no começo e no fim do golpe
// pw/pa/pr: pose do herói na preparação, no golpe e na recuperação
// stop = pausa no impacto (quadros), kb = empurrão, step = passo para frente ao golpear
const WEAPONS = {
  espada: {
    name: 'Espada Enferrujada', desc: 'Rápida. Combo de 3 golpes; o último é mais forte.', tint: '#dfe8ef', idle: 50, run: 145,
    heavyName: 'Corte Carregado', heavyDesc: 'avança e corta com força.',
    heavy: { wind: 34, act: 7, rec: 22, dmg: 34, reach: 30, up: 10, kb: 5.5, step: 4, stop: 9, shake: 6, arc: [-170, 90], pw: 'windup', pa: 'attack', pr: 'slam' },
    stats: [['Dano', 2], ['Velocidade', 3], ['Alcance', 2]],
    combo: [
      { wind: 5, act: 5, rec: 11, dmg: 9, reach: 21, up: 4, kb: 1.6, step: 1.2, stop: 3, shake: 1, arc: [-100, 50], pw: 'windup', pa: 'attack', pr: 'attack' },
      { wind: 5, act: 5, rec: 11, dmg: 9, reach: 21, up: 4, kb: 1.6, step: 1.2, stop: 3, shake: 1, arc: [80, -60], pw: 'slam', pa: 'attack', pr: 'windup' },
      { wind: 9, act: 6, rec: 18, dmg: 19, reach: 24, up: 8, kb: 3.6, step: 2.2, stop: 5, shake: 3, arc: [-140, 80], pw: 'windup', pa: 'attack', pr: 'slam' },
    ],
  },
  martelo: {
    name: 'Martelo Pesado', desc: 'Lento, mas cada golpe esmaga e empurra para longe.', tint: '#c3ccd4', idle: 25, run: 160,
    heavyName: 'Terremoto', heavyDesc: 'esmaga o chão e atinge dos dois lados.',
    heavy: { wind: 48, act: 8, rec: 30, dmg: 62, reach: 42, up: 20, kb: 7, step: 1, stop: 11, shake: 9, arc: [-175, 90], pw: 'windup', pa: 'attack', pr: 'slam', slam: true, both: true, quake: true },
    stats: [['Dano', 3], ['Velocidade', 1], ['Alcance', 3]],
    combo: [
      { wind: 16, act: 6, rec: 18, dmg: 23, reach: 27, up: 12, kb: 4.5, step: 1.6, stop: 6, shake: 4, arc: [-150, 70], pw: 'windup', pa: 'attack', pr: 'slam', slam: true },
      { wind: 18, act: 7, rec: 22, dmg: 31, reach: 28, up: 14, kb: 5.5, step: 2.2, stop: 7, shake: 5, arc: [-160, 75], pw: 'windup', pa: 'attack', pr: 'slam', slam: true },
    ],
  },
  lanca: {
    name: 'Lança de Guerra', desc: 'Estocadas longas que atravessam a fila de bugs.', tint: '#ffd9a0', idle: -70, run: -120,
    note: 'Crítico: acertar 2 ou mais bugs no mesmo golpe causa dano dobrado.',
    stats: [['Dano', 2], ['Velocidade', 2], ['Alcance', 3]],
    heavyName: 'Investida', heavyDesc: 'dispara para frente espetando tudo no caminho.',
    heavy: { wind: 30, act: 8, rec: 24, dmg: 30, reach: 46, up: 0, kb: 5, step: 5.5, stop: 8, shake: 5, arc: [-4, 0], thrust: true, crit: true, pw: 'draw', pa: 'attack', pr: 'attack' },
    combo: [
      { wind: 9, act: 4, rec: 14, dmg: 13, reach: 38, up: 0, kb: 2, step: 1.4, stop: 3, shake: 1, arc: [-4, 0], thrust: true, crit: true, pw: 'draw', pa: 'attack', pr: 'attack' },
      { wind: 9, act: 4, rec: 18, dmg: 17, reach: 40, up: 0, kb: 3, step: 2, stop: 4, shake: 2, arc: [-4, 0], thrust: true, crit: true, pw: 'draw', pa: 'attack', pr: 'attack' },
    ],
  },
  besta: {
    name: 'Besta Explosiva', desc: 'Virotes explodem ao acertar um bug e soltam estilhaços em volta. Clique para mirar.', tint: '#ffb27a', idle: 30, run: 120,
    stats: [['Dano', 3], ['Velocidade', 1], ['Alcance', 3]],
    heavyName: 'Virote Pesado', heavyDesc: 'explosão bem maior, com o dobro de estilhaços.',
    heavy: { ranged: true, bolt: true, wind: 46, act: 1, rec: 22, dmg: 44, kb: 3.5, stop: 7, shake: 3, speed: 8, explode: { r: 38, dmg: 26, frags: 12 }, arc: [0, 0], pw: 'draw', pa: 'loose', pr: 'loose' },
    combo: [
      { ranged: true, bolt: true, wind: 18, act: 1, rec: 18, dmg: 26, kb: 2.5, stop: 4, shake: 1, speed: 7, explode: { r: 26, dmg: 14, frags: 6 }, arc: [0, 0], pw: 'draw', pa: 'loose', pr: 'loose' },
    ],
  },
  arco: {
    name: 'Arco Simples', desc: 'Ataca de longe. Clique para mirar com o mouse; J atira para frente.', tint: '#e6d2a0', idle: 70, run: 115,
    heavyName: 'Flecha Perfurante', heavyDesc: 'atravessa todos os bugs no caminho.',
    heavy: { ranged: true, wind: 42, act: 1, rec: 16, dmg: 40, kb: 4, stop: 6, shake: 3, speed: 9, pierce: true, arc: [0, 0], pw: 'draw', pa: 'loose', pr: 'loose' },
    stats: [['Dano', 2], ['Velocidade', 2], ['Alcance', 3]],
    // ranged: em vez de golpe, solta uma flecha no fim da preparação (wind)
    combo: [
      { ranged: true, wind: 12, act: 1, rec: 10, dmg: 16, kb: 1.2, stop: 2, shake: 0, speed: 6, arc: [0, 0], pw: 'draw', pa: 'loose', pr: 'loose' },
    ],
  },
  zarabatana: {
    name: 'Zarabatana', desc: 'Dardos envenenam o bug por 3 segundos; envenenado, ele leva o dobro de dano. Clique para mirar.', tint: '#9dff6a', idle: 10, run: 120,
    stats: [['Dano', 1], ['Velocidade', 3], ['Alcance', 3]],
    heavyName: 'Rajada Tripla', heavyDesc: 'sopra 3 dardos seguidos, todos com dano crítico.',
    // dart: dardo leve (cai pouco); poison: quadros de veneno; burst: [quantos dardos, quadros entre eles]
    heavy: { ranged: true, dart: true, wind: 36, act: 13, rec: 14, dmg: 8, kb: .8, stop: 2, shake: 1, speed: 7, poison: 180, alwaysCrit: true, burst: [3, 6], arc: [0, 0], pw: 'draw', pa: 'loose', pr: 'loose' },
    combo: [
      { ranged: true, dart: true, wind: 9, act: 1, rec: 10, dmg: 8, kb: .6, stop: 1, shake: 0, speed: 7, poison: 180, arc: [0, 0], pw: 'draw', pa: 'loose', pr: 'loose' },
    ],
  },
  katana: {
    name: 'Katana Ninja', desc: 'Cada golpe é um avanço relâmpago que atravessa os bugs e corta todos no caminho.', tint: '#c8f8ff', idle: 45, run: 150,
    note: 'Corta o escudo do Link Quebrado: acerta até de frente.', breaksShield: true,
    stats: [['Dano', 2], ['Velocidade', 3], ['Alcance', 2]],
    heavyName: 'Chuva de Adagas', heavyDesc: 'golpeia o chão e lança 5 adagas para frente.',
    heavy: { wind: 30, act: 6, rec: 22, dmg: 22, reach: 24, up: 6, kb: 4, step: 0, stop: 7, shake: 6, arc: [-150, 80], pw: 'windup', pa: 'attack', pr: 'slam', slam: true, daggers: 5 },
    // dash: velocidade do avanço durante o golpe (o herói passa pelos bugs sem levar dano)
    combo: [
      { wind: 4, act: 7, rec: 12, dmg: 11, reach: 14, up: 4, kb: 1.4, step: 0, stop: 2, shake: 1, arc: [-20, 10], dash: 5.5, both: true, pw: 'windup', pa: 'attack', pr: 'attack' },
      { wind: 4, act: 7, rec: 12, dmg: 11, reach: 14, up: 4, kb: 1.4, step: 0, stop: 2, shake: 1, arc: [20, -10], dash: 5.5, both: true, pw: 'slam', pa: 'attack', pr: 'windup' },
      { wind: 7, act: 8, rec: 18, dmg: 20, reach: 16, up: 6, kb: 3.4, step: 0, stop: 4, shake: 3, arc: [-30, 15], dash: 6.5, both: true, pw: 'windup', pa: 'attack', pr: 'slam' },
    ],
  },
};
// adaga da Chuva de Adagas (voa como flecha)
const DAGGER_S = { ranged: true, dagger: true, dmg: 14, kb: 2, stop: 2, shake: 1, speed: 6.5 };
