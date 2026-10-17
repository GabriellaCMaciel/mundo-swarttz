// O mapa do mundo: uma segunda tábua de madeira ao lado da placa "Sobre" (perto do ponto de partida), com o mapa de cima do mundo inteiro
// e um X vermelho no lugar onde a pessoa está AGORA.
//
// CONCEITOS DESTE ARQUIVO
//  - Mapa = escala + translação: um ponto do mundo (x, z) vira um pixel do desenho por  px = cx + x·k  e  py = cy + z·k,
//    onde k = (raio do mapa em pixels) ÷ (raio do mundo). O norte fica em cima porque o "fundo" do mundo é o lado -z.
//  - Desenhar em duas camadas: a parte parada (terreno, trilhas, nomes) é desenhada UMA vez num canvas "base"; a cada atualização só se
//    copia a base e se desenha o X por cima. Assim o custo é pequeno e a textura só é reenviada à placa de vídeo quando a pessoa se mexe.
//  - Só atualiza quando alguém consegue ver a tábua (perto dela): longe, não gasta nada.
'use strict';

const WMAP = { W: 640, H: 560, cx: 320, cy: 300, R: 232, world: 90, board: [8, 1], upd: 0, lx: 1e9, lz: 1e9, ctx: null, tex: null, base: null };
const mapPx = (x, z) => [WMAP.cx + x * WMAP.R / WMAP.world, WMAP.cy + z * WMAP.R / WMAP.world];

function drawMapBase() { // a parte parada do mapa (uma vez só)
  const c = document.createElement('canvas'); c.width = WMAP.W; c.height = WMAP.H; const x = c.getContext('2d');
  x.fillStyle = '#f1e4c8'; x.fillRect(0, 0, WMAP.W, WMAP.H);                                  // papel
  x.strokeStyle = '#2a1745'; x.lineWidth = 6; x.strokeRect(5, 5, WMAP.W - 10, WMAP.H - 10);       // moldura de tinta
  const [ox, oy] = [WMAP.cx, WMAP.cy], R = WMAP.R;
  x.beginPath(); x.arc(ox, oy, R, 0, 6.3); x.fillStyle = '#d9c7ef'; x.fill();                     // o mundo (roxo claro, igual ao chão)
  x.beginPath(); x.arc(ox, oy, R, 0, 6.3); x.arc(ox, oy, R * 84 / 90, 0, 6.3, true); x.fillStyle = '#4a9a6e'; x.fill(); // anel verde = a muralha de árvores
  for (let i = 0; i < 90; i++) { const a = i / 90 * 6.283, r = R * 0.965; x.beginPath(); x.arc(ox + Math.cos(a) * r, oy + Math.sin(a) * r, 5.5, 0, 6.3); x.fillStyle = i % 3 ? '#2f7a56' : '#a7467f'; x.fill(); }
  x.lineWidth = 3; x.strokeStyle = '#2a1745'; x.beginPath(); x.arc(ox, oy, R, 0, 6.3); x.stroke();
  // trilhas (fio de bordado) do ponto de partida até cada zona
  const [sx, sy] = mapPx(0, 6);
  zones.forEach(z => { const [zx, zy] = mapPx(z.pos[0], z.pos[2]); x.setLineDash([9, 7]); x.lineWidth = 3.5; x.strokeStyle = hex(z.color); x.beginPath(); x.moveTo(sx, sy); x.lineTo(zx, zy); x.stroke(); });
  x.setLineDash([]);
  // lagoa, cerejeira e balanço
  const [px, py] = mapPx(POND.x, POND.z); x.beginPath(); x.ellipse(px, py, POND.r * WMAP.R / WMAP.world * 1.5, POND.r * WMAP.R / WMAP.world * 1.2, 0, 0, 6.3); x.fillStyle = '#4fa8d8'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = '#1d5f8a'; x.stroke();
  const [cx, cy] = mapPx(CHERRY.x, CHERRY.z); x.beginPath(); x.arc(cx, cy, 9, 0, 6.3); x.fillStyle = '#ff8fbf'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = '#a23a72'; x.stroke();
  const [bx, by] = mapPx(SWING.x, SWING.z); x.beginPath(); x.arc(bx, by, 8, 0, 6.3); x.fillStyle = '#7fd6a0'; x.fill(); x.stroke();
  // nomes: letra escura sobre uma etiqueta clara (contraste alto, legível em qualquer parte do mapa)
  x.font = '800 22px Nunito, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const tag = (t, mx, my, dy, col) => {
    const w = x.measureText(t).width + 14; x.fillStyle = 'rgba(255,250,240,.94)'; x.fillRect(mx - w / 2, my + dy - 14, w, 28);
    x.lineWidth = 2; x.strokeStyle = col; x.strokeRect(mx - w / 2, my + dy - 14, w, 28); x.fillStyle = '#2a1745'; x.fillText(t, mx, my + dy + 1);
  };
  zones.forEach(z => { const [zx, zy] = mapPx(z.pos[0], z.pos[2]); x.beginPath(); x.arc(zx, zy, 13, 0, 6.3); x.fillStyle = hex(z.color); x.fill(); x.lineWidth = 3.5; x.strokeStyle = '#2a1745'; x.stroke(); });
  zones.forEach(z => { const [zx, zy] = mapPx(z.pos[0], z.pos[2]); tag(z.id === 'selos' ? 'Selos' : z.name, zx, zy, z.id === 'biblioteca' || z.id === 'sobre' || z.id === 'atelie' ? -28 : 28, hex(z.color)); });
  tag('Lagoa', px, py, 26, '#1d5f8a'); tag('Cerejeira', cx, cy, -24, '#a23a72'); tag('Balanço', bx, by, -22, '#2f7a56');
  x.fillStyle = '#2a1745'; x.font = '800 26px Nunito, system-ui, sans-serif'; x.textAlign = 'left'; x.fillText('Mapa do Mundo Swarttz', 22, 30);
  x.font = '700 17px Nunito, system-ui, sans-serif'; x.textAlign = 'right'; x.fillText('N ↑', WMAP.W - 22, 30);
  return c;
}

function buildWorldMap(g) { // chamada por props.sobre (zones.js): monta a segunda tábua ao lado da placa "Sobre"
  const bx = 6.45; // à direita da placa (que mede 5,5 de largura)
  WMAP.base = drawMapBase();
  const cv = document.createElement('canvas'); cv.width = WMAP.W; cv.height = WMAP.H; WMAP.ctx = cv.getContext('2d'); WMAP.ctx.drawImage(WMAP.base, 0, 0);
  WMAP.tex = new THREE.CanvasTexture(cv); WMAP.tex.anisotropy = 4;
  box(5.2, 4.2, 0.18, 0x3a2350, bx, 3.0, 0, g);                                                    // tábua de fundo
  box(5.5, 0.16, 0.28, 0x6b4a2f, bx, 5.18, 0, g); box(5.5, 0.16, 0.28, 0x6b4a2f, bx, 0.82, 0, g);       // moldura de madeira
  [-2.67, 2.67].forEach(dx => box(0.16, 4.5, 0.28, 0x6b4a2f, bx + dx, 3.0, 0, g));
  [-2, 2].forEach(dx => box(0.16, 1.0, 0.16, 0x6b4a2f, bx + dx, 0.5, -0.2, g));                      // pés
  const map = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8 * WMAP.H / WMAP.W), new THREE.MeshBasicMaterial({ map: WMAP.tex }));
  map.position.set(bx, 3.0, 0.12); g.add(map);
  [[-2.2, 1.9, 0.5], [2.2, 1.9, -0.5]].forEach(([dx, dy, r]) => { // fitas adesivas nos cantos, como na foto
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshBasicMaterial({ color: 0xff5fa2, transparent: true, opacity: 0.82, side: THREE.DoubleSide }));
    t.position.set(bx + dx, 3.0 + dy, 0.14); t.rotation.z = r; g.add(t);
  });
}

function updateWorldMap(now) { // chamada todo quadro: redesenha só quando a pessoa está perto da tábua e andou
  if (!WMAP.ctx || phase !== 'world') return;
  const dx = player.position.x - WMAP.board[0], dz = player.position.z - WMAP.board[1];
  if (dx * dx + dz * dz > 70 * 70) return; // longe: ninguém vê a tábua
  const moved = Math.hypot(player.position.x - WMAP.lx, player.position.z - WMAP.lz) > 0.7;
  const pulse = calm ? 0 : Math.floor(now * 3) % 2; // o X pisca devagarinho (parado se o usuário pediu menos movimento)
  if (!moved && pulse === WMAP.pl) return;
  if (now - WMAP.upd < 0.2) return; WMAP.upd = now; WMAP.pl = pulse; WMAP.lx = player.position.x; WMAP.lz = player.position.z;
  const x = WMAP.ctx; x.drawImage(WMAP.base, 0, 0);
  const [px, py] = mapPx(player.position.x, player.position.z), s = 13 + pulse * 3; // o X: duas pinceladas cruzadas, vermelhas com contorno branco
  x.lineCap = 'round';
  [[11, '#ffffff'], [6.5, '#d6204a']].forEach(([w, col]) => { x.lineWidth = w; x.strokeStyle = col; x.beginPath(); x.moveTo(px - s, py - s); x.lineTo(px + s, py + s); x.moveTo(px + s, py - s); x.lineTo(px - s, py + s); x.stroke(); });
  x.font = '800 20px Nunito, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const w = x.measureText('você está aqui').width + 14, ty = py + s + 20; x.fillStyle = '#d6204a'; x.fillRect(px - w / 2, ty - 13, w, 26); x.fillStyle = '#fff'; x.fillText('você está aqui', px, ty + 1);
  WMAP.tex.needsUpdate = true;
}
