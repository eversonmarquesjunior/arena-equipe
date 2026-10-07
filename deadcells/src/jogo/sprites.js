// ===== Masmorra da Equipe: poses de plataforma dos heróis (corrida, pulo, rolagem, poção) =====

// poses de plataforma; wp = qual pose a arma do herói usa
Object.assign(POSES, {
  // run: índice da passada em RUN_LEGS (as pernas são redesenhadas em buildSprite, mais abaixo)
  run1: { legs: 'n', bob: 0, back: [8, 16, 17, 19], bh: [18, 19], front: [15, 16, 8, 20], fh: [7, 21], wp: 'idle', run: 0 },
  run2: { legs: 'n', bob: 1, back: [7, 16, 7, 20], bh: [7, 21], front: [15, 16, 14, 20], fh: [14, 21], wp: 'idle', run: 1 },
  run3: { legs: 'n', bob: 0, back: [8, 16, 5, 20], bh: [4, 21], front: [15, 16, 19, 19], fh: [20, 19], wp: 'idle', run: 2 },
  run4: { legs: 'n', bob: 1, back: [7, 16, 7, 20], bh: [7, 21], front: [15, 16, 14, 20], fh: [14, 21], wp: 'idle', run: 3 },
  jump: { legs: 'w', bob: 0, back: [6, 16, 4, 11], bh: [3, 10], front: [16, 16, 19, 12], fh: [19, 11], wp: 'idle' },
  fall: { legs: 'n', bob: 0, back: [6, 16, 3, 14], bh: [2, 13], front: [16, 16, 20, 14], fh: [20, 13], wp: 'idle' },
  roll: { legs: 'n', bob: 2, back: [6, 16, 8, 19], bh: [9, 19], front: [16, 16, 13, 19], fh: [12, 19], wp: 'idle' },
  drink: { legs: 'n', bob: 0, back: [6, 16, 6, 21], bh: [6, 22], front: [16, 16, 16, 13], fh: [15, 12], wp: 'idle' },
});

// pernas da corrida: [perna de trás (mais escura), perna da frente], cada uma quadril → joelho → pé (linha do sapato)
// o personagem olha para a direita, então x maior = para frente
const RUN_LEGS = [
  [[[10, 23], [8, 26], [6, 29]], [[13, 23], [15, 26], [17, 30]]],   // passada: perna da frente esticada à frente
  [[[10, 23], [13, 25], [11, 27]], [[13, 23], [13, 26], [12, 30]]], // passagem: perna de trás sobe dobrada
  [[[10, 23], [12, 26], [16, 30]], [[13, 23], [11, 26], [7, 29]]],  // passada com a outra perna
  [[[10, 23], [10, 26], [10, 30]], [[13, 23], [16, 25], [14, 27]]], // passagem com a outra perna
];
const buildBase = buildSprite;
buildSprite = function (c, poseName, extraBob = 0) {
  const P = POSES[poseName], g = buildBase(c, poseName, extraBob);
  if (P.run === undefined) return g;
  const b = P.bob + extraBob, top = 23 + b;
  for (const k of [...g.p.keys()]) if (Math.floor(k / SW) >= top) g.p.delete(k);
  const leg = (pts, col, shoe) => {
    const q = pts.map(([x, y], i) => [x, i === 0 ? y + b : y]);
    for (let i = 1; i < q.length; i++) {
      const [x0, y0] = q[i - 1], [x1, y1] = q[i], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let j = 0; j <= n; j++) { const x = Math.round(x0 + (x1 - x0) * j / n), y = Math.round(y0 + (y1 - y0) * j / n); g.rect(x - 1, y, x + 1, y, col); }
    }
    const [fx, fy] = q[q.length - 1];
    g.rect(fx - 1, fy, fx + 2, fy, shoe);
    if (fy + 1 < SH) g.rect(fx - 1, fy + 1, fx + 2, fy + 1, c.sole);
  };
  const [far, near] = RUN_LEGS[P.run];
  leg(far, sh(c.pants, 0.8), sh(c.shoe, 0.8));
  g.rect(9, top, 14, top, c.pants);
  leg(near, c.pants, c.shoe);
  // inclina a cabeça um pixel para frente
  const lean = m => { const n = new Map(); for (const [k, v] of m) { const X = k % SW, Y = Math.floor(k / SW); n.set(Y < 15 + b && X + 1 < SW ? k + 1 : k, v); } return n; };
  g.p = lean(g.p); g.fx = lean(g.fx);
  return g;
};

// heróis são só a aparência; quem define o ataque é a arma que você pega no mapa
CHARS.forEach(c => { c.weapon = () => {}; c.fists = false; });
