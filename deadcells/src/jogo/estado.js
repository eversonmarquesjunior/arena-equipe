// ===== Estado da partida: variáveis que vários arquivos leem e mudam =====

// mode: 'title' | 'play' | 'pause' | 'exit' (passando pela porta) | 'dead' | 'won'
let heroIdx = 0, T = 0, mode = 'title', playT = 0, fade = 0, exitT = 0, deadT = 0, hitstop = 0, shake = 0, hurtFx = 0;
let enemies = [], items = [], nums = [], arrows = [], coins = [], frags = [], blasts = [], chests = [], ghosts = [];   // ghosts: rastro do avanço da katana
let coinCount = 0;
let aimPt = null, mouseScr = null;   // aimPt: ponto do mapa clicado para atacar; mouseScr: mouse na tela (para desenhar a mira)
// teletransporte na porta: brilha, estica num raio de luz e some
const EXIT_GLOW = 24, EXIT_GONE = 40, EXIT_END = 75;
const cam = { x: 0, y: 0, look: 0, floor: 0 };
// bioma atual: biome é o nome (chave em BIOMES) e L é o objeto dele (mapa, decoração, inimigos...)
let biome = 'masmorra', L = null;
let testMode = false;   // ambiente de teste (Esc > Teste): moedas infinitas e teleporte para qualquer bioma
const curDoor = () => L.door;
