// ===== Partículas: poeira, fumaça, faíscas e chamas =====

// ---------- partículas
let parts = [];
const DUST = ['#a9c2bd', '#6b8a88', '#3e5a5c'];
const SMOKE = ['#d9d2e6', '#9d93b0', '#6a6079', '#4b435a'];
const FLAME = ['#e9fff2', '#9dffc8', '#3fe08f', '#1c9a58'];
const POISON = ['#e9ffe0', '#9dff6a', '#4fb83a', '#2a6b1f'];
function addP(x, y, vx, vy, life, col, g = 0, size = 1) { parts.push({ x, y, vx, vy, life, max: life, col, g, size }); }
function burst(x, y, n, cols, sp = 1.5, g = 0, life = [10, 22], size = 1) {
  for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(.3, 1) * sp; addP(x, y, Math.cos(a) * v, Math.sin(a) * v, irand(life[0], life[1]), cols, g, size); }
}
function dust(x, y, n, dir = 0) { for (let i = 0; i < n; i++) addP(x + rand(-3, 3), y - 1, rand(-1, 1) + dir * rand(.3, 1), rand(-.7, -.1), irand(10, 20), DUST, .02); }
