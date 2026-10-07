// ===== Bioma 2: Esgoto Tóxico =====
// pequeno por enquanto (vem logo depois da Masmorra, antes da Lojinha); poças de gosma machucam e devolvem ao chão firme
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
  name: 'Esgoto Tóxico', sub: 'cuidado com as poças verdes: a gosma machuca',
  w: 112, h: 40, pal: PAL_SEWER, flame: FLAME_RED, torchGlow: GLOW_R, barrel: 'metal', spores: SPORES_SEWER,
  start: { x: 4 * TS, y: 34 * TS },
  door: { x: 105 * TS, y: 30 * TS, w: 16, h: 32 },

  build({ carve, plat }) {
    carve(1, 20, 19, 33);                       // sala de chegada
    plat(7, 29, 4); plat(13, 25, 4);
    carve(20, 24, 49, 33);                      // túnel com poça tóxica
    carve(27, 34, 31, BOTTOM);
    carve(50, 14, 79, 33);                      // sala da emboscada
    plat(55, 29, 5); plat(69, 29, 5); plat(62, 24, 5); plat(54, 20, 4); plat(71, 20, 4);
    carve(80, 24, 94, 33);                      // túnel com outra poça
    carve(85, 34, 88, BOTTOM);
    carve(95, 18, 110, 33);                     // sala da saída
    plat(98, 29, 4);
  },

  // poças tóxicas: cair nelas machuca e devolve o herói ao último chão firme (y = linha da superfície)
  pools: [{ x0: 27, x1: 31, y: 35 }, { x0: 85, x1: 88, y: 35 }],
  // canos redondos na parede do fundo, pingando gosma
  pipes: [[10, 22], [36, 27], [64, 17], [102, 21]],
  gates: [{ tx: 49, y0: 24, y1: 33 }, { tx: 80, y0: 24, y1: 33 }],
  encounters: [
    { at: 8, list: [['bug', 18, 34]] },
    { at: 22, list: [['shield', 42, 34], ['flyer', 38, 27]] },
    { at: 82, list: [['shield', 93, 34]] },
    { at: 95, list: [['shooter', 107, 34], ['ghost', 100, 34]] },
  ],
  ambushes: [
    { at: 54, gates: [0, 1], waves: [
      [['bug', 60, 34], ['shield', 72, 34], ['bug', 66, 34]],
      [['ghost', 64, 34], ['shooter', 74, 34], ['flyer', 62, 18], ['flyer', 70, 18]],
    ] },
  ],

  torches: [[4, 26], [17, 26], [23, 28], [44, 28], [53, 23], [76, 23], [83, 28], [97, 26], [108, 26]],
  barrels: [[2, 33], [18, 33], [51, 33], [52, 33], [78, 33], [109, 33]],
  chains: [[58, 14, 4], [75, 14, 3], [14, 20, 2]],
});
