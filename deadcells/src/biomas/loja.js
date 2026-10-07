// ===== Lojinha da Masmorra =====
// sala fechada entre os biomas: o herói chega pela porta da Masmorra e gasta as moedas
// tem o Baú de Poder (grátis) com um Pergaminho de Poder

defBiome('loja', {
  name: 'Lojinha da Masmorra', sub: 'chegue perto de um item e aperte E para comprar com suas moedas', shop: true, next: 'esgoto',
  w: 47, h: 40, pal: PAL_DUNGEON, flame: FLAME, spores: SPORES_DUNGEON,
  start: { x: 4 * TS, y: 34 * TS },
  door: { x: 39 * TS, y: 30 * TS, w: 16, h: 32 },

  build({ carve, plat }) {
    carve(1, 20, 44, 33);
    plat(6, 28, 4); plat(36, 28, 4);
  },

  // itens à venda, em balcões no chão: [coluna, tipo, arma, preço]
  shopItems: [[14, 'potion', null, 20], [20, 'weapon', 'zarabatana', 60], [26, 'weapon', 'katana', 75]],
  // power: Baú de Poder (no chão logo depois das armas; guarda um Pergaminho de Poder)
  chests: [{ tx: 33, row: 34, power: true }],

  torches: [[3, 29], [11, 28], [17, 28], [23, 28], [30, 28], [36, 28], [43, 29]],
  windows: [[7, 21], [36, 21]],
  barrels: [[2, 33], [9, 33], [10, 33]],
  chains: [[14, 20, 2], [26, 20, 2]],

  // tapete vermelho no chão e uma faixa com moedas na parede do fundo
  decor(r) {
    const fy = this.start.y;
    r(12 * TS, fy - 1, 16 * TS, 1, '#7a1f2e'); r(12 * TS, fy - 2, 16 * TS, 1, '#c8203f');
    for (let x = 12 * TS + 2; x < 28 * TS; x += 6) r(x, fy - 2, 2, 1, '#ffd23f');
    r(13 * TS, 22 * TS, 14 * TS, 12, '#5a1622'); r(13 * TS, 22 * TS, 14 * TS, 1, '#d9a640'); r(13 * TS, 22 * TS + 11, 14 * TS, 1, '#d9a640');
    for (let i = 0; i < 6; i++) {
      const X = 15 * TS + i * 18, Y = 22 * TS + 3;
      r(X, Y, 6, 6, '#5a3f0a'); r(X + 1, Y + 1, 4, 4, '#ffd23f'); r(X + 1, Y + 1, 1, 1, '#fff6c2');
    }
  },
});
