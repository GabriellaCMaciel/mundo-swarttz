// As zonas do portfólio: cenários, etiquetas, trilhas e detecção de proximidade.
'use strict';

// ===== 4. As zonas (cada uma é uma parte do portfólio) =====
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
      if (logo) nx.drawImage(logo, 136, 20, 148, 183);
      nx.fillStyle = '#2a1745'; nx.textAlign = 'center';
      nx.font = '800 60px Syne, sans-serif'; nx.fillText('Gabriella', 210, 280); nx.fillText('Swarttz', 210, 342);
      // textos do bilhete: nada pequeno demais para ler de longe (antes 20 px e 15 px; agora 34 px e 30 px)
      nx.font = '800 34px "JetBrains Mono", monospace'; nx.fillText('dev em formação', 210, 400);
      nx.font = '800 30px "JetBrains Mono", monospace'; nx.fillStyle = '#7b3fe4'; nx.fillText('Web & Mobile', 210, 452);
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
  cinema(g) { buildCinema(g); }, // o cinema drive-in (tela, carrinhos e projetor) fica em js/cinema.js
  telefone(g) { buildPhone(g); }, // o celular gigante flutuante, com ícones e cartões de vidro (js/phone.js)
  cartas(g) { buildMailbox(g); } // a casinha e a caixa de correio rosa (js/mailbox.js)
};

// Onde cada zona fica, a cor e o texto do cartão que aparece quando você chega perto.
// size = quanto o cenário da zona é ampliado (1 = tamanho original); r = raio de "alcance" da zona.
const zones = [
  { id: 'sobre', name: 'Sobre', color: 0xf2b84b, pos: [8, 0, 1], rot: -0.55, size: 1.35, text: 'Quem é a Gabriella Swarttz: foto, apresentação e descrição.' },
  { id: 'atelie', name: 'Ateliê', color: 0xff5fa2, pos: [-33, 0, -20], size: 1.35, text: 'As soft skills viram obras: pintura, bordado e cores.' },
  { id: 'biblioteca', name: 'Biblioteca', color: 0x37d0c0, pos: [0, 0, -54], r: 12.5, labelY: 13, glow: 0.05, lightI: 0.5, lightD: 20,
    text: 'Os livros que brilham são cursos, certificações e a graduação. Chegue perto de um e abra.' },
  // Cinema drive-in: cada filme na tela gigante (e cada carrinho estacionado) é um projeto. rot gira a frente da tela para o lado de onde a personagem chega.
  { id: 'cinema', name: 'Cinema drive-in', color: 0xf2b84b, pos: [34, 0, -22], rot: -0.7, r: 16, labelY: 13.4, glow: 0.08, lightI: 0.8, lightD: 26, text: 'Cada filme é um projeto meu. Na bilheteria você escolhe qual passa na tela gigante.' },
  { id: 'telefone', name: 'Telefone', color: 0x7b3fe4, pos: [27, 0, 31], size: 1.35, labelY: 0.5, labelZ: 2.0, text: 'GitHub, LinkedIn e e-mail, a um toque.' },
  // Cartas: a posição é a da caixa de correio. A casa e o quintal ficam atrás dela, girados (rot) para não encararem a câmera (veja mailbox.js)
  { id: 'cartas', name: 'Cartas', color: 0xff7eb6, pos: [CARTAS.x, 0, CARTAS.z], rot: CARTAS.rot, r: 7, labelY: 5.4, glow: 0, lightI: 0.22, lightD: 12, text: 'Cartas de depoimento que a Gabriella recebeu. Abra a caixinha de correio para ler.' }
];

// Etiqueta flutuante: desenhada num canvas 2D e usada como "sprite" (imagem que sempre encara a câmera)
function makeLabel(text, color, scale = 1) {
  // A largura da caixa se ajusta ao texto (medido no canvas): nomes longos como "Álbum de selos" não são mais cortados
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '800 54px Syne, system-ui, sans-serif';
  x.font = font;
  const W = Math.max(512, Math.ceil(x.measureText(text).width) + 120); // 60px de folga de cada lado
  c.width = W; c.height = 128;
  x.fillStyle = 'rgba(11,6,19,0.85)';
  x.beginPath();
  if (x.roundRect) x.roundRect(6, 6, W - 12, 116, 28); else x.rect(6, 6, W - 12, 116);
  x.fill();
  x.lineWidth = 5; x.strokeStyle = hex(color); x.stroke();
  x.fillStyle = '#f6ecd9'; x.font = font; // mudar o tamanho do canvas apaga a fonte, então definimos de novo
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, 68);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
  s.scale.set(4 * scale * (W / 512), 1 * scale, 1); s.renderOrder = 10;
  return s;
}

function buildZones() {
  zones.forEach(z => {
    const g = new THREE.Group(); g.position.set(z.pos[0], z.pos[1], z.pos[2]); g.rotation.y = z.rot || 0; world.add(g); // rot: giro em radianos (negativo = vira a frente para a esquerda)
    const S = z.size || 1; // ampliação do cenário (as zonas pequenas ficaram 35% maiores)
    const R = z.r || 5.5 * S; // raio de "alcance" da zona (só conta para o cartão e a trilha: não existe mais nenhum círculo desenhado no chão)
    const light = new THREE.PointLight(z.color, z.lightI || 0.9, z.lightD || 14 * S); light.position.set(0, 5 * S, 3 * S); g.add(light);
    const aura = glowSprite(z.color, R * 2.2, z.glow || 0.22); aura.position.set(0, 2.6 * S, 0.5); g.add(aura);
    // Para ampliar um cenário inteiro basta colocá-lo dentro de um grupo com scale (as luzes e a etiqueta ficam de fora, no tamanho certo)
    const stage = S === 1 ? g : new THREE.Group();
    if (S !== 1) { stage.scale.setScalar(S); g.add(stage); }
    props[z.id](stage);
    const label = makeLabel(z.name, z.color); label.position.set(0, z.labelY || 6.8 * S, z.labelZ || 0); // labelZ: puxa a etiqueta para a frente (o celular fica alto demais para ela ficar em cima) g.add(label);
    enableShadows(g);
    g.userData.zoneId = z.id; z.group = g; // o clique (js/pick.js) descobre a zona subindo pelos pais até achar este id
    z.built = true; z.light = light; z.label = label; z.r = R;
  });
  const lk = makeLabel('Kiara', 0xf08a3c, 0.55); lk.position.y = 2.3; kiara.add(lk);
  const lm = makeLabel('Maria Marta', 0xf6ecd9, 0.6); lm.position.y = 2.3; maria.add(lm);
  catLabels.push([lk, kiara], [lm, maria]);
}
const catLabels = []; // [etiqueta, gata]: as etiquetas somem quando estão longe
// Espera as fontes carregarem (no máximo 2,5 s) para as etiquetas e o celular saírem bonitos.
// document.fonts.load() é preciso porque uma fonte só é baixada quando alguém a pede: a Nunito (celular) só é usada dentro de textura de canvas.
Promise.race([
  document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 24px Nunito'), document.fonts.load('600 24px Nunito'), document.fonts.load('800 24px Syne'), document.fonts.load('700 24px Caveat')]).then(() => document.fonts.ready) : Promise.resolve(),
  new Promise(r => setTimeout(r, 2500))
]).then(buildZones);

let activeZone = null, activeBook = null; // zona e livro (da biblioteca) mais perto da personagem
const tmpV = new THREE.Vector3();
function checkZones(now) {
  let found = null;
  for (const z of zones) {
    if (!z.built) continue;
    const d = Math.hypot(player.position.x - z.pos[0], player.position.z - z.pos[2]);
    const near = d < z.r + 0.7;
    z.label.getWorldPosition(tmpV); // a etiqueta some quando está longe do personagem ou colada na câmera
    z.label.material.opacity = Math.max(0, Math.min(1, 1.7 - d / 18, (camera.position.distanceTo(tmpV) - 9) / 6));
    z.light.intensity = (z.lightI || 0.9) * (near ? 2.1 : 1);
    if (near) found = z;
  }
  catLabels.forEach(([lab, cat]) => {
    cat.getWorldPosition(tmpV); // posição no MUNDO (alguns gatos moram dentro de grupos girados, como a Mel no telhado)
    const dc = Math.hypot(player.position.x - tmpV.x, player.position.z - tmpV.z);
    lab.material.opacity = Math.max(0, Math.min(1, 1.8 - dc / 10));
  });
  // Na biblioteca, o cartão mostra o livro que está mais perto (se tiver algum)
  const book = found && found.id === 'biblioteca' ? nearestBook() : null;
  if (found !== activeZone || book !== activeBook) {
    activeZone = found; activeBook = book;
    if (book) { hud.cardTitle.textContent = book.data.title; hud.cardText.textContent = book.data.kind + ' · ' + book.data.org; hud.card.hidden = false; }
    else if (found) { hud.cardTitle.textContent = found.name; hud.cardText.textContent = found.text; hud.card.hidden = false; }
    else hud.card.hidden = true;
    if (book) announce('Perto do livro: ' + book.data.title + '. ' + (touch ? 'Toque no cartão para abrir.' : 'Aperte E ou Enter para abrir.'));
    else if (found) announce('Você chegou em ' + found.name + '. ' + found.text + ' ' + (touch ? 'Toque no cartão para abrir.' : 'Aperte E ou Enter para abrir.'));
  }
}

