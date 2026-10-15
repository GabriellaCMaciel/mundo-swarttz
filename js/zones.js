// As zonas do portfólio: cenários, etiquetas, trilhas e detecção de proximidade.
'use strict';

// ===== 4. As zonas (cada uma é uma parte do portfólio) =====
const floaters = []; // objetos que flutuam devagar (os selos)
const hex = c => '#' + c.toString(16).padStart(6, '0');
const bookColors = [0xff5fa2, 0xf2b84b, 0x37d0c0, 0x7b3fe4, 0xf08a3c, 0xb79af5];
const brushColors = ['#ff5fa2', '#f2b84b', '#37d0c0', '#7b3fe4', '#f08a3c', '#b79af5'];

// Pintura abstrata desenhada em tempo real (pinceladas aleatórias) para o cavalete
function paintingTex() {
  return canvasTex(400, 480, (x, w, h) => {
    x.fillStyle = '#f6ecd9'; x.fillRect(0, 0, w, h); x.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      x.strokeStyle = brushColors[i % 6]; x.lineWidth = 10 + Math.random() * 26; x.globalAlpha = 0.85;
      x.beginPath(); x.moveTo(Math.random() * w, Math.random() * h);
      x.bezierCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h); x.stroke();
    }
    x.globalAlpha = 1; x.strokeStyle = '#2a1745'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
  });
}
// Imagem provisória de projeto (um "print" desenhado): troque depois pelas imagens reais
function placeholderTex(c1, c2, label) {
  return canvasTex(256, 330, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, hex(c1)); g.addColorStop(1, hex(c2));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(246,236,217,0.94)'; x.fillRect(22, 40, w - 44, h - 120);
    x.fillStyle = hex(c2); x.fillRect(22, 40, w - 44, 22);
    ['#ff5fa2', '#f2b84b', '#37d0c0'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(38 + i * 16, 51, 4, 0, 6.3); x.fill(); });
    x.fillStyle = hex(c1); x.fillRect(38, 82, 90, 12); x.fillRect(38, 104, 150, 8); x.fillRect(38, 120, 120, 8); x.fillRect(38, 150, w - 76, 70);
    x.fillStyle = '#fff'; x.font = '700 20px "JetBrains Mono", monospace'; x.textAlign = 'center';
    x.fillText(label, w / 2, h - 44); x.font = '400 13px "JetBrains Mono", monospace'; x.fillText('print do projeto', w / 2, h - 22);
  });
}
// Tela do telefone gigante: uma grade de "apps" (só o GitHub está ligado por enquanto)
function phoneTex() {
  return canvasTex(512, 700, (x, w, h) => {
    x.fillStyle = '#0b0613'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f2b84b'; x.font = '800 38px Syne, sans-serif'; x.textAlign = 'center'; x.fillText('contatos', w / 2, 90);
    const tiles = ['GitHub', 'LinkedIn', 'Instagram', 'E-mail', 'WhatsApp', 'YouTube', 'TikTok', 'Figma', 'Currículo'];
    tiles.forEach((t, i) => {
      const cx = 30 + (i % 3) * 156, cy = 150 + Math.floor(i / 3) * 140;
      x.fillStyle = i === 0 ? '#f2b84b' : '#2a1745'; x.fillRect(cx, cy, 140, 120);
      x.fillStyle = i === 0 ? '#0b0613' : '#b79af5'; x.font = '700 22px Syne, sans-serif'; x.fillText(t, cx + 70, cy + 70);
    });
  });
}

// Cada função abaixo monta o "cenário" de uma zona. Mexa nas cores e tamanhos à vontade.
const props = {
  sobre(g) { // quadro com a foto colada com fita e um bilhete com a logo
    box(5.2, 4.2, 0.18, 0x3a2350, 0, 3.0, 0, g);
    box(5.5, 0.16, 0.28, 0x6b4a2f, 0, 5.18, 0, g); box(5.5, 0.16, 0.28, 0x6b4a2f, 0, 0.82, 0, g);
    [-2.67, 2.67].forEach(x => box(0.16, 4.5, 0.28, 0x6b4a2f, x, 3.0, 0, g));
    [-2, 2].forEach(x => box(0.16, 1.0, 0.16, 0x6b4a2f, x, 0.5, -0.2, g));
    const pol = new THREE.Group(); pol.position.set(-0.95, 3.2, 0.14); pol.rotation.z = 0.06; g.add(pol);
    box(2.5, 2.9, 0.05, 0xf6ecd9, 0, 0, 0, pol);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(ASSETS.photo) }));
    photo.position.set(0, 0.2, 0.03); pol.add(photo);
    [[-1.0, 1.45, -0.5], [1.0, 1.45, 0.5]].forEach(([x, y, r]) => { // fitas adesivas
      const tape = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.32), new THREE.MeshBasicMaterial({ color: 0xff5fa2, transparent: true, opacity: 0.82, side: THREE.DoubleSide }));
      tape.position.set(x, y, 0.06); tape.rotation.z = r; pol.add(tape);
    });
    const noteTex = canvasTex(420, 520, () => {});
    const nx = noteTex.image.getContext('2d');
    const drawNote = logo => {
      nx.fillStyle = '#f6ecd9'; nx.fillRect(0, 0, 420, 520);
      if (logo) nx.drawImage(logo, 135, 24, 150, 198);
      nx.fillStyle = '#2a1745'; nx.textAlign = 'center';
      nx.font = '800 38px Syne, sans-serif'; nx.fillText('Gabriella', 210, 288); nx.fillText('Swarttz', 210, 332);
      nx.font = '700 20px "JetBrains Mono", monospace'; nx.fillText('dev em formação', 210, 378);
      nx.font = '400 15px "JetBrains Mono", monospace'; nx.fillStyle = '#7b3fe4'; nx.fillText('(texto provisório)', 210, 420);
      noteTex.needsUpdate = true;
    };
    drawNote(null); loadImg(ASSETS.logoLight, drawNote);
    const note = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.48), new THREE.MeshBasicMaterial({ map: noteTex }));
    note.position.set(1.55, 3.0, 0.12); note.rotation.z = -0.05; g.add(note);
    const nt = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.28), new THREE.MeshBasicMaterial({ color: 0xf2b84b, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    nt.position.set(1.55, 4.28, 0.14); nt.rotation.z = 0.1; g.add(nt);
  },
  atelie(g) { // cavalete com pintura, bastidor de bordado e novelos de lã
    box(2.8, 3.4, 0.14, 0xf6ecd9, 0, 2.7, 0, g);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.1), new THREE.MeshBasicMaterial({ map: paintingTex() })); art.position.set(0, 2.7, 0.08); g.add(art);
    [-1, 1].forEach(x => { const leg = box(0.12, 3.4, 0.12, 0x6b4a2f, x * 0.9, 1.6, 0.3, g); leg.rotation.z = -x * 0.1; });
    box(0.12, 3.2, 0.12, 0x6b4a2f, 0, 1.5, -0.7, g);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.09, 10, 32), lam(0xd9a066)); hoop.position.set(-2.9, 1.7, 1); hoop.rotation.y = 0.5; g.add(hoop);
    const cloth = new THREE.Mesh(new THREE.CircleGeometry(0.78, 32), lam(0xff5fa2, { side: THREE.DoubleSide })); cloth.position.copy(hoop.position); cloth.rotation.y = 0.5; g.add(cloth);
    for (let i = 0; i < 8; i++) { // pontinhos de bordado
      const a = i / 8 * Math.PI * 2;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lam(0xf2b84b)); dot.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.03); cloth.add(dot);
    }
    box(0.1, 1.2, 0.1, 0x6b4a2f, -2.9, 0.6, 1, g);
    [[2.4, 1.6, 0x37d0c0, 0.45], [3.1, 2.4, 0xf2b84b, 0.35], [2.0, 2.6, 0xff5fa2, 0.3]].forEach(([x, z, c, r]) => {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), lam(c)); ball.position.set(x, r, z); g.add(ball);
    });
  },
  biblioteca(g) { buildLibrary(g); }, // o cenário grande fica em js/library.js
  selos(g) { // selos flutuantes: cada um será um projeto (imagens provisórias)
    const pairs = [[0xff5fa2, 0x7b3fe4], [0x37d0c0, 0x7b3fe4], [0xf2b84b, 0xff5fa2], [0x7b3fe4, 0x37d0c0]];
    pairs.forEach(([c1, c2], i) => {
      const s = new THREE.Group();
      box(1.5, 1.9, 0.06, 0xf6ecd9, 0, 0, 0, s);
      const shot = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.55), new THREE.MeshBasicMaterial({ map: placeholderTex(c1, c2, 'projeto ' + (i + 1)) })); shot.position.z = 0.04; s.add(shot);
      for (let k = 0; k < 7; k++) { const px = -0.65 + k * 0.2167; box(0.1, 0.1, 0.07, 0x1a0f2e, px, 0.95, 0, s); box(0.1, 0.1, 0.07, 0x1a0f2e, px, -0.95, 0, s); }
      for (let k = 0; k < 8; k++) { const py = -0.8 + k * 0.2286; box(0.1, 0.1, 0.07, 0x1a0f2e, 0.75, py, 0, s); box(0.1, 0.1, 0.07, 0x1a0f2e, -0.75, py, 0, s); }
      s.position.set(-2.4 + i * 1.6, 2.4 + (i % 2) * 0.5, 0);
      s.userData = { y0: s.position.y, i };
      g.add(s); floaters.push(s);
    });
  },
  telefone(g) { // telefone grandão: cada "app" será uma rede social
    box(3, 5, 0.4, 0x120b1c, 0, 2.7, 0, g);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.7), new THREE.MeshBasicMaterial({ map: phoneTex() })); scr.position.set(0, 2.75, 0.21); g.add(scr);
    const g2 = glowSprite(0x37d0c0, 7, 0.4); g2.position.set(0, 2.8, 0.6); g.add(g2);
  },
  cartas(g) { // mesinha com cartas de depoimentos
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.15, 24), lam(0x3a2350)); table.position.y = 1.1; g.add(table);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.1, 10), lam(0x3a2350)); stem.position.y = 0.55; g.add(stem);
    [0xff5fa2, 0xf2b84b, 0x37d0c0, 0xf08a3c, 0xb79af5].forEach((c, i) => {
      const e = box(1.6, 0.09, 1.05, c, (i - 2) * 0.12, 1.22 + i * 0.1, i % 2 ? 0.1 : -0.1, g);
      e.rotation.y = (i - 2) * 0.28;
    });
    const sheet = box(1.3, 0.04, 0.9, 0xf6ecd9, 0.1, 1.82, 0, g); sheet.rotation.y = 0.2;
  }
};

// Onde cada zona fica, a cor e o texto do cartão que aparece quando você chega perto
const zones = [
  { id: 'sobre', name: 'Sobre', color: 0xf2b84b, pos: [-7, 0, -9], text: 'Quem é a Gabriella Swarttz: foto, apresentação e descrição.' },
  { id: 'atelie', name: 'Ateliê', color: 0xff5fa2, pos: [-22, 0, -4], text: 'As soft skills viram obras: pintura, bordado e cores.' },
  { id: 'biblioteca', name: 'Biblioteca', color: 0x37d0c0, pos: [0, 0, -28], r: 9, ground: 0x1d3a35, labelY: 10, glow: 0.07, lightI: 0.5,
    text: 'Os livros que brilham são cursos, certificações e a graduação. Chegue perto de um e abra.' },
  { id: 'selos', name: 'Álbum de selos', color: 0xf2b84b, pos: [22, 0, -4], text: 'Cada projeto vira selos com prints dele rodando.' },
  { id: 'telefone', name: 'Telefone', color: 0x7b3fe4, pos: [14, 0, 18], text: 'Redes sociais e contatos, a um toque.' },
  { id: 'cartas', name: 'Cartas', color: 0xf08a3c, pos: [-14, 0, 18], text: 'Depoimentos em cartas, organizados por categoria.' }
];

// Etiqueta flutuante: desenhada num canvas 2D e usada como "sprite" (imagem que sempre encara a câmera)
function makeLabel(text, color, scale = 1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(11,6,19,0.85)';
  x.beginPath();
  if (x.roundRect) x.roundRect(6, 6, 500, 116, 28); else x.rect(6, 6, 500, 116);
  x.fill();
  x.lineWidth = 5; x.strokeStyle = hex(color); x.stroke();
  x.fillStyle = '#f6ecd9'; x.font = '800 54px Syne, system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 68);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
  s.scale.set(4 * scale, 1 * scale, 1); s.renderOrder = 10;
  return s;
}

function buildZones() {
  zones.forEach(z => {
    const g = new THREE.Group(); g.position.set(z.pos[0], z.pos[1], z.pos[2]); world.add(g);
    const R = z.r || 5.5; // raio da zona (a biblioteca é maior que as outras)
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 0.3, 0.3, 48), lam(z.ground || 0x241538, { emissive: new THREE.Color(z.color), emissiveIntensity: 0.14 }));
    plate.position.y = 0.1; plate.receiveShadow = true; g.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.09, 8, 64), new THREE.MeshBasicMaterial({ color: z.color }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; ring.userData.flat = true; g.add(ring);
    const light = new THREE.PointLight(z.color, z.lightI || 0.9, 14); light.position.set(0, 5, 3); g.add(light);
    const aura = glowSprite(z.color, R * 2.2, z.glow || 0.3); aura.position.set(0, 2.6, 0.5); g.add(aura);
    props[z.id](g);
    const label = makeLabel(z.name, z.color); label.position.set(0, z.labelY || 6.8, 0); g.add(label);
    enableShadows(g);
    z.ring = ring; z.light = light; z.label = label; z.r = R;

    // "Fio de bordado": trilha pontilhada colorida que leva do centro até a zona
    const d = Math.hypot(z.pos[0], z.pos[2]), ux = z.pos[0] / d, uz = z.pos[2] / d;
    for (let t = 6.5; t < d - R - 1.1; t += 1.7) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.2), new THREE.MeshBasicMaterial({ color: z.color }));
      dash.position.set(ux * t, 0.06, uz * t); dash.rotation.y = -Math.atan2(uz, ux); dash.userData.flat = true; world.add(dash);
    }
  });
  const lk = makeLabel('Kiara', 0xf08a3c, 0.55); lk.position.y = 2.3; kiara.add(lk);
  const lm = makeLabel('Maria Marta', 0xf6ecd9, 0.6); lm.position.y = 2.3; maria.add(lm);
  catLabels.push([lk, kiara], [lm, maria]);
}
const catLabels = []; // [etiqueta, gata]: as etiquetas somem quando estão longe
// Espera a fonte carregar (no máximo 2,5 s) para as etiquetas saírem bonitas
Promise.race([
  document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
  new Promise(r => setTimeout(r, 2500))
]).then(buildZones);

let activeZone = null, activeBook = null; // zona e livro (da biblioteca) mais perto da personagem
const tmpV = new THREE.Vector3();
function checkZones(now) {
  let found = null;
  for (const z of zones) {
    if (!z.ring) continue;
    const d = Math.hypot(player.position.x - z.pos[0], player.position.z - z.pos[2]);
    const near = d < z.r + 0.7;
    z.label.getWorldPosition(tmpV); // a etiqueta some quando está longe do personagem ou colada na câmera
    z.label.material.opacity = Math.max(0, Math.min(1, 1.7 - d / 18, (camera.position.distanceTo(tmpV) - 9) / 6));
    z.ring.scale.setScalar(near ? 1.04 + Math.sin(now * 5) * 0.02 : 1);
    z.light.intensity = (z.lightI || 0.9) * (near ? 2.1 : 1);
    if (near) found = z;
  }
  catLabels.forEach(([lab, cat]) => {
    const dc = Math.hypot(player.position.x - cat.position.x, player.position.z - cat.position.z);
    lab.material.opacity = Math.max(0, Math.min(1, 1.8 - dc / 10));
  });
  // Na biblioteca, o cartão mostra o livro que está mais perto (se tiver algum)
  const book = found && found.id === 'biblioteca' ? nearestBook() : null;
  if (found !== activeZone || book !== activeBook) {
    activeZone = found; activeBook = book;
    if (book) { hud.cardTitle.textContent = book.data.title; hud.cardText.textContent = book.data.kind + ' · ' + book.data.org; hud.card.hidden = false; }
    else if (found) { hud.cardTitle.textContent = found.name; hud.cardText.textContent = found.text; hud.card.hidden = false; }
    else hud.card.hidden = true;
  }
}

