// A lagoa viva: peixinhos nadando e o Zé Porempa, o gato guloso, tentando pegar um deles.
// Tudo aqui é ANIMAÇÃO: a cada quadro (updatePondLife) a gente muda um pouquinho a posição e o giro de cada peça.
// Conceitos para estudar: "máquina de estados" (o gato troca de fase: observar > se preparar > bater > recuperar),
// "steering" (cada peixe vira devagar na direção de um ponto-alvo em vez de teletransportar) e "pool" de objetos
// (anéis e gotas são criados uma vez só e reaproveitados, para não pesar).
'use strict';

const pondLife = { ready: false, P: null, fish: [], rings: [], drops: [], ze: null, pawX: 0, pawZ: 0, nextRipple: 0 };
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a)); // deixa um ângulo entre -π e π (para girar pelo lado mais curto)
const randIn = (a, b) => a + Math.random() * (b - a);

function makeFish(color, patch, size) {
  const f = new THREE.Group(), mat = lam(color);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), mat); body.scale.set(0.7, 0.5, 1.7); f.add(body);
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), lam(patch)); p.scale.set(0.8, 0.4, 1.1); p.position.set(0.04, 0.1, -0.05); f.add(p);
  const tail = new THREE.Group(); tail.position.z = -0.38; f.add(tail);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.34, 4), mat); fin.scale.set(0.22, 1, 1.5); fin.rotation.x = Math.PI / 2; fin.position.z = -0.17; tail.add(fin);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0x120b1c })); e.position.set(s * 0.1, 0.05, 0.33); f.add(e); });
  f.scale.setScalar(size);
  return { g: f, tail };
}

function buildPondLife(P) { // P = { x, z, r } em coordenadas do mundo
  pondLife.P = P;

  // ----- O Zé Porempa: gato branco, olhos cor de mel e barriguinha de quem come bem -----
  const ze = buildCat(0xfffaf2, null);
  const { body, head, tail } = ze.userData;
  body.children[0].scale.set(1.18, 0.95, 1.45); // barriga redonda
  [2, 4].forEach(i => { // olhos: grandes, amarelo-mel, com uma pupilinha
    const eye = head.children[i]; eye.material.color.setHex(0xe8aa3a); eye.scale.setScalar(1.7);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0x120b1c }));
    pupil.scale.set(0.55, 1.3, 0.5); pupil.position.set(eye.position.x, eye.position.y, eye.position.z + 0.05); head.add(pupil);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff8fb3 })); nose.position.set(0, -0.03, 0.33); head.add(nose);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6f9c })); // língua (ele é guloso)
  tongue.scale.set(1, 0.5, 1.4); tongue.position.set(0, -0.13, 0.3); tongue.visible = false; head.add(tongue);
  body.children[2].visible = false; // some com a pata da frente: no lugar dela entra uma pata "articulada" (o braço)
  const arm = new THREE.Group(); arm.position.set(0.22, 0.42, 0.42); body.add(arm);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), body.children[1].material); leg.position.y = -0.2; arm.add(leg);
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), body.children[1].material); paw.position.y = -0.41; arm.add(paw);

  // Senta na beirada, de frente para a água (rotation.y gira o gato; o "rosto" dele aponta para +z local)
  const A = 0.1, dx = Math.cos(A), dz = Math.sin(A);
  ze.position.set(P.x + dx * (P.r + 0.55), 0, P.z + dz * (P.r + 0.55));
  ze.rotation.y = Math.atan2(-dx, -dz);
  world.add(ze); enableShadows(ze);
  const label = makeLabel('Zé Porempa', 0xf2b84b, 0.6); label.position.y = 2.3; ze.add(label); catLabels.push([label, ze]);
  Object.assign(ze.userData, { arm, tongue, state: 'watch', t: 0, cool: 2.5 });
  pondLife.ze = ze;
  // onde a pata cai quando ele bate na água (um pouco à frente do gato)
  pondLife.pawX = ze.position.x + Math.sin(ze.rotation.y) * 1.15; pondLife.pawZ = ze.position.z + Math.cos(ze.rotation.y) * 1.15;

  // ----- Os peixes (carpas coloridas) -----
  const looks = [[0xff8a3c, 0xfff1f5, 1.1], [0xfff1f5, 0xff8a3c, 1.0], [0xf2b84b, 0xfff1f5, 0.95], [0xff7eb6, 0xfff1f5, 0.9], [0xfff1f5, 0xf2b84b, 1.15], [0xff8a3c, 0xf2b84b, 0.8], [0xf2b84b, 0xff7eb6, 1.0], [0xfff1f5, 0xff7eb6, 0.85]];
  looks.forEach(([c, pc, sz], i) => {
    const { g, tail: tl } = makeFish(c, pc, sz * 1.15);
    const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (P.r - 1);
    const f = { g, tail: tl, x: P.x + Math.cos(a) * r, z: P.z + Math.sin(a) * r, h: Math.random() * 6.283, spd: randIn(0.9, 1.5), tx: P.x, tz: P.z, tNext: 0, flee: 0, ph: i * 1.7 };
    g.position.set(f.x, 0.11, f.z); world.add(g); pondLife.fish.push(f);
  });

  // ----- Anéis de marola e gotinhas (criados uma vez e reaproveitados) -----
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.085; m.visible = false; world.add(m); pondLife.rings.push({ m, life: 1, max: 1, op: 0 });
  }
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0xdff6ff })); m.visible = false; world.add(m);
    pondLife.drops.push({ m, vx: 0, vy: 0, vz: 0, on: false });
  }
  pondLife.ready = true;
}

function emitRing(x, z, max, op) {
  const r = pondLife.rings.find(q => q.life >= 1); if (!r) return;
  r.life = 0; r.max = max; r.op = op; r.m.position.set(x, 0.085, z); r.m.visible = true;
}
function splash(x, z) { // a pata bate na água: anel grande + gotinhas voando
  emitRing(x, z, 1.7, 0.8);
  pondLife.drops.filter(d => !d.on).slice(0, 7).forEach(d => {
    d.on = true; d.m.visible = true; d.m.position.set(x, 0.12, z);
    const a = Math.random() * 6.283, v = randIn(0.6, 1.8); d.vx = Math.cos(a) * v; d.vz = Math.sin(a) * v; d.vy = randIn(3, 5);
  });
}

function newWaypoint(f, P, ze) {
  if (Math.random() < 0.4) { // curiosidade: vai espiar perto do gato
    f.tx = pondLife.pawX + randIn(-0.9, 0.9); f.tz = pondLife.pawZ + randIn(-0.9, 0.9);
  } else {
    const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (P.r - 0.9);
    f.tx = P.x + Math.cos(a) * r; f.tz = P.z + Math.sin(a) * r;
  }
}

function updatePondLife(now, dt) {
  if (!pondLife.ready) return;
  dt = Math.min(dt, 0.05);
  const P = pondLife.P, ze = pondLife.ze, u = ze.userData, { body, head, tail } = u;

  // ----- peixes: cada um vira devagar na direção do seu ponto-alvo e nada para a frente -----
  pondLife.fish.forEach(f => {
    if (now > f.tNext || Math.hypot(f.tx - f.x, f.tz - f.z) < 0.5) { newWaypoint(f, P, ze); f.tNext = now + randIn(2.5, 5); }
    f.flee = Math.max(0, f.flee - dt);
    const want = Math.atan2(f.tx - f.x, f.tz - f.z), turn = (f.flee > 0 ? 7 : 2.4) * dt;
    f.h += Math.max(-turn, Math.min(turn, wrapA(want - f.h)));
    const sp = f.spd * (f.flee > 0 ? 3.4 : 1);
    f.x += Math.sin(f.h) * sp * dt; f.z += Math.cos(f.h) * sp * dt;
    const dxp = f.x - P.x, dzp = f.z - P.z, d = Math.hypot(dxp, dzp), lim = P.r - 0.55;
    if (d > lim) { f.x = P.x + dxp / d * lim; f.z = P.z + dzp / d * lim; f.tx = P.x; f.tz = P.z; } // não sai da água
    f.g.position.set(f.x, 0.11 + Math.sin(now * 2 + f.ph) * 0.012, f.z); f.g.rotation.y = f.h;
    f.tail.rotation.y = Math.sin(now * (6 + sp * 3) + f.ph) * 0.55;
  });
  if (now > pondLife.nextRipple) { // de vez em quando um peixe faz uma marolinha
    const f = pondLife.fish[(Math.random() * pondLife.fish.length) | 0]; emitRing(f.x, f.z, 0.55, 0.35); pondLife.nextRipple = now + randIn(0.5, 1.4);
  }

  // ----- Zé Porempa: máquina de estados -----
  u.t += dt;
  let near = null, nd = 99;
  pondLife.fish.forEach(f => { const d = Math.hypot(f.x - pondLife.pawX, f.z - pondLife.pawZ); if (d < nd) { nd = d; near = f; } });
  const tgt = (k, a, b) => THREE.MathUtils.lerp(a, b, Math.min(1, dt * k)); // aproxima um valor do alvo suavemente
  let bodyRx = 0, bodyY = 0, armRx = 0, headX = 0.3 + Math.sin(now * 1.7) * 0.04, wig = 0, lick = false;

  if (u.state === 'watch') {
    u.cool -= dt;
    if (near) head.rotation.y = tgt(5, head.rotation.y, THREE.MathUtils.clamp(wrapA(Math.atan2(near.x - ze.position.x, near.z - ze.position.z) - ze.rotation.y), -0.7, 0.7));
    tail.rotation.z = Math.sin(now * 2.2) * 0.35;
    lick = Math.sin(now * 2.6) > 0.8;
    if (u.cool <= 0 && nd < 1.7) { u.state = 'windup'; u.t = 0; }
  } else if (u.state === 'windup') { // se agacha e remexe o bumbum antes do bote
    bodyY = -0.07; headX = 0.55; bodyRx = 0.08; wig = Math.sin(u.t * 34) * 0.07; tail.rotation.z = Math.sin(u.t * 26) * 0.6;
    if (u.t > 0.6) { u.state = 'swat'; u.t = 0; u.hit = false; }
  } else if (u.state === 'swat') { // estica a pata para a água
    bodyRx = 0.28; bodyY = -0.05; headX = 0.8; armRx = -1.35;
    if (!u.hit && u.t > 0.14) {
      u.hit = true; splash(pondLife.pawX, pondLife.pawZ);
      pondLife.fish.forEach(f => { // os peixes perto da pata fogem na hora, para longe dela
        if (Math.hypot(f.x - pondLife.pawX, f.z - pondLife.pawZ) < 2.2) { f.flee = 1.3; f.tx = f.x + (f.x - pondLife.pawX) * 3 + randIn(-1, 1); f.tz = f.z + (f.z - pondLife.pawZ) * 3 + randIn(-1, 1); f.tNext = now + 1.5; }
      });
    }
    if (u.t > 0.5) { u.state = 'recover'; u.t = 0; }
  } else { // recover: volta devagar, "sem graça" por ter errado
    bodyRx = 0.1; headX = 0.1; tail.rotation.z = Math.sin(now * 5) * 0.2;
    if (u.t > 0.9) { u.state = 'watch'; u.t = 0; u.cool = randIn(2.5, 5.5); }
  }
  body.rotation.x = tgt(12, body.rotation.x, bodyRx); body.position.y = tgt(12, body.position.y, bodyY); body.rotation.z = wig;
  u.arm.rotation.x = tgt(u.state === 'swat' ? 22 : 7, u.arm.rotation.x, armRx);
  head.rotation.x = tgt(8, head.rotation.x, headX);
  if (u.state !== 'watch') head.rotation.y = tgt(6, head.rotation.y, 0);
  u.tongue.visible = lick;

  // ----- anéis e gotinhas -----
  pondLife.rings.forEach(r => {
    if (r.life >= 1) return;
    r.life = Math.min(1, r.life + dt * 1.1); const s = 0.25 + r.life * r.max;
    r.m.scale.set(s, s, 1); r.m.material.opacity = r.op * (1 - r.life); if (r.life >= 1) r.m.visible = false;
  });
  pondLife.drops.forEach(d => {
    if (!d.on) return;
    d.vy -= 14 * dt; d.m.position.x += d.vx * dt; d.m.position.z += d.vz * dt; d.m.position.y += d.vy * dt;
    if (d.m.position.y < 0.08) { d.on = false; d.m.visible = false; }
  });
}
