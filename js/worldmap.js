// O mapa do mundo, no canto superior direito da tela: um círculo com o MESMO chão bordado do mundo (retalhos roxos, fio dourado, pontos-cruz
// rosa e confete), construçõezinhas fofas e um X vermelho que se mexe junto com a personagem. Tocar nele (ou apertar M) amplia o mapa e mostra o nome de cada lugar.
//
// CONCEITOS DESTE ARQUIVO
//  - Mapa = escala + translação: um ponto do mundo (x, z) vira um pixel por  px = cx + x·k  e  py = cy + z·k, com k = (tamanho do mapa em pixels) ÷ (tamanho
//    do mundo). O "norte" fica em cima porque o fundo do mundo (onde fica a biblioteca) é o lado -z, e a câmera olha para lá.
//  - Duas camadas: a ilustração (parada) é desenhada UMA vez num canvas "base"; a cada atualização só se copia a base e se desenha o X por cima.
//    O mapa pequeno e o grande são duas bases (a grande só nasce quando alguém a abre), com o mesmo desenho em escalas diferentes (u = S ÷ 640).
//  - Só atualiza quando mudou algo (a personagem andou ou o X pulsou), no máximo ~8 vezes por segundo, e nunca com um painel aberto (o loop está parado).
//  - Ilustração "despojada": nada aqui é proporcional de verdade. Os prédios são grandes demais para o mapa e as árvores são enfeite sorteado
//    (sementes fixas: mulberry32). É de propósito, como nos mapas de livros ilustrados.
//  - CÍRCULO: o canvas é quadrado, mas tudo é desenhado dentro de um recorte circular (clip) e o CSS arredonda o botão (border-radius 50%).
//  - O chão do mapa REUSA a textura do chão do mundo (patchTex, de world.js): um retalho dela = 20 unidades do mundo, então o desenho bate com o de verdade.
'use strict';

const WMAP = { open: false, base: {}, upd: 0, lx: 1e9, lz: 1e9, pl: -1, btn: null, cv: null, ctx: null, kind: 'small', S: 0, ready: false };
const MAP_CX = 0.5, MAP_CY = 0.5, MAP_K = 0.45 / 84; // centro (em frações do lado) e escala (fração do lado por unidade do mundo; 84 = WORLD_LIMIT)
const mapPt = (x, z, S) => [S * (MAP_CX + x * MAP_K), S * (MAP_CY + z * MAP_K)];

// os lugares que aparecem no mapa: x, z no mundo; ic = qual desenho; lab = de que lado fica o nome (u = em cima, d = embaixo, l, r)
function mapPlaces() {
  const zp = id => { const z = zones.find(o => o.id === id); return { x: z.pos[0], z: z.pos[2], name: id === 'selos' ? 'Selos' : z.name }; };
  return [
    { ...zp('sobre'), ic: 'sobre', lab: 'r', dx: 20 }, { ...zp('atelie'), ic: 'atelie', lab: 'l' }, { ...zp('biblioteca'), ic: 'biblioteca', lab: 'u' },
    { ...zp('selos'), ic: 'selos', lab: 'u' }, { ...zp('telefone'), ic: 'telefone', lab: 'd' }, { ...zp('cartas'), ic: 'cartas', lab: 'd' },
    { x: POND.x, z: POND.z, name: 'Lagoa', ic: 'lagoa', lab: 'r', dx: 18 }, { x: CHERRY.x, z: CHERRY.z, name: 'Cerejeira', ic: 'cerejeira', lab: 'u' },
    { x: SWING.x, z: SWING.z, name: 'Balanço', ic: 'balanco', lab: 'u', ox: 26 }, { x: TRAIL_START.x, z: TRAIL_START.z, name: 'Início', ic: 'inicio', lab: 'd', dy: 26 }
  ];
}

// ---------- pedacinhos de desenho ----------
function blobPath(x, cx, cy, R) { // a ilha: um círculo "amassado" por três ondas de seno
  x.beginPath();
  for (let i = 0; i <= 90; i++) { const t = i / 90 * 6.2832, r = R * (1 + 0.03 * Math.sin(3 * t + 0.6) + 0.02 * Math.sin(5 * t + 2.1) + 0.012 * Math.sin(9 * t)); i ? x.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r) : x.moveTo(cx + r, cy); }
  x.closePath();
}
function dot(x, px, py, r, c) { x.beginPath(); x.arc(px, py, r, 0, 6.3); x.fillStyle = c; x.fill(); }
function tinyTree(x, px, py, s, c1, c2) { // árvore de livro infantil: tronquinho + copa redonda com um brilho
  x.fillStyle = '#8a5a44'; x.fillRect(px - s * 0.12, py - s * 0.1, s * 0.24, s * 0.55);
  dot(x, px, py - s * 0.35, s * 0.5, c1); dot(x, px - s * 0.14, py - s * 0.5, s * 0.22, c2);
}
function bubble(x, text, px, py, u, side, color = '#3a2350') { // balãozinho de fala (como nos mapas de referência): fundo branco, ponta apontando para o lugar
  x.font = '800 ' + Math.round(24 * u) + 'px Nunito, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const w = x.measureText(text).width + 26 * u, h = 38 * u;
  let bx = px - w / 2, by = py - h / 2, tx = px, ty = py, p = [];
  if (side === 'u') { ty = by + h; p = [[px - 7 * u, ty - 1], [px + 7 * u, ty - 1], [px, ty + 9 * u]]; }
  else if (side === 'd') { p = [[px - 7 * u, by + 1], [px + 7 * u, by + 1], [px, by - 9 * u]]; }
  else if (side === 'l') { bx = px - w; by = py - h / 2; p = [[bx + w - 1, py - 7 * u], [bx + w - 1, py + 7 * u], [bx + w + 9 * u, py]]; }
  else { bx = px; p = [[bx + 1, py - 7 * u], [bx + 1, py + 7 * u], [bx - 9 * u, py]]; }
  x.save(); x.shadowColor = 'rgba(60,20,90,.28)'; x.shadowBlur = 8 * u; x.shadowOffsetY = 3 * u; x.fillStyle = '#fff';
  rrPath(x, bx, by, w, h, 14 * u); x.fill(); x.beginPath(); p.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); x.restore();
  x.fillStyle = color; x.fillText(text, bx + w / 2, by + h / 2 + 1.5 * u);
}

// Os desenhos dos lugares. Cada um é feito de formas simples e chapadas, centradas em (0,0), numa grade de uns 60x60 (depois escalada por u).
const MAP_ICONS = {
  inicio(x) { x.fillStyle = '#8a5a44'; x.fillRect(-2, -34, 4, 40); x.fillStyle = '#ff5fa2'; x.beginPath(); x.moveTo(2, -34); x.lineTo(28, -26); x.lineTo(2, -16); x.closePath(); x.fill(); dot(x, 0, 8, 7, '#f2b84b'); },
  sobre(x) { // placa de madeira com a foto e um bilhete
    x.fillStyle = '#8a5a3a'; x.fillRect(-20, 0, 5, 26); x.fillRect(15, 0, 5, 26);
    rrPath(x, -32, -32, 64, 44, 5); x.fillStyle = '#8a5a3a'; x.fill(); rrPath(x, -28, -28, 56, 36, 3); x.fillStyle = '#3a2350'; x.fill();
    x.fillStyle = '#f6ecd9'; x.fillRect(-24, -24, 24, 28); dot(x, -12, -14, 6, '#e8b99a'); x.fillStyle = '#5a3a2a'; x.beginPath(); x.arc(-12, -16, 6.5, 3.14, 6.28); x.fill(); x.fillRect(-18, -8, 12, 8);
    x.fillStyle = '#f6ecd9'; x.fillRect(4, -22, 20, 26); x.fillStyle = '#b79af5'; x.fillRect(8, -16, 12, 3); x.fillRect(8, -9, 12, 3); x.fillRect(8, -2, 8, 3);
    x.fillStyle = 'rgba(255,95,162,.9)'; x.fillRect(-26, -30, 12, 5);
  },
  atelie(x) { // cavalete com uma pintura colorida e um novelo de lã
    x.strokeStyle = '#8a5a3a'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(-14, 2); x.lineTo(-24, 26); x.moveTo(14, 2); x.lineTo(24, 26); x.moveTo(0, 2); x.lineTo(0, 26); x.stroke();
    rrPath(x, -22, -34, 44, 42, 4); x.fillStyle = '#fff6e2'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#8a5a3a'; x.stroke();
    x.lineWidth = 6; [['#ff5fa2', -14, -24, 6, -14], ['#f2b84b', -10, -10, 14, -22], ['#37d0c0', -4, -2, 14, -4], ['#7b3fe4', 2, -28, 14, -12]].forEach(([c, a, b, d, e]) => { x.strokeStyle = c; x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke(); });
    dot(x, 30, 22, 9, '#37d0c0'); x.strokeStyle = '#1f9a8c'; x.lineWidth = 2; x.beginPath(); x.arc(30, 22, 5, 0.5, 4); x.stroke();
  },
  biblioteca(x) { // casinha com um livro aberto gigante em cima (como o "Quests" da referência)
    x.fillStyle = '#b07a6c'; x.fillRect(-26, -4, 52, 30); x.fillStyle = '#8a5648'; x.fillRect(-26, 20, 52, 6);
    x.fillStyle = '#5b3530'; x.beginPath(); x.moveTo(-6, 26); x.lineTo(-6, 10); x.arc(0, 10, 6, 3.14, 6.28); x.lineTo(6, 26); x.closePath(); x.fill();
    x.fillStyle = '#ffe9a8'; x.fillRect(-20, 3, 8, 8); x.fillRect(12, 3, 8, 8);
    x.fillStyle = '#7a4a42'; x.beginPath(); x.moveTo(-36, -4); x.lineTo(-30, -16); x.lineTo(30, -16); x.lineTo(36, -4); x.closePath(); x.fill(); // capa do livro
    x.fillStyle = '#fff3dc'; x.beginPath(); x.moveTo(0, -8); x.lineTo(-32, -10); x.lineTo(-30, -38); x.quadraticCurveTo(-14, -42, 0, -32); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(0, -8); x.lineTo(32, -10); x.lineTo(30, -38); x.quadraticCurveTo(14, -42, 0, -32); x.closePath(); x.fill();
    x.strokeStyle = '#f0a8c0'; x.lineWidth = 2.5; [[-26, -30], [-26, -23], [-26, -16]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(-14, b - 4, -4, b + 1); x.moveTo(-a, b); x.quadraticCurveTo(14, b - 4, 4, b + 1); x.stroke(); });
  },
  selos(x) { // um selo postal com a borda picotada
    x.fillStyle = '#fff6e2'; rrPath(x, -26, -32, 52, 62, 3); x.fill();
    for (let i = 0; i < 7; i++) { const px = -22 + i * 7.3; dot(x, px, -32, 3.2, '#b48fd8'); dot(x, px, 30, 3.2, '#b48fd8'); }
    for (let i = 0; i < 8; i++) { const py = -26 + i * 7.6; dot(x, -26, py, 3.2, '#b48fd8'); dot(x, 26, py, 3.2, '#b48fd8'); }
    const g = x.createLinearGradient(-18, -24, 18, 22); g.addColorStop(0, '#7b3fe4'); g.addColorStop(1, '#ff5fa2'); rrPath(x, -18, -24, 36, 46, 3); x.fillStyle = g; x.fill();
    dot(x, 7, -10, 5, '#ffe08a'); x.fillStyle = '#fff6e2'; x.beginPath(); x.moveTo(-18, 22); x.lineTo(-6, 0); x.lineTo(4, 14); x.lineTo(10, 6); x.lineTo(18, 22); x.closePath(); x.fill();
  },
  telefone(x) { // celular com três bolinhas de contato em volta (LinkedIn, e-mail e GitHub)
    rrPath(x, -15, -34, 30, 60, 8); x.fillStyle = '#4254d8'; x.fill(); rrPath(x, -11, -27, 22, 46, 4); x.fillStyle = '#8a60e0'; x.fill();
    rrPath(x, -8, -20, 7, 7, 2); x.fillStyle = '#fff'; x.fill(); rrPath(x, 1, -20, 7, 7, 2); x.fillStyle = '#ff5fa2'; x.fill(); x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(-8, -8, 16, 3); x.fillRect(-8, -2, 12, 3);
    dot(x, -26, -8, 7, '#3d7bff'); dot(x, 26, -16, 7, '#8b4cf0'); dot(x, 27, 12, 6, '#2b1b4d');
  },
  cartas(x) { // casinha rosa com caixa de correio na frente
    x.fillStyle = '#f7d9e2'; x.fillRect(-26, -6, 52, 32); x.fillStyle = '#d6527f'; x.beginPath(); x.moveTo(-32, -6); x.lineTo(0, -34); x.lineTo(32, -6); x.closePath(); x.fill();
    x.fillStyle = '#8a5a44'; x.fillRect(-18, 6, 12, 20); x.fillStyle = '#ffe9a8'; x.fillRect(4, 2, 12, 11);
    x.fillStyle = '#8a5a3a'; x.fillRect(27, 4, 4, 22); rrPath(x, 21, -6, 18, 12, 4); x.fillStyle = '#ff7eb6'; x.fill(); x.fillStyle = '#e03a3a'; x.fillRect(37, -10, 3, 8);
  },
  lagoa(x) { // peixinhos laranja na água (a lagoa em si é desenhada à parte, como mancha)
    [[-10, -2, 1], [12, 8, -1]].forEach(([a, b, d]) => { x.fillStyle = '#ff8a3c'; x.beginPath(); x.ellipse(a, b, 9, 5, 0, 0, 6.3); x.fill(); x.beginPath(); x.moveTo(a - d * 8, b); x.lineTo(a - d * 15, b - 6); x.lineTo(a - d * 15, b + 6); x.closePath(); x.fill(); dot(x, a + d * 4, b - 1, 1.5, '#3a2350'); });
  },
  cerejeira(x) { // árvore de flor-de-cerejeira
    x.fillStyle = '#8a5a44'; x.fillRect(-4, -4, 8, 30); [[0, -22, 20, '#f4a6c9'], [-15, -12, 13, '#ff8fbf'], [15, -12, 13, '#ff8fbf'], [0, -34, 12, '#ffd0e2']].forEach(([a, b, r, c]) => dot(x, a, b, r, c));
    [[-8, -26], [10, -20], [-18, -10], [4, -38], [18, -8]].forEach(([a, b]) => dot(x, a, b, 2.2, '#fff6f9'));
  },
  balanco(x) { // árvore com um balanço pendurado
    x.fillStyle = '#8a5a44'; x.fillRect(-4, -8, 9, 36); [[0, -24, 19, '#4fa85a'], [-14, -16, 12, '#5cb85c'], [15, -14, 12, '#5cb85c']].forEach(([a, b, r, c]) => dot(x, a, b, r, c)); dot(x, -6, -30, 7, '#7fd68c');
    x.strokeStyle = '#d9b98c'; x.lineWidth = 2; x.beginPath(); x.moveTo(-12, -6); x.lineTo(-12, 16); x.moveTo(-26, -6); x.lineTo(-26, 16); x.stroke(); x.fillStyle = '#c99a62'; x.fillRect(-30, 16, 22, 4);
  }
};

function drawMapBase(S, labels) { // a ilustração inteira (parada), desenhada UMA vez
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), u = S / 640, rnd = mulberry32(31);
  const cx = S * MAP_CX, cy = S * MAP_CY, R = S * 0.5, mp = (a, b) => mapPt(a, b, S);
  x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.clip();                                // tudo abaixo fica DENTRO do círculo
  const L = 20 * MAP_K * S;                                                                      // tamanho de um retalho (20 unidades do mundo) em pixels do mapa
  for (let i = -Math.ceil(0.5 / (20 * MAP_K)); i <= Math.ceil(0.5 / (20 * MAP_K)); i++) for (let j = -Math.ceil(0.5 / (20 * MAP_K)); j <= Math.ceil(0.5 / (20 * MAP_K)); j++) x.drawImage(patchTex.image, cx + i * L, cy + j * L, L + 0.5, L + 0.5); // o mesmo chão bordado do mundo
  x.fillStyle = 'rgba(183,154,245,.14)'; x.fillRect(0, 0, S, S);                                // um véu lilás clarinho para os desenhos aparecerem melhor
  const cf = ['#ff5fa2', '#f2b84b', '#37d0c0', '#b79af5', '#f08a3c', '#f6ecd9'];
  for (let i = 0; i < (labels ? 70 : 40); i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * R * 0.92; x.save(); x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.rotate(rnd() * 3); x.fillStyle = cf[i % 6]; x.fillRect(-4 * u, -1.4 * u, 8 * u, 2.8 * u); x.restore(); } // confete, como no chão do mundo
  x.restore();
  x.setLineDash([12 * u, 9 * u]); x.lineWidth = 3 * u; x.strokeStyle = 'rgba(242,184,75,.85)'; x.beginPath(); x.arc(cx, cy, R - 9 * u, 0, 6.2832); x.stroke(); x.setLineDash([]); // costura dourada em volta, como a do chão
  const pl = mapPlaces();
  // lagoa (mancha azul)
  const [lx, ly] = mp(POND.x, POND.z); x.beginPath(); x.ellipse(lx, ly, 46 * u, 33 * u, 0.15, 0, 6.3); x.fillStyle = '#5fb7e0'; x.fill(); x.beginPath(); x.ellipse(lx - 6 * u, ly - 5 * u, 34 * u, 22 * u, 0.15, 0, 6.3); x.fillStyle = '#7fcdee'; x.fill();
  // árvores de enfeite, sorteadas, longe dos lugares e das trilhas
  const near = (a, b, r) => pl.some(p => { const [q, w] = mp(p.x, p.z); return Math.hypot(a - q, b - w) < r; });
  const tc = [['#2f8f6b', '#4cb88a'], ['#247a5a', '#3aa17a'], ['#3aa17a', '#6fd0a8'], ['#e58ab8', '#f4a6c9']]; // as cores das árvores do mundo (verde-azulado e rosa de cerejeira)
  for (let i = 0, n = 0; i < 900 && n < (labels ? 46 : 36); i++) {
    const a = rnd() * 6.28, r = Math.sqrt(rnd()) * R * 0.8, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r, wx = (px / S - MAP_CX) / MAP_K, wz = (py / S - MAP_CY) / MAP_K;
    if (near(px, py, 58 * u) || Math.hypot(px - lx, py - ly) < 62 * u) continue;
    const k = tc[(rnd() * tc.length) | 0]; tinyTree(x, px, py + 8 * u, (20 + rnd() * 12) * u, k[0], k[1]); n++;
  }
  for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * R * 0.85, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; if (near(px, py, 44 * u)) continue; dot(x, px, py, 3 * u, i % 3 ? '#fff' : '#ff6f8f'); } // florzinhas
  // os lugares (desenhos maiores no mapa pequeno, onde não cabem nomes)
  const sc = labels ? 1 : 1.35;
  pl.forEach(p => { const [a, b] = mp(p.x, p.z); x.save(); x.translate(a, b); x.scale(u * sc, u * sc); x.shadowColor = 'rgba(60,30,40,.3)'; x.shadowBlur = 5; x.shadowOffsetY = 3; MAP_ICONS[p.ic](x); x.restore(); });
  if (labels) pl.forEach(p => { // nomes em balõezinhos
    const [a, b] = mp(p.x, p.z), off = 44 * u + (p.dy || 0) * u, off2 = 36 * u + (p.dx || 0) * u;
    const ox = (p.ox || 0) * u; // ox: empurra o balão para o lado (evita sobrepor o vizinho)
    if (p.lab === 'u') bubble(x, p.name, a + ox, b - off - 14 * u, u, 'u'); else if (p.lab === 'd') bubble(x, p.name, a + ox, b + off + 12 * u, u, 'd');
    else if (p.lab === 'r') bubble(x, p.name, a + off2, b - 4 * u, u, 'r'); else bubble(x, p.name, a - off2, b - 4 * u, u, 'l');
  });
  if (labels) { x.font = '800 ' + Math.round(22 * u) + 'px Nunito, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff6e2'; x.fillText('N ↑', cx, 30 * u); } // só o norte (o título "Mundo Swarttz" saiu do mapa ampliado)
  return c;
}

// ---------- o mapa na tela ----------
function mapSize() { return WMAP.open ? Math.min(innerWidth * 0.92, innerHeight * 0.66, 460) : (innerWidth <= 640 ? 92 : 116); } // tamanho em pixels da tela (CSS)
function mapPick() { // escolhe/recria a base certa e acerta o tamanho do canvas visível
  const css = Math.round(mapSize()), dpr = Math.min(window.devicePixelRatio || 1, 2), S = Math.round(css * dpr), kind = WMAP.open ? 'big' : 'small';
  const key = kind + S; if (!WMAP.base[key]) { WMAP.base = {}; WMAP.base[key] = drawMapBase(S, WMAP.open); } // só guarda a base em uso (a outra é refeita quando precisar)
  WMAP.cv.width = WMAP.cv.height = S; WMAP.cv.style.width = WMAP.cv.style.height = css + 'px'; WMAP.S = S; WMAP.kind = kind; WMAP.key = key;
  WMAP.lx = 1e9; WMAP.pl = -1;
}
function setMapOpen(on) {
  if (!WMAP.ready) return; WMAP.open = on; WMAP.btn.setAttribute('aria-expanded', on ? 'true' : 'false'); WMAP.btn.classList.toggle('big', on);
  WMAP.btn.setAttribute('aria-label', on ? 'Mapa do mundo, ampliado. Aperte para diminuir.' : 'Mapa do mundo, com um X onde você está. Aperte para ampliar e ver os nomes dos lugares.');
  mapPick(); updateWorldMap(clock.elapsedTime, true); if (!rafId) renderer.render(scene, camera);
}
function buildWorldMap() { // chamada ao entrar no mundo (ui.js > startWorld)
  WMAP.btn = document.getElementById('minimap'); WMAP.cv = document.getElementById('mmCanvas'); WMAP.ctx = WMAP.cv.getContext('2d');
  WMAP.btn.hidden = false; WMAP.ready = true; mapPick(); updateWorldMap(clock.elapsedTime, true);
  WMAP.btn.addEventListener('click', () => setMapOpen(!WMAP.open));
  // com o mapa ampliado, clicar/tocar em QUALQUER lugar fora dele só fecha o mapa (a fase de captura chega antes do clique-para-andar, e o stopPropagation impede que a personagem ande por causa desse clique)
  window.addEventListener('pointerdown', e => { if (WMAP.open && !WMAP.btn.contains(e.target)) { e.stopPropagation(); e.preventDefault(); setMapOpen(false); } }, true);
  window.addEventListener('resize', () => { if (WMAP.ready) { mapPick(); updateWorldMap(clock.elapsedTime, true); } });
}

function updateWorldMap(now, force) { // chamada todo quadro: redesenha só quando a personagem andou ou o X pulsou
  if (!WMAP.ready || (phase !== 'world')) return;
  const moved = Math.hypot(player.position.x - WMAP.lx, player.position.z - WMAP.lz) > 0.5;
  const pulse = calm ? 0 : Math.floor(now * 3) % 2; // o X pisca devagarinho (parado se o usuário pediu menos movimento)
  if (!force && !moved && pulse === WMAP.pl) return;
  if (!force && now - WMAP.upd < 0.12) return; WMAP.upd = now; WMAP.pl = pulse; WMAP.lx = player.position.x; WMAP.lz = player.position.z;
  const x = WMAP.ctx, S = WMAP.S, u = S / 640 * (WMAP.open ? 1 : 1.25);
  x.drawImage(WMAP.base[WMAP.key], 0, 0);
  const [px, py] = mapPt(player.position.x, player.position.z, S), s = (11 + pulse * 3) * u; // o X: duas pinceladas cruzadas, vermelhas com contorno branco
  x.lineCap = 'round';
  [[11 * u, '#ffffff'], [6 * u, '#e0183f']].forEach(([w, col]) => { x.lineWidth = w; x.strokeStyle = col; x.beginPath(); x.moveTo(px - s, py - s); x.lineTo(px + s, py + s); x.moveTo(px + s, py - s); x.lineTo(px - s, py + s); x.stroke(); });
  if (WMAP.open) { x.font = '800 ' + Math.round(20 * u) + 'px Nunito, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const t = 'você está aqui', w = x.measureText(t).width + 18 * u, ty = py + s + 24 * u; x.fillStyle = '#e0183f'; rrPath(x, px - w / 2, ty - 15 * u, w, 30 * u, 10 * u); x.fill(); x.fillStyle = '#fff'; x.fillText(t, px, ty + 1); }
  WMAP.hasX = true;
}
