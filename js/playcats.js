// A turma brincalhona do balanço: a Maria Julietta (branca, pequena, um olho azul e outro amarelo) caça as borboletas sem parar, enquanto o Mocca
// (filhote "siamês falso") persegue um passarinho: espreita, agacha e pula, e depois escala o tronco da árvore atrás dele (veja updateMocca).
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
  const B = { g: bird, wings, th: 0, mode: 'orbit', t: 0, orbitDur: 4.5, px: bird.position.x, py: bird.position.y, pz: bird.position.z, from: new THREE.Vector3(), toId: 'top', gt: 0, gd: 1, lift: 1, perchId: 'top', kind: 'top', pt: 0, threat: false, lastLow: null };

  PCATS.J = J; PCATS.M = M; PCATS.B = B; PCATS.ready = true;
}

// ---------- ajudantes de movimento ----------
function avoid(C) { // empurra o gato para fora de cestos, livros e do tronco (círculos em xz)
  const p = C.g.position;
  OBST.forEach(([ox, oz, r]) => { const dx = p.x - ox, dz = p.z - oz, d = Math.hypot(dx, dz); if (d < r + 0.25 && d > 0.001) { p.x = ox + dx / d * (r + 0.25); p.z = oz + dz / d * (r + 0.25); } });
  p.x = Math.max(AREA.x0, Math.min(AREA.x1, p.x)); p.z = Math.max(AREA.z0, Math.min(AREA.z1, p.z));
}
// DESVIO: se a linha reta até o alvo bate num cesto, na pilha de livros ou no tronco, o gato mira num ponto ao lado do obstáculo (um "waypoint").
// Sem isso ele empurrava o cesto para sempre, preso num canto. Recalculado todo quadro, então ele contorna sozinho.
function route(p, tx, tz) {
  for (const [ox, oz, r] of OBST) {
    const R = r + 0.55, sx = tx - p.x, sz = tz - p.z, L2 = sx * sx + sz * sz; if (L2 < 1e-4) continue;
    if (Math.hypot(tx - ox, tz - oz) < R) continue; // o alvo está dentro do obstáculo (ex.: poleiro em cima do cesto): não tem como desviar
    const t = Math.max(0, Math.min(1, ((ox - p.x) * sx + (oz - p.z) * sz) / L2)), cx = p.x + sx * t, cz = p.z + sz * t; // ponto da reta mais perto do obstáculo
    if (Math.hypot(cx - ox, cz - oz) < R) {
      let nx = cx - ox, nz = cz - oz; const nl = Math.hypot(nx, nz); if (nl < 0.05) { nx = -sz; nz = sx; } // reta passa bem no meio: escolhe um lado
      const k = (R + 0.2) / (Math.hypot(nx, nz) || 1); return [ox + nx * k, oz + nz * k];
    }
  }
  return [tx, tz];
}
// anda em direção a (tx, tz): vira devagar e avança na direção em que está virado (é o que dá a sensação de bichinho de verdade)
function steer(C, tx, tz, speed, dt, turn = 9) {
  const p = C.g.position, d = Math.hypot(tx - p.x, tz - p.z), [wx, wz] = route(p, tx, tz); // d = distância até o alvo de verdade; o gato vira para o waypoint
  if (d > 0.05) { C.yaw = lerpA(C.yaw, Math.atan2(wx - p.x, wz - p.z), Math.min(1, turn * dt)); const sp = Math.min(speed, Math.max(0.8, d * 4)); // desacelera ao chegar: sem isso ele ficava dando voltas em torno do alvo (o giro é suave demais para um alvo tão perto)
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
    if (C.t > C.wait) { C.t = 0; const b = nearestButterfly(C, 7); if (b) { C.target = b; C.state = 'stalk'; } else if (Math.random() < 0.3) { C.state = 'zoom'; C.t = 0; C.tx = rr(AREA.x0 + 1, AREA.x1 - 1); C.tz = rr(AREA.z0 + 1, AREA.z1 - 1); } else { C.tx = rr(AREA.x0 + 1, AREA.x1 - 0.5); C.tz = rr(AREA.z0 + 1, AREA.z1 - 0.5); C.wait = rr(1.4, 3.2); } }
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

// ---------- Poleiros do passarinho (em coordenadas do balanço) ----------
// kind 'low' = baixo (o Mocca alcança pulando); 'top' = lá em cima, na ponta de um galhinho da copa (o Mocca só chega escalando o tronco).
const PERCH = {
  stub:   { kind: 'low', x: TRUNK.x - 1.5, y: 1.62, z: TRUNK.z + 0.3 },   // galhinho baixo no tronco (criado em swing.js)
  basket: { kind: 'low', x: -3.2, y: 1.25, z: 1.0 },                      // em cima do cesto de flores
  seat:   { kind: 'low', dyn: true },                                    // na tábua do balanço (que balança!)
  top:    { kind: 'top', x: 3.0, y: 6.92, z: 2.55 }                      // ponta do galhinho alto
};
const _pp = new THREE.Vector3();
function perchPos(id, out) { // onde está o poleiro AGORA (o assento se mexe junto com o pêndulo: ele gira em volta do pivô a 5,3 de altura)
  const P = PERCH[id];
  if (P.dyn) { const f = swing.pivot.rotation.x; out.set(0.1, 5.3 - 3.93 * Math.cos(f), TRUNK.z - 3.93 * Math.sin(f)); } else out.set(P.x, P.y, P.z);
  return out;
}

// ---------- Mocca: segue o passarinho com instinto de caçador ----------
// A HISTÓRIA (o passarinho conduz, o Mocca reage):
//  1. o passarinho voa em volta da copa e o Mocca o ACOMPANHA no chão, de olho nele;
//  2. o passarinho pousa num poleiro BAIXO: o Mocca se aproxima devagar (espreita), AGACHA, balança o bumbum e PULA;
//  3. o passarinho voa na hora e pousa no TOPO da árvore: o Mocca corre para o tronco e ESCALA;
//  4. quando o Mocca está quase lá, o passarinho voa de novo, dá uma volta e pousa num poleiro baixo e distante: volta ao passo 1.
function updateMocca(C, J, B, dt, now) {
  const p = C.g.position; C.t += dt;
  let amp = 0, rate = 14, tailUp = -0.4, headX = 0, headY = 0, pitch = 0, yaw = C.yaw, crouch = 0;
  const trunkPos = y => ({ x: TRUNK.x - trunkR(y) + 0.02, z: TRUNK.z });
  const perched = B.mode === 'perched', lowPerch = perched && B.kind === 'low', topPerch = perched && B.kind === 'top';
  const bp = B.g.position;
  const watchBird = () => { // a cabeça acompanha o passarinho: gira para o lado dele e sobe o focinho conforme ele está alto
    const rel = Math.atan2(bp.x - p.x, bp.z - p.z) - C.yaw; headY = Math.max(-0.8, Math.min(0.8, Math.atan2(Math.sin(rel), Math.cos(rel))));
    headX = -Math.max(0.1, Math.min(0.7, Math.atan2(bp.y - 0.8, Math.hypot(bp.x - p.x, bp.z - p.z) + 0.3)));
  };
  if (C.state === 'follow') { // anda pelo chão sob o passarinho, de olho nele
    const tx = Math.max(AREA.x0 + 0.5, Math.min(AREA.x1 - 0.5, bp.x - 0.5)), tz = Math.max(AREA.z0 + 0.5, Math.min(AREA.z1 - 0.5, bp.z + 0.8));
    const d = steer(C, tx, tz, 3.1, dt, 9); amp = d > 0.5 ? 1 : 0; rate = 16; tailUp = -0.2; watchBird();
    if (lowPerch && !B.threat && B.pt > 0.7) { C.state = 'stalk'; C.t = 0; }
    else if (topPerch && !B.threat && B.pt > 0.5) { C.state = 'toTree'; C.t = 0; }
  } else if (C.state === 'stalk') { // espreita: vai devagar, baixinho, até o ponto de onde dá para pular
    if (!lowPerch || B.threat) { C.state = 'follow'; C.t = 0; }
    else {
      const px = bp.x, pz = bp.z, dx = p.x - px, dz = p.z - pz, dd = Math.hypot(dx, dz) || 1; // ponto de salto: 1,9 do poleiro, do lado de onde o Mocca vem
      const lx = Math.max(AREA.x0 + 0.3, Math.min(AREA.x1 - 0.2, px + dx / dd * 1.9)), lz = Math.max(AREA.z0 + 0.3, Math.min(AREA.z1 - 0.2, pz + dz / dd * 1.9));
      const d = steer(C, lx, lz, 2.0, dt, 10); amp = d > 0.4 ? 0.7 : 0; rate = 11; tailUp = -0.05; crouch = 0.45; watchBird();
      if (d < 0.35 || C.t > 7) { C.state = 'crouchB'; C.t = 0; }
    }
  } else if (C.state === 'crouchB') { // agacha, balança o bumbum e fixa o olhar
    crouch = 1; amp = 0; tailUp = -0.02; headX = -0.45; C.yaw = lerpA(C.yaw, Math.atan2(bp.x - p.x, bp.z - p.z), Math.min(1, 12 * dt));
    C.g.position.x += Math.sin(now * 38) * 0.0025; C.g.position.z += Math.cos(now * 31) * 0.0015;
    if (C.t > 0.95) { // PULA na direção do passarinho
      C.state = 'pounceB'; C.t = 0; C.from = p.clone(); { const dx = bp.x - p.x, dz = bp.z - p.z, dl = Math.hypot(dx, dz) || 1, hop = Math.max(0.6, dl - 0.9); C.to = new THREE.Vector3(p.x + dx / dl * hop, 0, p.z + dz / dl * hop); C.H = Math.max(0.6, Math.min(1.5, bp.y * 0.9)); }
    }
  } else if (C.state === 'pounceB') {
    const u = Math.min(1, C.t / 0.8); jumpArc(C, C.from, C.to, C.H, u); pitch = -0.9 * Math.sin(Math.PI * Math.min(1, u * 1.15)) + (u > 0.6 ? (u - 0.6) * 1.2 : 0); amp = 0; headX = -0.4;
    C.legs[0].rotation.x = C.legs[1].rotation.x = -1.2 * Math.sin(Math.PI * u);
    if (u > 0.3 && !B.threat) B.threat = true;       // o passarinho percebe e sai voando antes de o Mocca chegar
    if (u >= 1) { C.state = 'land'; C.t = 0; avoid(C); C.legs[0].rotation.x = C.legs[1].rotation.x = 0; }
  } else if (C.state === 'land') { // aterrissa de patas abertas, sem o passarinho, e olha para cima
    watchBird(); amp = 0; crouch = 0.4 * Math.max(0, 1 - C.t / 0.4);
    if (C.t > 0.8) { C.state = 'follow'; C.t = 0; }
  } else if (C.state === 'toTree') { // o passarinho foi para o topo: corre até a base do tronco, pelo lado esquerdo
    const d = steer(C, TRUNK.x - 2.1, TRUNK.z + 0.1, 5, dt, 12); amp = 1; rate = 22; watchBird();
    if (d < 0.35) { C.state = 'leap'; C.t = 0; C.from = p.clone(); const t0 = trunkPos(1.1); C.to = new THREE.Vector3(t0.x, 1.1, t0.z); C.yaw0 = C.yaw; }
  } else if (C.state === 'leap') { // pula do chão para o tronco: o corpo gira de "andando" para "subindo"
    const u = Math.min(1, C.t / 0.5), e = easeSmooth(u); jumpArc(C, C.from, C.to, 0.35, u); pitch = -e * Math.PI / 2; yaw = lerpA(C.yaw0, Math.PI / 2, e); amp = 0;
    if (u >= 1) { C.state = 'climb'; C.t = 0; C.y = 1.1; C.yaw = Math.PI / 2; C.top = rr(4.4, 4.9); }
  } else if (C.state === 'climb' || C.state === 'descend' || C.state === 'slip' || C.state === 'reach') {
    pitch = -Math.PI / 2; yaw = Math.PI / 2; C.yaw = yaw;
    if (C.state === 'climb') { C.y += 1.35 * dt; amp = 1; rate = 16; headX = -0.25; if (C.y >= C.top) { C.state = 'reach'; C.t = 0; C.swiped = false; C.left = 0; } }
    else if (C.state === 'reach') { // estica a patinha para o passarinho... e ele voa antes de ser pego
      amp = 0.15; headX = -0.45;
      const k = (C.t % 1.1) / 1.1, sw = k < 0.5 ? Math.sin(k / 0.5 * Math.PI) : 0; // 0..1..0 em meio segundo
      C.legs[1].position.z = C.legBase[1].z + 0.22 * sw; C.legs[1].rotation.x = -0.9 * sw; C.legs[0].position.z = C.legBase[0].z + 0.06 * sw;
      if (C.t > 1.3 && topPerch && !B.threat) B.threat = true; // quase lá: o passarinho voa
      if (!perched || B.kind !== 'top') C.left += dt;          // conta o tempo desde que ele saiu, para o Mocca ficar olhando ele ir embora
      if (C.left > 1.4 || C.t > 6) { C.legs[1].rotation.x = 0; C.state = Math.random() < 0.55 ? 'slip' : 'descend'; C.t = 0; C.slipFrom = C.y; }
    } else if (C.state === 'slip') { // escorrega um pedaço, se agarrando com as unhas
      C.y = C.slipFrom - 1.5 * easeSmooth(Math.min(1, C.t / 0.6)); amp = 1; rate = 34; tailUp = 0.3; headX = -0.1;
      if (C.t > 1.1) { C.state = 'descend'; C.t = 0; }
    } else { C.y -= 1.5 * dt; amp = 0.7; rate = 12; headX = 0.2; if (C.y <= 1.2) { C.state = 'dismount'; C.t = 0; C.from = p.clone(); C.to = new THREE.Vector3(TRUNK.x - 2.3, 0, TRUNK.z + 0.4); C.yaw0 = Math.PI / 2; } }
    if (C.state !== 'dismount') { const t = trunkPos(C.y); p.set(t.x, C.y, t.z + Math.sin(now * 2.2) * 0.03); }
  }
  if (C.state === 'dismount') { // pula de volta para o chão e cai de pé
    const u = Math.min(1, C.t / 0.65), e = easeSmooth(u); jumpArc(C, C.from, C.to, 0.5, u); pitch = -Math.PI / 2 * (1 - e); yaw = lerpA(C.yaw0, -Math.PI / 2, e); amp = 0;
    if (u >= 1) { C.state = 'follow'; C.t = 0; C.yaw = -Math.PI / 2; C.pitch = 0; }
  }
  gait(C, amp, rate, dt, now, tailUp, 0.13 * crouch); look(C, headY, headX, dt);
  if (C.state !== 'reach') { C.legs[1].rotation.x *= 0.8; }
  const flying = C.state === 'leap' || C.state === 'dismount' || C.state === 'pounceB' || C.state === 'climb' || C.state === 'descend' || C.state === 'slip' || C.state === 'reach';
  if (flying) { C.g.rotation.set(pitch, yaw, 0); C.pitch = pitch; } else setPose(C, dt, pitch);
}

// ---------- o passarinho: conduz a história ----------
// Modos: 'orbit' (voa em círculos em volta da copa), 'glide' (voa de um ponto até um poleiro, em arco) e 'perched' (pousado).
// B.threat = true quer dizer "o Mocca ameaçou": o passarinho decide fugir. Quem liga o threat é o Mocca (updateMocca).
function pickLow(B) { // escolhe um poleiro baixo, diferente do último e, de preferência, longe do Mocca
  const ids = ['stub', 'basket', 'seat'].filter(id => id !== B.lastLow), mp = PCATS.M.g.position; let best = ids[0], bd = -1;
  ids.forEach(id => { perchPos(id, _pp); const d = Math.hypot(_pp.x - mp.x, _pp.z - mp.z) + Math.random() * 2.5; if (d > bd) { bd = d; best = id; } });
  return best;
}
function birdGlideTo(B, id, dur, lift) { B.from.set(B.px, B.py, B.pz); B.toId = id; B.gt = 0; B.gd = dur; B.lift = lift; B.mode = 'glide'; B.threat = false; }
function updateBird(B, M, dt, now) {
  B.t += dt;
  const cx = TRUNK.x - 1.4, cy = 7.2, cz = TRUNK.z + 0.8;
  const orbit = th => ({ x: cx + Math.cos(th) * 3.4, y: cy + Math.sin(th * 2) * 0.7, z: cz + Math.sin(th) * 2.3 }); // um "oito" preguiçoso em volta da copa
  let nx = B.px, ny = B.py, nz = B.pz, wings = 1, fast = false, lean = 0, face = null;
  if (B.mode === 'orbit') {
    B.th += dt * 0.6; const want = orbit(B.th), k = Math.min(1, 2.4 * dt);
    nx += (want.x - nx) * k; ny += (want.y - ny) * k; nz += (want.z - nz) * k;
    if (B.t > B.orbitDur) birdGlideTo(B, pickLow(B), 2.1, 1.1);
  } else if (B.mode === 'glide') {
    B.gt += dt; const u = Math.min(1, B.gt / B.gd), e = easeSmooth(u); perchPos(B.toId, _pp);
    const side = Math.sin(Math.PI * 2 * u) * 0.55 * (B.toId === 'top' ? 0.4 : 1); // um S no caminho: voo de passarinho nunca é reto
    nx = B.from.x + (_pp.x - B.from.x) * e + side; nz = B.from.z + (_pp.z - B.from.z) * e; ny = B.from.y + (_pp.y - B.from.y) * e + B.lift * Math.sin(Math.PI * u);
    fast = B.toId === 'top'; lean = u > 0.8 ? -0.5 * (u - 0.8) / 0.2 : 0; // no pouso, abre as asas e levanta o peito
    if (u >= 1) { B.mode = 'perched'; B.perchId = B.toId; B.kind = PERCH[B.toId].kind; B.pt = 0; B.threat = false; if (B.kind === 'low') B.lastLow = B.toId; }
  } else { // perched
    B.pt += dt; perchPos(B.perchId, _pp); nx = _pp.x; ny = _pp.y; nz = _pp.z; wings = 0;
    const pk = Math.max(0, Math.sin(now * 2.7 + 1)); lean = Math.pow(pk, 10) * 0.5; // de vez em quando bica o poleiro
    face = B.kind === 'low' ? Math.atan2(M.g.position.x - nx, M.g.position.z - nz) : Math.sin(now * 0.7) * 0.8 + 0.2; // baixo: vigia o gato; alto: olha em volta
    if (B.kind === 'low' && (B.threat || B.pt > 16)) { birdGlideTo(B, 'top', 1.5, 1.6); B.threat = false; }
    else if (B.kind === 'top' && (B.threat || B.pt > 14)) { B.mode = 'orbit'; B.t = 0; B.orbitDur = rr(2.8, 4); B.th = Math.atan2(nz - cz, nx - cx); B.threat = false; }
  }
  const vx = (nx - B.px) / Math.max(dt, 0.001), vz = (nz - B.pz) / Math.max(dt, 0.001);
  B.px = nx; B.py = ny; B.pz = nz; B.g.position.set(nx, ny + (wings ? Math.sin(now * 9) * 0.04 : 0), nz);
  if (face !== null) B.g.rotation.y = lerpA(B.g.rotation.y, face, Math.min(1, 6 * dt));
  else if (Math.hypot(vx, vz) > 0.25) B.g.rotation.y = lerpA(B.g.rotation.y, Math.atan2(vx, vz), Math.min(1, 6 * dt)); // olha para onde voa
  B.g.rotation.x += (lean - B.g.rotation.x) * Math.min(1, 10 * dt);
  const bank = wings ? -Math.max(-0.5, Math.min(0.5, (vx * Math.cos(B.g.rotation.y) - vz * Math.sin(B.g.rotation.y)) * 0.05)) : 0; // inclina nas curvas
  B.g.rotation.z += (bank - B.g.rotation.z) * Math.min(1, 5 * dt);
  const f = Math.sin(now * (fast ? 38 : 26));
  B.wings.forEach(({ w, s }) => { w.rotation.z += ((wings ? s * (0.25 + 0.75 * f) : s * 0.1) - w.rotation.z) * Math.min(1, wings ? 1 : 12 * dt); }); // voando: batendo; pousado: dobradas
}

function updatePlayCats(now, dt) {
  if (!PCATS.ready) return;
  swing.g.getWorldPosition(_cp);
  if (Math.hypot(_cp.x - camera.position.x, _cp.z - camera.position.z) > 85) return; // longe da câmera: não gasta nada
  dt = Math.min(dt, 0.05);
  if (calm) { return; } // "reduzir movimento": os bichinhos ficam onde estão
  const { J, M, B } = PCATS;
  if (!J.init) { J.init = true; J.wait = 0.5; J.tx = J.g.position.x; J.tz = J.g.position.z; M.init = true; M.state = 'follow'; M.tx = M.g.position.x; M.tz = M.g.position.z; }
  updateJulietta(J, M, dt, now); updateMocca(M, J, B, dt, now); updateBird(B, M, dt, now);
  // se os dois ficarem colados, um empurra o outro de leve (nada de gato dentro de gato)
  if (M.state === 'follow' || M.state === 'stalk') { const dx = M.g.position.x - J.g.position.x, dz = M.g.position.z - J.g.position.z, d = Math.hypot(dx, dz); if (d < 0.6 && d > 0.001) { M.g.position.x += dx / d * (0.6 - d) * 0.5; M.g.position.z += dz / d * (0.6 - d) * 0.5; J.g.position.x -= dx / d * (0.6 - d) * 0.5; J.g.position.z -= dz / d * (0.6 - d) * 0.5; } }
  swing.bf.forEach(b => { if (b.up > 0) b.up = Math.max(0, b.up - dt * 0.9); });
}
buildPlayCats();
