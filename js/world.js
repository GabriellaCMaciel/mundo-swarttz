// O mundo 3D: chão, luzes, céu, personagem e gatas.
'use strict';

// ===== 3. O mundo: chão bordado, céu, luzes, personagem e gatas =====
const world = new THREE.Group();
world.visible = false;
scene.add(world);
const touch = window.matchMedia('(pointer: coarse)').matches;
const WORLD_FOG = 0x3a1a6a;
const RUN = { mul: 1 }; // quanto a personagem está mais rápida que o normal (1 = andando, ~1,8 = correndo); a Kiara usa isso para acompanhar (js/kiara.js)
const skyTex = canvasTex(8, 256, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#12062a'); g.addColorStop(0.55, '#3a1a6a'); g.addColorStop(1, '#3a1a6a');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
});

// Luzes: uma suave que vem "do céu" e um sol quente que gera sombras e acompanha o personagem
world.add(new THREE.HemisphereLight(0xb79af5, 0x1a0f2e, 0.78));
const sun = new THREE.DirectionalLight(0xffe2b0, 0.85);
sun.castShadow = true;
sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 80 });
sun.shadow.bias = -0.0006;
world.add(sun, sun.target);

// Chão: retalhos de tecido costurados com fio de bordado dourado e pontos-cruz rosa
const patchTex = canvasTex(512, 512, (x, w, h) => {
  // tons de roxo mais CLAROS que antes (eram #1f1033 a #3a2060): o chão escuro demais escondia a personagem e os objetos escuros; assim há mais contraste (acessibilidade)
  const cols = ['#4a2f80', '#573595', '#432a74', '#603ca3', '#4f3187', '#3b2468'], n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = cols[(i * 3 + j * 5 + ((i * j) % 2)) % cols.length]; x.fillRect(i * s, j * s, s, s); }
  x.strokeStyle = 'rgba(242,184,75,0.42)'; x.lineWidth = 2.5; x.setLineDash([14, 10]);
  for (let k = 0; k < n; k++) { x.beginPath(); x.moveTo(k * s + 0.5, 0); x.lineTo(k * s + 0.5, h); x.stroke(); x.beginPath(); x.moveTo(0, k * s + 0.5); x.lineTo(w, k * s + 0.5); x.stroke(); }
  x.setLineDash([]); x.strokeStyle = 'rgba(255,95,162,0.38)'; x.lineWidth = 3;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const cx = i * s + s / 2, cy = j * s + s / 2;
    x.beginPath(); x.moveTo(cx - 6, cy - 6); x.lineTo(cx + 6, cy + 6); x.moveTo(cx + 6, cy - 6); x.lineTo(cx - 6, cy + 6); x.stroke();
  }
});
patchTex.wrapS = patchTex.wrapT = THREE.RepeatWrapping;
patchTex.repeat.set(20, 20); // o chão cobre 400 unidades: 20 repetições = retalhos de 20x20, do mesmo tamanho de antes
patchTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
const ground = new THREE.Mesh(new THREE.CircleGeometry(200, 90), new THREE.MeshLambertMaterial({ map: patchTex }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);

// Confete colorido espalhado pelo chão
const confettiCols = [0xff5fa2, 0xf2b84b, 0x37d0c0, 0xb79af5, 0xf08a3c, 0xf6ecd9], confetti = [];
for (let i = 0; i < 320; i++) {
  const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 95;
  confetti.push({ x: Math.cos(a) * r, y: 0.05, z: Math.sin(a) * r, sx: 0.5, sy: 0.08, sz: 0.16, ry: Math.random() * Math.PI, c: confettiCols[i % 6] });
}
world.add(instanced(new THREE.BoxGeometry(1, 1, 1), lam(0xffffff), confetti)); // as 160 tirinhas viram UM objeto (veja garden.js)

// Estrelas no céu e vaga-lumes dourados flutuando perto do chão
const starPos = new Float32Array(300 * 3);
for (let i = 0; i < 300; i++) {
  const a = Math.random() * Math.PI * 2, el = 0.12 + Math.random() * 1.2, r = 200;
  starPos.set([Math.cos(a) * Math.cos(el) * r, Math.sin(el) * r, Math.sin(a) * Math.cos(el) * r], i * 3);
}
const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
world.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xf2d9a0, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 })));

const MOTES = 300, moteBase = new Float32Array(MOTES * 3), motePos = new Float32Array(MOTES * 3);
for (let i = 0; i < MOTES; i++) {
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 90;
  moteBase.set([Math.cos(a) * r, 1.2 + Math.random() * 8, Math.sin(a) * r], i * 3);
}
motePos.set(moteBase);
const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
world.add(new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xf2b84b, size: 3, sizeAttenuation: false, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })));
function updateMotes(now) {
  for (let i = 0; i < MOTES; i++) {
    motePos[i * 3] = moteBase[i * 3] + Math.sin(now * 0.4 + i) * 0.8;
    motePos[i * 3 + 1] = moteBase[i * 3 + 1] + Math.sin(now * 0.7 + i * 1.7) * 0.6;
    motePos[i * 3 + 2] = moteBase[i * 3 + 2] + Math.cos(now * 0.35 + i) * 0.8;
  }
  moteGeo.attributes.position.needsUpdate = true;
}

// --- O personagem: uma figura encapuzada (a persona Gabriella Swarttz) ---
function buildPlayer() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const cloth = lam(0x2a1745);
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.9, 16), cloth); cloak.position.y = 0.95; body.add(cloak);
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12), cloth); hood.position.y = 2.0; body.add(hood);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), new THREE.MeshBasicMaterial({ color: 0x07030d }));
  face.position.set(0, 1.98, 0.2); face.scale.set(1, 1, 0.8); body.add(face);
  [-1, 1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xf2b84b }));
    eye.position.set(s * 0.15, 2.02, 0.53); body.add(eye);
  });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0xf2b84b }));
  collar.rotation.x = Math.PI / 2; collar.position.y = 1.55; body.add(collar);
  const aura = glowSprite(0x7b3fe4, 5.5, 0.55); aura.position.y = 0.4; g.add(aura);
  g.userData.body = body;
  return g;
}

// --- As gatas: um construtor de gato que muda cor e mancha ---
// Cada gato é montado por aqui. opts.eye = cor da íris (hex), ou { l, r } com uma cor para cada olho (olho esquerdo / direito do gato). Todo gato com olho colorido ganha também uma pupila
// preta redonda e menor por cima da íris. Sem opts.eye, os olhos ficam escuros (só uma bolinha).
function catEye(color) {
  const g = new THREE.Group();
  if (color === undefined || color === null) { g.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: 0x120b1c }))); return g; }
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), new THREE.MeshBasicMaterial({ color })));                       // íris (a cor do olho)
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), new THREE.MeshBasicMaterial({ color: 0x070309 })); // pupila: preta, menor e mais à frente
  pupil.position.z = 0.046; g.add(pupil);
  return g;
}
// ----- PELAGEM: cores múltiplas pintadas NA pele (regra de todos os gatos, atuais e futuros) -----
// NUNCA coloque esferas/bolas de outra cor por cima do corpo para fazer "manchas": isso cria caroços e volume. Em vez disso,
// a segunda (e terceira) cor é PINTADA numa textura de Canvas 2D que cobre o próprio corpo/cabeça, então a superfície continua lisa.
// Conceito: UV. Cada ponto da esfera tem uma coordenada (u,v) na imagem. Na SphereGeometry do Three.js, u dá a volta no corpo
// (0 = lado -x, 0,25 = frente +z, 0,5 = lado +x, 0,75 = costas) e v vai de cima (0) até embaixo (1).
// A imagem tem 512x256 px, e uma mancha é {x, y, r, a, rot, c}: centro em px, raio, achatamento (a), giro e cor.
const coatHex = c => '#' + c.toString(16).padStart(6, '0'); // (hex() de zones.js ainda não existe quando esta página carrega)
function coatTex(base, blobs, seed = 1) {
  return canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = coatHex(base); x.fillRect(0, 0, w, h);
    const rnd = mulberry32(seed * 7919);
    blobs.forEach(b => {
      const ph1 = rnd() * 6.28, ph2 = rnd() * 6.28, a = b.a || 1, rot = b.rot || 0;
      for (const off of [-w, 0, w]) { // desenha também deslocado de uma volta inteira, para a mancha não ser cortada na emenda da textura
        x.save(); x.translate(b.x + off, b.y); x.rotate(rot); x.scale(1, a);
        x.beginPath();
        for (let i = 0; i <= 28; i++) { // contorno irregular (um círculo "amassado" por duas ondas), para a mancha parecer de pelo e não de compasso
          const t = i / 28 * 6.2832, k = 1 + 0.16 * Math.sin(3 * t + ph1) + 0.09 * Math.sin(5 * t + ph2);
          i ? x.lineTo(Math.cos(t) * b.r * k, Math.sin(t) * b.r * k) : x.moveTo(b.r * k, 0);
        }
        x.closePath(); x.fillStyle = coatHex(b.c); x.shadowColor = coatHex(b.c); x.shadowBlur = b.r * 0.3; x.fill(); // shadowBlur = borda macia, sem corte seco
        x.restore();
      }
    });
  });
}
const coatMat = (base, blobs, seed) => lam(0xffffff, { map: coatTex(base, blobs, seed) }); // material com a pelagem pintada

function buildCat(baseColor, patchColor, opts = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const fur = lam(baseColor);
  // patchColor = uma segunda cor: duas manchas macias pintadas (uma no dorso, uma na cabeça), orelha e rabo da mesma cor. Sem volume.
  const coat = opts.coat || (patchColor ? {
    torso: [{ x: 256, y: 92, r: 62, a: 1.25, c: patchColor }, { x: 318, y: 156, r: 28, c: patchColor }, { x: 390, y: 84, r: 24, c: patchColor }],
    head: [{ x: 6, y: 72, r: 52, c: patchColor }], ear: -1, tail: patchColor
  } : null);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), coat ? coatMat(baseColor, coat.torso, 1) : fur);
  torso.scale.set(0.9, 0.7, 1.3); torso.position.y = 0.45; body.add(torso);
  [[-0.22, 0.4], [0.22, 0.4], [-0.22, -0.4], [0.22, -0.4]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 8), fur);
    leg.position.set(x, 0.16, z); body.add(leg);
  });
  const head = new THREE.Group(); head.position.set(0, 0.85, 0.55); body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10), coat && coat.head ? coatMat(baseColor, coat.head, 2) : fur));
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 4), coat && coat.ear === s ? lam(coat.head[0].c) : fur); ear.position.set(s * 0.19, 0.3, 0); head.add(ear);
    const eye = catEye(opts.eye && opts.eye.l !== undefined ? (s === 1 ? opts.eye.l : opts.eye.r) : opts.eye); eye.position.set(s * 0.12, 0.05, 0.3); head.add(eye); // opts.eye = { l, r } dá um olho de cada cor (heterocromia). O lado ESQUERDO do gato é +x (ele olha para +z)
  });
  const tail = new THREE.Group(); tail.position.set(0, 0.6, -0.62); tail.rotation.x = -0.5; body.add(tail);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 8), coat && coat.tail ? lam(coat.tail) : fur);
  tailMesh.position.y = 0.45; tail.add(tailMesh);
  g.scale.setScalar(1.25);
  g.userData = { body, head, tail };
  return g;
}

function enableShadows(obj) { obj.traverse(o => { if (o.isMesh && !o.userData.flat) o.castShadow = true; }); }

const player = buildPlayer(); player.position.set(0, 0, 6); world.add(player); enableShadows(player);
const kiara = buildCat(0xf6ecd9, 0xf08a3c, { eye: 0xe0a030 }); kiara.position.set(3, 0, 8); kiara.scale.setScalar(0.78); world.add(kiara); // 0,78: ela ainda é adolescente, então fica menor que as adultas
  enableShadows(kiara);   // branca e laranja, pestinha carente (íris cor de mel)
const maria = buildCat(0xf6ecd9, null, { eye: 0xf5cf1f }); maria.position.set(-3.2, 0, -24.5); maria.rotation.y = 0.6; world.add(maria); enableShadows(maria); // branca, vive na biblioteca (íris amarela)

// Rastro de faíscas atrás de quem anda (um "pool" de brilhos que vão sendo reaproveitados)
const sparks = [];
for (let i = 0; i < 18; i++) { const s = glowSprite(0xf2b84b, 0.8, 0); s.visible = false; world.add(s); sparks.push({ s, life: 0 }); }
let sparkTimer = 0;
const sparkColors = [0xf2b84b, 0xff5fa2, 0x37d0c0, 0xb79af5];
function emitSpark() {
  const o = sparks.find(p => p.life <= 0); if (!o) return;
  o.life = 0.9; o.s.visible = true; o.s.material.color.setHex(sparkColors[(Math.random() * 4) | 0]);
  o.s.position.set(player.position.x + (Math.random() - 0.5) * 0.6, player.position.y + 0.35, player.position.z + (Math.random() - 0.5) * 0.6);
}
function updateSparks(dt) {
  sparks.forEach(o => {
    if (o.life <= 0) return;
    o.life -= dt; const k = Math.max(o.life, 0) / 0.9;
    o.s.material.opacity = k * 0.9; o.s.scale.setScalar(0.5 + (1 - k) * 0.9); o.s.position.y += dt * 0.7;
    if (o.life <= 0) o.s.visible = false;
  });
}

