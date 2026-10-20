// A Biblioteca: um caramanchão grande e aberto, coberto de trepadeiras, com estantes, sofás, puffs,
// plantas, luzinhas e um jardim em volta (flores, árvores, lagoa, postes), sem nenhuma borda marcando
// onde ela começa: o jardim vai se misturando ao resto do mundo.
// Os livros que brilham são selecionáveis: cada um abre um curso, uma certificação ou a graduação
// (os dados deles ficam em config.js). Os ajudantes (flores, luzes, borboletas) estão em garden.js.
// Este arquivo só define funções e variáveis; quem chama buildLibrary() é o zones.js.
'use strict';

const LIB = {
  R: 9,          // raio do hexágono (distância do centro até cada coluna)
  FY: 0.4,       // altura do piso de pedra em relação ao chão do mundo
  RY: 6.4,       // altura das colunas (onde o telhado começa)
  RH: 3.8,       // altura do telhado
  ZR: 12.5,      // até onde a zona "vale" (o cartão aparece, a câmera se afasta)
  center: null,  // posição da zona no mundo (preenchida em buildLibrary)
  ready: false
};
// Como a câmera muda dentro da biblioteca (y = sobe, z = afasta; negativo = chega mais perto, look = olha mais para cima)
const LIB_CAM = { y: 8, z: 3, look: 0.8 };
const libraryBooks = [];  // livros selecionáveis: { data, group, glow, hit, base }
const libFx = {};         // coisas que se animam: telhado, lâmpada
let hoverBook = null;     // livro sob o mouse

// ----- Texturas desenhadas com o Canvas 2D -----
function stoneTex(rep) { // lajotas de pedra irregulares
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
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
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
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 1.8);
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
function pondTex() { // água da lagoa: degradê e marolas
  return canvasTex(256, 256, (x, w) => {
    const c = w / 2, g = x.createRadialGradient(c, c, 10, c, c, c);
    g.addColorStop(0, '#46b6d6'); g.addColorStop(0.7, '#2a7fa8'); g.addColorStop(1, '#1f5a86');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
    x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = 2;
    for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(c + (i * 37 % 120) - 60, c + (i * 53 % 120) - 60, 14 + (i * 11) % 30, 0.2, 2.6); x.stroke(); }
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
  const veg = new VegBatch(rnd), lights = new Lights(), lampPos = [];
  LIB.center = g.position;
  const inner = new THREE.Group(); inner.position.y = FY; g.add(inner); // tudo que fica em cima do piso de pedra
  const APO = R * Math.cos(30 * DEG);   // do centro até o meio de cada lado do hexágono
  const Rr = R * 1.16;                  // o telhado sobra um pouco para fora das colunas
  const CREAM = 0xe8dcc8, WOOD = 0x4b2e3f, WICKER = 0x8a6644, GOLD = 0xf2b84b, TERRA = 0xb4655a, STONE = 0x6f6283;
  const I = y => y + FY;                // altura "do piso" -> altura "do chão do mundo"
  const flat = m => { m.userData.flat = true; return m; };

  // --- Piso de pedra em dois níveis, degrau e pedras do caminho ---
  const tier = (rTop, rBot, h, y, rep) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 6), new THREE.MeshLambertMaterial({ map: stoneTex(rep) }));
    m.rotation.y = Math.PI / 6; m.position.y = y; m.receiveShadow = true; g.add(m);
  };
  tier(11, 11.4, 0.6, 0.1, 5); tier(12.4, 12.8, 0.4, 0, 6);
  const step = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 1.8), new THREE.MeshLambertMaterial({ map: stoneTex(2) }));
  step.position.set(0, 0.06, 11.6); step.receiveShadow = true; g.add(step);
  for (let i = 0; i < 6; i++) {
    const s = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.07, 9), mat(STONE)));
    s.position.set(Math.sin(i * 1.7) * 0.35, 0.04, 13.4 + i * 1.5); g.add(s);
  }

  // --- Colunas, vigas e telhado ---
  const tops = []; // topo de cada coluna
  for (let k = 0; k < 6; k++) {
    const a = (30 + 60 * k) * DEG, [x, z] = polar(a, R);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.48, RY, 14), mat(CREAM)); col.position.set(x, RY / 2, z); inner.add(col);
    bx(1.2, 0.4, 1.2, CREAM, x, 0.2, z, inner);          // base
    bx(1.2, 0.42, 1.2, CREAM, x, RY - 0.21, z, inner);   // capitel
    bx(1.35, 0.1, 1.35, GOLD, x, RY - 0.5, z, inner);    // friso dourado
    tops.push(new THREE.Vector3(x, RY - 0.1, z));
  }
  const apex = new THREE.Vector3(0, RY + RH, 0), zAxis = new THREE.Vector3(0, 0, 1);
  const beamBetween = (A, B, t, color) => { // viga fina ligando dois pontos 3D
    const len = A.distanceTo(B), mid = A.clone().add(B).multiplyScalar(0.5);
    const m = bx(t, t, len, color, mid.x, mid.y, mid.z, inner);
    m.quaternion.setFromUnitVectors(zAxis, B.clone().sub(A).normalize()); return m;
  };
  tops.forEach(A => beamBetween(A, apex, 0.26, 0x6b4a2f));                       // caibros até a ponta
  const mids = tops.map(A => A.clone().lerp(apex, 0.5));
  mids.forEach((A, i) => beamBetween(A, mids[(i + 1) % 6], 0.2, 0x6b4a2f));      // anel de vigas no meio do telhado
  for (let k = 0; k < 5; k++) { // viga de cada lado + frisos dourados na beirada (o lado da frente, k = 5, fica sem viga: é a entrada, e assim a câmera enxerga lá dentro)
    const am = (60 + 60 * k) * DEG, [mx, mz] = polar(am, APO);
    bx(R + 0.7, 0.45, 0.5, CREAM, mx, RY - 0.05, mz, inner).rotation.y = am;
    const [ex, ez] = polar(am, Rr * Math.cos(30 * DEG));
    bx(Rr, 0.14, 0.2, GOLD, ex, RY + 0.2, ez, inner).rotation.y = am;
  }
  // TRANSPARÊNCIA: o telhado fica quase invisível quando a Gabriella chega perto, para a câmera enxergar lá dentro
  libFx.roofMat = new THREE.MeshLambertMaterial({ map: shingleTex(), side: THREE.DoubleSide, transparent: true, opacity: 0.97, depthWrite: false });
  const roof = flat(new THREE.Mesh(new THREE.ConeGeometry(Rr, RH, 6, 1, true), libFx.roofMat));
  roof.rotation.y = Math.PI / 6; roof.position.y = RY + RH / 2 + 0.1; inner.add(roof);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshBasicMaterial({ color: GOLD })); fin.position.y = RY + RH + 0.4; inner.add(fin);
  const finGlow = glowSprite(GOLD, 4, 0.7); finGlow.position.copy(fin.position); inner.add(finGlow);

  // --- Trepadeiras: folhas em volta do telhado (somem junto com ele), cortinas nas beiradas e espirais nas colunas ---
  const roofLeaves = [];
  for (let i = 0; i < 260; i++) {
    const th = rnd() * 6.283, deg = th / DEG, delta = ((deg + 30) % 60 + 60) % 60 - 30; // quão longe do meio do lado
    const u = Math.pow(rnd(), 0.8), baseR = Rr * Math.cos(30 * DEG) / Math.cos(delta * DEG);
    const rr = baseR * (1 - u) + 0.1, [x, z] = polar(th, rr), s = 0.5 + rnd() * 0.6;
    roofLeaves.push({ x, y: RY + 0.25 + u * RH, z, sx: s, sy: s * 0.55, sz: s, ry: rnd() * 3, rz: rnd(), c: GREENS[(rnd() * 5) | 0] });
  }
  libFx.vineMat = lam(0xffffff, { transparent: true, opacity: 0.97, depthWrite: false });
  inner.add(instanced(new THREE.IcosahedronGeometry(1, 0), libFx.vineMat, roofLeaves));
  for (let k = 0; k < 6; k++) {
    const a = (30 + 60 * k) * DEG;
    for (let j = 0; j < 3; j++) {
      const [x, z] = polar(a + (j - 1) * 0.1, Rr * 0.97 - j * 0.2), n = 2 + ((rnd() * 3) | 0);
      for (let i = 0; i < n; i++) veg.leaf(x, I(RY - 0.1 - i * 0.55), z, 0.5 - i * 0.05);
    }
    const [px, pz] = polar(a, R + 0.05);
    const front = k === 0 || k === 5; // as duas colunas da frente ganham menos folhas, para não tampar a vista lá de dentro
    for (let i = 0; i < (front ? 6 : 14); i++) { const aa = i * 1.1 + k; veg.leaf(px + Math.cos(aa) * 0.45, I(0.6 + i * (front ? 0.9 : 0.4)), pz + Math.sin(aa) * 0.45, (front ? 0.14 : 0.2) + rnd() * 0.1); }
    // cestos de flores pendurados nas colunas
    const [bxx, bzz] = polar(a, R + 1.3);
    const chain = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 4), mat(0x1a0f2e))); chain.position.set(bxx, I(RY - 1.1), bzz); g.add(chain);
    const basket = flat(new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6, 0, 6.3, 1.57, 1.57), mat(TERRA))); basket.position.set(bxx, I(RY - 2.0), bzz); g.add(basket);
    veg.bush(bxx, I(RY - 2.0), bzz, 0.55, 12, FLOWER_COLS[k % 6]);
  }

  // --- Estantes cheias de livros (3 lados), com plantinhas e pilhas deitadas ---
  const bookPal = [0xff5fa2, 0xf2b84b, 0x37d0c0, 0x7b3fe4, 0xf08a3c, 0xb79af5, 0x2f8f6b, 0xc94f6d, 0x3b4a9b, 0xe8dcc8, 0x8a3b5c];
  const unit = new THREE.BoxGeometry(1, 1, 1);
  [240, 180, 120].forEach(deg => {
    const am = deg * DEG, sg = new THREE.Group(), [sx, sz] = polar(am, APO - 0.55);
    sg.position.set(sx, 0, sz); sg.rotation.y = am + Math.PI; inner.add(sg); // de frente para o centro
    const W = 7.9, H = 5.6, boards = [0.05, 0.95, 1.85, 2.75, 3.65, 4.55, H - 0.05];
    bx(W, H, 0.12, WOOD, 0, H / 2, -0.4, sg);
    [-1, 1].forEach(s => bx(0.16, H, 0.95, WOOD, s * W / 2, H / 2, 0, sg));
    boards.forEach(y => bx(W, 0.1, 0.95, WOOD, 0, y, 0, sg));
    bx(W + 0.4, 0.14, 1.15, GOLD, 0, H + 0.07, 0, sg);
    const items = [];
    for (let r = 0; r < 6; r++) {
      const baseY = boards[r] + 0.05;
      for (let xp = -W / 2 + 0.25; xp < W / 2 - 0.35;) {
        const roll = rnd();
        if (roll < 0.05) { xp += 0.3; continue; }
        if (roll < 0.09) { // vasinho com planta
          const pot = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.28, 8), mat(TERRA))); pot.position.set(xp + 0.25, baseY + 0.14, -0.05); sg.add(pot);
          const lf = flat(new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat(GREENS[(rnd() * 5) | 0]))); lf.position.set(xp + 0.25, baseY + 0.5, -0.05); sg.add(lf);
          xp += 0.6; continue;
        }
        if (roll < 0.12) { // pilha de livros deitados
          [0.7, 0.6, 0.5].forEach((w, i) => items.push({ x: xp + 0.4, y: baseY + 0.06 + i * 0.12, z: -0.05, sx: w, sy: 0.11, sz: 0.5, ry: (rnd() - 0.5) * 0.3, c: bookPal[(rnd() * bookPal.length) | 0] }));
          xp += 0.85; continue;
        }
        const w = 0.14 + rnd() * 0.2, h = 0.5 + rnd() * 0.28, d = 0.55 + rnd() * 0.15;
        items.push({ x: xp + w / 2, y: baseY + h / 2, z: -0.34 + d / 2 + rnd() * 0.06, sx: w, sy: h, sz: d, c: bookPal[(rnd() * bookPal.length) | 0] });
        xp += w + 0.015;
      }
    }
    sg.add(instanced(unit, lam(0xffffff), items));
    if (deg === 180) { // escada de biblioteca encostada na estante do fundo
      [-1, 1].forEach(s => { const rail = bx(0.09, 5.0, 0.09, 0xc9965a, 3.0 + s * 0.3, 2.5, 0.8, sg); rail.rotation.x = -0.14; });
      for (let i = 0; i < 9; i++) { const y = 0.45 + i * 0.52; bx(0.6, 0.07, 0.08, 0xc9965a, 3.0, y, 0.8 + (2.5 - y) * 0.14, sg); }
    }
  });

  // --- Os livros selecionáveis: num arco largo em frente às estantes, bem espaçados (~3,2 unidades) ---
  // O arco ocupa sempre ~173°, então o espaçamento se ajusta sozinho ao número de livros da lista `books`.
  const nB = books.length, stepB = nB > 1 ? 173 / (nB - 1) : 0;
  for (let i = 0; i < nB; i++) {
    const data = books[i]; if (!data) continue;
    const a = (180 - (i - (nB - 1) / 2) * stepB) * DEG, [x, z] = polar(a, 6.3); // i = 0 fica à esquerda, o último à direita
    const grp = new THREE.Group(); grp.position.set(x, 3.4, z);
    grp.rotation.y = Math.atan2(Math.sin(a + Math.PI), Math.cos(a + Math.PI)) * 0.55; // de frente para o centro, virado um pouco para a câmera
    inner.add(grp);
    const pages = lam(0xf6ecd9), cover = lam(data.color);
    grp.scale.setScalar(1.25); // os livros são maiores que o normal para aparecerem bem de longe
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.05, 0.36), [pages, cover, pages, pages, new THREE.MeshBasicMaterial({ map: bookCoverTex(data) }), cover]));
    bx(0.09, 0.62, 0.02, GOLD, 0.38, -1.25, 0.2, grp).userData.merge = false; // fitinha marcadora de página (se mexe junto com o livro, por isso não é fundida)
    const glow = glowSprite(data.color, 5.4, 0.5); glow.position.z = -0.2; grp.add(glow);
    const hit = flat(new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.5, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))); grp.add(hit);
    const entry = { data, group: grp, glow, hit, base: 3.4, phase: i * 1.3 };
    hit.userData.book = entry; libraryBooks.push(entry);
  }

  // --- Grades baixas com vasinhos de flores nos dois lados abertos ---
  [60, 300].forEach(deg => {
    const am = deg * DEG, rg = new THREE.Group(), [rx, rz] = polar(am, APO - 0.05);
    rg.position.set(rx, 0, rz); rg.rotation.y = am; inner.add(rg);
    bx(R - 1, 0.1, 0.24, CREAM, 0, 1.0, 0, rg); bx(R - 1, 0.1, 0.16, CREAM, 0, 0.22, 0, rg);
    for (let i = 0; i < 12; i++) bx(0.08, 0.8, 0.08, CREAM, -3.9 + i * 0.71, 0.6, 0, rg);
    [-3.2, -1.6, 0, 1.6, 3.2].forEach((s, j) => {
      const pot = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.34, 10), mat(TERRA))); pot.position.set(s, 1.22, 0); rg.add(pot);
      veg.bush(rx + s * Math.cos(am), I(1.5), rz - s * Math.sin(am), 0.42, 10, FLOWER_COLS[(j + (deg > 100 ? 2 : 0)) % 6]);
    });
  });

  // --- Móveis ---
  const place = (grp, lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyMatrix4(grp.matrix); // posição local do móvel -> posição no "inner"
  const cush = [0x37d0c0, 0xff5fa2, 0xf2b84b, 0xb79af5];
  function sofa(deg, w) {
    const sp = new THREE.Group(), [x, z] = polar(deg * DEG, 6.0), UP = 0xd9cfe8, UP2 = 0xc7bbdc;
    sp.position.set(x, 0, z); sp.rotation.y = deg * DEG + Math.PI; inner.add(sp);
    bx(w, 0.5, 1.2, WICKER, 0, 0.25, 0, sp);
    [-1, 1].forEach(s => bx(w / 2 - 0.25, 0.3, 1.05, UP, s * w / 4, 0.65, 0.06, sp));
    bx(w, 0.9, 0.34, UP2, 0, 0.95, -0.45, sp);
    [-1, 1].forEach(s => bx(0.3, 0.75, 1.2, WICKER, s * (w / 2 - 0.15), 0.62, 0, sp));
    [-0.3, 0, 0.3].forEach((f, i) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.17), lam(cush[(i + deg) % 4], { emissive: cush[(i + deg) % 4], emissiveIntensity: 0.3 }));
      p.position.set(f * w, 1.0, -0.2); p.rotation.z = (i - 1) * 0.14; flat(p); sp.add(p);
    });
    sp.updateMatrix(); return sp;
  }
  sofa(120, 3.8);
  const sofaLeft = sofa(240, 3.8);
  const seat = place(sofaLeft, -0.8, 0.8, 0.05); // a Maria Marta dorme no sofá
  maria.position.set(g.position.x + seat.x, g.position.y + FY + seat.y, g.position.z + seat.z);
  maria.rotation.y = 0.5;

  const bed = new THREE.Group(); bed.position.set(0, 0, -6.2); inner.add(bed); // um divã grande no fundo, debaixo dos livros
  bx(5.8, 0.45, 1.7, WICKER, 0, 0.22, 0, bed); bx(5.6, 0.3, 1.55, 0xd9cfe8, 0, 0.6, 0, bed);
  [-1, 1].forEach(s => { const b = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.4, 12), lam(0xc7bbdc))); b.rotation.x = Math.PI / 2; b.position.set(s * 2.7, 0.95, 0); bed.add(b); }); // almofadas-rolo nas pontas
  [-1.5, -0.5, 0.6, 1.6].forEach((px, i) => {
    const p = flat(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.17), lam(cush[i], { emissive: cush[i], emissiveIntensity: 0.3 }))); p.position.set(px, 1.0, -0.55); p.rotation.set(-0.5, 0, (i - 1.5) * 0.12); bed.add(p);
  });
  bed.updateMatrix();

  function armchair(deg, col) {
    const ac = new THREE.Group(), [x, z] = polar(deg * DEG, 5.9);
    ac.position.set(x, 0, z); ac.rotation.y = deg * DEG + Math.PI; inner.add(ac);
    bx(1.5, 0.45, 1.4, WICKER, 0, 0.22, 0, ac); bx(1.15, 0.3, 1.1, col, 0, 0.62, 0.08, ac);
    bx(1.5, 0.95, 0.3, col, 0, 0.95, -0.55, ac); [-1, 1].forEach(s => bx(0.28, 0.7, 1.4, WICKER, s * 0.62, 0.6, 0, ac));
    ac.updateMatrix(); return ac;
  }
  const chairR = armchair(58, 0xf4a6c9), chairL = armchair(302, 0x8fe0d6);

  const sideTable = (x, z, kind) => { // mesinha de apoio com uma luminária pequena ou uma plantinha
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 14), mat(WOOD)); top.position.set(x, 0.85, z); inner.add(top);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.8, 8), mat(WOOD)); leg.position.set(x, 0.42, z); inner.add(leg);
    if (kind === 'lamp') {
      const st = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), mat(GOLD))); st.position.set(x, 1.15, z); inner.add(st);
      const sh = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 0.3, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, side: THREE.DoubleSide }))); sh.position.set(x, 1.5, z); inner.add(sh);
      const gl = glowSprite(0xffc870, 2.6, 0.6); gl.position.set(x, 1.5, z); inner.add(gl);
    } else {
      const pot = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 8), mat(TERRA))); pot.position.set(x, 1.04, z); inner.add(pot);
      for (let i = 0; i < 4; i++) veg.leaf(x + Math.cos(i * 1.6) * 0.15, I(1.35 + (i % 2) * 0.12), z + Math.sin(i * 1.6) * 0.15, 0.22);
    }
  };
  [120, 240].forEach(deg => [-1, 1].forEach((s, j) => {
    const a = deg * DEG, [cx, cz] = polar(a, 6.0), ex = Math.cos(a + Math.PI), ez = -Math.sin(a + Math.PI); // eixo "para o lado" do sofá
    sideTable(cx + ex * s * 2.7, cz + ez * s * 2.7, j === 0 ? 'lamp' : 'plant');
  }));
  [-1, 1].forEach((s, j) => sideTable(s * 3.9, -6.0, j === 0 ? 'plant' : 'lamp'));
  const floorLamp = (x, z) => { // abajur de chão ao lado das poltronas
    const pole = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.6, 6), mat(GOLD))); pole.position.set(x, 1.3, z); inner.add(pole);
    const base = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.08, 12), mat(GOLD))); base.position.set(x, 0.04, z); inner.add(base);
    const sh = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 0.7, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, side: THREE.DoubleSide }))); sh.position.set(x, 2.75, z); inner.add(sh);
    const gl = glowSprite(0xffc870, 4.2, 0.65); gl.position.set(x, 2.75, z); inner.add(gl);
  };
  [chairR, chairL].forEach(c => { const p = place(c, 1.35, 0, 0.1); floorLamp(p.x, p.z); });

  // Tapete, mesinha de leitura com a luminária, puffs
  const rug = flat(new THREE.Mesh(new THREE.CircleGeometry(4.6, 56), new THREE.MeshLambertMaterial({ map: rugTex() })));
  rug.rotation.x = -Math.PI / 2; rug.position.y = 0.02; rug.receiveShadow = true; inner.add(rug);
  const table = new THREE.Group(); table.position.set(0, 0, -0.2); inner.add(table);
  const tcyl = (rt, rb, h, y, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 24), mat(c)); m.position.y = y; table.add(m); return m; };
  tcyl(0.65, 0.7, 0.1, 0.05, WOOD); tcyl(0.15, 0.15, 0.7, 0.45, WOOD); tcyl(1.2, 1.2, 0.12, 0.82, WOOD);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.035, 6, 36), mat(GOLD)); edge.rotation.x = Math.PI / 2; edge.position.y = 0.82; table.add(edge);
  const pool = flat(new THREE.Mesh(new THREE.CircleGeometry(1.05, 28), new THREE.MeshBasicMaterial({ color: 0xffc878, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));
  pool.rotation.x = -Math.PI / 2; pool.position.set(-0.4, 0.89, 0); table.add(pool);
  const lamp = new THREE.Group(); lamp.position.set(-0.5, 0.88, -0.2); table.add(lamp);
  const lcyl = (rt, rb, h, y, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), mat(c)); m.position.y = y; lamp.add(m); };
  lcyl(0.25, 0.3, 0.09, 0.045, GOLD); lcyl(0.04, 0.04, 1.05, 0.58, GOLD);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.48, 0.58, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, side: THREE.DoubleSide }));
  shade.position.y = 1.4; lamp.add(shade);
  libFx.lampGlow = glowSprite(0xffc870, 5, 0.75); libFx.lampGlow.position.y = 1.35; lamp.add(libFx.lampGlow);
  libFx.lampLight = new THREE.PointLight(0xffc878, 1.1, 14); libFx.lampLight.position.set(0, 1.5, 0); lamp.add(libFx.lampLight); // a única luz de verdade nova
  bx(0.55, 0.045, 0.45, 0xf6ecd9, 0.7, 0.92, 0.2, table).rotation.set(0, 0.2, 0.1); // livro aberto
  bx(0.55, 0.045, 0.45, 0xf6ecd9, 1.02, 0.92, 0.15, table).rotation.set(0, 0.2, -0.1);
  bx(1.1, 0.03, 0.48, 0xff5fa2, 0.86, 0.89, 0.18, table).rotation.y = 0.2;
  bx(0.62, 0.11, 0.45, 0x37d0c0, -0.1, 0.94, 0.7, table); bx(0.56, 0.11, 0.42, GOLD, -0.08, 1.05, 0.7, table).rotation.y = 0.15; // pilha de livros
  const cup = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.14, 12), mat(0xf6ecd9))); cup.position.set(0.55, 0.95, -0.55); table.add(cup);
  const vase = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.34, 10), mat(0x7b3fe4))); vase.position.set(-0.1, 1.05, -0.75); table.add(vase);
  [0xff7eb6, 0xfff1f5, 0xf2b84b, 0xff5fa2].forEach((c, i) => veg.bush(table.position.x - 0.1 + Math.cos(i * 1.6) * 0.12, I(1.4 + (i % 2) * 0.12), table.position.z - 0.75 + Math.sin(i * 1.6) * 0.12, 0.13, 0, c));
  [0, 1, 2, 3, 4, 5].forEach(i => { // puffs
    const a = (22 + i * 60) * DEG, [x, z] = polar(a, 3.4 + (i % 2) * 0.5), c = [0xff5fa2, 0xf2b84b, 0x37d0c0, 0xb79af5, 0xf08a3c, 0x7b3fe4][i];
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), lam(c)); p.scale.y = 0.72; p.position.set(x, 0.5, z); inner.add(p);
    const ring = flat(new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.025, 6, 20), mat(GOLD))); ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.68, z); inner.add(ring);
  });

  // Plantas grandes em vasos, junto das colunas
  for (let k = 1; k < 5; k++) { // (as duas colunas da frente ficam sem vaso grande, para a câmera enxergar lá dentro)
    const [x, z] = polar((30 + 60 * k) * DEG, R - 1.5);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.8, 10), mat(TERRA)); pot.position.set(x, 0.4, z); inner.add(pot);
    for (let i = 0; i < 9; i++) { const aa = i * 2.4, t = i / 8; veg.leaf(x + Math.cos(aa) * (0.4 + t * 0.4), I(1.0 + t * 1.9), z + Math.sin(aa) * (0.4 + t * 0.4), 0.45 + rnd() * 0.3); }
    veg.bush(x, I(2.9), z, 0.3, 5, FLOWER_COLS[(k + 1) % 6]);
  }

  // --- Lustre, lanternas penduradas e postes na entrada ---
  const chand = new THREE.Group(); chand.position.set(0, RY - 1.6, -0.2); inner.add(chand);
  const ringC = flat(new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 6, 28), mat(GOLD))); ringC.rotation.x = Math.PI / 2; chand.add(ringC);
  const cordC = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.6, 4), mat(0x1a0f2e))); cordC.position.y = 1.8; chand.add(cordC);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, gl = glowSprite(0xffd98a, 1.6, 0.85); gl.position.set(Math.cos(a) * 1.3, 0.2, Math.sin(a) * 1.3); chand.add(gl); }
  function lantern(parent, x, y, z, glowSize, sc = 1) {
    const l = new THREE.Group(); l.position.set(x, y, z); l.scale.setScalar(sc); parent.add(l);
    l.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.38), new THREE.MeshBasicMaterial({ color: 0xffcf80 })));
    bx(0.5, 0.07, 0.5, GOLD, 0, 0.3, 0, l); bx(0.46, 0.06, 0.46, GOLD, 0, -0.29, 0, l);
    l.add(glowSprite(0xffb85c, glowSize, 0.65));
  }
  [0, 60, 120, 180, 240, 300].forEach(deg => {
    const [x, z] = polar(deg * DEG, 5.4);
    const cord = flat(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.4, 4), mat(0x1a0f2e))); cord.position.set(x, 6.0, z); inner.add(cord);
    lantern(inner, x, 4.1, z, 3.6);
  });
  [-1, 1].forEach(s => { // lanternas no degrau de entrada
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.5, 8), mat(0x1a0f2e)); post.position.set(s * 4.9, 1.25, 12.2); g.add(post);
    lantern(g, s * 4.9, 2.8, 12.2, 4.4, 0.65);
  });

  // --- Luzinhas de Natal (pisca-pisca) nas vigas, beiradas, caibros e colunas ---
  for (let k = 0; k < 6; k++) {
    const a1 = (30 + 60 * k) * DEG, a2 = a1 + 60 * DEG;
    const p1 = new THREE.Vector3(...polar(a1, R)), p2 = new THREE.Vector3(...polar(a2, R));
    lights.swag(p1.setY(I(RY - 0.7)), p2.setY(I(RY - 0.7)), 0.7, 22);
    const e1 = new THREE.Vector3(...polar(a1, Rr)), e2 = new THREE.Vector3(...polar(a2, Rr));
    lights.swag(e1.setY(I(RY + 0.1)), e2.setY(I(RY + 0.1)), 0.45, 26);
    for (let i = 1; i < 13; i++) { const t = i / 13, [x, z] = polar(a1, R * (1 - t)); lights.add(x, I(RY - 0.4 + t * (RH + 0.3)), z); } // caibros
    const [px, pz] = polar(a1, R);
    for (let i = 0; i < 26; i++) lights.add(px + Math.cos(i * 0.9) * 0.58, I(0.5 + i * 0.22), pz + Math.sin(i * 0.9) * 0.58); // espiral na coluna
    lights.swag(I3(mids[k], FY), I3(mids[(k + 1) % 6], FY), 0.4, 10);
  }

  // ===================== O JARDIM EM VOLTA (sem bordas: vai se misturando ao mundo) =====================
  const pond = { x: POND.x - g.position.x, z: POND.z - g.position.z, r: POND.r }; // a lagoa (posição global em garden.js: o gato e os peixes dela vivem em pond.js)
  const blocked = (x, z, pad = 0) => (z > 8.5 && Math.abs(x) < 3.2 + pad) || Math.hypot(x - pond.x, z - pond.z) < pond.r + 1.4 + pad; // caminho da entrada e lagoa
  // Três fileiras de canteiros floridos, cada trecho com uma cor dominante (os canteiros mudam de cor ao redor)
  [[14.3, 3.0, 0.9, 1.4, 11], [15.9, 3.2, 0.7, 1.1, 9], [17.6, 3.6, 0.9, 1.5, 5]].forEach(([rad, stp, r0, r1, nf], ri) => {
    const n = Math.floor(2 * Math.PI * rad / stp);
    for (let i = 0; i < n; i++) {
      const a = (i + rnd() * 0.6) / n * 2 * Math.PI, [x, z] = polar(a, rad + (rnd() - 0.5));
      if (blocked(x, z)) continue;
      veg.groundBush(x, z, r0 + rnd() * (r1 - r0), nf, FLOWER_COLS[(Math.floor(a / (Math.PI / 4)) + ri * 2) % 6]);
    }
  });
  veg.groundBush(-5.6, 14.6, 1.8, 28, 0xff7eb6); veg.groundBush(5.6, 14.8, 1.7, 26, 0xb79af5); // hortênsias grandes ladeando a entrada
  veg.groundBush(-7.2, 13.6, 1.2, 16, 0xfff1f5); veg.groundBush(7.4, 13.8, 1.2, 16, 0xf2b84b);
  for (let i = 0; i < 120; i++) { // pontinhos de flores soltos pelo chão
    const a = rnd() * 6.283, [x, z] = polar(a, 12.8 + rnd() * 13);
    if (!blocked(x, z)) veg.groundBush(x, z, 0.22 + rnd() * 0.12, 4, FLOWER_COLS[(rnd() * 6) | 0]);
  }
  // Árvores floridas atrás e nos lados, com luzinhas na copa
  for (let a = 38; a < 330; a += 21) {
    const [x, z] = polar((a + rnd() * 8) * DEG, 21 + rnd() * 4.5);
    if (blocked(x, z, 2)) continue;
    if (z > pond.z + 2 && Math.abs(x - pond.x) < pond.r + 8) continue; // nenhuma árvore na frente da lagoa (a câmera olha de baixo para cima)
    const h = 5.2 + rnd() * 2, cr = veg.tree(x, z, h, (a / 21 | 0) % 2 === 0);
    for (let i = 0; i < 16; i++) { const u = rnd() * 6.283, v = rnd() * 3.14; lights.add(x + Math.cos(u) * Math.sin(v) * cr * 1.05, h * 0.72 + Math.cos(v) * cr * 0.8, z + Math.sin(u) * Math.sin(v) * cr * 1.05); }
  }
  // Postes de luz em volta do jardim, ligados por fios de luzinhas (inclusive um arco sobre a entrada)
  const posts = [];
  for (let a = 30; a < 340; a += 30) { const [x, z] = polar(a * DEG, 16.7); if (!blocked(x, z, 1)) posts.push({ x, z, h: 3.6 }); }
  [-1, 1].forEach(s => posts.push({ x: s * 3.7, z: 15.2, h: 4.4 }));
  posts.sort((p, q) => Math.atan2(p.x, p.z) - Math.atan2(q.x, q.z));
  posts.forEach((p, i) => {
    veg.post(p.x, p.z, p.h); lampPos.push(p.x, p.h + 0.2, p.z);
    const q = posts[i + 1];
    if (q && Math.hypot(q.x - p.x, q.z - p.z) < 13) lights.swag({ x: p.x, y: p.h, z: p.z }, { x: q.x, y: q.h, z: q.z }, 1.1, 20);
  });
  for (let i = 0; i < 8; i++) { const z = 13.2 + i * 1.6; lights.add(-2.3, 0.3, z); lights.add(2.3, 0.3, z); } // luzinhas no chão, ao longo do caminho
  // Bancos com lanterna
  const bench = (x, z, face) => {
    const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = face; g.add(b);
    bx(2.8, 0.16, 0.9, 0x8a6644, 0, 0.6, 0, b); bx(2.8, 0.75, 0.14, 0x8a6644, 0, 1.05, -0.42, b);
    [-1, 1].forEach(s => bx(0.14, 0.6, 0.8, 0x4b2e3f, s * 1.2, 0.3, 0, b));
    veg.post(x + Math.cos(face) * 1.9, z - Math.sin(face) * 1.9, 2.0); lampPos.push(x + Math.cos(face) * 1.9, 2.2, z - Math.sin(face) * 1.9);
  };
  bench(BENCH_SPOT.x - (POND.x - pond.x), BENCH_SPOT.z - (POND.z - pond.z), Math.PI / 2); // o único banco: do lado ESQUERDO da lagoa, olhando para a água (posição em cherry.js)
  buildCherry(g, rnd, lights, pond); // a cerejeira grande ao lado do banco, com pétalas ao vento (cherry.js)
  // Lagoa com pedras na borda, vitórias-régias e flores de lótus
  const water = flat(new THREE.Mesh(new THREE.CircleGeometry(pond.r, 40), new THREE.MeshBasicMaterial({ map: pondTex() })));
  water.rotation.x = -Math.PI / 2; water.position.set(pond.x, 0.06, pond.z); g.add(water);
  const rim = [], pads = [];
  for (let i = 0; i < 38; i++) { const a = i / 38 * 6.283, s = 0.3 + rnd() * 0.25; rim.push({ x: pond.x + Math.cos(a) * (pond.r + 0.1), y: 0.12, z: pond.z + Math.sin(a) * (pond.r + 0.1), sx: s, sy: s * 0.7, sz: s, ry: rnd() * 3, c: [0x8a7f9a, 0x6f6283, 0xa093b3][i % 3] }); }
  for (let i = 0; i < 12; i++) {
    const a = rnd() * 6.283, d = rnd() * (pond.r - 0.9), x = pond.x + Math.cos(a) * d, z = pond.z + Math.sin(a) * d;
    pads.push({ x, y: 0.1, z, sx: 0.4 + rnd() * 0.25, sy: 0.04, sz: 0.4 + rnd() * 0.25, c: GREENS[i % 5] });
    if (i % 2 === 0) veg.bush(x, 0.18, z, 0.2, 5, i % 4 === 0 ? 0xff7eb6 : 0xfff1f5, 0x3aa17a);
  }
  g.add(instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), rim));
  g.add(instanced(new THREE.CylinderGeometry(1, 1, 1, 9), lam(0xffffff), pads));
  buildPondLife(POND); // peixinhos nadando e o Zé Porempa na beira (pond.js)
  // Borboletas voando pelo jardim
  addButterflies(g, [[-9, 15], [9, 15], [-13, -14], [13, -14], [0, 20], [-20, 0], [20, 2], [-5, 24]], 8, rnd);

  veg.addTo(g); lights.addTo(g, 7);
  lampGlows(g, lampPos, 3.8);
  // Marca quase tudo que é parado (menos os livros que flutuam e o que é transparente) para ser fundido em poucas malhas
  const bookRoots = libraryBooks.map(b => b.group), under = o => { for (let n = o.parent; n; n = n.parent) if (bookRoots.includes(n)) return true; return false; };
  g.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && !o.material.map && !o.material.transparent && o.geometry.index && !under(o)) o.userData.merge = true; });
  mergeStatic(g);
  inner.traverse(o => { if (o.isMesh && !o.userData.flat) o.receiveShadow = true; });
  LIB.ready = true;
}
// Leva um ponto (do "inner") para a altura do chão do mundo, para as luzinhas que ficam no grupo da zona
function I3(v, fy) { return { x: v.x, y: v.y + fy, z: v.z }; }

// ----- Interação com os livros: o mais perto da Gabriella, o que está sob o mouse e o clique -----
const bookV = new THREE.Vector3();
function libraryNear() { return LIB.ready && Math.hypot(player.position.x - LIB.center.x, player.position.z - LIB.center.z) < LIB.ZR + 4; }
function nearestBook() { // livro a menos de ~3 unidades da personagem (para abrir com a tecla E ou o botão)
  let best = null, bd = 3.0;
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
  return THREE.MathUtils.clamp((LIB.ZR + 7 - d) / 8, 0, 1);
}

// Chamada todo quadro: telhado some/aparece, lâmpada pulsa, livros flutuam
function updateLibrary(now, dt) {
  if (!LIB.ready) return;
  const d = Math.hypot(player.position.x - LIB.center.x, player.position.z - LIB.center.z);
  const want = 0.97 - 0.86 * THREE.MathUtils.clamp((24 - d) / 8, 0, 1);
  libFx.roofMat.opacity += (want - libFx.roofMat.opacity) * Math.min(1, dt * 4);
  libFx.vineMat.opacity = Math.max(0.04, libFx.roofMat.opacity - 0.08);
  libFx.lampLight.intensity = 1.1 + 0.06 * Math.sin(now * 6) + 0.04 * Math.sin(now * 13);
  libFx.lampGlow.material.opacity = 0.72 + 0.06 * Math.sin(now * 6);
  libraryBooks.forEach(b => {
    const on = b === activeBook || b === hoverBook, k = Math.min(1, dt * 8);
    const s = b.group.scale.x + ((on ? 1.5 : 1.25) - b.group.scale.x) * k; // 1,25 = tamanho normal; cresce quando está perto/sob o mouse
    b.group.scale.setScalar(s);
    b.glow.material.opacity += ((on ? 0.95 : 0.5) - b.glow.material.opacity) * k;
    if (!calm) { b.group.position.y = b.base + Math.sin(now * 1.4 + b.phase) * 0.1; b.group.rotation.z = Math.sin(now * 0.9 + b.phase) * 0.05; }
  });
}
