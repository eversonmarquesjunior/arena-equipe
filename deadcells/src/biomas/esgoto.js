// ===== Bioma 2: Esgoto Tóxico =====
// vem logo depois da Masmorra, antes da Lojinha; no lugar das emboscadas, obstáculos: poças de gosma, jatos que saem
// das grades do chão, pingos que caem dos canos do teto e tábuas podres que desabam (ver jogo/obstaculos.js)
// inspirado no Toxic Sewers de Dead Cells: verde musgo claro com tochas vermelhas

// cores do mapa: verde musgo claro
const PAL_SEWER = {
  bg: '#3b5430', bgPatch: '#35502c', bgMortar: '#2e4426', bgSpeck: '#4a6a3a', slime: '#6fae3e',
  d4: '#1b2915', d3: '#22331a', d3Speck: '#2a3e20', d2: '#2d4223', d2Mortar: '#26381e',
  wall: '#5c7a43', wallMortar: '#486233', wallSpeck: '#77985a', top: '#c2e88a', top2: '#8fbf55',
  under: '#2a3a20', drip: '#6fae3e', lit: '#7f9f5f', shade: '#33462a',
};
const FLAME_RED = ['#fff0e0', '#ff9a8a', '#ff4d4d', '#a01f2a'];
const SPORES_SEWER = ['#4f7a33', '#b5ff7a', '#4f7a33'];

defBiome('esgoto', {
  name: 'Esgoto Tóxico', sub: 'cuidado com a gosma: poças, jatos e pingos machucam',
  w: 472, h: 40, pal: PAL_SEWER, flame: FLAME_RED, torchGlow: GLOW_R, barrel: 'metal', spores: SPORES_SEWER,
  start: { x: 4 * TS, y: 34 * TS },
  door: { x: 462 * TS, y: 30 * TS, w: 16, h: 32 },

  build({ carve, plat, fill }) {
    // 1. sala de chegada
    carve(1, 20, 24, 33);
    plat(7, 29, 4); plat(13, 25, 4);
    // 2. canal de gosma: pedras no meio das poças, com pingos em cima
    carve(25, 24, 70, 33);
    carve(31, 34, 36, BOTTOM); carve(40, 34, 46, BOTTOM); carve(50, 34, 56, BOTTOM);
    // 3. câmara dos jatos: grades no chão e um caminho por cima, nas tábuas
    carve(71, 16, 110, 33);
    plat(80, 28, 4); plat(87, 25, 4); plat(94, 28, 4);
    // 4. ponte podre: rio de gosma atravessado por tábuas que desabam
    carve(111, 22, 150, 33);
    carve(114, 34, 147, BOTTOM);
    // 5. torre dos canos: subida por plataformas, com jatos embaixo e pingos no alto
    carve(151, 4, 180, 33);
    plat(153, 29, 6); plat(162, 25, 6); plat(153, 21, 6); plat(162, 17, 6); plat(153, 13, 6); plat(160, 10, 21);
    // 6. corredor alto: jatos que vão do chão ao teto
    carve(181, 4, 215, 9);
    // 7. cachoeira: descida até o lago de gosma, pulando de ilha em ilha
    carve(216, 4, 270, 33);
    carve(220, 34, 263, BOTTOM);
    fill(224, 30, 227, BOTTOM, SOLID); fill(234, 30, 237, BOTTOM, SOLID); fill(244, 30, 247, BOTTOM, SOLID); fill(254, 30, 257, BOTTOM, SOLID);
    plat(216, 10, 6); plat(225, 14, 4); plat(237, 20, 4);
    // 8. galeria dos canos: jatos em dupla, poço com tábua podre e jatos desencontrados
    carve(271, 24, 320, 33);
    carve(288, 34, 295, BOTTOM);
    // 9. salão das duas poças: caminho de baixo (tábuas e pingos) ou de cima (plataformas)
    carve(321, 10, 380, 33);
    carve(327, 34, 340, BOTTOM); carve(351, 34, 366, BOTTOM);
    plat(354, 30, 3);
    plat(322, 28, 4); plat(329, 23, 6); plat(340, 20, 8); plat(353, 23, 6);
    // 10. túnel da onda: os jatos ligam um depois do outro, é só seguir atrás deles
    carve(381, 26, 420, 33);
    // 11. sala da saída (sem obstáculos)
    carve(421, 18, 470, 33);
    plat(430, 29, 5); plat(440, 25, 6);
  },

  // poças tóxicas: cair nelas machuca e devolve o herói ao último chão firme (y = linha da superfície)
  pools: [
    { x0: 31, x1: 36, y: 35 }, { x0: 40, x1: 46, y: 35 }, { x0: 50, x1: 56, y: 35 },
    { x0: 114, x1: 147, y: 35 },
    { x0: 220, x1: 223, y: 35 }, { x0: 228, x1: 233, y: 35 }, { x0: 238, x1: 243, y: 35 }, { x0: 248, x1: 253, y: 35 }, { x0: 258, x1: 263, y: 35 },
    { x0: 288, x1: 295, y: 35 },
    { x0: 327, x1: 340, y: 35 }, { x0: 351, x1: 366, y: 35 },
  ],
  // jatos: [coluna, linha do chão, altura em blocos, atraso]
  jets: [
    [78, 34, 7, 0], [85, 34, 7, 37], [92, 34, 7, 75], [99, 34, 7, 112],
    [160, 34, 6, 0], [170, 34, 6, 75],
    [189, 10, 6, 0], [197, 10, 6, 50], [205, 10, 6, 100],
    [235, 30, 6, 0], [255, 30, 6, 75],
    [277, 34, 6, 0], [282, 34, 6, 0], [302, 34, 6, 0], [308, 34, 6, 50], [314, 34, 6, 100],
    [345, 34, 8, 0],
    [387, 34, 8, 0], [393, 34, 8, 20], [399, 34, 8, 40], [405, 34, 8, 60], [411, 34, 8, 80],
  ],
  // pingos: [coluna, primeira linha embaixo do teto, atraso]
  drips: [
    [38, 24, 0], [48, 24, 55],
    [88, 16, 30],
    [128, 22, 0], [139, 22, 55],
    [156, 4, 0], [172, 4, 55],
    [246, 4, 20],
    [292, 24, 40],
    [355, 10, 0], [360, 10, 55],
  ],
  // tábuas podres: [coluna, linha, tamanho]
  crumbles: [
    [116, 31, 3], [122, 30, 3], [128, 31, 3], [134, 29, 3], [140, 31, 3],
    [231, 17, 3], [243, 23, 3],
    [290, 32, 4],
    [329, 31, 3], [334, 29, 3], [359, 31, 3],
  ],
  // canos redondos na parede do fundo, pingando gosma
  pipes: [[10, 22], [60, 27], [104, 20], [120, 25], [176, 22], [166, 6], [200, 6], [230, 8], [262, 12], [298, 27], [334, 14], [372, 14], [400, 29], [434, 21], [456, 21]],

  // inimigos: ainda a definir
  encounters: [],

  torches: [[4, 26], [21, 26], [28, 28], [66, 28], [74, 24], [107, 24], [113, 26], [148, 26], [154, 8], [178, 26], [186, 6], [212, 6], [219, 8], [267, 26],
    [274, 28], [318, 28], [324, 16], [348, 14], [378, 16], [384, 29], [417, 29], [424, 23], [450, 23], [468, 23]],
  barrels: [[2, 33], [3, 33], [27, 33], [68, 33], [72, 33], [109, 33], [112, 33], [149, 33], [152, 33], [179, 33], [214, 9], [217, 33], [268, 33], [269, 33],
    [272, 33], [319, 33], [322, 33], [379, 33], [382, 33], [419, 33], [423, 33], [446, 33], [447, 33]],
  chains: [[14, 20, 2], [58, 24, 3], [76, 16, 4], [106, 16, 5], [118, 22, 3], [145, 22, 3], [222, 4, 5], [250, 4, 7], [265, 4, 4], [325, 10, 5], [366, 10, 6], [432, 18, 3], [452, 18, 3]],
});
