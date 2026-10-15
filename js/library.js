// A Biblioteca: um caramanchão aberto, coberto de trepadeiras, com estantes, sofás, puffs,
// luzinhas e flores em volta. Os livros que brilham são selecionáveis: cada um abre um
// curso, uma certificação ou a graduação (os dados deles ficam em config.js).
// Este arquivo só define funções e variáveis; quem chama buildLibrary() é o zones.js.
'use strict';

const LIB = {
  R: 5.6,        // raio do hexágono (distância do centro até cada coluna)
  FY: 0.36,      // altura do piso de pedra em relação ao chão da zona
  RY: 4.6,       // altura das colunas (onde o telhado começa)
  RH: 2.6,       // altura do telhado
  ZR: 9,         // raio da zona inteira (o "jardim")
  center: null,  // posição da zona no mundo (preenchida em buildLibrary)
  ready: false
};
// Como a câmera muda dentro da biblioteca (y = sobe, z = afasta; negativo = chega mais perto, look = olha mais para cima)
const LIB_CAM = { y: 6, z: -1, look: 0.5 };
const libraryBooks = [];  // livros selecionáveis: { data, group, glow, hit, base }
const libFx = {};         // coisas que se animam: telhado, luzinhas, lâmpada
let hoverBook = null;     // livro sob o mouse
const DEG = Math.PI / 180;
const polar = (ang, r) => [Math.sin(ang) * r, Math.cos(ang) * r]; // ângulo + distância -> [x, z]

// Números "aleatórios" que sempre saem iguais (com a mesma semente): o cenário não muda a cada visita
function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Materiais iguais são reaproveitados (menos trabalho para a placa de vídeo)
const matCache = {};
const mat = c => matCache[c] || (matCache[c] = lam(c));
function bx(w, h, d, color, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z); parent.add(m); return m;
}

// INSTANCED MESH: um jeito de desenhar centenas de objetos iguais (livros, flores, folhas) numa
// única chamada, cada um com posição, tamanho e cor próprios. É o truque que mantém o site leve.
function instanced(geo, material, items) {
  const mesh = new THREE.InstancedMesh(geo, material, items.length);
  const d = new THREE.Object3D(), col = new THREE.Color();
  items.forEach((it, i) => {
    d.position.set(it.x, it.y, it.z);
    d.scale.set(it.sx, it.sy === undefined ? it.sx : it.sy, it.sz === undefined ? it.sx : it.sz);
    d.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    mesh.setColorAt(i, col.setHex(it.c));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.userData.flat = true; // não projeta sombra
  return mesh;
}

// ----- Texturas desenhadas com o Canvas 2D -----
function stoneTex() { // lajotas de pedra irregulares
  const rnd = mulberry32(5);
  const t = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#2b2138'; x.fillRect(0, 0, w, h);
    for (let y = 0; y < h;) {
      const rh = 80 + rnd() * 50, hh = Math.min(rh, h - y);
      for (let px = -rnd() * 80; px < w;) {
        const sw = 90 + rnd() * 90;
        x.fillStyle = 'hsl(' + (262 + rnd() * 22) + ',16%,' + (34 + rnd() * 12) + '%)';
        x.fillRect(px + 3, y + 3, sw - 6, hh - 6);
        px += sw;
      }
      y += rh;
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
}
function shingleTex() { // telhas arredondadas em tons de roxo
  const rnd = mulberry32(9);
  const t = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#1d1028'; x.fillRect(0, 0, w, h);
    const cols = ['#4a2c6b', '#3d2459', '#55337a', '#33204d'], rows = 8, n = 8, rh = h / rows, cw = w / n;
    for (let r = rows - 1; r >= 0; r--) { // de baixo para cima, para a fileira de cima ficar por cima
      for (let i = -1; i <= n; i++) {
        const cx = i * cw + (r % 2 ? cw / 2 : 0) + cw / 2, y0 = r * rh;
        x.fillStyle = cols[(rnd() * 4) | 0]; x.strokeStyle = '#1d1028'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(cx - cw / 2, y0); x.lineTo(cx + cw / 2, y0); x.lineTo(cx + cw / 2, y0 + rh * 0.55);
        x.arc(cx, y0 + rh * 0.55, cw / 2, 0, Math.PI, false); x.closePath(); x.fill(); x.stroke();
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 1.6);
  return t;
}
function rugTex() { // tapete colorido em círculos
  return canvasTex(512, 512, (x, w) => {
    const c = w / 2, cols = ['#ff5fa2', '#f2b84b', '#37d0c0', '#7b3fe4', '#f08a3c', '#b79af5', '#ff5fa2'];
    x.fillStyle = '#f6ecd9'; x.beginPath(); x.arc(c, c, c, 0, 6.3); x.fill();
    cols.forEach((col, i) => { x.fillStyle = col; x.beginPath(); x.arc(c, c, c - 14 - i * 32, 0, 6.3); x.fill(); });
    x.fillStyle = '#2a1745'; x.beginPath(); x.arc(c, c, 32, 0, 6.3); x.fill();
    x.strokeStyle = 'rgba(246,236,217,0.75)'; x.lineWidth = 3; x.setLineDash([9, 11]);
    [0, 2, 4].forEach(i => { x.beginPath(); x.arc(c, c, c - 30 - i * 32, 0, 6.3); x.stroke(); });
  });
}
const lumOf = c => (c >> 16 & 255) * 0.299 + (c >> 8 & 255) * 0.587 + (c & 255) * 0.114;
function bookCoverTex(b) { // capa do livro: cor, moldura dourada e o nome curto
  return canvasTex(256, 360, (x, w, h) => {
    x.fillStyle = hex(b.color); x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 0, 26, h); // lombada
    x.strokeStyle = '#f2b84b'; x.lineWidth = 6; x.strokeRect(42, 18, w - 60, h - 36);
    const ink = lumOf(b.color) > 150 ? '#0b0613' : '#f6ecd9';
    let size = 58; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = ink;
    do { x.font = '800 ' + size + 'px Syne, sans-serif'; size -= 3; } while (x.measureText(b.short).width > 160 && size > 18);
    x.fillText(b.short, 150, 150);
    x.font = '700 15px "JetBrains Mono", monospace'; x.fillText(b.kind.toUpperCase(), 150, 215);
    x.fillStyle = '#f2b84b'; // estrelinha de 4 pontas
    x.beginPath(); x.moveTo(150, 240); x.quadraticCurveTo(150, 262, 172, 262); x.quadraticCurveTo(150, 262, 150, 284);
    x.quadraticCurveTo(150, 262, 128, 262); x.quadraticCurveTo(150, 262, 150, 240); x.fill();
  });
}

// ===== O cenário completo da biblioteca (g = o grupo da zona, centrado no ponto da zona) =====
function buildLibrary(g) {
  const { R, FY, RY, RH } = LIB;
  const rnd = mulberry32(2024);
  LIB.center = g.position;
  const inner = new THREE.Group(); inner.position.y = FY; g.add(inner); // tudo que fica em cima do piso de pedra
  const APO = R * Math.cos(30 * DEG);   // do centro até o meio de cada lado do hexágono
  const CREAM = 0xe8dcc8, WOOD = 0x4b2e3f, WICKER = 0x8a6644, GOLD = 0xf2b84b;
  const greens = [0x2f8f6b, 0x247a5a, 0x3aa17a, 0x1d6650, 0x4cb88a];
  const flowerCols = [0xff7eb6, 0xff5fa2, 0xfff1f5, 0xb79af5, 0xf2b84b, 0xf08a3c];
  const bushes = [], flowers = [];

  // Um arbusto (bolinha verde amassada) coberto de florzinhas. dom = cor que predomina
  function bush(x, y, z, r, nFlowers, dom) {
    bushes.push({ x, y, z, sx: r * (1 + rnd() * 0.25), sy: r * 0.78, sz: r * (1 + rnd() * 0.25), ry: rnd() * 3, c: greens[(rnd() * 5) | 0] });
    for (let i = 0; i < nFlowers; i++) {
      const u = 0.15 + rnd() * 0.85, ph = rnd() * 6.283, s = Math.sqrt(1 - u * u);
      flowers.push({ x: x + Math.cos(ph) * s * r * 1.02, y: y + u * r * 0.8, z: z + Math.sin(ph) * s * r * 1.02, sx: 0.12 + rnd() * 0.1, c: rnd() < 0.72 ? dom : flowerCols[(rnd() * 6) | 0] });
    }
  }

  // --- Piso de pedra hexagonal, degrau e pedras do caminho ---
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.5, 0.5, 6), new THREE.MeshLambertMaterial({ map: stoneTex() }));
  plat.rotation.y = Math.PI / 6; plat.position.y = 0.11; plat.receiveShadow = true; g.add(plat);
  const step = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 1.3), new THREE.MeshLambertMaterial({ map: stoneTex() }));
  step.position.set(0, 0.2, 6.95); step.receiveShadow = true; g.add(step);
  [[0.1, 8.4], [-0.25, 9.3], [0.2, 10.3]].forEach(([x, z]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.07, 9), mat(0x6f6283));
    s.position.set(x, 0.28, z); s.userData.flat = true; g.add(s);
  });

  // --- Colunas, vigas e telhado ---
  const tops = []; // topo de cada coluna
  for (let k = 0; k < 6; k++) {
    const a = (30 + 60 * k) * DEG, [x, z] = polar(a, R);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, RY, 12), mat(CREAM)); col.position.set(x, RY / 2, z); inner.add(col);
    bx(0.82, 0.28, 0.82, CREAM, x, 0.14, z, inner);        // base
    bx(0.82, 0.3, 0.82, CREAM, x, RY - 0.15, z, inner);    // capitel
    bx(0.9, 0.07, 0.9, GOLD, x, RY - 0.34, z, inner);      // friso dourado
    tops.push(new THREE.Vector3(x, RY - 0.1, z));
  }
  const apex = new THREE.Vector3(0, RY + RH, 0), zAxis = new THREE.Vector3(0, 0, 1);
  tops.forEach(A => { // caibros: do topo de cada coluna até a ponta do telhado
    const len = A.distanceTo(apex), mid = A.clone().add(apex).multiplyScalar(0.5);
    const rf = bx(0.16, 0.16, len, 0x6b4a2f, mid.x, mid.y, mid.z, inner);
    rf.quaternion.setFromUnitVectors(zAxis, apex.clone().sub(A).normalize());
  });
  const Rr = R * 1.18; // o telhado sobra um pouco para fora das colunas
  for (let k = 0; k < 5; k++) { // viga de cada lado + frisos dourados na beirada (o lado da frente, k = 5, fica sem viga: é a entrada, e assim a câmera enxerga lá dentro)
    const am = (60 + 60 * k) * DEG, [mx, mz] = polar(am, APO);
    bx(R + 0.5, 0.32, 0.36, CREAM, mx, RY - 0.05, mz, inner).rotation.y = am;
    const [ex, ez] = polar(am, Rr * Math.cos(30 * DEG));
    bx(Rr, 0.12, 0.16, GOLD, ex, RY + 0.16, ez, inner).rotation.y = am;
  }
  // TRANSPARÊNCIA: o telhado fica quase invisível quando a Gabriella entra, para a câmera enxergar lá dentro
  libFx.roofMat = new THREE.MeshLambertMaterial({ map: shingleTex(), side: THREE.DoubleSide, transparent: true, opacity: 0.97, depthWrite: false });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Rr, RH, 6, 1, true), libFx.roofMat);
  roof.rotation.y = Math.PI / 6; roof.position.y = RY + RH / 2 + 0.1; roof.userData.flat = true; inner.add(roof);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), new THREE.MeshBasicMaterial({ color: GOLD })); fin.position.y = RY + RH + 0.3; inner.add(fin);
  const finGlow = glowSprite(GOLD, 3, 0.7); finGlow.position.copy(fin.position); inner.add(finGlow);

  // --- Trepadeiras: folhas em volta do telhado (somem junto com ele), nas beiradas e nas colunas ---
  const leaf = new THREE.IcosahedronGeometry(1, 0);
  const roofLeaves = [];
  for (let i = 0; i < 150; i++) {
    const th = rnd() * 6.283, deg = th / DEG, delta = ((deg + 30) % 60 + 60) % 60 - 30; // quão longe do meio do lado
    const u = Math.pow(rnd(), 0.8), baseR = Rr * Math.cos(30 * DEG) / Math.cos(delta * DEG);
    const rr = baseR * (1 - u) + 0.1, [x, z] = polar(th, rr), s = 0.32 + rnd() * 0.4;
    roofLeaves.push({ x, y: RY + 0.2 + u * RH, z, sx: s, sy: s * 0.55, sz: s, ry: rnd() * 3, rz: rnd(), c: greens[(rnd() * 5) | 0] });
  }
  libFx.vineMat = lam(0xffffff, { transparent: true, opacity: 0.97, depthWrite: false });
  inner.add(instanced(leaf, libFx.vineMat, roofLeaves));
  const hangLeaves = [];
  for (let k = 0; k < 6; k++) {
    const a = (30 + 60 * k) * DEG;
    for (let j = 0; j < 3; j++) { // cortinas de folhas que caem da beirada
      const [x, z] = polar(a + (j - 1) * 0.12, Rr * 0.97 - j * 0.15), n = 2 + ((rnd() * 3) | 0);
      for (let i = 0; i < n; i++) hangLeaves.push({ x, y: RY - 0.1 - i * 0.42, z, sx: 0.3 - i * 0.03, sy: 0.4, sz: 0.3 - i * 0.03, ry: rnd() * 3, c: greens[(rnd() * 5) | 0] });
    }
    const [px, pz] = polar(a, R + 0.05); // folhas subindo em espiral pela coluna
    for (let i = 0; i < 9; i++) {
      const aa = i * 1.1 + k, s = 0.17 + rnd() * 0.1;
      hangLeaves.push({ x: px + Math.cos(aa) * 0.3, y: 0.5 + i * 0.42, z: pz + Math.sin(aa) * 0.3, sx: s, sy: s * 1.2, sz: s, ry: rnd() * 3, c: greens[(rnd() * 5) | 0] });
    }
  }
  inner.add(instanced(leaf, lam(0xffffff), hangLeaves));

  // --- Estantes cheias de livros (3 lados) ---
  const bookPal = [0xff5fa2, 0xf2b84b, 0x37d0c0, 0x7b3fe4, 0xf08a3c, 0xb79af5, 0x2f8f6b, 0xc94f6d, 0x3b4a9b, 0xe8dcc8, 0x8a3b5c];
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const slotsOrder = [240, 180, 120]; // da esquerda para a direita; cada estante tem 2 livros selecionáveis
  slotsOrder.forEach((deg, si) => {
    const am = deg * DEG, sg = new THREE.Group(), [sx, sz] = polar(am, APO - 0.55);
    sg.position.set(sx, 0, sz); sg.rotation.y = am + Math.PI; inner.add(sg); // de frente para o centro
    const W = 4.7, H = 4.2, boards = [0.05, 0.95, 1.85, 2.75, 3.65, H - 0.05];
    bx(W, H, 0.12, WOOD, 0, H / 2, -0.4, sg);
    [-1, 1].forEach(s => bx(0.14, H, 0.95, WOOD, s * W / 2, H / 2, 0, sg));
    boards.forEach(y => bx(W, 0.1, 0.95, WOOD, 0, y, 0, sg));
    bx(W + 0.3, 0.12, 1.1, GOLD, 0, H + 0.06, 0, sg);
    const items = [];
    for (let r = 0; r < 5; r++) {
      const baseY = boards[r] + 0.05;
      for (let xp = -W / 2 + 0.2; xp < W / 2 - 0.3;) {
        if (rnd() < 0.07) { xp += 0.3; continue; }
        const w = 0.14 + rnd() * 0.2, h = 0.5 + rnd() * 0.28, d = 0.55 + rnd() * 0.15;
        items.push({ x: xp + w / 2, y: baseY + h / 2, z: -0.34 + d / 2 + rnd() * 0.06, sx: w, sy: h, sz: d, c: bookPal[(rnd() * bookPal.length) | 0] });
        xp += w + 0.015;
      }
    }
    sg.add(instanced(unit, lam(0xffffff), items));
    if (deg === 180) { // escada de biblioteca encostada na estante do fundo
      [-1, 1].forEach(s => { const rail = bx(0.08, 4.0, 0.08, 0xc9965a, 2.0 + s * 0.28, 2.0, 0.78, sg); rail.rotation.x = -0.16; });
      for (let i = 0; i < 7; i++) { const y = 0.45 + i * 0.5; bx(0.56, 0.06, 0.07, 0xc9965a, 2.0, y, 0.78 + (2 - y) * 0.16, sg); }
    }

    // os livros selecionáveis: flutuam na frente da estante, brilhando
    const facing = Math.atan2(Math.sin(sg.rotation.y), Math.cos(sg.rotation.y));
    [-1, 1].forEach((side, j) => {
      const data = books[si * 2 + j]; if (!data) return;
      const grp = new THREE.Group(); grp.position.set(side * 1.3, 2.6, 0.95); grp.rotation.y = -facing * 0.65; sg.add(grp);
      const pages = lam(0xf6ecd9), cover = lam(data.color);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.65, 0.3), [pages, cover, pages, pages, new THREE.MeshBasicMaterial({ map: bookCoverTex(data) }), cover]);
      grp.add(body);
      bx(0.07, 0.5, 0.02, GOLD, 0.3, -1.0, 0.16, grp); // fitinha marcadora de página
      const glow = glowSprite(data.color, 4.2, 0.5); glow.position.z = -0.15; grp.add(glow);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.1, 0.9), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.userData.flat = true; grp.add(hit);
      const entry = { data, group: grp, glow, hit, base: 2.6, phase: j + si * 2 };
      hit.userData.book = entry; libraryBooks.push(entry);
    });
  });

  // --- Grades baixas com vasinhos de flores nos dois lados abertos ---
  [60, 300].forEach(deg => {
    const am = deg * DEG, rg = new THREE.Group(), [rx, rz] = polar(am, APO - 0.05);
    rg.position.set(rx, 0, rz); rg.rotation.y = am; inner.add(rg);
    bx(R - 0.7, 0.1, 0.2, CREAM, 0, 1.0, 0, rg); bx(R - 0.7, 0.1, 0.14, CREAM, 0, 0.22, 0, rg);
    for (let i = 0; i < 8; i++) bx(0.07, 0.8, 0.07, CREAM, -2.25 + i * 0.64, 0.6, 0, rg);
    [-1.7, 0, 1.7].forEach((s, j) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.3, 10), mat(0xb4655a)); pot.position.set(s, 1.2, 0); rg.add(pot);
      bush(rx + s * Math.cos(am), FY + 1.35, rz - s * Math.sin(am), 0.36, 9, flowerCols[(j + (deg > 100 ? 2 : 0)) % 3]);
    });
  });

  // --- Sofás ---
  function sofa(deg) {
    const sp = new THREE.Group(), [x, z] = polar(deg * DEG, 3.25), UP = 0xd9cfe8, UP2 = 0xc7bbdc;
    sp.position.set(x, 0, z); sp.rotation.y = deg * DEG + Math.PI; inner.add(sp);
    bx(3.0, 0.45, 1.15, WICKER, 0, 0.22, 0, sp);
    [-1, 1].forEach(s => bx(1.4, 0.3, 1.0, UP, s * 0.72, 0.6, 0.06, sp));
    bx(3.0, 0.85, 0.32, UP2, 0, 0.9, -0.45, sp);
    [-1, 1].forEach(s => bx(0.3, 0.7, 1.15, WICKER, s * 1.35, 0.58, 0, sp));
    [[-0.9, 0x37d0c0, 0.15], [0.1, 0xff5fa2, -0.1], [1.0, 0xf2b84b, 0.12]].forEach(([px, c, r]) => { // almofadas coloridas (com um pouquinho de brilho próprio para não escurecerem na sombra)
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.16), lam(c, { emissive: c, emissiveIntensity: 0.3 }));
      pil.position.set(px, 0.98, -0.2); pil.rotation.z = r; sp.add(pil);
    });
    sp.updateMatrix();
    return sp;
  }
  sofa(120);
  const sofaLeft = sofa(240);
  const seat = new THREE.Vector3(-0.7, 0.78, 0.05).applyMatrix4(sofaLeft.matrix); // a Maria Marta dorme no sofá
  maria.position.set(g.position.x + seat.x, g.position.y + FY + seat.y, g.position.z + seat.z);
  maria.rotation.y = 0.5;

  // --- Puffs ---
  [[-2.0, 1.1, 0xff5fa2], [2.1, 1.3, 0xf2b84b], [0.1, -2.3, 0x37d0c0]].forEach(([x, z, c]) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.66, 14, 10), lam(c)); p.scale.y = 0.72; p.position.set(x, 0.46, z); inner.add(p);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 20), mat(GOLD)); ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.64, z); inner.add(ring);
  });

  // --- Tapete, mesinha de leitura e luminária ---
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshLambertMaterial({ map: rugTex() }));
  rug.rotation.x = -Math.PI / 2; rug.position.y = 0.02; rug.receiveShadow = true; rug.userData.flat = true; inner.add(rug);
  const table = new THREE.Group(); table.position.set(0, 0, -0.1); inner.add(table);
  const tcyl = (rt, rb, h, y, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 20), mat(c)); m.position.y = y; table.add(m); return m; };
  tcyl(0.5, 0.55, 0.08, 0.04, WOOD); tcyl(0.12, 0.12, 0.6, 0.38, WOOD); tcyl(0.95, 0.95, 0.1, 0.7, WOOD);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.03, 6, 32), mat(GOLD)); edge.rotation.x = Math.PI / 2; edge.position.y = 0.7; table.add(edge);
  const poolLight = new THREE.Mesh(new THREE.CircleGeometry(0.85, 24), new THREE.MeshBasicMaterial({ color: 0xffc878, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  poolLight.rotation.x = -Math.PI / 2; poolLight.position.set(-0.3, 0.76, 0); poolLight.userData.flat = true; table.add(poolLight);
  const lamp = new THREE.Group(); lamp.position.set(-0.4, 0.75, -0.15); table.add(lamp);
  const lcyl = (rt, rb, h, y, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), mat(c)); m.position.y = y; lamp.add(m); };
  lcyl(0.22, 0.26, 0.08, 0.04, GOLD); lcyl(0.035, 0.035, 0.9, 0.5, GOLD);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, side: THREE.DoubleSide }));
  shade.position.y = 1.2; lamp.add(shade);
  libFx.lampGlow = glowSprite(0xffc870, 4.2, 0.75); libFx.lampGlow.position.y = 1.15; lamp.add(libFx.lampGlow);
  libFx.lampLight = new THREE.PointLight(0xffc878, 1.1, 12); libFx.lampLight.position.set(0, 1.3, 0); lamp.add(libFx.lampLight); // a única luz de verdade nova
  const open1 = bx(0.5, 0.04, 0.4, 0xf6ecd9, 0.62, 0.78, 0.1, table); open1.rotation.set(0, 0.2, 0.1); // livro aberto
  const open2 = bx(0.5, 0.04, 0.4, 0xf6ecd9, 0.93, 0.78, 0.05, table); open2.rotation.set(0, 0.2, -0.1);
  bx(0.95, 0.03, 0.42, 0xff5fa2, 0.78, 0.745, 0.08, table).rotation.y = 0.2;
  bx(0.55, 0.1, 0.4, 0x37d0c0, -0.1, 0.8, 0.55, table); bx(0.5, 0.1, 0.38, GOLD, -0.08, 0.9, 0.55, table).rotation.y = 0.15; // pilha de livros
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.13, 12), mat(0xf6ecd9)); cup.position.set(0.5, 0.82, -0.45); table.add(cup);

  // --- Luminárias penduradas e postes na entrada ---
  function lantern(parent, x, y, z, glowSize, sc = 1) {
    const l = new THREE.Group(); l.position.set(x, y, z); l.scale.setScalar(sc); parent.add(l);
    l.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.38), new THREE.MeshBasicMaterial({ color: 0xffcf80 })));
    bx(0.5, 0.07, 0.5, GOLD, 0, 0.3, 0, l); bx(0.46, 0.06, 0.46, GOLD, 0, -0.29, 0, l);
    const gl = glowSprite(0xffb85c, glowSize, 0.65); l.add(gl);
  }
  [0, 120, 240].forEach(deg => {
    const [x, z] = polar(deg * DEG, 1.9);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.7, 4), mat(0x1a0f2e)); cord.position.set(x, 5.1, z); cord.userData.flat = true; inner.add(cord);
    lantern(inner, x, 3.5, z, 3.4);
  });
  [-1, 1].forEach(s => { // postes de luz ao lado do degrau
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.3, 8), mat(0x1a0f2e)); post.position.set(s * 2.9, 1.4, 7.0); g.add(post);
    lantern(g, s * 2.9, 2.8, 7.0, 4.2, 0.6);
  });

  // --- Luzinhas de Natal (pisca-pisca) nas vigas, beiradas, caibros e colunas ---
  // Um "Points" é uma nuvem de pontos; usamos a bolinha de brilho como textura para cada luzinha.
  const lightsA = { p: [], c: [] }, lightsB = { p: [], c: [] };
  const warm = [new THREE.Color(0xffd98a), new THREE.Color(0xffe9c0), new THREE.Color(0xff9ec8), new THREE.Color(0xc9b0ff)];
  let lightN = 0;
  const addLight = (x, y, z) => { const s = lightN++ % 2 ? lightsA : lightsB, c = warm[lightN % 4]; s.p.push(x, y, z); s.c.push(c.r, c.g, c.b); };
  const swag = (A, B, sag, n) => { for (let i = 0; i <= n; i++) { const t = i / n; addLight(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t - Math.sin(Math.PI * t) * sag, A.z + (B.z - A.z) * t); } };
  for (let k = 0; k < 6; k++) {
    const a1 = (30 + 60 * k) * DEG, a2 = a1 + 60 * DEG;
    const p1 = new THREE.Vector3(...polar(a1, R)), p2 = new THREE.Vector3(...polar(a2, R));
    swag(p1.setY(RY - 0.45), p2.setY(RY - 0.45), 0.55, 14);
    const e1 = new THREE.Vector3(...polar(a1, Rr)), e2 = new THREE.Vector3(...polar(a2, Rr));
    swag(e1.setY(RY + 0.05), e2.setY(RY + 0.05), 0.35, 16);
    for (let i = 1; i < 10; i++) { const t = i / 10, [x, z] = polar(a1, R * (1 - t)); addLight(x, RY - 0.3 + t * (RH + 0.2) - 0.1, z); } // caibros
    const [px, pz] = polar(a1, R);
    for (let i = 0; i < 18; i++) addLight(px + Math.cos(i * 0.9) * 0.4, 0.5 + i * 0.2, pz + Math.sin(i * 0.9) * 0.4); // espiral na coluna
  }
  [lightsA, lightsB].forEach((s, i) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(s.p, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(s.c, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 7, map: glowTex, vertexColors: true, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    inner.add(pts); libFx['tw' + i] = pts;
  });

  // --- Flores em volta: um anel de arbustos ao redor do piso (com uma abertura na frente, no caminho) ---
  for (let deg = 0; deg < 360; deg += 15) {
    const dd = Math.min(deg, 360 - deg);
    if (dd < 14) continue;
    const dom = flowerCols[((deg / 15) | 0) % 6], [x, z] = polar(deg * DEG, 7.9 + rnd() * 0.8), r = 0.8 + rnd() * 0.4;
    bush(x, 0.25 + r * 0.35, z, r, 11, dom);
  }
  for (let deg = 7; deg < 360; deg += 15) {
    const dd = Math.min(deg, 360 - deg);
    if (dd < 14) continue;
    const [x, z] = polar(deg * DEG, 8.8 + rnd() * 0.3), r = 0.5 + rnd() * 0.25;
    bush(x, 0.25 + r * 0.3, z, r, 7, flowerCols[(rnd() * 6) | 0]);
  }
  bush(-5.6, 0.25 + 0.5, 7.3, 1.45, 24, 0xff7eb6); bush(5.4, 0.25 + 0.5, 7.4, 1.35, 22, 0xb79af5); // hortênsias grandes na frente
  g.add(instanced(new THREE.IcosahedronGeometry(1, 1), lam(0xffffff), bushes));
  g.add(instanced(new THREE.SphereGeometry(1, 6, 5), lam(0xffffff, { emissive: 0x2a1020 }), flowers));

  inner.traverse(o => { if (o.isMesh && !o.userData.flat) o.receiveShadow = true; });
  LIB.ready = true;
}

// ----- Interação com os livros: o mais perto da Gabriella, o que está sob o mouse e o clique -----
const bookV = new THREE.Vector3();
function libraryNear() { return LIB.ready && Math.hypot(player.position.x - LIB.center.x, player.position.z - LIB.center.z) < LIB.ZR + 3; }
function nearestBook() { // livro a menos de ~3 unidades da personagem (para abrir com a tecla E ou o botão)
  let best = null, bd = 3.3;
  libraryBooks.forEach(b => {
    b.group.getWorldPosition(bookV);
    const d = Math.hypot(bookV.x - player.position.x, bookV.z - player.position.z);
    if (d < bd) { bd = d; best = b; }
  });
  return best;
}
// RAYCASTER: dispara um "raio invisível" da câmera passando pelo ponto onde o mouse está e
// descobre qual objeto 3D ele atravessa primeiro. É assim que o clique chega até o livro.
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pickBook(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(libraryBooks.map(b => b.hit), false)[0];
  return hit ? hit.object.userData.book : null;
}
renderer.domElement.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || phase !== 'world' || panelOpen || !libraryNear()) { hoverBook = null; return; }
  hoverBook = pickBook(e);
  renderer.domElement.style.cursor = hoverBook ? 'pointer' : '';
});
renderer.domElement.addEventListener('click', e => {
  if (phase !== 'world' || panelOpen || !libraryNear()) return;
  const b = pickBook(e);
  if (b) openBook(b.data);
});

// Câmera se afasta um pouco quando a Gabriella entra no jardim (para caber o caramanchão inteiro)
function libraryCamBoost() {
  if (!LIB.ready) return 0;
  const d = Math.hypot(player.position.x - LIB.center.x, player.position.z - LIB.center.z);
  return THREE.MathUtils.clamp((LIB.ZR + 4 - d) / 6, 0, 1);
}

// Chamada todo quadro: telhado some/aparece, luzinhas piscam, lâmpada pulsa, livros flutuam
function updateLibrary(now, dt) {
  if (!LIB.ready) return;
  const d = Math.hypot(player.position.x - LIB.center.x, player.position.z - LIB.center.z);
  const want = 0.97 - 0.86 * THREE.MathUtils.clamp((15 - d) / 6, 0, 1);
  libFx.roofMat.opacity += (want - libFx.roofMat.opacity) * Math.min(1, dt * 4);
  libFx.vineMat.opacity = libFx.roofMat.opacity;
  libFx.tw0.material.opacity = 0.7 + 0.3 * Math.sin(now * 2.4);
  libFx.tw1.material.opacity = 0.7 + 0.3 * Math.sin(now * 2.4 + Math.PI);
  libFx.lampLight.intensity = 1.1 + 0.06 * Math.sin(now * 6) + 0.04 * Math.sin(now * 13);
  libFx.lampGlow.material.opacity = 0.72 + 0.06 * Math.sin(now * 6);
  libraryBooks.forEach(b => {
    const on = b === activeBook || b === hoverBook, k = Math.min(1, dt * 8);
    const s = b.group.scale.x + ((on ? 1.2 : 1) - b.group.scale.x) * k;
    b.group.scale.setScalar(s);
    b.glow.material.opacity += ((on ? 0.95 : 0.5) - b.glow.material.opacity) * k;
    if (!calm) { b.group.position.y = b.base + Math.sin(now * 1.4 + b.phase) * 0.1; b.group.rotation.z = Math.sin(now * 0.9 + b.phase) * 0.05; }
  });
}
