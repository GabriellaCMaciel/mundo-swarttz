// O CINEMA DRIVE-IN da zona de projetos: cada "filme" é um projeto.
//  - O TELÃO passa as imagens (prints) do projeto que está em exibição.
//  - Os CARTAZES na parede, embaixo do telão, trazem as informações de cada filme (título, frase, status e tecnologias).
//  - Na BILHETERIA a pessoa escolhe o filme (setas 3D, botões na tela, as teclas [ e ] ou clicando num cartaz ou carrinho):
//    o telão, os cartazes, o letreiro e o ingresso mudam juntos, na hora.
// Os dados dos filmes ficam em js/config.js (lista `films`); aqui só estão o cenário e o comportamento.
//
// CONCEITOS DESTE ARQUIVO
//  - TEXTURA DE CANVAS: cada cartaz, o telão, o ingresso e os letreiros são desenhos de Canvas 2D usados como textura.
//    A gente só redesenha quando algo muda (filme novo, imagem que terminou de carregar, transição), então o custo é pequeno.
//  - TRANSIÇÃO (cross-fade): para trocar de imagem sem "pulo", desenha-se a imagem antiga e, por cima, a nova com opacidade
//    (globalAlpha) que vai de 0 a 1 em ~0,7 s.
//  - "COVER": para a imagem preencher o telão sem esticar, escala-se pelo MAIOR dos dois fatores (largura e altura) e centraliza-se.
//  - RAIO DE CLIQUE (raycaster): pick.js lança um "raio invisível" e, se ele acerta um cartaz, um carrinho ou uma seta da bilheteria,
//    chama cinemaSelect()/cinemaStep() em vez de abrir o painel.
'use strict';

const CIN = {
  sw: 12.6, sh: 7.1, sy: 7.2, sz: -9.2,        // tamanho do telão (16:9), altura do centro e onde fica (z local; a frente do cinema é +z)
  rows: [-2.4, 3.0], cols: [-5.2, 0, 5.2],     // onde os carrinhos estacionam (duas fileiras de três)
  booth: { x: -14.6, z: 2.6 },                 // onde fica a bilheteria (fora do estacionamento, à esquerda)
  idx: 0, si: 0, SLIDE: 4.5, slideT: 0, fade: 1, flash: 0, built: false,
  cars: [], posters: [], hits: [], imgs: [], cur: null, prev: null, ticketT: 1, near: false, hudOn: false
};
const filmHex = c => '#' + c.toString(16).padStart(6, '0'); // (hex() de zones.js ainda não existe quando esta página carrega)

// ---------- ajudantes de desenho ----------
const cinRR = (x, a, b, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); };
// escolhe o maior tamanho de fonte (de px até min) em que o texto CABE em maxW. Nada de palavra cortada: o texto encolhe até caber.
function cinFit(x, text, maxW, px, min, weight, family) {
  let s = px;
  for (; s > min; s -= 2) { x.font = weight + ' ' + s + 'px ' + family; if (x.measureText(text).width <= maxW) return s; }
  x.font = weight + ' ' + min + 'px ' + family; return min;
}
// quebra o texto em linhas que cabem em maxW (o Canvas 2D não quebra linha sozinho)
function cinWrap(x, text, maxW) {
  const out = []; let line = '';
  text.split(' ').forEach(w => { const t = line ? line + ' ' + w : w; if (line && x.measureText(t).width > maxW) { out.push(line); line = w; } else line = t; });
  if (line) out.push(line);
  return out;
}
// escolhe o maior tamanho em que o título cabe em até `maxLines` linhas, cada uma dentro de maxW
function cinTitle(x, text, maxW, maxLines, px, min, family) {
  for (let s = px; s >= min; s -= 2) {
    x.font = '800 ' + s + 'px ' + family; const L = cinWrap(x, text, maxW);
    if (L.length <= maxLines && L.every(l => x.measureText(l).width <= maxW)) return { size: s, lines: L };
  }
  x.font = '800 ' + min + 'px ' + family; return { size: min, lines: cinWrap(x, text, maxW) };
}
function cinCover(x, im, a) { // desenha a imagem preenchendo todo o canvas (sem esticar), com opacidade a
  const W = x.canvas.width, H = x.canvas.height, s = Math.max(W / im.width, H / im.height);
  x.globalAlpha = a; x.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s); x.globalAlpha = 1;
}
function cinStitch(x, W, H, step, alpha) { // pontos-cruz bordados de fundo, como no chão do mundo
  x.strokeStyle = 'rgba(255,255,255,' + alpha + ')'; x.lineWidth = 3;
  for (let a = step / 2; a < W; a += step) for (let b = step / 2; b < H; b += step) { x.beginPath(); x.moveTo(a - 6, b - 6); x.lineTo(a + 6, b + 6); x.moveTo(a + 6, b - 6); x.lineTo(a - 6, b + 6); x.stroke(); }
}
function cinClapper(x, cx, cy, s) { // claquete (o símbolo do cinema), usada onde ainda não há imagem
  x.save(); x.translate(cx, cy); x.scale(s, s);
  x.fillStyle = '#0b0613'; cinRR(x, -60, -20, 120, 78, 8); x.fill();
  x.fillStyle = '#f6ecd9'; cinRR(x, -60, -48, 120, 24, 5); x.fill();
  x.fillStyle = '#0b0613'; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(-50 + k * 30, -48); x.lineTo(-30 + k * 30, -48); x.lineTo(-44 + k * 30, -24); x.lineTo(-64 + k * 30, -24); x.closePath(); x.fill(); }
  x.strokeStyle = '#f6ecd9'; x.lineWidth = 5; x.beginPath(); x.moveTo(-34, 24); x.lineTo(34, 24); x.moveTo(-34, 40); x.lineTo(16, 40); x.stroke();
  x.restore();
}
const cinImgs = i => (CIN.imgs[i] || []).filter(im => im._ok); // imagens do filme i que já terminaram de carregar

// ---------- o telão ----------
function drawScreen() {
  const f = films[CIN.idx], x = CIN.cx, W = CIN.cv.width, H = CIN.cv.height, list = cinImgs(CIN.idx);
  if (!list.length) { // sem prints (projeto ainda não lançado): mostra o status, no estilo do cartaz
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, filmHex(f.color)); g.addColorStop(1, filmHex(f.color2));
    x.fillStyle = g; x.fillRect(0, 0, W, H); cinStitch(x, W, H, 64, 0.12);
    x.fillStyle = 'rgba(11,6,19,0.8)'; cinRR(x, W * 0.18, H * 0.16, W * 0.64, H * 0.68, 36); x.fill();
    cinClapper(x, W / 2, H * 0.36, 1.7);
    x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#f2b84b';
    const lab = f.status.toUpperCase(); cinFit(x, lab, W * 0.56, 118, 40, '800', 'Syne, system-ui, sans-serif'); x.fillText(lab, W / 2, H * 0.68); // o status inteiro (ex. LANÇAMENTO PREVISTO), medido para caber
    x.fillStyle = '#f6ecd9'; cinFit(x, f.title, W * 0.56, 60, 30, '800', 'Syne, system-ui, sans-serif'); x.fillText(f.title, W / 2, H * 0.78);
    CIN.cur = null;
  } else {
    const cur = list[CIN.si % list.length];
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    if (CIN.fade < 1 && CIN.prev) { cinCover(x, CIN.prev, 1); cinCover(x, cur, CIN.fade); } else cinCover(x, cur, 1);
    CIN.cur = cur;
  }
  CIN.tex.needsUpdate = true;
}

// ---------- os cartazes ("em cartaz"): as informações do filme ----------
const CPW = 440, CPH = 536; // tamanho do desenho do cartaz (px)
function drawPoster(i) {
  const f = films[i], c = CIN.posters[i].cv, x = c.getContext('2d'), W = CPW, H = CPH, FONT = 'Syne, system-ui, sans-serif', SANS = 'Nunito, system-ui, sans-serif';
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, filmHex(f.color)); g.addColorStop(1, filmHex(f.color2));
  x.fillStyle = g; x.fillRect(0, 0, W, H); cinStitch(x, W, H, 56, 0.13);
  // arte: o primeiro print do projeto (ou a claquete, se ainda não houver imagem)
  const ax = 20, ay = 20, aw = W - 40, ah = 214;
  x.save(); cinRR(x, ax, ay, aw, ah, 14); x.clip();
  const list = cinImgs(i);
  if (list.length) { const im = list[0], s = Math.max(aw / im.width, ah / im.height); x.drawImage(im, ax + (aw - im.width * s) / 2, ay + (ah - im.height * s) / 2, im.width * s, im.height * s); }
  else { x.fillStyle = '#1a0f2e'; x.fillRect(ax, ay, aw, ah); cinStitch(x, W, H, 56, 0.05); cinClapper(x, W / 2, ay + ah / 2 - 4, 1.35); }
  x.restore(); x.strokeStyle = '#f6ecd9'; x.lineWidth = 4; cinRR(x, ax, ay, aw, ah, 14); x.stroke();
  // selo de status sobre a arte (canto de baixo)
  x.font = '800 24px "JetBrains Mono", monospace'; const st = f.status.toUpperCase(), sw = x.measureText(st).width + 34;
  x.fillStyle = '#f2b84b'; cinRR(x, ax + 12, ay + ah - 52, sw, 40, 20); x.fill(); // embaixo à esquerda: não cobre o topo dos prints
  x.fillStyle = '#0b0613'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(st, ax + 29, ay + ah - 31);
  // painel escuro com o texto: contraste garantido sobre qualquer cor do cartaz
  x.fillStyle = 'rgba(11,6,19,0.86)'; cinRR(x, 14, ay + ah + 12, W - 28, H - (ay + ah + 12) - 14, 18); x.fill();
  // texto: título + frase ocupam o espaço entre a arte e a linha de tecnologias. Começa com o título grande e vai diminuindo até TUDO caber
  // (assim um título de 2 linhas nunca invade a frase nem as tecnologias).
  const tx = 30, tw = W - 60, top = ay + ah + 12 + 16, bottom = H - 14 - 14 - 34 - 12; // área livre do texto
  let lay = null;
  for (let ts = 52; ts >= 28 && !lay; ts -= 2) {
    const T = cinTitle(x, f.title, tw, 2, ts, ts, FONT);
    x.font = '800 ' + Math.min(24, Math.round(ts * 0.5)) + 'px ' + SANS; const fs = Math.min(24, Math.round(ts * 0.5)), tl = cinWrap(x, f.tagline, tw), lh = fs * 1.25;
    const need = T.lines.length * ts * 1.08 + 10 + Math.min(tl.length, 3) * lh;
    if (tl.length <= 3 && T.lines.every(l => (x.font = '800 ' + ts + 'px ' + FONT, x.measureText(l).width <= tw)) && need <= bottom - top) lay = { ts, T, fs, tl, lh };
  }
  if (!lay) { const T = cinTitle(x, f.title, tw, 3, 28, 24, FONT); x.font = '800 20px ' + SANS; lay = { ts: T.size, T, fs: 20, tl: cinWrap(x, f.tagline, tw).slice(0, 2), lh: 25 }; }
  x.textBaseline = 'alphabetic'; x.textAlign = 'left'; x.fillStyle = '#f6ecd9'; x.font = '800 ' + lay.ts + 'px ' + FONT;
  let y = top + lay.ts * 0.8; lay.T.lines.forEach(l => { x.fillText(l, tx, y); y += lay.ts * 1.08; });
  x.font = '800 ' + lay.fs + 'px ' + SANS; x.fillStyle = '#e6d9ff'; y += 4; lay.tl.forEach(l => { x.fillText(l, tx, y); y += lay.lh; });
  // tecnologias (as que couberem na linha)
  x.font = '800 19px "JetBrains Mono", monospace'; let cx = tx; const cy = H - 14 - 14 - 34;
  for (const s of f.stack) {
    const w = x.measureText(s).width + 26; if (cx + w > W - 30) break;
    x.strokeStyle = '#f2b84b'; x.lineWidth = 2.5; cinRR(x, cx, cy, w, 34, 17); x.stroke();
    x.fillStyle = '#f6ecd9'; x.textBaseline = 'middle'; x.fillText(s, cx + 13, cy + 18); x.textBaseline = 'alphabetic'; cx += w + 8;
  }
  CIN.posters[i].tex.needsUpdate = true;
}

// ---------- o letreiro LED e o ingresso da bilheteria ----------
function drawMarquee() {
  const f = films[CIN.idx], x = CIN.mq.getContext('2d'), W = CIN.mq.width, H = CIN.mq.height;
  x.fillStyle = '#0b0613'; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,0.05)'; for (let a = 8; a < W; a += 14) for (let b = 8; b < H; b += 14) x.fillRect(a, b, 4, 4); // grade de "LEDs" apagados
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#f2b84b'; x.font = '800 34px "JetBrains Mono", monospace'; x.fillText('EM EXIBIÇÃO  ·  ' + (CIN.idx + 1) + ' / ' + films.length, W / 2, 36);
  cinFit(x, f.title, W - 70, 84, 36, '800', 'Syne, system-ui, sans-serif'); x.fillStyle = '#f6ecd9'; x.shadowColor = filmHex(f.color); x.shadowBlur = 18; x.fillText(f.title, W / 2, H / 2 + 14); x.shadowBlur = 0;
  x.fillStyle = '#ff9bc7'; x.font = '800 30px "JetBrains Mono", monospace'; x.fillText(f.status.toUpperCase(), W / 2, H - 32);
  CIN.mqTex.needsUpdate = true;
}
function drawTicket() {
  const f = films[CIN.idx], x = CIN.tk.getContext('2d'), W = CIN.tk.width, H = CIN.tk.height;
  x.fillStyle = '#f2b84b'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#fff1c9'; cinRR(x, 8, 8, W - 16, H - 16, 10); x.fill();
  x.fillStyle = '#0b0613'; for (let k = 0; k < 9; k++) { x.beginPath(); x.arc(0, 16 + k * 20, 7, 0, 6.3); x.arc(W, 16 + k * 20, 7, 0, 6.3); x.fill(); } // picote dos lados
  x.fillStyle = filmHex(f.color); x.fillRect(22, 18, W - 44, 8);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#7a4a1e'; x.font = '800 22px "JetBrains Mono", monospace'; x.fillText('INGRESSO · ADMIT ONE', W / 2, 46);
  cinFit(x, f.title, W - 60, 56, 26, '800', 'Syne, system-ui, sans-serif'); x.fillStyle = '#241538'; x.fillText(f.title, W / 2, 96);
  x.fillStyle = '#7a4a1e'; x.font = '800 20px "JetBrains Mono", monospace'; x.fillText('SESSÃO ÚNICA · ' + f.year, W / 2, 140);
  CIN.tkTex.needsUpdate = true;
}

// ---------- escolher o filme ----------
function cinemaSelect(i, quiet) {
  if (!CIN.built) return;
  i = (i + films.length) % films.length; if (i === CIN.idx && !quiet) return;
  CIN.prev = CIN.cur; CIN.idx = i; CIN.si = 0; CIN.slideT = 0; CIN.fade = 0; CIN.flash = 1; CIN.ticketT = 0; // recomeça a transição, o "liga" do projetor e o ingresso saindo
  drawScreen(); drawMarquee(); drawTicket();
  CIN.glow.material.color.setHex(films[i].color);
  const car = CIN.cars[i]; if (car) CIN.spot.position.set(car.position.x, 2.5, car.position.z);
  CIN.posters.forEach((p, k) => { p.frame.material.color.setHex(k === i ? 0xffd98a : 0x3a2060); p.mesh.material.color.setScalar(k === i ? 1 : 0.62); p.lit.visible = k === i; });
  cinHud(); if (!quiet) announce('Em exibição no cinema: ' + films[i].title + '. ' + films[i].tagline + '. ' + films[i].status + '.');
}
const cinemaStep = d => cinemaSelect(CIN.idx + d);

// os controles na tela (barra embaixo, no centro): aparecem quando a personagem está perto da bilheteria
const cinEl = {};
function cinHud() {
  if (!cinEl.sel) return;
  const f = films[CIN.idx];
  cinEl.title.textContent = f.title; cinEl.meta.textContent = (CIN.idx + 1) + ' / ' + films.length + ' · ' + f.status;
}
function cinInit() {
  ['sel', 'prev', 'next', 'info', 'title', 'meta', 'keys'].forEach(k => { cinEl[k] = document.getElementById('cin' + k[0].toUpperCase() + k.slice(1)); });
  if (!cinEl.sel) return;
  cinEl.prev.addEventListener('click', () => cinemaStep(-1));
  cinEl.next.addEventListener('click', () => cinemaStep(1));
  cinEl.info.addEventListener('click', () => openPanel(CIN.zone));
  cinEl.keys.hidden = touch; // as teclas [ e ] só fazem sentido com teclado
}

// ---------- o carrinho de brinquedo: frente para a tela (-z); a traseira, que a câmera vê, leva a placa do filme ----------
function plateTex(text) {
  return canvasTex(192, 72, (x, w, h) => {
    x.fillStyle = '#f6ecd9'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7b3fe4'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
    cinFit(x, text, w - 28, 40, 14, '800', '"JetBrains Mono", monospace');
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

// ---------- a bilheteria: uma casinha de verdade, com letreiro, toldo listrado, guichê, ingresso, setas e fila ----------
function arrowTex(dir) { // botão redondo com uma seta (dir = -1 esquerda, 1 direita)
  return canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = dir < 0 ? '#ff5fa2' : '#f2b84b'; x.beginPath(); x.arc(64, 64, 62, 0, 6.3); x.fill();
    x.strokeStyle = '#0b0613'; x.lineWidth = 8; x.stroke();
    x.fillStyle = '#0b0613'; x.beginPath(); x.moveTo(64 + dir * 28, 64); x.lineTo(64 - dir * 20, 34); x.lineTo(64 - dir * 20, 94); x.closePath(); x.fill();
  });
}
function buildBooth(g) {
  const B = new THREE.Group(); B.position.set(CIN.booth.x, 0, CIN.booth.z); B.rotation.y = 0.18; B.scale.setScalar(1.2); g.add(B); // um tantinho virada para o centro do estacionamento
  box(4.1, 0.25, 3.0, 0x3a2060, 0, 0.12, 0, B);                       // base
  box(3.8, 2.9, 2.6, 0xf6ecd9, 0, 1.55, 0, B);                        // corpo
  [-1, 1].forEach(s => box(0.26, 2.9, 0.26, 0xff5fa2, s * 1.9, 1.55, 1.3, B)); // pilares rosa na frente
  box(4.2, 0.2, 3.0, 0xf2b84b, 0, 3.08, 0, B);                        // laje do teto, dourada
  // guichê (a janela) com grades e luz de dentro
  box(2.4, 1.3, 0.12, 0x241538, 0, 1.95, 1.3, B);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.05), new THREE.MeshBasicMaterial({ color: 0xffd98a })); win.position.set(0, 1.95, 1.37); B.add(win);
  [-0.7, 0, 0.7].forEach(x => box(0.05, 1.05, 0.05, 0x6b4a2f, x, 1.95, 1.4, B));
  box(2.9, 0.16, 0.9, 0x8a5a3a, 0, 1.3, 1.62, B);                     // balcão que sai do guichê
  const hang = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: canvasTex(560, 140, (x, w, h) => { // plaquinha "ESCOLHA O FILME"
    x.fillStyle = '#241538'; x.fillRect(0, 0, w, h); x.strokeStyle = '#f2b84b'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
    x.fillStyle = '#f6ecd9'; cinFit(x, 'ESCOLHA O FILME', w - 40, 62, 24, '800', 'Syne, system-ui, sans-serif'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ESCOLHA O FILME', w / 2, h / 2 + 3);
  }) })); hang.position.set(0, 0.8, 1.33); B.add(hang);
  // as setas: botões grandes na frente (clicáveis)
  [-1, 1].forEach(d => {
    const bt = new THREE.Group(); bt.position.set(d * 1.38, 0.66, 1.4); bt.userData.cinBtn = d; B.add(bt);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.16, 20), lam(0x1a0f2e)); cyl.rotation.x = Math.PI / 2; bt.add(cyl);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ map: arrowTex(d) })); face.position.z = 0.09; // botões grandes: com a câmera longe, um botão pequeno seria difícil de clicar bt.add(face);
    CIN.hits.push(bt);
  });
  // toldo listrado
  const aw = new THREE.Group(); aw.position.set(0, 2.85, 1.35); aw.rotation.x = 0.4; B.add(aw);
  const stripes = [], vals = [];
  for (let k = 0; k < 9; k++) { const x = -1.76 + k * 0.44, c = k % 2 ? 0xf6ecd9 : 0xff5fa2; stripes.push({ x, y: 0, z: 0.6, sx: 0.44, sy: 0.07, sz: 1.2, c }); vals.push({ x, y: -0.12, z: 1.22, sx: 0.44, sy: 0.3, sz: 0.06, c }); }
  const sb = new THREE.BoxGeometry(1, 1, 1);
  aw.add(instanced(sb, lam(0xffffff), stripes), instanced(sb, lam(0xffffff), vals));
  // letreiro "BILHETERIA" no alto (o texto é medido e encolhido até caber, com folga de cada lado)
  const SW = 4.1, SH = 0.95;
  box(SW, SH, 0.28, 0x1a0f2e, 0, 3.75, 1.1, B);
  const sgn = new THREE.Mesh(new THREE.PlaneGeometry(SW - 0.2, SH - 0.2), new THREE.MeshBasicMaterial({ map: canvasTex(800, 180, (x, w, h) => {
    x.fillStyle = '#1a0f2e'; x.fillRect(0, 0, w, h); x.strokeStyle = '#f2b84b'; x.lineWidth = 8; x.strokeRect(5, 5, w - 10, h - 10);
    const s = cinFit(x, 'BILHETERIA', w - 110, 120, 40, '800', 'Syne, system-ui, sans-serif'); // 55 px livres de cada lado
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#f2b84b'; x.shadowBlur = 16; x.fillStyle = '#ffd98a'; x.fillText('BILHETERIA', w / 2, h / 2 + s * 0.04);
  }) })); sgn.position.set(0, 3.75, 1.26); B.add(sgn);
  const bulbs = []; for (let k = 0; k < 15; k++) { const x = -SW / 2 + 0.1 + k * (SW - 0.2) / 14; bulbs.push({ x, y: 4.3, z: 1.22, sx: 0.14, sy: 0.14, sz: 0.14, c: k % 2 ? 0xff5fa2 : 0xffd98a }, { x, y: 3.2, z: 1.22, sx: 0.14, sy: 0.14, sz: 0.14, c: k % 2 ? 0xffd98a : 0xff5fa2 }); }
  B.add(instanced(sb, new THREE.MeshBasicMaterial({ color: 0xffffff }), bulbs));
  // letreiro LED em cima do teto: mostra o filme em exibição, na hora
  [-1.5, 1.5].forEach(s => box(0.12, 1.4, 0.12, 0x1a0f2e, s, 3.9, 0.4, B));
  box(3.9, 1.22, 0.2, 0x1a0f2e, 0, 4.9, 0.4, B);
  CIN.mq = document.createElement('canvas'); CIN.mq.width = 720; CIN.mq.height = 220; CIN.mqTex = new THREE.CanvasTexture(CIN.mq); CIN.mqTex.anisotropy = 4;
  const mq = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 1.13), new THREE.MeshBasicMaterial({ map: CIN.mqTex })); mq.position.set(0, 4.9, 0.51); B.add(mq);
  // o ingresso que sai pelo guichê toda vez que o filme muda
  CIN.tk = document.createElement('canvas'); CIN.tk.width = 320; CIN.tk.height = 170; CIN.tkTex = new THREE.CanvasTexture(CIN.tk); CIN.tkTex.anisotropy = 4;
  CIN.ticket = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.5), new THREE.MeshBasicMaterial({ map: CIN.tkTex, side: THREE.DoubleSide }));
  CIN.ticket.rotation.x = -Math.PI / 2 + 0.12; B.add(CIN.ticket); CIN.ticketB = B;
  const lamp = glowSprite(0xffd98a, 5, 0.3); lamp.position.set(0, 2.1, 2.2); B.add(lamp);
  // fila: postes dourados com cordão
  const px = [-2.4, -0.8, 0.8, 2.4], pz = 4.0;
  px.forEach(x => { box(0.1, 1.0, 0.1, 0xf2b84b, x, 0.5, pz, B); const k = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), lam(0xffd98a)); k.position.set(x, 1.05, pz); B.add(k); });
  for (let k = 0; k < 3; k++) box(1.6, 0.06, 0.06, 0xff4d6d, (px[k] + px[k + 1]) / 2, 0.88, pz, B);
  B.userData.booth = true;
  g.updateMatrixWorld(true); const w = g.localToWorld(new THREE.Vector3(CIN.booth.x + 0.6, 0, CIN.booth.z + 4.2)); CIN.boothW = { x: w.x, z: w.z };
}

// ---------- o cinema todo ----------
function buildCinema(g) {
  const W = CIN.sw, H = CIN.sh, SY = CIN.sy, SZ = CIN.sz, n = films.length, WALL = 15.2, WH = 3.4;
  // imagens dos filmes (os prints para o telão e para a arte dos cartazes): quando uma termina de carregar, o que depende dela é redesenhado
  CIN.imgs = films.map((f, i) => (f.shots || []).map(src => {
    const im = new Image(); im._ok = false;
    im.onload = () => { im._ok = true; if (CIN.built) { drawPoster(i); if (i === CIN.idx) drawScreen(); } };
    im.src = src; return im;
  }));
  // ---- o telão ----
  CIN.cv = document.createElement('canvas'); CIN.cv.width = 1280; CIN.cv.height = Math.round(1280 * H / W); CIN.cx = CIN.cv.getContext('2d');
  CIN.tex = new THREE.CanvasTexture(CIN.cv); CIN.tex.anisotropy = 4;
  CIN.mat = new THREE.MeshBasicMaterial({ map: CIN.tex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), CIN.mat); screen.position.set(0, SY, SZ + 0.2); g.add(screen);
  box(W + 0.8, H + 0.8, 0.4, 0x1a0f2e, 0, SY, SZ - 0.05, g);                                   // moldura escura
  box(W + 1.1, 0.16, 0.5, 0xf2b84b, 0, SY + H / 2 + 0.46, SZ, g); box(W + 1.1, 0.16, 0.5, 0xf2b84b, 0, SY - H / 2 - 0.46, SZ, g); // frisos dourados
  [-1, 1].forEach(s => box(0.16, H + 1.1, 0.5, 0xf2b84b, s * (W / 2 + 0.46), SY, SZ, g));
  // a parede da base é a vitrine dos cartazes
  box(WALL, WH, 1.5, 0x3a2060, 0, WH / 2, SZ + 0.05, g); box(WALL + 0.3, 0.2, 1.7, 0xff5fa2, 0, WH + 0.1, SZ + 0.05, g);
  const bulbs = []; for (let k = 0; k < 17; k++) bulbs.push({ x: -W / 2 - 0.2 + k * (W + 0.4) / 16, y: SY + H / 2 + 0.78, z: SZ + 0.1, sx: 0.26, sy: 0.26, sz: 0.26, c: k % 2 ? 0xff5fa2 : 0xffd98a });
  g.add(instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), bulbs)); // letreiro de lâmpadas
  CIN.glow = glowSprite(films[0].color, 22, 0.26); CIN.glow.position.set(0, SY, SZ + 1.5); g.add(CIN.glow); // o clarão do telão, na cor do filme
  // faixa "EM CARTAZ" acima dos cartazes
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(WALL - 0.6, 0.52), new THREE.MeshBasicMaterial({ map: canvasTex(1520, 52, (x, w, h) => {
    x.fillStyle = '#150a26'; x.fillRect(0, 0, w, h); x.fillStyle = '#f2b84b'; x.font = '800 38px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let t = '★'; while (x.measureText(t + '  EM CARTAZ  ★').width < w - 90) t += '  EM CARTAZ  ★'; // repete "EM CARTAZ" só enquanto couber INTEIRO: nenhuma palavra fica cortada na ponta
    x.fillText(t, w / 2, h / 2 + 2);
  }) })); strip.position.set(0, 3.1, SZ + 0.82); g.add(strip);
  // os 6 cartazes (clicáveis): cada um com moldura, que acende no filme em exibição
  const PW = 2.05, PH = 2.5, gap = 2.45;
  films.forEach((f, i) => {
    const px = (i - (n - 1) / 2) * gap, cv = document.createElement('canvas'); cv.width = CPW; cv.height = CPH;
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    const frame = box(PW + 0.2, PH + 0.2, 0.06, 0x3a2060, px, 1.5, SZ + 0.83, g);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: tex })); mesh.position.set(px, 1.5, SZ + 0.87); mesh.userData.film = i; g.add(mesh);
    const lit = glowSprite(0xffd98a, 4.4, 0.5); lit.position.set(px, 1.5, SZ + 0.95); lit.visible = false; g.add(lit);
    CIN.posters.push({ cv, tex, frame, mesh, lit }); CIN.hits.push(mesh);
    drawPoster(i);
  });
  // ---- o estacionamento: asfalto roxo com vagas pintadas e fio dourado, como o chão do mundo ----
  const PX = 24, PZ = 15, PZC = 1.2;
  const asph = canvasTex(1024, 640, (x, w, h) => {
    const mx = a => (a + PX / 2) / PX * w, mz = a => (a - (PZC - PZ / 2)) / PZ * h;
    x.fillStyle = '#1b1030'; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 1400; k++) { x.fillStyle = k % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.16)'; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    x.strokeStyle = 'rgba(246,236,217,0.7)'; x.lineWidth = 5;
    [-7.8, -2.6, 2.6, 7.8].forEach(a => { [[-4.5, -0.3], [0.9, 5.1]].forEach(([z0, z1]) => { x.beginPath(); x.moveTo(mx(a), mz(z0)); x.lineTo(mx(a), mz(z1)); x.stroke(); }); });
    x.strokeStyle = 'rgba(242,184,75,0.85)'; x.lineWidth = 6; x.beginPath(); x.moveTo(mx(-7.8), mz(-4.5)); x.lineTo(mx(7.8), mz(-4.5)); x.stroke(); // linha de parada em frente à tela
    x.strokeStyle = 'rgba(255,95,162,0.7)'; x.lineCap = 'round'; x.lineJoin = 'round'; // setas rosa no corredor, apontando para a tela
    for (let a = -9; a <= 9; a += 3) { x.beginPath(); x.moveTo(mx(a) - 12, mz(0.75)); x.lineTo(mx(a), mz(0.15)); x.lineTo(mx(a) + 12, mz(0.75)); x.stroke(); }
    x.strokeStyle = 'rgba(242,184,75,0.6)'; x.lineWidth = 4; x.setLineDash([16, 12]); x.strokeRect(10, 10, w - 20, h - 20); // fio dourado pontilhado na borda
  });
  asph.anisotropy = 4;
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(PX, PZ), new THREE.MeshLambertMaterial({ map: asph })); lot.rotation.x = -Math.PI / 2; lot.position.set(0, 0.04, PZC); lot.receiveShadow = true; g.add(lot);
  // ---- os carrinhos: um por filme (clicar escolhe o filme) ----
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.28, 12), wheelMat = lam(0x120b1c);
  films.forEach((f, i) => {
    const car = buildCar(f, wheelGeo, wheelMat);
    car.position.set(CIN.cols[i % 3], 0.04, CIN.rows[(i / 3) | 0]); car.rotation.y = (((i * 37) % 7) - 3) * 0.012; // um tantinho "torto", como carro estacionado de verdade
    car.userData.film = i; g.add(car); CIN.cars.push(car); CIN.hits.push(car);
  });
  const posts = [], spk = []; // postes de som entre as vagas (instanciados)
  CIN.rows.forEach(rz => [-2.6, 2.6].forEach(px => { posts.push({ x: px, y: 0.65, z: rz - 1.6, sx: 0.1, sy: 1.3, sz: 0.1, c: 0x6b4a2f }); spk.push({ x: px, y: 1.25, z: rz - 1.6, sx: 0.46, sy: 0.34, sz: 0.22, c: 0xff5fa2 }); }));
  g.add(instanced(new THREE.BoxGeometry(1, 1, 1), lam(0xffffff), posts), instanced(new THREE.BoxGeometry(1, 1, 1), lam(0xffffff), spk));
  CIN.spot = glowSprite(0xf2b84b, 3.2, 0.7); g.add(CIN.spot); // marcador: uma luz que paira em cima do carrinho do filme em exibição
  // ---- cabine do projetor, com o feixe de luz até o telão ----
  box(2.4, 1.7, 2.0, 0x8a5fd0, 0, 0.85, 9.6, g); box(2.5, 0.14, 2.1, 0xf2b84b, 0, 1.75, 9.6, g);
  box(1.1, 0.7, 1.3, 0x5a3a96, 0, 2.2, 9.5, g);
  const hw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ color: 0xffd98a })); hw.position.set(0, 1.0, 10.62); g.add(hw); // janelinha acesa da cabine
  box(1.1, 0.1, 0.12, 0xf6ecd9, 0, 0.66, 10.66, g);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.45, 12), new THREE.MeshBasicMaterial({ color: 0xfff2d6 })); lens.rotation.x = Math.PI / 2; lens.position.set(0, 2.2, 8.7); g.add(lens);
  const from = new THREE.Vector3(0, 2.2, 8.4), to = new THREE.Vector3(0, SY - 0.9, SZ + 3.6), L = from.distanceTo(to);
  const coneGeo = new THREE.ConeGeometry(4.6, L, 20, 1, true); coneGeo.translate(0, -L / 2, 0); coneGeo.rotateX(-Math.PI / 2); // ponta na origem, base a L de distância na direção +z
  const beam = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xfff2d6, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beam.scale.x = 1.4; beam.userData.flat = true;
  const beamRig = new THREE.Group(); beamRig.position.copy(from); beamRig.add(beam); g.add(beamRig); g.updateMatrixWorld(true); beamRig.lookAt(g.localToWorld(to.clone())); // lookAt usa coordenadas do MUNDO: por isso convertemos o ponto
  // ---- letreiro da entrada (à direita), bem maior e com o texto medido para caber ----
  const sx = 16.2, sz2 = 3.5; box(0.26, 5.4, 0.26, 0x1a0f2e, sx, 2.7, sz2, g);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: canvasTex(768, 384, (x, w, h) => {
    x.fillStyle = '#150a26'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ff5fa2'; x.lineWidth = 10; x.strokeRect(8, 8, w - 16, h - 16);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const s1 = cinFit(x, 'DRIVE-IN', w - 120, 140, 50, '800', 'Syne, system-ui, sans-serif'); x.shadowColor = '#f2b84b'; x.shadowBlur = 22; x.fillStyle = '#f2b84b'; x.fillText('DRIVE-IN', w / 2, 110);
    const s2 = cinFit(x, 'SWARTTZ', w - 120, 96, 40, '800', 'Syne, system-ui, sans-serif'); x.shadowColor = '#ff5fa2'; x.fillStyle = '#ff9bc7'; x.fillText('SWARTTZ', w / 2, 210);
    x.shadowBlur = 0; x.fillStyle = '#f6ecd9'; cinFit(x, '1 filme = 1 projeto', w - 120, 40, 22, '800', '"JetBrains Mono", monospace'); x.fillText('1 filme = 1 projeto', w / 2, 306);
  }) })); sign.position.set(sx, 5.6, sz2); sign.rotation.y = -0.4; g.add(sign);
  buildBooth(g);
  CIN.zone = zones.find(z => z.id === 'cinema'); cinInit();
  CIN.built = true; cinemaSelect(0, true); // começa passando o primeiro filme
}

// Chamado todo quadro (ui.js): transição das imagens, passar os prints do filme, o "tremido" do projetor, o ingresso e a barra da bilheteria.
function updateCinema(now, dt) {
  if (!CIN.built) return;
  const pl = typeof player !== 'undefined' ? player.position : null;
  if (pl && Math.hypot(pl.x - CIN.zone.pos[0], pl.z - CIN.zone.pos[2]) > 75) return; // longe do cinema, nada é atualizado (economiza)
  if (CIN.fade < 1) { CIN.fade = Math.min(1, CIN.fade + dt / 0.7); drawScreen(); }
  const list = cinImgs(CIN.idx);
  if (!calm && list.length > 1) { // passa os prints do projeto, um a um
    CIN.slideT += dt;
    if (CIN.slideT >= CIN.SLIDE) { CIN.slideT = 0; CIN.prev = CIN.cur; CIN.si = (CIN.si + 1) % list.length; CIN.fade = 0; drawScreen(); }
  }
  CIN.flash = Math.max(0, CIN.flash - dt * 2.6);
  CIN.mat.color.setScalar(Math.max(0.12, 0.95 + (calm ? 0 : Math.sin(now * 23) * 0.03) - CIN.flash * 0.75));
  CIN.spot.material.opacity = calm ? 0.7 : 0.55 + Math.sin(now * 3) * 0.2;
  // ingresso saindo do guichê (0 = escondido dentro; 1 = em cima do balcão)
  CIN.ticketT = Math.min(1, CIN.ticketT + dt / 0.7); const e = 1 - Math.pow(1 - CIN.ticketT, 3);
  CIN.ticket.position.set(-0.35, 1.42 + (1 - e) * 0.02, 1.35 + e * 0.55); CIN.ticket.visible = e > 0.02;
  // a barra de escolha aparece perto da bilheteria (e só com o mundo livre: sem painel aberto)
  const near = !!(pl && Math.hypot(pl.x - CIN.boothW.x, pl.z - CIN.boothW.z) < 7.5 && !panelOpen && phase === 'world');
  CIN.near = near && cinEl.sel && true;
  if (cinEl.sel && near !== CIN.hudOn) { CIN.hudOn = near; cinEl.sel.hidden = !near; if (near) { cinHud(); announce('Bilheteria do cinema. Use as setas na tela ou as teclas colchete esquerdo e direito para escolher o filme.'); } }
}
