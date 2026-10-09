// ===== Bioma 3: Ossuário =====
// vem depois da Lojinha; inspirado no Ossuary de Dead Cells: paredes carmim, brasas vermelhas no ar,
// grandes arcos abertos com luz vermelha e rosada ao fundo, correntes e gaiolas penduradas, crânios pelo chão
// esboço: o mapa e o visual estão prontos; os inimigos (e as salas de emboscada) vêm depois

// cores do mapa: carmim escuro, com a borda do chão cor de osso
const PAL_OSSUARY = {
  bg: '#3a1418', bgPatch: '#341216', bgMortar: '#2a0e12', bgSpeck: '#4f1c22',
  d4: '#0e0406', d3: '#16070a', d3Speck: '#1e0a0e', d2: '#220b10', d2Mortar: '#1a080c',
  wall: '#4a1a22', wallMortar: '#36121a', wallSpeck: '#5e242c', top: '#c9b49a', top2: '#7a5a4a',
  under: '#1a080c', drip: '#5e242c', lit: '#6a2a32', shade: '#28090e',
};
const FLAME_EMBER = ['#fff0e0', '#ffb36b', '#ff4d2e', '#8a1f1f'];
const SPORES_EMBER = ['#ff6b4a', '#ffb36b', '#8a1f1f'];   // brasas subindo devagar
// ponte de ossos (tábuas que desabam, ver jogo/obstaculos.js)
const BONE_BRIDGE = { top: '#e8dcc4', mid: '#b8a88c', bot: '#6a5a48', crack: '#3a2e24', drip: null, bits: ['#e8dcc4', '#b8a88c', '#6a5a48'] };

defBiome('ossuario', {
  name: 'Ossuário', sub: 'o cemitério esquecido embaixo da masmorra',
  w: 472, h: 40, pal: PAL_OSSUARY, flame: FLAME_EMBER, torchGlow: GLOW_R, spores: SPORES_EMBER, crumbleLook: BONE_BRIDGE,
  start: { x: 4 * TS, y: 34 * TS },
  door: { x: 462 * TS, y: 22 * TS, w: 16, h: 32 },

  build({ carve, plat, fill }) {
    // 1. entrada
    carve(1, 18, 30, 33);
    plat(9, 29, 5); plat(19, 25, 5);
    // 2. corredor dos ossos, com um degrau
    carve(31, 24, 60, 33);
    fill(44, 32, 47, 33, SOLID);
    // 3. salão do grande arco: subida pelas plataformas da direita até o corredor de cima
    carve(61, 4, 110, 33);
    plat(85, 30, 5); plat(93, 26, 5); plat(85, 22, 5); plat(93, 18, 5); plat(100, 14, 11);
    // 4. corredor de cima
    carve(111, 8, 140, 13);
    // 5. cripta com dois fossos sem fundo (uma plataforma e uma ponte de ossos)
    carve(141, 8, 190, 29);
    carve(155, 30, 163, BOTTOM); plat(158, 26, 3);
    carve(172, 30, 179, BOTTOM);
    // 6. escadaria descendo
    carve(191, 8, 215, 33);
    fill(191, 30, 198, 33, SOLID); fill(199, 32, 205, 33, SOLID);
    // 7. salão (bom para a primeira emboscada)
    carve(216, 20, 250, 33);
    plat(222, 29, 5); plat(239, 29, 5); plat(230, 25, 6);
    // 8. galeria das gaiolas: fossos com gaiolas penduradas em cima
    carve(251, 10, 300, 33);
    carve(262, 34, 268, BOTTOM); plat(264, 30, 3);
    carve(281, 34, 288, BOTTOM);
    // 9. torre
    carve(301, 2, 330, 33);
    plat(304, 29, 5); plat(312, 25, 5); plat(304, 21, 5); plat(312, 17, 5); plat(304, 13, 5); plat(312, 9, 19);
    // 10. corredor alto
    carve(331, 4, 360, 8);
    // 11. salão do segundo arco (bom para a emboscada final)
    carve(361, 4, 410, 25);
    plat(361, 9, 5); plat(368, 21, 5); plat(399, 21, 5);
    // 12. ponte de ossos sobre o abismo
    carve(411, 14, 450, 25);
    carve(418, 26, 444, BOTTOM);
    // 13. sala da saída
    carve(451, 14, 470, 25);
  },

  // Baú de Poder (Pergaminho de Poder) no canto do pé da torre, logo depois do segundo arco;
  // no fim do corredor alto, um baú com 1 poção antes da emboscada final; na sala da saída, baú com 2 poções
  chests: [{ tx: 327, row: 34, power: true }, { tx: 356, row: 9, potions: 1 }, { tx: 455, row: 26, potions: 2 }],
  // pontes de ossos que desabam: [coluna, linha, tamanho]
  crumbles: [[174, 27, 3], [283, 31, 4], [421, 23, 3], [427, 22, 3], [433, 23, 3], [439, 22, 3]],

  // inimigos: os funcionários do Ossuário (Segunda-feira, Café Queimado e Chefe no Corredor), apresentados um de cada vez
  // encontros: quando o herói passa da coluna "at", os inimigos da lista surgem ([tipo, coluna, linha do chão])
  encounters: [
    { at: 27, list: [['zombie', 50, 34]] },
    { at: 64, list: [['zombie', 80, 34], ['zombie', 96, 34]] },
    { at: 112, list: [['grenadier', 135, 14]] },
    { at: 143, list: [['zombie', 150, 30], ['grenadier', 186, 30]] },
    { at: 192, list: [['shocker', 210, 34]] },
    { at: 262, list: [['zombie', 274, 34], ['shocker', 293, 34]] },
    { at: 302, list: [['grenadier', 314, 17]] },
    { at: 333, list: [['zombie', 352, 9]] },
  ],
  // portões das salas de emboscada (0 e 1: salão 7; 2 e 3: salão 11)
  gates: [{ tx: 216, y0: 20, y1: 33 }, { tx: 250, y0: 20, y1: 33 }, { tx: 360, y0: 4, y1: 8 }, { tx: 411, y0: 14, y1: 25 }],
  ambushes: [
    { at: 221, gates: [0, 1], waves: [
      [['zombie', 226, 34], ['zombie', 245, 34], ['grenadier', 233, 25]],
    ] },
    { at: 367, gates: [2, 3], waves: [
      [['zombie', 378, 26], ['zombie', 392, 26], ['grenadier', 370, 21], ['grenadier', 401, 21], ['shocker', 404, 26]],
    ] },
  ],

  torches: [[5, 25], [27, 25], [35, 28], [56, 28], [64, 24], [107, 10], [116, 10], [136, 10], [145, 22], [168, 22], [186, 22], [195, 18], [212, 26],
    [219, 26], [247, 26], [254, 26], [297, 26], [305, 6], [326, 6], [336, 5], [356, 5], [364, 16], [407, 16], [414, 18], [447, 18], [454, 19], [468, 19]],
  chains: [[15, 18, 4], [40, 24, 2], [100, 4, 6], [125, 8, 2], [150, 8, 6], [182, 8, 5], [233, 20, 2], [318, 2, 4], [345, 4, 2], [372, 4, 8], [403, 4, 8], [425, 14, 3], [437, 14, 4]],
  // gaiolas penduradas: [coluna, linha do teto, comprimento da corrente em pixels]
  cages: [[52, 24, 12], [165, 8, 40], [176, 8, 70], [265, 10, 52], [285, 10, 76], [430, 14, 30], [458, 14, 22]],
  // gaiola do Alfredão (o periquito que vira companheiro do herói, ver jogo/pet.js): baixa o bastante para soltar com E
  petCage: { tx: 24, row: 18, len: 78, floor: 34 },
  // crânios e montes de ossos no chão: [coluna, linha do chão]
  skulls: [[3, 34], [12, 34], [29, 34], [38, 34], [58, 34], [63, 34], [108, 34], [118, 14], [147, 30], [185, 30], [208, 34], [217, 34], [249, 34],
    [253, 34], [274, 34], [298, 34], [302, 34], [339, 9], [363, 26], [386, 26], [409, 26], [413, 26], [469, 26]],
  bones: [[6, 34], [26, 34], [52, 34], [70, 34], [144, 30], [210, 34], [245, 34], [292, 34], [380, 26], [395, 26], [467, 26]],
  // arcos abertos ao fundo: [coluna do meio, linha de cima, linha do chão, raio em blocos]
  arches: [[74, 6, 34, 8], [275, 12, 34, 5], [385, 6, 26, 8]],

  // arcos: luz vermelha em cima indo para o rosa embaixo, raios de luz, mato escuro no pé e borda de pedra irregular
  backdrop(px) {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const SKY = ['#d9573e', '#c24038', '#a83040', '#8e2848', '#74204a', '#5a1a40'];
    this.arches.forEach(([col, row, floor, rad]) => {
      const cx = col * TS + 4, top = row * TS, bot = floor * TS - 1, R = rad * TS, cy = top + R;
      for (let y = top; y <= bot; y++) for (let x = cx - R; x <= cx + R; x++) {
        const dx = x - cx, dy = y - cy;
        const edge = y < cy ? R - Math.hypot(dx, dy) : R - Math.abs(dx);   // distância até a borda do arco
        if (edge < 0) continue;
        const jag = 2 + ((Math.sin(y * .7 + x * .3) * 2 + Math.sin(y * .23) * 2) | 0);
        if (edge < jag) { px(x, y, '#1e080c'); continue; }
        const t = (y - top) / (bot - top) * (SKY.length - 1), i = Math.floor(t), f = t - i;
        let c = SKY[Math.min(SKY.length - 1, i + (f > ((x + y) % 4) / 4 ? 1 : 0))];
        if (((dx + (y - top) * .6) % 48 + 48) % 48 < 5) c = i < 2 ? '#e06a48' : i < 4 ? '#b83a4a' : '#86305a';   // raios de luz
        const weed = 10 + Math.sin(x / 7) * 6 + Math.sin(x / 3) * 3;
        if (bot - y < weed) c = bot - y < weed - 3 ? '#1e0812' : '#341020';
        if (rnd() < .008) c = rnd() < .5 ? '#ffb36b' : '#ff6b4a';   // brasas
        px(x, y, c);
      }
    });
  },
  // gaiolas, crânios e ossos (por cima do mapa)
  decor(r) {
    this.cages.forEach(([col, row, len]) => {
      const X = col * TS + 4, Y = row * TS;
      for (let y = 0; y < len; y += 3) r(X - (y / 3 % 2), Y + y, 2, 2, '#7a5a52');
      const cy = Y + len;
      r(X - 6, cy, 12, 1, '#9a7468'); r(X - 7, cy + 1, 14, 1, '#9a7468'); r(X - 7, cy + 16, 14, 2, '#9a7468');
      [-7, -4, -1, 2, 5].forEach(bx => r(X + bx, cy + 1, 1, 16, '#7a5a52'));
      r(X - 2, cy + 6, 4, 3, '#c9b49a'); r(X - 1, cy + 7, 1, 1, '#1e080c'); r(X + 1, cy + 7, 1, 1, '#1e080c');   // caveira presa
      r(X - 1, cy + 9, 2, 5, '#a8957e'); r(X - 3, cy + 10, 6, 1, '#a8957e');
    });
    this.skulls.forEach(([col, row]) => {
      const X = col * TS + 1, Y = row * TS;
      r(X, Y - 5, 6, 4, '#d8c8b0'); r(X + 1, Y - 6, 4, 1, '#d8c8b0'); r(X + 1, Y - 1, 4, 1, '#b8a88c');
      r(X + 1, Y - 4, 1, 2, '#1e080c'); r(X + 4, Y - 4, 1, 2, '#1e080c'); r(X + 3, Y - 2, 1, 1, '#6a5a48');
    });
    this.bones.forEach(([col, row]) => {
      const X = col * TS, Y = row * TS;
      r(X, Y - 2, 9, 1, '#d8c8b0'); r(X - 1, Y - 3, 2, 2, '#d8c8b0'); r(X + 8, Y - 3, 2, 2, '#d8c8b0');
      r(X + 3, Y - 4, 7, 1, '#b8a88c'); r(X + 2, Y - 5, 2, 2, '#b8a88c'); r(X + 9, Y - 5, 2, 2, '#b8a88c');
    });
  },
});
