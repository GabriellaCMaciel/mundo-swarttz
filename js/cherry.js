// A cerejeira da lagoa: uma árvore grande de flor-de-cerejeira, pétalas caindo ao vento e um tapete de pétalas no chão.
// Este arquivo só define funções; quem chama buildCherry() é o library.js (junto da lagoa) e updateCherry() roda todo quadro (ui.js).
// Conceitos para estudar:
//  - ANIMAÇÃO SEM ESTADO: em vez de guardar a posição de cada pétala e somar um pouquinho por quadro, a posição é uma
//    FÓRMULA do tempo (now). Cada pétala tem um "relógio" próprio t entre 0 e 1 (0 = soltou do galho, 1 = pousou) e a
//    posição sai de t. Quando t passa de 1 ele volta a 0 sozinho (resto da divisão), então a pétala "renasce" na copa.
//  - INSTANCED MESH: as ~70 pétalas que caem e as ~300 que estão no chão são desenhadas em 2 chamadas só.
//  - VENTO: um empurrão para o lado (+x, em direção à lagoa) que fica mais forte e mais fraco devagarinho (seno lento = rajadas).
'use strict';

// Onde a cerejeira e o banco ficam (coordenadas do MUNDO): à esquerda da lagoa, com o banco no meio, olhando para a água.
const CHERRY = { x: POND.x - POND.r - 4.6, z: POND.z + 0.6, h: 7.4 };
const BENCH_SPOT = { x: POND.x - POND.r - 1.9, z: POND.z + 1.4 };

const PETAL_PINKS = [0xffc2da, 0xffb0cf, 0xffd0e2, 0xffe3ee, 0xf7a1c7]; // tons de rosa (sem branco puro, para a copa não estourar de luz)
const cherryState = { fall: null, items: [], wind: 1, ready: false, tmp: new THREE.Object3D() };

// Galho/tronco como um TUBO liso que acompanha uma curva (CatmullRomCurve3) e vai afinando.
// Antes era uma fila de cilindros retos: nas curvas sobravam "cunhas" vazias entre eles. No tubo não existe emenda.
// Truque: o TubeGeometry nasce com raio 1; cada anel de vértices é então encolhido em direção ao centro da curva (rFn = raio em cada ponto, de t=0 a t=1).
function cherryTube(parent, points, rFn, material, segs = 24) {
  const curve = new THREE.CatmullRomCurve3(points), radial = 9, geo = new THREE.TubeGeometry(curve, segs, 1, radial, false), pos = geo.attributes.position;
  for (let i = 0; i <= segs; i++) {
    const c = curve.getPointAt(i / segs), r = rFn(i / segs);
    for (let k = 0; k <= radial; k++) { const n = i * (radial + 1) + k; pos.setXYZ(n, c.x + (pos.getX(n) - c.x) * r, c.y + (pos.getY(n) - c.y) * r, c.z + (pos.getZ(n) - c.z) * r); }
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material); parent.add(m); return m;
}

// g = grupo da biblioteca (coordenadas locais = mundo - g.position); rnd = gerador de números "aleatórios" fixos; lights = pisca-pisca da biblioteca
function buildCherry(g, rnd, lights, pond) {
  const gx = CHERRY.x - (POND.x - pond.x), gz = CHERRY.z - (POND.z - pond.z); // mundo -> local
  const T = new THREE.Group(); T.position.set(gx, 0, gz); T.rotation.y = 0.6; T.scale.set(1.3, 1.12, 1.3); g.add(T); // maior que antes; o giro (+y) leva a frente da árvore um pouco para a direita
  const BARK = lam(0x5b3b46), V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ----- Tronco GROSSO e curvo (tubo liso, com a base alargada em raízes) e galhos que abrem em leque, cada um terminando num punhado de flores -----
  const top = V(0.15, 4.1, -0.05);
  cherryTube(T, [V(0, -0.3, 0), V(0.3, 1.4, 0.1), V(-0.3, 2.8, 0.25), top], t => 0.5 + 0.55 * Math.pow(1 - t, 1.5) + 0.5 * Math.pow(Math.max(0, 1 - t * 5), 2), BARK, 28);
  const tips = [];
  [[-2.7, 5.3, 0.8], [3.0, 5.6, -0.6], [0.3, 6.2, 2.7], [-0.4, 5.9, -2.8], [2.3, 5.1, 2.3], [-2.4, 5.1, -2.0], [0.2, 6.9, 0.2], [3.7, 4.5, 0.9]].forEach(([x, y, z]) => {
    const mid = V(x * 0.5 + 0.1, 4.0 + (y - 4.0) * 0.4, z * 0.5);
    cherryTube(T, [V(top.x, top.y - 0.4, top.z), mid, V(x, y, z)], t => 0.36 * (1 - t) + 0.09, BARK, 12); tips.push(V(x, y, z));
  });
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), BARK); knot.position.copy(top); T.add(knot); // nó onde os galhos nascem: esconde qualquer emenda
  // ----- Copa: muitas bolas macias de flor em tons de rosa; as de baixo "caem" como galhos de chorão -----
  const blobs = [];
  const add = (x, y, z, s) => blobs.push({ x, y, z, sx: s, sy: s * 0.8, sz: s, ry: rnd() * 3, c: PETAL_PINKS[(rnd() * 5) | 0] });
  tips.forEach(t => {
    for (let k = 0; k < 5; k++) add(t.x + (rnd() - 0.5) * 2.2, t.y + (rnd() - 0.3) * 1.2, t.z + (rnd() - 0.5) * 2.2, 0.8 + rnd() * 0.7);
    for (let k = 0; k < 2; k++) add(t.x + (rnd() - 0.5) * 2.6, t.y - 0.9 - rnd() * 0.8, t.z + (rnd() - 0.5) * 2.6, 0.45 + rnd() * 0.3); // cachos pendurados
  });
  for (let k = 0; k < 8; k++) add((rnd() - 0.5) * 3, 5.3 + rnd() * 1.6, (rnd() - 0.5) * 3, 1 + rnd() * 0.7); // miolo da copa
  // O material tem um brilho rosado próprio (emissive) para a copa não ficar apagada à noite
  const crown = instanced(new THREE.IcosahedronGeometry(1, 1), lam(0xffffff, { emissive: 0x4a1830 }), blobs);
  T.add(crown);
  // florzinhas mais claras salpicadas por cima da copa
  const specks = [];
  for (let i = 0; i < 70; i++) { const b = blobs[(rnd() * blobs.length) | 0], u = rnd() * 6.283, v = rnd() * 3.14, r = b.sx * 0.97; specks.push({ x: b.x + Math.cos(u) * Math.sin(v) * r, y: b.y + Math.cos(v) * r * 0.8, z: b.z + Math.sin(u) * Math.sin(v) * r, sx: 0.12 + rnd() * 0.07, c: rnd() < 0.7 ? 0xffdceb : 0xff8fbd }); }
  T.add(instanced(new THREE.IcosahedronGeometry(1, 1), lam(0xffffff, { emissive: 0x33202a }), specks)); // icosaedro (redondinho): o octaedro virava pontinhas
  T.updateMatrix(); const lp = new THREE.Vector3();
  for (let i = 0; i < 26; i++) { const b = blobs[(rnd() * blobs.length) | 0]; lp.set(b.x + (rnd() - 0.5), b.y + (rnd() - 0.5), b.z + (rnd() - 0.5)).applyMatrix4(T.matrix); lights.add(lp.x, lp.y, lp.z); } // (applyMatrix4: leva o ponto para onde a árvore realmente está, já escalada e girada) // luzinhas quentes dentro da copa

  // ----- Tapete de pétalas: um brilho rosado suave no chão e centenas de pétalas espalhadas (algumas boiando na lagoa) -----
  // O brilho do chão é uma textura com degradê radial (centro rosado que some nas bordas): assim não aparece uma borda dura de círculo
  const carpetTex = canvasTex(256, 256, (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,179,209,0.5)'); gr.addColorStop(0.6, 'rgba(255,179,209,0.22)'); gr.addColorStop(1, 'rgba(255,179,209,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), new THREE.MeshBasicMaterial({ map: carpetTex, transparent: true, depthWrite: false }));
  carpet.rotation.x = -Math.PI / 2; carpet.position.set(gx + 1.5, 0.035, gz); carpet.userData.flat = true; g.add(carpet);
  const flatPetal = new THREE.CircleGeometry(0.5, 6); flatPetal.rotateX(-Math.PI / 2); flatPetal.scale(1, 1, 1.5); // oval deitada
  const ground = [];
  for (let i = 0; i < 300; i++) {
    const a = rnd() * 6.283, d = Math.pow(rnd(), 0.7) * 9, x = gx + 1.2 + Math.cos(a) * d * 1.15, z = gz + Math.sin(a) * d * 0.9; // oval, um pouco mais esticada para o lado da lagoa
    const onWater = Math.hypot(x - pond.x, z - pond.z) < pond.r - 0.3, inPond = Math.hypot(x - pond.x, z - pond.z) < pond.r + 0.3 && !onWater;
    if (inPond) continue; // a borda de pedras fica livre
    const s = 0.2 + rnd() * 0.14;
    ground.push({ x, y: onWater ? 0.085 : 0.05 + rnd() * 0.01, z, sx: s, sy: 1, sz: s, ry: rnd() * 6.283, c: PETAL_PINKS[(rnd() * 5) | 0] });
  }
  for (let i = 0; i < 40; i++) { // um montinho perto do banco e outro em volta do tronco
    const a = rnd() * 6.283, d = rnd() * 1.6, bx0 = i % 2 ? BENCH_SPOT.x - (POND.x - pond.x) : gx, bz0 = i % 2 ? BENCH_SPOT.z - (POND.z - pond.z) : gz, s = 0.2 + rnd() * 0.12;
    ground.push({ x: bx0 + Math.cos(a) * d, y: 0.055, z: bz0 + Math.sin(a) * d, sx: s, sy: 1, sz: s, ry: rnd() * 6.283, c: PETAL_PINKS[(rnd() * 5) | 0] });
  }
  const gm = instanced(flatPetal, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), ground); g.add(gm);

  // ----- Pétalas caindo: cada uma tem um "relógio" próprio (fase) e uma duração; a fórmula está em updateCherry -----
  const N = 70, items = [];
  for (let i = 0; i < N; i++) {
    const u = rnd() * 6.283, v = Math.sqrt(rnd());
    items.push({
      x0: gx + Math.cos(u) * v * 4.8, z0: gz + Math.sin(u) * v * 4.2, y0: 4.6 + rnd() * 3.2, // ponto de onde se solta, dentro da copa
      dur: 7 + rnd() * 6, ph: rnd(), drift: 3 + rnd() * 5, sw: 0.5 + rnd() * 0.9, spin: 1.5 + rnd() * 3, s: 0.2 + rnd() * 0.12, zdrift: (rnd() - 0.5) * 2.5, c: PETAL_PINKS[(rnd() * 5) | 0], ground: 0.05,
    });
  }
  const petalGeo = new THREE.CircleGeometry(0.5, 6); petalGeo.scale(1, 1.5, 1); // oval em pé: ao girar mostra as duas faces
  const fall = new THREE.InstancedMesh(petalGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), N);
  const col = new THREE.Color(); items.forEach((it, i) => fall.setColorAt(i, col.setHex(it.c)));
  fall.instanceColor.needsUpdate = true; fall.frustumCulled = false; fall.userData.flat = true; g.add(fall);
  cherryState.fall = fall; cherryState.items = items; cherryState.ready = true;
  cherryState.center = new THREE.Vector3(gx, 3, gz); cherryState.parent = g;
}

const _cp = new THREE.Vector3();
function updateCherry(now) {
  const S = cherryState; if (!S.ready) return;
  S.parent.localToWorld(_cp.copy(S.center));
  const near = Math.hypot(_cp.x - camera.position.x, _cp.z - camera.position.z) < 70;
  S.fall.visible = near && !calm; if (!near || calm) return; // longe da câmera (ou com "reduzir movimento" ligado no sistema) não anima nada: as pétalas do chão continuam lá
  const d = S.tmp, wind = 0.75 + 0.25 * Math.sin(now * 0.4) + 0.12 * Math.sin(now * 1.3); // rajadas: forte, fraco, forte...
  S.items.forEach((p, i) => {
    const t = (now / p.dur + p.ph) % 1; // 0 = soltou, 1 = pousou
    const e = t * t * 0.35 + t * 0.65; // cai um pouco mais rápido perto do fim (aceleração leve)
    const y = p.y0 + (p.ground - p.y0) * e + Math.sin(t * 6.283 * p.sw * 3 + i) * 0.12; // desce + balança de leve
    const x = p.x0 + p.drift * wind * t + Math.sin(t * 6.283 * p.sw * 2 + i * 1.7) * 0.5; // empurrada pelo vento (+x) e zigue-zague
    const z = p.z0 + p.zdrift * t + Math.cos(t * 6.283 * p.sw * 2 + i) * 0.35;
    d.position.set(x, y, z);
    d.rotation.set(t * p.spin * 6.283 * 0.5 + i, t * p.spin * 6.283 + i * 2, Math.sin(t * 9 + i) * 0.8); // gira "tombando"
    const fade = Math.min(1, t * 8, (1 - t) * 8) * p.s; // nasce e some pequenininha (nada de "pop" na tela)
    d.scale.set(fade, fade, fade); d.updateMatrix();
    S.fall.setMatrixAt(i, d.matrix);
  });
  S.fall.instanceMatrix.needsUpdate = true;
}
