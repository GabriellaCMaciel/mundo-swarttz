// Ajudantes de jardim, usados pela biblioteca (library.js) e pela decoração do mundo (decor.js):
// plantas e flores em "lotes" (InstancedMesh), pisca-pisca (luzinhas) e borboletas.
// Este arquivo só define funções e classes, nada aparece sozinho.
'use strict';

// A lagoa da biblioteca (coordenadas do MUNDO). Fica aqui para library.js, pond.js e decor.js concordarem sobre onde ela está.
const POND = { x: -40, z: -46, r: 5.4 };
// O balanço na árvore, à direita da biblioteca (coordenadas do MUNDO), usado por swing.js e decor.js
const SWING = { x: 40, z: -47 };

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
function bx(w, h, d, color, x, y, z, parent) { // caixa colorida; as pequenas não projetam sombra (economiza)
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.userData.merge = true; // será fundida com as outras caixas parecidas por mergeStatic() (muito menos trabalho para a placa de vídeo)
  if (w * h * d < 1) m.userData.flat = true;
  parent.add(m); return m;
}

// MERGE: junta centenas de caixas estáticas num punhado de malhas grandes (uma por material).
// Em vez de 300 "pedidos de desenho" à placa de vídeo, ela recebe uns 15, e o visual é idêntico.
function mergeStatic(root) {
  const list = []; root.traverse(o => { if (o.isMesh && o.userData.merge) list.push(o); });
  const buckets = new Map(), v = new THREE.Vector3();
  list.forEach(o => {
    const key = o.material.uuid + (o.userData.flat ? 'f' : 's');
    let b = buckets.get(key); if (!b) buckets.set(key, b = { material: o.material, flat: !!o.userData.flat, pos: [], nor: [], idx: [] });
    const M = new THREE.Matrix4(), chain = []; // matriz do objeto em relação ao root
    for (let n = o; n && n !== root; n = n.parent) { n.updateMatrix(); chain.push(n.matrix); }
    for (let i = chain.length - 1; i >= 0; i--) M.multiply(chain[i]);
    const N = new THREE.Matrix3().getNormalMatrix(M), geo = o.geometry, base = b.pos.length / 3;
    const p = geo.attributes.position, nr = geo.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(M); b.pos.push(v.x, v.y, v.z);
      v.fromBufferAttribute(nr, i).applyMatrix3(N).normalize(); b.nor.push(v.x, v.y, v.z);
    }
    for (let i = 0; i < geo.index.count; i++) b.idx.push(geo.index.array[i] + base);
    o.parent.remove(o); geo.dispose();
  });
  buckets.forEach(b => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    geo.setIndex(b.idx);
    const m = new THREE.Mesh(geo, b.material); m.userData.flat = b.flat; m.receiveShadow = true; root.add(m);
  });
}

// INSTANCED MESH: um jeito de desenhar centenas de objetos iguais (livros, flores, folhas) numa
// única chamada, cada um com posição, tamanho e cor próprios. É o truque que mantém o site leve.
function instanced(geo, material, items) {
  const mesh = new THREE.InstancedMesh(geo, material, Math.max(1, items.length));
  const d = new THREE.Object3D(), col = new THREE.Color();
  items.forEach((it, i) => {
    d.position.set(it.x, it.y, it.z);
    d.scale.set(it.sx, it.sy === undefined ? it.sx : it.sy, it.sz === undefined ? it.sx : it.sz);
    d.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    mesh.setColorAt(i, col.setHex(it.c));
  });
  mesh.count = items.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.userData.flat = true; // não projeta sombra
  // O corte de "o que está fora da tela" de um InstancedMesh usa só a peça original, então damos a ele uma esfera
  // que cobre todas as cópias (se o lote for pequeno, o corte funciona de verdade).
  const c = new THREE.Vector3(); items.forEach(it => c.add(new THREE.Vector3(it.x, it.y, it.z))); c.divideScalar(Math.max(1, items.length));
  let rad = 1; items.forEach(it => { rad = Math.max(rad, Math.hypot(it.x - c.x, it.y - c.y, it.z - c.z) + Math.max(it.sx, it.sy || 0, it.sz || 0) + 0.5); });
  mesh.geometry = mesh.geometry.clone(); mesh.geometry.boundingSphere = new THREE.Sphere(c, rad);
  return mesh;
}

// Todos os "quadradinhos" de vegetação ficam nesta lista: os que estão muito longe da câmera (já escondidos pela névoa) não são desenhados.
const vegChunks = [];
const CULL_DIST = 100; // distância (em unidades do mundo) a partir da qual um lote de plantas deixa de ser desenhado
const _cv = new THREE.Vector3();
let _cullTick = 0;
function cullFar() {
  if (++_cullTick % 6) return; // basta conferir de vez em quando
  vegChunks.forEach(c => {
    _cv.copy(c.m.geometry.boundingSphere.center); c.parent.localToWorld(_cv);
    c.m.visible = Math.hypot(_cv.x - camera.position.x, _cv.z - camera.position.z) < CULL_DIST + c.m.geometry.boundingSphere.radius;
  });
}

const GREENS = [0x2f8f6b, 0x247a5a, 0x3aa17a, 0x1d6650, 0x4cb88a];
const FLOWER_COLS = [0xff7eb6, 0xff5fa2, 0xfff1f5, 0xb79af5, 0xf2b84b, 0xf08a3c];

// Um "lote" de vegetação: você pede arbustos, árvores e florzinhas, e no fim .addTo() cria tudo de uma vez.
class VegBatch {
  constructor(rnd) { this.rnd = rnd; this.bushes = []; this.flowers = []; this.leaves = []; this.trunks = []; }
  // Arbusto = bolinha verde amassada coberta de florzinhas. dom = cor que predomina; col = cor da folhagem
  bush(x, y, z, r, nFlowers, dom, col) {
    const rnd = this.rnd;
    this.bushes.push({ x, y, z, sx: r * (1 + rnd() * 0.25), sy: r * 0.78, sz: r * (1 + rnd() * 0.25), ry: rnd() * 3, c: col || GREENS[(rnd() * 5) | 0] });
    for (let i = 0; i < nFlowers; i++) {
      const u = 0.15 + rnd() * 0.85, ph = rnd() * 6.283, s = Math.sqrt(1 - u * u);
      this.flowers.push({ x: x + Math.cos(ph) * s * r * 1.02, y: y + u * r * 0.8, z: z + Math.sin(ph) * s * r * 1.02, sx: 0.12 + rnd() * 0.1, c: rnd() < 0.72 ? dom : FLOWER_COLS[(rnd() * 6) | 0] });
    }
  }
  groundBush(x, z, r, nFlowers, dom, col) { this.bush(x, r * 0.38, z, r, nFlowers, dom, col); } // meio enterrado no chão
  leaf(x, y, z, s, c) { const rnd = this.rnd; this.leaves.push({ x, y, z, sx: s, sy: s * 0.6, sz: s, ry: rnd() * 3, rz: rnd(), c: c || GREENS[(rnd() * 5) | 0] }); }
  post(x, z, h, c = 0x3a2350, w = 0.1) { this.trunks.push({ x, y: h / 2, z, sx: w, sy: h, sz: w, c }); } // poste fino
  // Árvore: tronco + 3 bolas de folhas. blossom = árvore de flor-de-cerejeira (copa rosa/lilás)
  tree(x, z, h, blossom) {
    const rnd = this.rnd, w = 0.14 + h * 0.035;
    this.trunks.push({ x, y: h * 0.3, z, sx: w, sy: h * 0.6, sz: w, c: 0x6b4a2f });
    const cr = h * 0.36, col = blossom ? [0xf4a6c9, 0xe58ab8, 0xcdb4f6][(rnd() * 3) | 0] : null, dom = blossom ? 0xfff1f5 : FLOWER_COLS[(rnd() * 6) | 0];
    this.bush(x, h * 0.72, z, cr, 12, dom, col);
    this.bush(x + cr * 0.75, h * 0.6, z + cr * 0.2, cr * 0.65, 6, dom, col);
    this.bush(x - cr * 0.65, h * 0.62, z - cr * 0.4, cr * 0.6, 6, dom, col);
    return cr;
  }
  // Divide tudo em "quadradinhos" de 18x18 unidades do mundo: só os quadradinhos que aparecem na tela são desenhados
  addTo(parent) {
    const mats = { b: lam(0xffffff), f: lam(0xffffff, { emissive: 0x2a1020 }), l: lam(0xffffff), t: lam(0xffffff) };
    const geos = { b: new THREE.IcosahedronGeometry(1, 1), f: new THREE.OctahedronGeometry(1, 0), l: new THREE.IcosahedronGeometry(1, 0), t: new THREE.CylinderGeometry(1, 1.2, 1, 6) };
    const cells = new Map();
    const put = (kind, items) => items.forEach(it => {
      const key = Math.floor(it.x / 18) + ',' + Math.floor(it.z / 18) + kind;
      let c = cells.get(key); if (!c) cells.set(key, c = { kind, items: [] }); c.items.push(it);
    });
    put('b', this.bushes); put('f', this.flowers); put('l', this.leaves); put('t', this.trunks);
    cells.forEach(c => { const m = instanced(geos[c.kind], mats[c.kind], c.items); parent.add(m); vegChunks.push({ m, parent }); });
  }
}

// PISCA-PISCA: pontinhos de luz (uma nuvem de "Points") em fileiras, em curvas (swag) ou onde você quiser.
// Metade das luzinhas pisca em oposição à outra metade, o que dá o efeito de cintilar.
const twinkle = [];
const WARM = [new THREE.Color(0xffd98a), new THREE.Color(0xffe9c0), new THREE.Color(0xff9ec8), new THREE.Color(0xc9b0ff)];
class Lights {
  constructor() { this.a = { p: [], c: [] }; this.b = { p: [], c: [] }; this.n = 0; }
  add(x, y, z) { const s = this.n++ % 2 ? this.a : this.b, c = WARM[this.n % 4]; s.p.push(x, y, z); s.c.push(c.r, c.g, c.b); }
  // fio pendurado entre dois pontos A e B (sag = o quanto ele "cai" no meio, n = quantas luzinhas)
  swag(A, B, sag, n) { for (let i = 0; i <= n; i++) { const t = i / n; this.add(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t - Math.sin(Math.PI * t) * sag, A.z + (B.z - A.z) * t); } }
  addTo(parent, size = 7) {
    [this.a, this.b].forEach((s, i) => {
      if (!s.p.length) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(s.p, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(s.c, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: glowTex, vertexColors: true, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      pts.frustumCulled = false;
      parent.add(pts); twinkle.push({ pts, phase: i });
    });
  }
}
// Lâmpadas grandes e macias (as "bolas de luz" dos postes): Points com tamanho em unidades do mundo
function lampGlows(parent, positions, size = 3.4, color = 0xffc878) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: glowTex, color, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; parent.add(pts); return pts;
}

// BORBOLETAS: duas asinhas que batem e um voo em círculos preguiçosos em volta de um ponto
const butterflies = [];
function addButterflies(parent, centers, n, rnd) {
  const wingCols = [0xff5fa2, 0xf2b84b, 0x37d0c0, 0xb79af5, 0xf08a3c];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), c = centers[i % centers.length], col = wingCols[i % 5];
    const mk = side => {
      const geo = new THREE.PlaneGeometry(0.5, 0.4); geo.rotateX(-Math.PI / 2); geo.translate(side * 0.25, 0, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); m.userData.flat = true; g.add(m); return m;
    };
    parent.add(g);
    butterflies.push({ g, wL: mk(-1), wR: mk(1), cx: c[0], cz: c[1], r: 1.5 + rnd() * 2.5, sp: 0.35 + rnd() * 0.3, ph: rnd() * 6.28, h: 0.8 + rnd() * 1.2 });
  }
}

// Chamada todo quadro: luzinhas piscam e borboletas voam
function updateGarden(now) {
  cullFar();
  twinkle.forEach(t => { t.pts.material.opacity = 0.7 + 0.3 * Math.sin(now * 2.4 + t.phase * Math.PI); });
  butterflies.forEach(b => {
    const a = now * b.sp + b.ph;
    b.g.position.set(b.cx + Math.cos(a) * b.r, b.h + Math.sin(now * 1.3 + b.ph) * 0.4, b.cz + Math.sin(a * 0.8) * b.r * 0.7);
    b.g.rotation.y = -a + Math.PI;
    const f = Math.sin(now * 16 + b.ph) * 0.9; b.wL.rotation.z = -f; b.wR.rotation.z = f;
  });
}
