// O mundo 3D: chão, luzes, céu, personagem e gatas.
'use strict';

// ===== 3. O mundo: chão bordado, céu, luzes, personagem e gatas =====
const world = new THREE.Group();
world.visible = false;
scene.add(world);
const touch = window.matchMedia('(pointer: coarse)').matches;
const WORLD_FOG = 0x2a1250;
const skyTex = canvasTex(8, 256, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#12062a'); g.addColorStop(0.55, '#2a1250'); g.addColorStop(1, '#2a1250');
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
  const cols = ['#2a1745', '#33195a', '#241538', '#3a2060', '#2d1a4d', '#1f1033'], n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = cols[(i * 3 + j * 5 + ((i * j) % 2)) % cols.length]; x.fillRect(i * s, j * s, s, s); }
  x.strokeStyle = 'rgba(242,184,75,0.36)'; x.lineWidth = 2.5; x.setLineDash([14, 10]);
  for (let k = 0; k < n; k++) { x.beginPath(); x.moveTo(k * s + 0.5, 0); x.lineTo(k * s + 0.5, h); x.stroke(); x.beginPath(); x.moveTo(0, k * s + 0.5); x.lineTo(w, k * s + 0.5); x.stroke(); }
  x.setLineDash([]); x.strokeStyle = 'rgba(255,95,162,0.38)'; x.lineWidth = 3;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const cx = i * s + s / 2, cy = j * s + s / 2;
    x.beginPath(); x.moveTo(cx - 6, cy - 6); x.lineTo(cx + 6, cy + 6); x.moveTo(cx + 6, cy - 6); x.lineTo(cx - 6, cy + 6); x.stroke();
  }
});
patchTex.wrapS = patchTex.wrapT = THREE.RepeatWrapping;
patchTex.repeat.set(14, 14);
patchTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
const ground = new THREE.Mesh(new THREE.CircleGeometry(140, 80), new THREE.MeshLambertMaterial({ map: patchTex }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);

// Confete colorido espalhado pelo chão
const confettiMats = [0xff5fa2, 0xf2b84b, 0x37d0c0, 0xb79af5, 0xf08a3c, 0xf6ecd9].map(c => lam(c));
const confettiGeo = new THREE.BoxGeometry(0.5, 0.08, 0.16);
for (let i = 0; i < 160; i++) {
  const m = new THREE.Mesh(confettiGeo, confettiMats[i % 6]);
  const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 55;
  m.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r);
  m.rotation.y = Math.random() * Math.PI; m.userData.flat = true;
  world.add(m);
}

// Estrelas no céu e vaga-lumes dourados flutuando perto do chão
const starPos = new Float32Array(300 * 3);
for (let i = 0; i < 300; i++) {
  const a = Math.random() * Math.PI * 2, el = 0.12 + Math.random() * 1.2, r = 200;
  starPos.set([Math.cos(a) * Math.cos(el) * r, Math.sin(el) * r, Math.sin(a) * Math.cos(el) * r], i * 3);
}
const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
world.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xf2d9a0, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 })));

const MOTES = 200, moteBase = new Float32Array(MOTES * 3), motePos = new Float32Array(MOTES * 3);
for (let i = 0; i < MOTES; i++) {
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 55;
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
function buildCat(baseColor, patchColor) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const fur = lam(baseColor);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), fur);
  torso.scale.set(0.9, 0.7, 1.3); torso.position.y = 0.45; body.add(torso);
  [[-0.22, 0.4], [0.22, 0.4], [-0.22, -0.4], [0.22, -0.4]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 8), fur);
    leg.position.set(x, 0.16, z); body.add(leg);
  });
  const head = new THREE.Group(); head.position.set(0, 0.85, 0.55); body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10), fur));
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 4), fur); ear.position.set(s * 0.19, 0.3, 0); head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: 0x120b1c })); eye.position.set(s * 0.12, 0.05, 0.3); head.add(eye);
  });
  if (patchColor) {
    const patch = lam(patchColor);
    const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), patch); p1.scale.set(0.8, 0.45, 1); p1.position.set(0.28, 0.72, -0.05); body.add(p1);
    const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), patch); p2.position.set(-0.16, 0.16, 0.02); head.add(p2);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.6, -0.62); tail.rotation.x = -0.5; body.add(tail);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 8), patchColor ? lam(patchColor) : fur);
  tailMesh.position.y = 0.45; tail.add(tailMesh);
  g.scale.setScalar(1.25);
  g.userData = { body, head, tail };
  return g;
}

function enableShadows(obj) { obj.traverse(o => { if (o.isMesh && !o.userData.flat) o.castShadow = true; }); }

const player = buildPlayer(); player.position.set(0, 0, 6); world.add(player); enableShadows(player);
const kiara = buildCat(0xf6ecd9, 0xf08a3c); kiara.position.set(3, 0, 8); world.add(kiara); enableShadows(kiara);   // branca e laranja, pestinha carente
const maria = buildCat(0xf6ecd9, null); maria.position.set(-3.2, 0, -24.5); maria.rotation.y = 0.6; world.add(maria); enableShadows(maria); // branca, vive na biblioteca

// Rastro de faíscas atrás de quem anda (um "pool" de brilhos que vão sendo reaproveitados)
const sparks = [];
for (let i = 0; i < 18; i++) { const s = glowSprite(0xf2b84b, 0.8, 0); s.visible = false; world.add(s); sparks.push({ s, life: 0 }); }
let sparkTimer = 0;
const sparkColors = [0xf2b84b, 0xff5fa2, 0x37d0c0, 0xb79af5];
function emitSpark() {
  const o = sparks.find(p => p.life <= 0); if (!o) return;
  o.life = 0.9; o.s.visible = true; o.s.material.color.setHex(sparkColors[(Math.random() * 4) | 0]);
  o.s.position.set(player.position.x + (Math.random() - 0.5) * 0.6, 0.35, player.position.z + (Math.random() - 0.5) * 0.6);
}
function updateSparks(dt) {
  sparks.forEach(o => {
    if (o.life <= 0) return;
    o.life -= dt; const k = Math.max(o.life, 0) / 0.9;
    o.s.material.opacity = k * 0.9; o.s.scale.setScalar(0.5 + (1 - k) * 0.9); o.s.position.y += dt * 0.7;
    if (o.life <= 0) o.s.visible = false;
  });
}

