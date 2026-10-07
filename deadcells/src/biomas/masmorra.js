// ===== Bioma 1: Masmorra (o tutorial) =====
// o herói escolhe a arma nos pedestais e conhece cada tipo de bug com calma
// coordenadas em blocos (TS = 8 px): colunas da esquerda para a direita, linhas de cima para baixo

// cores do mapa: azul-petróleo escuro
const PAL_DUNGEON = {
  bg: '#0e2129', bgPatch: '#0c1c23', bgMortar: '#09171d', bgSpeck: '#14303a',
  d4: '#061014', d3: '#09181e', d3Speck: '#0c1f26', d2: '#0f272f', d2Mortar: '#0a1c22',
  wall: '#1a404c', wallMortar: '#102a32', wallSpeck: '#265a66', top: '#4aa383', top2: '#2f7562',
  under: '#0a1a20', drip: '#102a32', lit: '#2a6270', shade: '#0d232a',
};
const SPORES_DUNGEON = ['#2c6a64', '#5fd1b8', '#2c6a64'];   // poeira flutuando no ar

defBiome('masmorra', {
  name: 'Masmorra', sub: 'escolha uma arma nos pedestais', next: 'loja',
  w: 470, h: 40, pal: PAL_DUNGEON, flame: FLAME, spores: SPORES_DUNGEON,
  start: { x: 6 * TS, y: 30 * TS },
  door: { x: 462 * TS, y: 14 * TS, w: 16, h: 32 },

  build({ carve, plat, fill }) {
    // sala inicial
    carve(3, 14, 44, 29);
    plat(14, 25, 5); plat(23, 21, 6);
    // corredor baixo com um degrau
    carve(45, 22, 62, 29);
    fill(52, 28, 54, 29, SOLID);
    // salão com fosso e escalada
    carve(63, 6, 104, 29);
    carve(73, 30, 82, BOTTOM);
    plat(77, 26, 3);
    plat(85, 26, 5); plat(92, 22, 5); plat(85, 18, 5); plat(93, 14, 12);
    // corredor de cima
    carve(105, 8, 130, 13);
    // poço e sala de baixo
    carve(131, 8, 138, 33);
    carve(139, 20, 178, 33);
    fill(148, 31, 150, 33, SOLID);
    plat(155, 28, 6);
    fill(166, 30, 169, 33, SOLID);
    // escadaria
    carve(179, 10, 207, 33);
    fill(184, 31, 189, 33, SOLID); fill(190, 28, 195, 33, SOLID); fill(196, 25, 201, 33, SOLID); fill(202, 22, 207, 33, SOLID);
    // sala da primeira emboscada
    carve(208, 6, 240, 21);
    // corredor depois da emboscada
    carve(241, 16, 260, 21);
    // galeria com fossos
    carve(261, 12, 300, 25);
    carve(268, 26, 274, BOTTOM); plat(270, 22, 3);
    carve(282, 26, 289, BOTTOM); plat(285, 23, 2);
    // torre (subida por plataformas)
    carve(301, 2, 330, 25);
    plat(304, 22, 5); plat(311, 18, 5); plat(304, 14, 5); plat(311, 10, 6); plat(318, 8, 13);
    // corredor alto
    carve(331, 2, 359, 7);
    // salão da emboscada final
    carve(360, 2, 400, 17);
    // corredor depois da emboscada final
    carve(401, 12, 419, 17);
    // ponte quebrada: fosso largo com tábuas
    carve(420, 6, 452, 17);
    carve(426, 18, 446, BOTTOM);
    plat(430, 15, 3); plat(436, 13, 3); plat(442, 15, 3);
    // sala da saída
    carve(453, 10, 466, 17);
    // salas secretas (escondidas atrás de paredes falsas, ver secrets)
    carve(112, 26, 129, 33); carve(130, 30, 130, 33);
    carve(286, 4, 299, 9); carve(300, 6, 300, 9); plat(301, 10, 3);
  },

  // wall: [coluna, linha inicial, linha final] da parede falsa (onde aparece o "?" de dica)
  secrets: [
    { x0: 112, y0: 26, x1: 130, y1: 33, wall: [130, 30, 33] },
    { x0: 286, y0: 4, x1: 300, y1: 9, wall: [300, 6, 9] },
  ],
  // baús: escolha entre a arma nova e uma poção
  chests: [{ tx: 116, row: 34, wid: 'lanca' }, { tx: 291, row: 10, wid: 'besta' }],
  // armas para escolher no começo: [coluna, linha do chão, arma]
  pedestals: [[12, 30, 'espada'], [22, 30, 'martelo'], [32, 30, 'arco']],
  // portões: o 0 é o da sala inicial (start: abre ao pegar a arma); os outros trancam as salas de emboscada
  gates: [
    { tx: 44, y0: 22, y1: 29, start: true },
    { tx: 207, y0: 10, y1: 21 }, { tx: 241, y0: 16, y1: 21 },
    { tx: 360, y0: 2, y1: 7 }, { tx: 401, y0: 12, y1: 17 },
  ],
  // encontros: quando o herói passa da coluna "at", os inimigos da lista surgem ([tipo, coluna, linha do chão])
  // fora das emboscadas os bugs vêm quase sempre sozinhos, para o jogador aprender cada tipo com calma
  encounters: [
    { at: 47, list: [['bug', 58, 30]] },
    { at: 64, list: [['shooter', 99, 30]] },
    { at: 86, list: [['flyer', 95, 10]] },
    { at: 108, list: [['shield', 122, 14]] },
    { at: 140, list: [['ghost', 154, 34]] },
    { at: 172, list: [['bug', 198, 25]] },
    { at: 262, list: [['flyer', 287, 17]] },
    { at: 292, list: [['shooter', 313, 18]] },
    { at: 333, list: [['shield', 345, 8]] },
    { at: 422, list: [['flyer', 436, 9]] },
    { at: 448, list: [['bug', 456, 18]] },
  ],
  // salas de emboscada: ao entrar, os portões (índices em gates) fecham e vêm ondas de inimigos
  ambushes: [
    { at: 212, gates: [1, 2], waves: [
      [['bug', 216, 22], ['bug', 236, 22], ['shield', 230, 22]],
      [['flyer', 220, 12], ['ghost', 226, 22], ['shooter', 238, 22]],
    ] },
    { at: 364, gates: [3, 4], waves: [
      [['shield', 372, 18], ['bug', 380, 18], ['bug', 392, 18]],
      [['ghost', 376, 18], ['shooter', 397, 18], ['flyer', 386, 8]],
      [['shield', 368, 18], ['shield', 394, 18], ['flyer', 380, 6], ['shooter', 389, 18]],
    ] },
  ],

  // decoração: tochas [coluna, linha], janelas [coluna, linha], barris [coluna, linha do chão], correntes [coluna, linha, tamanho]
  torches: [[8, 25], [28, 25], [40, 25], [58, 25], [66, 24], [101, 24], [70, 11], [99, 9], [112, 10], [124, 10], [145, 29], [160, 24], [176, 29], [186, 24], [199, 17], [212, 16], [226, 16], [233, 16],
    [248, 18], [256, 18], [266, 16], [280, 15], [296, 16], [303, 20], [326, 14], [318, 4], [340, 4], [354, 4], [368, 8], [380, 8], [392, 8], [406, 14], [413, 14], [424, 12], [449, 12], [456, 13], [465, 13]],
  windows: [[33, 18], [67, 15], [96, 23], [152, 22], [171, 22], [216, 9], [228, 9], [276, 14], [292, 14], [322, 12], [372, 6], [388, 6], [428, 7]],
  barrels: [[36, 29], [37, 29], [60, 29], [99, 29], [173, 33], [174, 33], [231, 21], [296, 25], [297, 25], [358, 7], [398, 17], [114, 33], [128, 33], [297, 9], [454, 17]],
  chains: [[20, 14, 5], [80, 6, 12], [118, 8, 3], [161, 20, 5], [190, 10, 8], [220, 6, 6], [279, 12, 6], [309, 2, 8], [376, 2, 5], [395, 2, 4], [433, 6, 4], [440, 6, 3], [121, 26, 3], [293, 4, 2]],
});
