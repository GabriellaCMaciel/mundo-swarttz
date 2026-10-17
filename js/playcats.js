// A turma brincalhona do balanço: a Maria Julietta (branca, pequena, um olho azul e outro amarelo) caça as borboletas, o Mocca (filhote
// "siamês falso") escala o tronco da árvore atrás de um passarinho que voa perto da copa, e os dois ainda se perseguem pelo chão.
//
// Conceitos para estudar:
//  - MÁQUINA DE ESTADOS: cada bichinho tem um "estado" (passear, espreitar, agachar, saltar...). A cada quadro o código faz o que o estado
//    manda e, quando uma condição acontece (chegou perto, o tempo acabou), troca de estado. É assim que se faz comportamento sem ficar tudo uma bagunça.
//  - ARCO DE SALTO: a posição horizontal vai de A até B (lerp) e a altura é uma parábola 4·H·u·(1−u), com u de 0 a 1.
//  - SUAVIZAÇÃO: nada "teletransporta": giro, altura e posição do passarinho se aproximam do alvo aos poucos (exponencial), então os movimentos ficam macios.
//  - EULER 'YXZ': para o gato subir no tronco, primeiro ele inclina para cima (x) e depois gira para o lado do tronco (y).
// Tudo aqui está em coordenadas do grupo do balanço (swing.g); o tronco fica em (TX, TZ), definidos em swing.js.
'use strict';

const PCATS = { ready: false, J: null, M: null, B: null, camD: 0 };
const TRUNK = { x: 5.2, z: -0.3 }; // o mesmo TX / TZ de swing.js
const trunkR = y => 0.9 - 0.35 * (y / 6.4); // raio do tronco na altura y (cone: 0,9 embaixo, 0,55 em cima)
const OBST = [[-3.2, 1.0, 0.6], [-2.35, 1.7, 0.6], [-2.5, 2.6, 0.95], [TRUNK.x, TRUNK.z, 1.1]]; // cestos, pilha de livros e tronco: o chão que os gatos desviam
const AREA = { x0: -6.2, x1: 3.9, z0: -2, z1: 5.4 }; // onde passeiam
const lerpA = (a, b, t) => { const d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * t; }; // gira pelo lado mais curto
const rr = (a, b) => a + Math.random() * (b - a);
const easeSmooth = t => t * t * (3 - 2 * t);

// ---------- montagem ----------
// Cada gato é um objeto C: o grupo 3D (g), as peças que animam (corpo, cabeça, rabo, patas) e o "estado" da máquina.
function makePlayCat(cat, scale, name, color) {
  const { body, head, tail } = cat.userData;
  cat.scale.setScalar(scale); cat.rotation.order = 'YXZ';
  const legs = body.children.filter(m => m.isMesh && m.geometry.type === 'CylinderGeometry'); // as 4 patas: FL, FR, BL, BR
  const label = makeLabel(name, color, 0.6); label.position.y = 2.3; cat.add(label); catLabels.push([label, cat]);
  return { g: cat, body, head, tail, legs, legBase: legs.map(l => l.position.clone()), ph: Math.random() * 6, amp: 0, yaw: 0, pitch: 0,
    state: 'roam', t: 0, tx: 0, tz: 0, speed: 0, scale, hop: 0, target: null, vy: 0, cycle: 0 };
}

function buildPlayCats() {
  const g = swing.g; if (!g) return;
  // ----- Maria Julietta: branca, olho ESQUERDO azul e DIREITO amarelo, pequena -----
  const jc = buildCat(0xfffaf2, null, { eye: { l: 0x4aa8ff, r: 0xf5cf1f } });
  const J = makePlayCat(jc, 0.82, 'Maria Julietta', 0xffd7ec);
  J.g.position.set(-1, 0, 2.4); g.add(J.g); enableShadows(J.g);

  // ----- Mocca: filhote cor de creme com "pontas" marrons (focinho, orelhas, patas e rabo), olhos azuis. As cores são PINTADAS no pelo (sem bolas) -----
  const BR = 0x6b4a3e;
  const mc = buildCat(0xf3e6d0, null, { eye: 0x58a6ff, coat: {
    torso: [{ x: 256, y: 64, r: 90, a: 1.5, c: 0xe3cfb3 }],                                  // um tom um pouco mais escuro nas costas, bem suave
    head: [{ x: 128, y: 122, r: 46, a: 0.92, c: BR }, { x: 128, y: 148, r: 30, a: 1, c: BR }], // máscara escura em volta do nariz e dos olhos
    tail: BR } });
  mc.userData.head.children.forEach(m => { if (m.isMesh && m.geometry.type === 'ConeGeometry') m.material = lam(BR); });                // orelhas
  mc.userData.body.children.forEach(m => { if (m.isMesh && m.geometry.type === 'CylinderGeometry') m.material = lam(BR); });            // patas
  const M = makePlayCat(mc, 0.62, 'Mocca', 0xe9cdb0);
  M.g.position.set(-3.6, 0, 0.2); g.add(M.g); enableShadows(M.g);

  // ----- O passarinho: redondinho, azul e creme, bico laranja, asinhas que batem -----
  const bird = new THREE.Group(), blue = lam(0x62b6ff), mk = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (p || bird).add(m); return m; };
  const bb = mk(new THREE.SphereGeometry(0.2, 10, 8), blue, 0, 0, 0); bb.scale.set(1, 0.9, 1.3);
  mk(new THREE.SphereGeometry(0.15, 8, 6), lam(0xfff2dc), 0, -0.06, 0.07).scale.set(1, 0.8, 1.2);                       // barriguinha creme
  mk(new THREE.SphereGeometry(0.13, 10, 8), blue, 0, 0.13, 0.2);                                                         // cabeça
  const beak = mk(new THREE.ConeGeometry(0.04, 0.12, 6), lam(0xff9a3c), 0, 0.12, 0.34); beak.rotation.x = Math.PI / 2;
  [-1, 1].forEach(s => mk(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshBasicMaterial({ color: 0x120b1c }), s * 0.065, 0.17, 0.29));
  [-1, 1].forEach(s => mk(new THREE.SphereGeometry(0.025, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff9ec4 }), s * 0.1, 0.12, 0.28)); // bochechas rosa
  mk(new THREE.BoxGeometry(0.12, 0.02, 0.24), lam(0x3f86d8), 0, 0.0, -0.32).rotation.x = 0.2;                               // rabinho
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.14, 0.07, 0.02); bird.add(w); mk(new THREE.BoxGeometry(0.34, 0.025, 0.2), lam(0x3f86d8), s * 0.17, 0, 0, w); return { w, s }; });
  bird.scale.setScalar(1.35); bird.position.set(TRUNK.x - 1.5, 7.4, TRUNK.z + 3); g.add(bird); bird.traverse(o => { if (o.isMesh) o.userData.flat = true; });
  const B = { g: bird, wings, th: 0, state: 'fly', t: 0, vx: 0, vz: 0, px: bird.position.x, py: bird.position.y, pz: bird.position.z, tease: 0 };

  PCATS.J = J; PCATS.M = M; PCATS.B = B; PCATS.ready = true;
}

// ---------- ajudantes de movimento ----------
function avoid(C) { // empurra o gato para fora de cestos, livros e do tronco (círculos em xz)
  const p = C.g.position;
  OBST.forEach(([ox, oz, r]) => { const dx = p.x - ox, dz = p.z - oz, d = Math.hypot(dx, dz); if (d < r + 0.25 && d > 0.001) { p.x = ox + dx / d * (r + 0.25); p.z = oz + dz / d * (r + 0.25); } });
  p.x = Math.max(AREA.x0, Math.min(AREA.x1, p.x)); p.z = Math.max(AREA.z0, Math.min(AREA.z1, p.z));
}
// anda em direção a (tx, tz): vira devagar e avança na direção em que está virado (é o que dá a sensação de bichinho de verdade)
function steer(C, tx, tz, speed, dt, turn = 9) {
  const p = C.g.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d > 0.05) { C.yaw = lerpA(C.yaw, Math.atan2(dx, dz), Math.min(1, turn * dt)); const sp = Math.min(speed, Math.max(0.8, d * 4)); // desacelera ao chegar: sem isso ele ficava dando voltas em torno do alvo (o giro é suave demais para um alvo tão perto)
    const st = sp * dt; p.x += Math.sin(C.yaw) * st; p.z += Math.cos(C.yaw) * st; C.speed = sp; }
  else C.speed = 0;
  avoid(C); return d;
}
// o "passo": patas em diagonal, o corpo quica um pouco e o rabo balança. amp = 0 (parada) a 1 (trotando); rate = velocidade das patas
function gait(C, amp, rate, dt, now, tailUp = -0.5, dropY = 0) { // dropY = quanto o corpo desce (agachar)
  C.amp += (amp - C.amp) * Math.min(1, 10 * dt); C.ph += dt * rate;
  C.legs.forEach((l, i) => { const f = Math.sin(C.ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.14 * C.amp; l.position.z = C.legBase[i].z + f; l.position.y = C.legBase[i].y + Math.max(0, Math.cos(C.ph + (i === 0 || i === 3 ? 0 : Math.PI))) * 0.07 * C.amp; });
  C.tail.rotation.x += (tailUp - C.tail.rotation.x) * Math.min(1, 6 * dt);
  C.tail.rotation.z = Math.sin(now * (3 + C.amp * 5)) * (0.18 + 0.22 * C.amp);
  C.body.position.y += ((Math.abs(Math.sin(C.ph)) * 0.04 * C.amp - dropY) - C.body.position.y) * Math.min(1, 12 * dt);
}
function look(C, ry, rx, dt) { C.head.rotation.y += (ry - C.head.rotation.y) * Math.min(1, 8 * dt); C.head.rotation.x += (rx - C.head.rotation.x) * Math.min(1, 8 * dt); }
function setPose(C, dt, pitch, yaw) { C.pitch += (pitch - C.pitch) * Math.min(1, 10 * dt); C.g.rotation.set(C.pitch, yaw === undefined ? C.yaw : yaw, 0); }
function jumpArc(C, a, b, H, u) { // salto de a para b, com altura máxima H; u vai de 0 a 1
  C.g.position.set(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u + 4 * H * u * (1 - u), a.z + (b.z - a.z) * u);
}

// ---------- Maria Julietta: caça as borboletas ----------
function nearestButterfly(C, maxD) {
  let best = null, bd = maxD;
  swing.bf.forEach(b => { const d = Math.hypot(b.g.position.x - C.g.position.x, b.g.position.z - C.g.position.z); if (d < bd) { bd = d; best = b; } });
  return best;
}
function updateJulietta(C, M, dt, now) {
  const p = C.g.position; C.t += dt;
  let amp = 0, rate = 12, tailUp = -0.5, headX = 0, headY = 0, pitch = 0, crouch = 0;
  if (C.state === 'roam') {
    if (C.t > C.wait) { C.t = 0; const b = nearestButterfly(C, 7); if (b) { C.target = b; C.state = 'stalk'; } else { C.tx = rr(AREA.x0 + 1, AREA.x1 - 0.5); C.tz = rr(AREA.z0 + 1, AREA.z1 - 0.5); C.wait = rr(1.4, 3.2); } }
    const d = steer(C, C.tx, C.tz, 2.6, dt); amp = d > 0.3 ? 1 : 0; rate = 13; tailUp = -0.3;
    if (d < 0.4) C.t = Math.max(C.t, C.wait); // chegou: escolhe outra coisa para fazer (esses dois não param quietos)
  } else if (C.state === 'stalk') { // espreita: anda direto até a borboleta, de cabeça erguida seguindo ela com os olhos
    const b = C.target, bp = b.g.position;
    const d = steer(C, bp.x, bp.z, 3.3, dt, 10); amp = 1; rate = 15; headX = -0.45; tailUp = -0.15;
    const rel = Math.atan2(bp.x - p.x, bp.z - p.z) - C.yaw; headY = Math.max(-0.7, Math.min(0.7, Math.atan2(Math.sin(rel), Math.cos(rel))));
    if (d < 1.7) { C.state = 'crouch'; C.t = 0; } else if (C.t > 7) { C.state = 'roam'; C.t = 0; C.wait = 0.3; }
  } else if (C.state === 'crouch') { // agacha e balança o bumbum, de olho na presa
    crouch = 1; headX = -0.5; amp = 0; tailUp = -0.1; const bp = C.target.g.position;
    C.yaw = lerpA(C.yaw, Math.atan2(bp.x - p.x, bp.z - p.z), Math.min(1, 12 * dt));
    C.g.position.x += Math.sin(now * 34) * 0.002;
    if (C.t > 0.55) { // PULO: mira onde a borboleta está agora (e ela vai se mexer, então às vezes erra)
      C.state = 'pounce'; C.t = 0; C.from = p.clone(); const dx = bp.x - p.x, dz = bp.z - p.z, d = Math.hypot(dx, dz), k = Math.min(d, 2.4) / (d || 1);
      C.to = new THREE.Vector3(p.x + dx * k, 0, p.z + dz * k); C.H = Math.max(0.5, Math.min(1.4, bp.y * 0.75));
    }
  } else if (C.state === 'pounce') {
    const u = Math.min(1, C.t / 0.62); jumpArc(C, C.from, C.to, C.H, u); amp = 0; pitch = -0.7 + u * 1.2; headX = -0.3;
    C.legs[0].rotation.x = C.legs[1].rotation.x = -1.1 * (1 - u * 0.4); // patinhas da frente esticadas
    if (u >= 1) { C.state = 'recover'; C.t = 0; C.target.up = 1.3; /* a borboleta se assusta e sobe */ avoid(C); C.legs[0].rotation.x = C.legs[1].rotation.x = 0; }
  } else if (C.state === 'recover') { // aterrissa, balança a cabeça, e quase sempre tenta de novo
    headY = Math.sin(now * 22) * 0.35 * Math.max(0, 1 - C.t / 0.5); amp = 0;
    if (C.t > 0.7) { C.state = 'roam'; C.t = 0; C.wait = Math.random() < 0.7 ? 0.05 : 1.4; }
  } else if (C.state === 'zoom') { // corrida maluca: foge do Mocca (ou só está animada)
    const d = steer(C, C.tx, C.tz, 5.4, dt, 12); amp = 1; rate = 22; tailUp = 0.1;
    if (d < 0.5 || C.t > 1.8) { C.state = 'roam'; C.t = 0; C.wait = 0.2; }
  }
  gait(C, amp, rate, dt, now, tailUp, 0.13 * crouch); look(C, headY, headX, dt);
  C.body.rotation.x += ((crouch * 0.1) - C.body.rotation.x) * Math.min(1, 10 * dt);
  if (C.state !== 'pounce') { C.legs[0].rotation.x *= 0.8; C.legs[1].rotation.x *= 0.8; }
  setPose(C, dt, pitch);
}

// ---------- Mocca: brinca, persegue a Julietta e escala o tronco atrás do passarinho ----------
function updateMocca(C, J, B, dt, now) {
  const p = C.g.position; C.t += dt;
  let amp = 0, rate = 14, tailUp = -0.4, headX = 0, headY = 0, pitch = 0, yaw = C.yaw, crouch = 0;
  const trunkPos = y => ({ x: TRUNK.x - trunkR(y) + 0.02, z: TRUNK.z });
  if (C.state === 'roam') { // passeia aos pulinhos; de vez em quando persegue a Julietta; depois de uns ciclos, vai para a árvore
    if (C.t > C.wait) {
      C.t = 0; C.cycle++;
      if (C.cycle >= 3) { C.state = 'toTree'; C.cycle = 0; }
      else if (Math.random() < 0.4) { C.state = 'chase'; }
      else { C.tx = rr(AREA.x0 + 0.5, AREA.x1 - 1); C.tz = rr(AREA.z0 + 0.5, AREA.z1 - 0.5); C.wait = rr(1.2, 2.6); C.zoomy = Math.random() < 0.5; }
    }
    const d = steer(C, C.tx, C.tz, C.zoomy ? 5 : 2.8, dt, 11); amp = d > 0.3 ? 1 : 0; rate = C.zoomy ? 22 : 15; tailUp = -0.15;
    if (d < 0.4) C.t = Math.max(C.t, C.wait - 0.4);
  } else if (C.state === 'chase') { // espreita a Julietta e pula nela
    const jp = J.g.position, d = steer(C, jp.x, jp.z, 4.4, dt, 12); amp = 1; rate = 20; headX = -0.25; tailUp = -0.1;
    if (d < 1.3) { C.state = 'crouchJ'; C.t = 0; } else if (C.t > 6) { C.state = 'roam'; C.t = 0; C.wait = 0.2; }
  } else if (C.state === 'crouchJ') {
    crouch = 1; amp = 0; tailUp = -0.05; const jp = J.g.position; C.yaw = lerpA(C.yaw, Math.atan2(jp.x - p.x, jp.z - p.z), Math.min(1, 12 * dt)); C.g.position.x += Math.sin(now * 40) * 0.0025;
    if (C.t > 0.45) { C.state = 'pounceJ'; C.t = 0; C.from = p.clone(); C.to = new THREE.Vector3(jp.x - Math.sin(C.yaw) * 0.45, 0, jp.z - Math.cos(C.yaw) * 0.45); }
  } else if (C.state === 'pounceJ') {
    const u = Math.min(1, C.t / 0.5); jumpArc(C, C.from, C.to, 0.7, u); pitch = -0.6 + u; amp = 0;
    if (u >= 1) { // a Julietta leva um susto e sai correndo; o Mocca vai atrás
      C.state = 'roam'; C.t = 0; C.wait = 0.3; J.state = 'zoom'; J.t = 0; const a = Math.atan2(J.g.position.x - p.x, J.g.position.z - p.z); J.tx = J.g.position.x + Math.sin(a) * 4; J.tz = J.g.position.z + Math.cos(a) * 4;
      J.tx = Math.max(AREA.x0 + 0.3, Math.min(AREA.x1 - 0.3, J.tx)); J.tz = Math.max(AREA.z0 + 0.3, Math.min(AREA.z1 - 0.3, J.tz)); C.state = 'chase'; C.t = 3;
    }
  } else if (C.state === 'toTree') { // corre até a base do tronco, pelo lado esquerdo
    const d = steer(C, TRUNK.x - 2.1, TRUNK.z + 0.1, 5, dt, 12); amp = 1; rate = 22; headX = -0.2;
    if (d < 0.35) { C.state = 'leap'; C.t = 0; C.from = p.clone(); const t0 = trunkPos(1.1); C.to = new THREE.Vector3(t0.x, 1.1, t0.z); C.yaw0 = C.yaw; }
  } else if (C.state === 'leap') { // pula do chão para o tronco: o corpo gira de "andando" para "subindo"
    const u = Math.min(1, C.t / 0.5), e = easeSmooth(u); jumpArc(C, C.from, C.to, 0.35, u); pitch = -e * Math.PI / 2; yaw = lerpA(C.yaw0, Math.PI / 2, e); amp = 0;
    if (u >= 1) { C.state = 'climb'; C.t = 0; C.y = 1.1; C.yaw = Math.PI / 2; C.top = rr(4.2, 4.8); }
  } else if (C.state === 'climb' || C.state === 'descend' || C.state === 'slip' || C.state === 'reach') {
    pitch = -Math.PI / 2; yaw = Math.PI / 2; C.yaw = yaw;
    if (C.state === 'climb') { C.y += 1.35 * dt; amp = 1; rate = 16; headX = -0.25; if (C.y >= C.top) { C.state = 'reach'; C.t = 0; C.swipes = 0; } }
    else if (C.state === 'reach') { // estica a patinha para o passarinho: três tentativas
      amp = 0.15; headX = -0.45;
      const k = (C.t % 1.1) / 1.1, sw = k < 0.5 ? Math.sin(k / 0.5 * Math.PI) : 0; // 0..1..0 em meio segundo
      C.legs[1].position.z = C.legBase[1].z + 0.22 * sw; C.legs[1].rotation.x = -0.9 * sw; C.legs[0].position.z = C.legBase[0].z + 0.06 * sw;
      if (k < 0.5 && !C.swiped) { C.swiped = true; B.dart = 1.3; } if (k >= 0.5) C.swiped = false;     // a cada patada o passarinho se esquiva
      if (C.t > 3.3) { C.legs[1].rotation.x = 0; C.state = Math.random() < 0.55 ? 'slip' : 'descend'; C.t = 0; C.slipFrom = C.y; }
    } else if (C.state === 'slip') { // escorrega um pedaço, se agarrando com as unhas
      C.y = C.slipFrom - 1.5 * easeSmooth(Math.min(1, C.t / 0.6)); amp = 1; rate = 34; tailUp = 0.3; headX = -0.1;
      if (C.t > 1.1) { C.state = C.y > 2.6 ? 'climb' : 'descend'; C.t = 0; C.top = Math.min(4.8, C.y + 1.6); }
    } else { C.y -= 1.5 * dt; amp = 0.7; rate = 12; headX = 0.2; if (C.y <= 1.2) { C.state = 'dismount'; C.t = 0; C.from = p.clone(); C.to = new THREE.Vector3(TRUNK.x - 2.3, 0, TRUNK.z + 0.4); C.yaw0 = Math.PI / 2; } }
    if (C.state !== 'dismount') { const t = trunkPos(C.y); p.set(t.x, C.y, t.z + Math.sin(now * 2.2) * 0.03); }
  }
  if (C.state === 'dismount') { // pula de volta para o chão e cai de pé
    const u = Math.min(1, C.t / 0.65), e = easeSmooth(u); jumpArc(C, C.from, C.to, 0.5, u); pitch = -Math.PI / 2 * (1 - e); yaw = lerpA(C.yaw0, -Math.PI / 2, e); amp = 0;
    if (u >= 1) { C.state = 'roam'; C.t = 0; C.wait = 0.5; C.yaw = -Math.PI / 2; C.cycle = 0; C.pitch = 0; }
  }
  gait(C, amp, rate, dt, now, tailUp, 0.13 * crouch); look(C, headY, headX, dt);
  if (C.state !== 'reach') { C.legs[1].rotation.x *= 0.8; }
  const flying = C.state === 'leap' || C.state === 'dismount' || C.state === 'pounceJ' || C.state === 'climb' || C.state === 'descend' || C.state === 'slip' || C.state === 'reach';
  if (flying) { C.g.rotation.set(pitch, yaw, 0); C.pitch = pitch; } else setPose(C, dt, pitch);
}

// ---------- o passarinho ----------
function updateBird(B, M, dt, now) {
  B.t += dt; B.th += dt * 0.55;
  const cx = TRUNK.x - 1.4, cy = 7.2, cz = TRUNK.z + 0.8;
  const orbit = th => ({ x: cx + Math.cos(th) * 3.4, y: cy + Math.sin(th * 2) * 0.7, z: cz + Math.sin(th) * 2.3 }); // um "oito" preguiçoso em volta da copa
  let want = orbit(B.th), rate = 2.2;
  const teasing = M.state === 'reach' || M.state === 'climb';
  if (B.dart > 0) { B.dart -= dt; want = orbit(B.th + 1.8); want.y += 0.8; rate = 7; } // esquiva: dispara para o outro lado
  else if (teasing && M.y > 3) { const mp = M.g.position; want = { x: mp.x - 0.35, y: mp.y + 1.6 + Math.sin(now * 3) * 0.12, z: mp.z + 0.15 }; rate = 3; } // paira acima do Mocca, provocando
  const k = Math.min(1, rate * dt);
  const nx = B.px + (want.x - B.px) * k, ny = B.py + (want.y - B.py) * k, nz = B.pz + (want.z - B.pz) * k;
  const vx = (nx - B.px) / Math.max(dt, 0.001), vz = (nz - B.pz) / Math.max(dt, 0.001);
  B.px = nx; B.py = ny; B.pz = nz; B.g.position.set(nx, ny + Math.sin(now * 9) * 0.04, nz);
  if (Math.hypot(vx, vz) > 0.25) B.g.rotation.y = lerpA(B.g.rotation.y, Math.atan2(vx, vz), Math.min(1, 6 * dt)); // olha para onde voa
  B.g.rotation.z += ((-Math.max(-0.5, Math.min(0.5, (vx * Math.cos(B.g.rotation.y) - vz * Math.sin(B.g.rotation.y)) * 0.05))) - B.g.rotation.z) * Math.min(1, 5 * dt); // inclina nas curvas
  const f = Math.sin(now * (B.dart > 0 ? 38 : 26));
  B.wings.forEach(({ w, s }) => { w.rotation.z = s * (0.25 + 0.75 * f); }); // asinhas batendo (mais rápido na fuga)
}

function updatePlayCats(now, dt) {
  if (!PCATS.ready) return;
  swing.g.getWorldPosition(_cp);
  if (Math.hypot(_cp.x - camera.position.x, _cp.z - camera.position.z) > 85) return; // longe da câmera: não gasta nada
  dt = Math.min(dt, 0.05);
  if (calm) { return; } // "reduzir movimento": os bichinhos ficam onde estão
  const { J, M, B } = PCATS;
  if (!J.init) { J.init = true; J.wait = 0.5; J.tx = J.g.position.x; J.tz = J.g.position.z; M.init = true; M.wait = 1; M.tx = M.g.position.x; M.tz = M.g.position.z; }
  updateJulietta(J, M, dt, now); updateMocca(M, J, B, dt, now); updateBird(B, M, dt, now);
  // se os dois ficarem colados, um empurra o outro de leve (nada de gato dentro de gato)
  if (M.state === 'roam' || M.state === 'chase') { const dx = M.g.position.x - J.g.position.x, dz = M.g.position.z - J.g.position.z, d = Math.hypot(dx, dz); if (d < 0.6 && d > 0.001) { M.g.position.x += dx / d * (0.6 - d) * 0.5; M.g.position.z += dz / d * (0.6 - d) * 0.5; J.g.position.x -= dx / d * (0.6 - d) * 0.5; J.g.position.z -= dz / d * (0.6 - d) * 0.5; } }
  swing.bf.forEach(b => { if (b.up > 0) b.up = Math.max(0, b.up - dt * 0.9); });
}
buildPlayCats();
