// O CINEMA DRIVE-IN: uma tela gigante que "passa" um filme por projeto, carrinhos estacionados (cada um é um projeto) e a cabine do projetor.
// Os dados dos filmes ficam em js/config.js (a lista `films`); este arquivo só constrói o cenário e anima a tela.
//
// CONCEITOS DESTE ARQUIVO
//  - TEXTURA DE CANVAS ANIMADA SEM CUSTO: a tela é um desenho de Canvas 2D (como um cartaz). Em vez de redesenhar a 60 quadros por segundo,
//    a gente redesenha SÓ quando o filme muda (drawFilm) e usa o brilho do material (color) para o "tremido" do projetor. Barato e bonito.
//  - FEIXE DE LUZ: um cone aberto (sem tampa), translúcido e com mistura ADITIVA (as cores somam, como luz de verdade) que sai do projetor até a tela.
//    Object3D.lookAt() gira um grupo para a frente dele (+z) apontar para um ponto: assim o cone acerta a tela sem fazer conta de ângulo.
//  - REAPROVEITAMENTO: as rodas, a geometria dos carrinhos e as lâmpadas do letreiro são compartilhadas (uma geometria, várias cópias).
'use strict';

const CIN = {
  sw: 13, sh: 6.8, sy: 6.4, sz: -9.2, // largura/altura da tela, altura do centro dela e onde ela fica (z local da zona; a frente da zona é +z)
  rows: [-2.4, 3.0], cols: [-5.2, 0, 5.2], // onde os carrinhos estacionam (duas fileiras de três)
  idx: 0, hold: 0, flash: 0, SHOW: 5.5, built: false, cars: []
};
const filmHex = c => '#' + c.toString(16).padStart(6, '0'); // (hex() de zones.js ainda não existe quando esta página carrega)

// quebra um texto em linhas que cabem em maxW pixels (o Canvas 2D não quebra linha sozinho)
function cinWrap(x, text, maxW) {
  const out = []; let line = '';
  text.split(' ').forEach(w => {
    const t = line ? line + ' ' + w : w;
    if (line && x.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
  });
  if (line) out.push(line);
  return out;
}
const cinRR = (x, a, b, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); };

// O cartaz do filme na tela grande. Textos GRANDES: a tela é vista de longe (título 120 px, frase 40 px, tecnologias 30 px).
function drawFilm(i) {
  const f = films[i], x = CIN.cx, W = CIN.cv.width, H = CIN.cv.height, n = films.length;
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, filmHex(f.color)); g.addColorStop(1, filmHex(f.color2));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,0.13)'; x.lineWidth = 3; // pontos-cruz bordados de fundo, como no chão do mundo
  for (let a = 30; a < W; a += 62) for (let b = 80; b < H - 40; b += 62) { x.beginPath(); x.moveTo(a - 7, b - 7); x.lineTo(a + 7, b + 7); x.moveTo(a + 7, b - 7); x.lineTo(a - 7, b + 7); x.stroke(); }
  x.fillStyle = '#0b0613'; x.fillRect(0, 0, W, 40); x.fillRect(0, H - 44, W, 44); // faixas escuras do rolo de filme, com os furinhos
  x.fillStyle = '#f6ecd9'; for (let a = 14; a < W; a += 44) { cinRR(x, a, 11, 22, 18, 4); x.fill(); cinRR(x, a, H - 31, 22, 18, 4); x.fill(); }
  x.fillStyle = 'rgba(11,6,19,0.78)'; cinRR(x, 40, 62, W - 80, H - 62 - 70, 26); x.fill(); // painel escuro atrás do texto: contraste sobre qualquer cor
  // selo de status + contagem
  x.font = '800 30px "JetBrains Mono", monospace'; x.textBaseline = 'middle';
  const st = f.status.toUpperCase(), sw = x.measureText(st).width + 44;
  x.fillStyle = '#f2b84b'; cinRR(x, 70, 84, sw, 48, 24); x.fill();
  x.fillStyle = '#0b0613'; x.textAlign = 'left'; x.fillText(st, 92, 109);
  x.fillStyle = '#f6ecd9'; x.textAlign = 'right'; x.fillText((i + 1) + ' / ' + n + '  ·  ' + f.year, W - 70, 109);
  // título: encolhe até caber
  let fs = 124; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  do { x.font = '800 ' + fs + 'px Syne, system-ui, sans-serif'; fs -= 4; } while (x.measureText(f.title).width > W - 150 && fs > 48);
  x.fillStyle = '#f6ecd9'; x.fillText(f.title, 70, 255);
  // frase
  x.font = '800 40px Nunito, system-ui, sans-serif'; x.fillStyle = '#e6d9ff';
  cinWrap(x, f.tagline, W - 150).slice(0, 2).forEach((l, k) => x.fillText(l, 70, 318 + k * 50));
  // tecnologias
  x.font = '800 30px "JetBrains Mono", monospace'; let cx = 70;
  for (const s of f.stack) {
    const w = x.measureText(s).width + 36; if (cx + w > W - 70) break;
    x.strokeStyle = '#f2b84b'; x.lineWidth = 3; cinRR(x, cx, 396, w, 46, 23); x.stroke();
    x.fillStyle = '#f6ecd9'; x.textBaseline = 'middle'; x.fillText(s, cx + 18, 420); x.textBaseline = 'alphabetic'; cx += w + 12;
  }
  for (let k = 0; k < n; k++) { // bolinhas de "qual filme está passando"
    x.fillStyle = k === i ? '#f6ecd9' : 'rgba(246,236,217,0.28)'; x.beginPath(); x.arc(W / 2 + (k - (n - 1) / 2) * 34, H - 22, k === i ? 9 : 6, 0, 6.3); x.fill();
  }
  CIN.tex.needsUpdate = true;
}

// Troca o filme da tela. hold = quantos segundos ele fica antes do próximo (escolher no painel segura por mais tempo).
function cinemaShow(i, hold) {
  if (!CIN.built) return;
  CIN.idx = (i + films.length) % films.length; CIN.hold = hold || CIN.SHOW; CIN.flash = 1; // flash = o "liga" do projetor: a tela escurece e volta
  drawFilm(CIN.idx);
  CIN.glow.material.color.setHex(films[CIN.idx].color);
  const car = CIN.cars[CIN.idx]; if (car) CIN.spot.position.set(car.position.x, 2.4, car.position.z);
}

// ----- um carrinho de brinquedo: a frente aponta para a tela (-z); a traseira, que a câmera vê, leva a placa com o nome do filme -----
function plateTex(text) {
  return canvasTex(192, 72, (x, w, h) => {
    x.fillStyle = '#f6ecd9'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7b3fe4'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
    let fs = 40; do { x.font = '800 ' + fs + 'px "JetBrains Mono", monospace'; fs -= 2; } while (x.measureText(text).width > w - 28 && fs > 14);
    x.fillStyle = '#241538'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 2);
  });
}
function buildCar(f, wheelGeo, wheelMat) {
  const c = new THREE.Group();
  box(2.0, 0.6, 3.8, f.color, 0, 0.62, 0, c);                       // carroceria
  box(2.02, 0.09, 3.4, f.color2, 0, 0.66, 0.05, c);                 // faixa pintada na lateral
  box(1.8, 0.56, 1.9, f.color, 0, 1.18, 0.35, c);                   // cabine
  const glassCol = new THREE.Color(f.color).multiplyScalar(0.3).lerp(new THREE.Color(0x2a1745), 0.4); // vidros escuros com um fiapo da cor do filme
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.4, 1.94), new THREE.MeshBasicMaterial({ color: glassCol })); glass.position.set(0, 1.22, 0.35); c.add(glass);
  box(2.06, 0.16, 0.12, 0x2a1745, 0, 0.36, 1.9, c); box(2.06, 0.16, 0.12, 0x2a1745, 0, 0.36, -1.9, c); // para-choques
  [-1, 1].forEach(s => {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.06), new THREE.MeshBasicMaterial({ color: 0xff4d6d })); tail.position.set(s * 0.7, 0.74, 1.91); c.add(tail);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.06), new THREE.MeshBasicMaterial({ color: 0xffe9a8 })); head.position.set(s * 0.7, 0.74, -1.91); c.add(head);
    [-1.2, 1.2].forEach(z => { const w = new THREE.Mesh(wheelGeo, wheelMat); w.rotation.z = Math.PI / 2; w.position.set(s * 1.0, 0.34, z); c.add(w); });
  });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.36), new THREE.MeshBasicMaterial({ map: plateTex(f.plate) })); plate.position.set(0, 0.55, 1.97); c.add(plate);
  return c;
}

function buildCinema(g) {
  const W = CIN.sw, H = CIN.sh, SY = CIN.sy, SZ = CIN.sz, n = films.length;
  // ---- a tela ----
  CIN.cv = document.createElement('canvas'); CIN.cv.width = 1024; CIN.cv.height = Math.round(1024 * H / W); CIN.cx = CIN.cv.getContext('2d');
  CIN.tex = new THREE.CanvasTexture(CIN.cv); CIN.tex.anisotropy = 4;
  CIN.mat = new THREE.MeshBasicMaterial({ map: CIN.tex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), CIN.mat); screen.position.set(0, SY, SZ + 0.2); g.add(screen);
  box(W + 0.8, H + 0.8, 0.4, 0x1a0f2e, 0, SY, SZ - 0.05, g);                                   // moldura escura
  [[W + 1.1, 0.16, 0, H / 2 + 0.46], [W + 1.1, 0.16, 0, -H / 2 - 0.46]].forEach(([w, h, x, y]) => box(w, h, 0.5, 0xf2b84b, x, SY + y, SZ, g)); // frisos dourados
  [-1, 1].forEach(s => box(0.16, H + 1.1, 0.5, 0xf2b84b, s * (W / 2 + 0.46), SY, SZ, g));
  // base de alvenaria: uma lanchonete embaixo da tela, com janelinhas acesas
  box(W + 1.2, 2.9, 1.5, 0x3a2060, 0, 1.45, SZ + 0.05, g); box(W + 1.4, 0.2, 1.7, 0xff5fa2, 0, 2.95, SZ + 0.05, g);
  box(1.3, 2.0, 0.08, 0x241538, 0, 1.0, SZ + 0.83, g);
  [-4.4, -2.4, 2.4, 4.4].forEach(x => { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), new THREE.MeshBasicMaterial({ color: 0xffd98a })); w.position.set(x, 1.55, SZ + 0.81); g.add(w); box(1.5, 0.12, 0.1, 0xf6ecd9, x, 1.05, SZ + 0.85, g); });
  // letreiro de lâmpadas no topo da tela (instanciadas: um objeto só para todas)
  const bulbs = []; for (let k = 0; k < 17; k++) bulbs.push({ x: -W / 2 - 0.2 + k * (W + 0.4) / 16, y: SY + H / 2 + 0.78, z: SZ + 0.1, sx: 0.26, sy: 0.26, sz: 0.26, c: k % 2 ? 0xff5fa2 : 0xffd98a });
  g.add(instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), bulbs));
  CIN.glow = glowSprite(films[0].color, 20, 0.28); CIN.glow.position.set(0, SY, SZ + 1.5); g.add(CIN.glow); // o clarão da tela, na cor do filme
  // ---- o estacionamento: asfalto roxo com vagas pintadas e fio dourado, como o chão do mundo ----
  const PX = 24, PZ = 15, PZC = 1.2, PCX = 0;
  const asph = canvasTex(1024, 640, (x, w, h) => {
    const mx = a => (a + PX / 2) / PX * w, mz = a => (a - (PZC - PZ / 2)) / PZ * h;
    x.fillStyle = '#1b1030'; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 1400; k++) { x.fillStyle = k % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.16)'; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    x.strokeStyle = 'rgba(246,236,217,0.7)'; x.lineWidth = 5; x.setLineDash([]);
    [-7.8, -2.6, 2.6, 7.8].forEach(a => { [[-4.5, -0.3], [0.9, 5.1]].forEach(([z0, z1]) => { x.beginPath(); x.moveTo(mx(a), mz(z0)); x.lineTo(mx(a), mz(z1)); x.stroke(); }); });
    x.strokeStyle = 'rgba(242,184,75,0.85)'; x.lineWidth = 6; x.beginPath(); x.moveTo(mx(-7.8), mz(-4.5)); x.lineTo(mx(7.8), mz(-4.5)); x.stroke(); // linha de parada em frente à tela
    x.strokeStyle = 'rgba(255,95,162,0.7)'; x.lineWidth = 6; x.lineCap = 'round'; x.lineJoin = 'round'; // setas rosa no corredor, apontando para a tela
    for (let a = -9; a <= 9; a += 3) { x.beginPath(); x.moveTo(mx(a) - 12, mz(0.75)); x.lineTo(mx(a), mz(0.15)); x.lineTo(mx(a) + 12, mz(0.75)); x.stroke(); }
    x.strokeStyle = 'rgba(242,184,75,0.6)'; x.lineWidth = 4; x.setLineDash([16, 12]); x.strokeRect(10, 10, w - 20, h - 20); // fio dourado pontilhado na borda
  });
  asph.anisotropy = 4;
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(PX, PZ), new THREE.MeshLambertMaterial({ map: asph })); lot.rotation.x = -Math.PI / 2; lot.position.set(PCX, 0.04, PZC); lot.receiveShadow = true; g.add(lot);
  // ---- os carrinhos: um por filme ----
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.28, 12), wheelMat = lam(0x120b1c);
  films.forEach((f, i) => {
    const car = buildCar(f, wheelGeo, wheelMat);
    car.position.set(CIN.cols[i % 3], 0.04, CIN.rows[(i / 3) | 0]); car.rotation.y = (((i * 37) % 7) - 3) * 0.012; // um tantinho "torto", como carro estacionado de verdade
    car.userData.film = i; g.add(car); CIN.cars.push(car);
  });
  // postes de som entre as vagas (instanciados)
  const posts = [], spk = [];
  CIN.rows.forEach(rz => [-2.6, 2.6].forEach(px => { posts.push({ x: px, y: 0.65, z: rz - 1.6, sx: 0.1, sy: 1.3, sz: 0.1, c: 0x6b4a2f }); spk.push({ x: px, y: 1.25, z: rz - 1.6, sx: 0.46, sy: 0.34, sz: 0.22, c: 0xff5fa2 }); }));
  g.add(instanced(new THREE.BoxGeometry(1, 1, 1), lam(0xffffff), posts), instanced(new THREE.BoxGeometry(1, 1, 1), lam(0xffffff), spk));
  // marcador do filme em cartaz: uma luz que paira em cima do carrinho dele
  CIN.spot = glowSprite(0xf2b84b, 3.2, 0.7); g.add(CIN.spot);
  // ---- cabine do projetor, com o feixe de luz até a tela ----
  box(2.4, 1.7, 2.0, 0x8a5fd0, 0, 0.85, 9.6, g); box(2.5, 0.14, 2.1, 0xf2b84b, 0, 1.75, 9.6, g);
  box(1.1, 0.7, 1.3, 0x5a3a96, 0, 2.2, 9.5, g);
  const hw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ color: 0xffd98a })); hw.position.set(0, 1.0, 10.62); g.add(hw); // janelinha acesa da cabine
  box(1.1, 0.1, 0.12, 0xf6ecd9, 0, 0.66, 10.66, g);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.45, 12), new THREE.MeshBasicMaterial({ color: 0xfff2d6 })); lens.rotation.x = Math.PI / 2; lens.position.set(0, 2.2, 8.7); g.add(lens);
  const from = new THREE.Vector3(0, 2.2, 8.4), to = new THREE.Vector3(0, SY - 0.3, SZ + 0.2), L = from.distanceTo(to);
  const coneGeo = new THREE.ConeGeometry(4.6, L, 20, 1, true); coneGeo.translate(0, -L / 2, 0); coneGeo.rotateX(-Math.PI / 2); // ponta na origem, base a L de distância na direção +z
  const beam = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xfff2d6, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beam.scale.x = 1.4; beam.userData.flat = true;
  const beamRig = new THREE.Group(); beamRig.position.copy(from); beamRig.add(beam); g.add(beamRig); g.updateMatrixWorld(true); beamRig.lookAt(g.localToWorld(to.clone())); // lookAt usa coordenadas do MUNDO: por isso convertemos o ponto (e antes atualizamos a matriz do grupo, que ainda não foi desenhado)
  // ---- bilheteria e letreiro da entrada ----
  const bx = -11.5, bz = 7;
  box(2.4, 2.6, 2.0, 0xf6ecd9, bx, 1.3, bz, g);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.1, 4), lam(0xff5fa2)); roof.rotation.y = Math.PI / 4; roof.position.set(bx, 3.15, bz); g.add(roof);
  const bwin = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.85), new THREE.MeshBasicMaterial({ color: 0xffd98a })); bwin.position.set(bx, 1.55, bz + 1.02); g.add(bwin);
  box(1.5, 0.12, 0.3, 0x6b4a2f, bx, 1.1, bz + 1.1, g);
  const bsign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: canvasTex(440, 110, (x, w, h) => {
    x.fillStyle = '#241538'; x.fillRect(0, 0, w, h); x.strokeStyle = '#f2b84b'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
    x.fillStyle = '#f6ecd9'; x.font = '800 54px Syne, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BILHETERIA', w / 2, h / 2 + 2);
  }) })); bsign.position.set(bx, 2.35, bz + 1.02); g.add(bsign);
  const sx = 15.5, sz2 = 3.5; // poste do letreiro (neon), fora do estacionamento para não tapar a tela
  box(0.22, 4.4, 0.22, 0x1a0f2e, sx, 2.2, sz2, g);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.3), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#150a26'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ff5fa2'; x.lineWidth = 8; x.strokeRect(6, 6, w - 12, h - 12);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#f2b84b'; x.shadowBlur = 18; x.fillStyle = '#f2b84b'; x.font = '800 84px Syne, sans-serif'; x.fillText('DRIVE-IN', w / 2, 82);
    x.shadowColor = '#ff5fa2'; x.fillStyle = '#ff9bc7'; x.font = '800 56px Syne, sans-serif'; x.fillText('SWARTTZ', w / 2, 150);
    x.shadowBlur = 0; x.fillStyle = '#f6ecd9'; x.font = '800 24px "JetBrains Mono", monospace'; x.fillText('1 filme = 1 projeto', w / 2, 212);
  }) })); sign.position.set(sx, 4.9, sz2); sign.rotation.y = -0.35; g.add(sign);
  CIN.zone = zones.find(z => z.id === 'cinema'); CIN.built = true; cinemaShow(0, CIN.SHOW);
}

// Chamado todo quadro (ui.js): passa os filmes sozinho e faz o tremidinho do projetor.
function updateCinema(now, dt) {
  if (!CIN.built) return;
  const pl = typeof player !== 'undefined' ? player.position : null; // longe do cinema, nada é atualizado (economiza)
  if (pl && Math.hypot(pl.x - CIN.zone.pos[0], pl.z - CIN.zone.pos[2]) > 70) return;
  if (!calm) { CIN.hold -= dt; if (CIN.hold <= 0) cinemaShow(CIN.idx + 1, CIN.SHOW); }
  CIN.flash = Math.max(0, CIN.flash - dt * 2.4);
  CIN.mat.color.setScalar(Math.max(0.12, 0.93 + (calm ? 0 : Math.sin(now * 23) * 0.035) - CIN.flash * 0.8));
  CIN.spot.material.opacity = calm ? 0.7 : 0.55 + Math.sin(now * 3) * 0.2;
}
