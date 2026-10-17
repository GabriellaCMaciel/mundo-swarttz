// Os gatos da casa da zona Cartas: a Mel, sentada no telhado, e os três filhotes (Bangula, Ônix e Cat Noir) brincando de lutinha.
// Conceitos para estudar neste arquivo:
//  - HIERARQUIA DE GRUPOS: a Mel está dentro de um grupo inclinado (que acompanha a água do telhado), dentro do grupo da casa,
//    dentro do grupo da zona. Cada pai move e gira os filhos junto, e getWorldPosition() descobre onde ela está no mundo inteiro.
//  - MÁQUINA DE ESTADOS COM SUAVIZAÇÃO: a Mel tem dois humores (calma / rosnando). Em vez de trocar de uma vez, uma variável
//    "g" (0 a 1) caminha devagar até o valor desejado, e todas as poses (orelhas, cabeça, tremor) são calculadas a partir dela.
//  - ANIMAÇÃO POR CICLO: os filhotes seguem um ciclo de 7,8 s dividido em três atos de 2,6 s. Em cada ato um é o ATACANTE, outro a VÍTIMA e o terceiro
//    PLATEIA. Dentro do ato há fases bem separadas (agachar > pular > rolar e brigar > voltar), para a brincadeira ficar nítida (veja updateKittens).
'use strict';

const yardCats = { mel: null, kittens: [], K: null };
const _yw = new THREE.Vector3();
const SQ = x => Math.max(0, Math.min(1, x));

// Manchas de pelo da Mel: pintadas na textura do corpo (coatTex, em world.js), nunca bolinhas por cima do pelo.
// Sorteia manchas de tamanho médio e bordas macias; o preto aparece mais vezes, então o escuro continua mandando.
function melBlobs(rnd, n, rMin, rMax, avoidFace) {
  const cols = [0xa95a1d, 0xa95a1d, 0xeadfca, 0x0d080a, 0x0d080a, 0x0d080a], out = [];
  while (out.length < n) {
    const x = rnd() * 512, y = 36 + rnd() * 170;
    if (avoidFace && x > 84 && x < 172 && y > 70 && y < 190) continue; // deixa a carinha (olhos e nariz) limpa
    out.push({ x, y, r: rMin + rnd() * (rMax - rMin), a: 0.7 + rnd() * 0.6, rot: rnd() * 3, c: cols[(rnd() * cols.length) | 0] });
  }
  return out;
}

// ================= A MEL =================
// Gata mais velha: mãe, avó e bisavó dos outros. Pelo curto, tricolor (preto, branco e laranja) bem misturado, mas o escuro
// predomina: quase se camufla. Olhos verdes. Fica sentada no telhado, observando tudo de longe, e rosna se outro gato chega perto.
function buildMel(H, rise, half) {
  const rnd = mulberry32(2026);
  const phi = Math.atan2(rise, half);
  // O poleiro: um grupo inclinado, colocado em cima da água da frente do telhado
  const pivot = new THREE.Group(), pz = 0.95;
  pivot.position.set(1.7, 4.1 + rise / 2 + 0.05 + (half / 2 - pz) * (rise / half) + 0.11 / Math.cos(phi) - 0.02, pz);
  pivot.rotation.x = phi * 0.55; // ela senta meio de pé, não deitada no mesmo ângulo do telhado
  H.add(pivot);
  const turn = new THREE.Group(); pivot.add(turn); turn.rotation.y = 0.3; // turn gira a gata inteira para olhar para alguém
  const cat = new THREE.Group(); cat.scale.setScalar(0.95); turn.add(cat);
  const body = new THREE.Group(); cat.add(body);

  const BASE = 0x2b2023, fur = lam(BASE);
  const ell = (r, sx, sy, sz, x, y, z, parent, m = fur) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); parent.add(o); return o; };
  // peitinho branco: uma mancha cream pintada na frente do tronco (u = 0,25), junto com as outras cores misturadas
  const torsoBlobs = [{ x: 128, y: 150, r: 34, a: 0.8, c: 0xeadfca }, ...melBlobs(rnd, 14, 14, 32)];
  ell(0.5, 0.82, 1.08, 0.8, 0, 0.62, 0, body, coatMat(BASE, torsoBlobs, 11));   // tronco (um elipsoide em pé: ela está sentada)
  [-1, 1].forEach(s => {
    ell(0.32, 0.9, 0.85, 1.2, s * 0.3, 0.28, -0.08, body, coatMat(BASE, melBlobs(rnd, 7, 14, 28), 20 + s)); // as ancas (cada uma com a sua pintura)
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.6, 8), fur); leg.position.set(s * 0.16, 0.3, 0.3); body.add(leg); // patas da frente
    ell(0.1, 1, 0.6, 1.4, s * 0.16, 0.05, 0.36, body);                  // patinhas
  });

  const head = new THREE.Group(); head.position.set(0, 1.42, 0.12); body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), coatMat(BASE, melBlobs(rnd, 6, 9, 18, true), 30)));
  const ears = [], eyes = [];
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 4), fur); ear.position.set(s * 0.2, 0.3, 0); ear.userData.s = s; head.add(ear); ears.push(ear);
    const eye = catEye(0x58d36a); eye.position.set(s * 0.13, 0.05, 0.3); head.add(eye); eyes.push(eye); // olhos verdes (com pupila preta, como todos os gatos)
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: 0xc46a7c })); nose.position.set(0, -0.04, 0.33); head.add(nose);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4a0e18 })); mouth.scale.set(1.2, 0.7, 0.8); mouth.position.set(0, -0.13, 0.27); mouth.visible = false; head.add(mouth);
  const fangs = [];
  [-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 5), new THREE.MeshBasicMaterial({ color: 0xfffaf2 })); f.position.set(s * 0.05, -0.09, 0.33); f.rotation.x = Math.PI; f.visible = false; head.add(f); fangs.push(f); });

  // Rabo curto, só um "C" que sai da garupa e se enrola de lado (antes era uma volta quase inteira, que parecia uma rosquinha-base).
  // É um pedaço de rosquinha (TorusGeometry: o 5º número é QUANTO da volta existe, em radianos). Como o arco é aberto, tampamos as duas pontas com bolinhas.
  const tail = new THREE.Group(); tail.position.set(0, 0.1, -0.02); body.add(tail);
  const TAIL_R = 0.5, TAIL_LEN = 2.0, arc = new THREE.Mesh(new THREE.TorusGeometry(TAIL_R, 0.075, 8, 16, TAIL_LEN), fur); arc.rotation.x = Math.PI / 2; arc.rotation.z = 4.35; tail.add(arc);
  [0, TAIL_LEN].forEach((a, i) => { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075 * (i ? 0.85 : 1), 8, 6), fur); cap.position.set(Math.cos(a) * TAIL_R, Math.sin(a) * TAIL_R, 0); arc.add(cap); });

  // "grrrr…": um balãozinho de texto que aparece quando ela rosna
  const gr = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 96, (x, w, h) => {
    x.font = 'italic 800 54px Syne, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 8; x.strokeStyle = '#1a0e22'; x.strokeText('grrrr…', w / 2, h / 2); x.fillStyle = '#ff9a5c'; x.fillText('grrrr…', w / 2, h / 2);
  }), transparent: true, opacity: 0, depthTest: false }));
  gr.scale.set(1.9, 0.72, 1); gr.renderOrder = 11; gr.position.set(1.15, 2.2, 0.3); cat.add(gr); // ao lado da etiqueta, para não cobrir o nome

  const label = makeLabel('Mel', 0x58d36a, 0.55); label.position.y = 2.7; cat.add(label); catLabels.push([label, cat]);
  Object.assign(yardCats, { mel: { pivot, turn, cat, body, head, ears, eyes, mouth, fangs, tail, gr, g: 0, growl: false, yaw: 0.3 } });
}

// ================= OS FILHOTES =================
// Três irmãos pretos de olhos verdes. Sorteio de funções (um ataca o próximo, formando um ciclo):
//   Bangula dá tapinhas na cara do Ônix > Ônix morde o rabo do Cat Noir > Cat Noir morde o Bangula > ...
function buildKitten(name, color) {
  const k = buildCat(0x2a2233, null, { eye: 0x58d36a }); // pelo preto (um pouquinho arroxeado para a luz não "apagar" o gato) e olhos verdes
  const { body, head, tail } = k.userData;
  k.scale.setScalar(0.86);                                  // filhote: menor que os adultos...
  k.rotation.order = 'YXZ';                                 // gira primeiro de lado (y) e depois inclina (x): é a ordem certa para pular e rolar
  head.scale.setScalar(1.25); head.position.y += 0.04;      // ...com a cabeça grande demais para o corpo (a cara de filhote)
  body.children[1].visible = false;                         // a pata da frente da esquerda e a da direita viram "braços" que mexem
  body.children[2].visible = false;
  const mat = body.children[0].material, arms = [];
  [-1, 1].forEach(s => {
    const arm = new THREE.Group(); arm.position.set(s * 0.22, 0.42, 0.4); body.add(arm);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), mat); leg.position.y = -0.2; arm.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat); paw.position.y = -0.41; arm.add(paw);
    arms.push(arm);
  });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0x5a1020 })); mouth.scale.set(1.1, 0.7, 0.8); mouth.position.set(0, -0.13, 0.27); mouth.visible = false; head.add(mouth);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0xc46a7c })); nose.position.set(0, -0.03, 0.33); head.add(nose);
  // pelo preto-arroxeado com um "brilho próprio" (emissive) leve: sem ele o gato preto vira uma mancha e não se enxerga o movimento
  body.children.forEach(m => { if (m.isMesh && m.material && m.material.emissive) m.material.emissive.setHex(0x1f1736); });
  head.children.forEach(m => { if (m.isMesh && m.material && m.material.emissive && m.material.color.getHex() === 0x2a2233) m.material.emissive.setHex(0x1f1736); });
  const hind = [body.children[3], body.children[4]]; // patas de trás (para chutar quando está de barriga para cima)
  return { g: k, body, head, tail, arms, hind, mouth, name, color };
}

function buildKittens(parent) {
  const K = new THREE.Group(); K.position.set(YARD_ARENA.x, 0, YARD_ARENA.z); parent.add(K);
  // Posições e direções do olhar (yaw) no cluster; o centro do trio fica na origem para o grupo poder girar sem "voar"
  const defs = [['Bangula', 0xb79af5, -0.4, 0.0, 1.95], ['Ônix', 0x37d0c0, 0.75, 0.15, Math.PI], ['Cat Noir', 0xf2b84b, 0.15, -0.85, -1.265]];
  const cx = defs.reduce((a, d) => a + d[2], 0) / 3, cz = defs.reduce((a, d) => a + d[3], 0) / 3;
  defs.forEach(([name, col, x, z, yaw], i) => {
    const kt = buildKitten(name, col);
    kt.x = (x - cx) * 1.45; kt.z = (z - cz) * 1.45; kt.yaw = yaw; kt.yawCur = yaw; // 1.45: espaço para pular uns nos outros sem se sobrepor
    kt.hx = kt.x; kt.hz = kt.z; // "casa" de cada um: de onde sai e para onde volta depois de cada ato
    kt.g.position.set(kt.x, 0, kt.z); kt.g.rotation.y = yaw; K.add(kt.g);
    const label = makeLabel(name, col, 0.7); label.position.y = 2.3 + i * 0.8; kt.g.add(label); catLabels.push([label, kt.g]); // etiquetas em alturas diferentes para não se sobrepor
    yardCats.kittens.push(kt);
  });
  yardCats.K = K;
  // "estrelinhas de impacto" (aparecem na hora do bote e da rolada) e "poeirinha": 4 sprites criados uma vez e reaproveitados
  const starTex = canvasTex(128, 128, x => { x.translate(64, 64); x.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 24 : 58, a = i * Math.PI / 8; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(r, 0); } x.closePath(); x.fillStyle = '#fff2a8'; x.fill(); x.lineWidth = 8; x.lineJoin = 'round'; x.strokeStyle = '#ff7a3c'; x.stroke(); });
  yardCats.puffs = [];
  for (let i = 0; i < 4; i++) { const sp = i % 2 ? glowSprite(0xffffff, 1.6, 0.55) : new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthTest: false })); sp.renderOrder = 11; sp.visible = false; K.add(sp); yardCats.puffs.push({ s: sp, life: 1, star: !(i % 2) }); }
  yardCats.lastP = 0;
}

function buildYardCats(g, H, rise, half) { buildMel(H, rise, half); buildKittens(g); }

// ================= ANIMAÇÃO (todo quadro) =================
function updateYardCats(now, dt) {
  const Y = yardCats; if (!Y.mel) return;
  dt = Math.min(dt || 0.016, 0.05);

  // ----- Mel: observa de longe; rosna se um gato chegar perto -----
  const m = Y.mel;
  m.cat.getWorldPosition(_yw);
  let near = null, nd = 1e9;
  [kiara, maria, pondLife.ze].forEach(c => { if (!c) return; const d = Math.hypot(c.position.x - _yw.x, c.position.z - _yw.z); if (d < nd) { nd = d; near = c; } });
  if (nd < 11) m.growl = true; else if (nd > 13.5) m.growl = false; // dois limites diferentes (histerese): ela não fica ligando e desligando na beirada
  m.g += ((m.growl ? 1 : 0) - m.g) * Math.min(1, dt * 4.5);
  const g = m.g;
  // para onde olhar: calma = varre o quintal devagar; rosnando = vira o corpo para o gato
  let yawWant = 0.3 + Math.sin(now * 0.17) * 0.28;
  if (m.growl && near) {
    _yw.set(near.position.x, 0, near.position.z); m.pivot.worldToLocal(_yw);
    yawWant = Math.max(-2.4, Math.min(2.4, Math.atan2(_yw.x, _yw.z)));
  }
  m.yaw += wrapA(yawWant - m.yaw) * Math.min(1, dt * (m.growl ? 5 : 1.2));
  m.turn.rotation.y = m.yaw;
  m.head.rotation.y = (1 - g) * (Math.sin(now * 0.55) * 0.5 + Math.sin(now * 1.3) * 0.08);
  m.head.rotation.x = 0.02 * Math.sin(now * 0.9) * (1 - g) + 0.3 * g;            // rosnando: abaixa a cabeça
  m.ears.forEach(e => { e.rotation.z = -e.userData.s * (0.15 + 1.0 * g); e.rotation.x = 0.7 * g; }); // orelhas viram "asa de avião" para trás
  const blink = (now % 4.6) < 0.13 && g < 0.2 ? 0.12 : 1 + 0.15 * g;
  m.eyes.forEach(e => e.scale.y += (blink - e.scale.y) * 0.5);                      // pisca de vez em quando (e arregala quando rosna)
  m.mouth.visible = g > 0.45; m.fangs.forEach(f => { f.visible = g > 0.45; });
  m.mouth.scale.y = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(now * 22));
  m.body.position.x = Math.sin(now * 58) * 0.012 * g;                              // tremor do rosnado
  m.body.scale.setScalar(1 + Math.sin(now * 1.6) * 0.012 + 0.06 * g);              // respira (e arrepia o pelo quando rosna)
  m.tail.rotation.y = Math.sin(now * (1.1 + 9 * g)) * (0.07 + 0.22 * g);
  m.gr.material.opacity = SQ((g - 0.3) * 1.7); m.gr.position.y = 2.2 + Math.sin(now * 17) * 0.025 * g;
  const sc = 1 + 0.08 * Math.sin(now * 17); m.gr.scale.set(1.9 * sc, 0.72 * sc, 1);

  updateKittens(now, dt);
}

// ================= A BRINCADEIRA DOS FILHOTES =================
// Ciclo de 7,8 s = três atos. No ato n: o filhote n ataca o n+1 (vítima) e o n+2 assiste (plateia). Fases do ato (p de 0 a 1):
//   0,00-0,20  o atacante AGACHA, balança o bumbum e chicoteia o rabo; a vítima fica de olho
//   0,20-0,42  o atacante PULA em arco até a vítima (patinhas esticadas)
//   0,42-0,50  BATEU: estrelinha de impacto, a vítima é empurrada e ROLA de barriga para cima
//   0,50-0,82  LUTINHA: a vítima, de barriga para cima, chuta com as patas de trás e empurra com as da frente; o atacante a "morde" (cabeça balançando)
//   0,82-1,00  a vítima rola de volta, o atacante volta saltitando para o seu lugar. Todos terminam EXATAMENTE onde começaram, então o próximo ato emenda sem pulo.
// Conceito: smoothstep ss(a, b, v) = sobe suave de 0 a 1 entre a e b; dá a "troca de fase" sem tranco. E o rolamento é uma rotação em torno do CENTRO do
// corpo (não dos pés): por isso a posição do corpo é corrigida junto com o ângulo (veja "roll" abaixo).
const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function kittenPuff(x, y, z, star) {
  const q = yardCats.puffs.find(o => o.life >= 1 && o.star === star) || yardCats.puffs.find(o => o.life >= 1); if (!q) return;
  q.life = 0; q.s.visible = true; q.s.position.set(x, y, z);
}
function updateKittens(now, dt) {
  const Y = yardCats, ks = Y.kittens, T = 7.8, seg = T / 3, ta = now % T, act = Math.floor(ta / seg), p = (ta - act * seg) / seg;
  const att = ks[act], vic = ks[(act + 1) % 3], wat = ks[(act + 2) % 3];
  const dx = vic.hx - att.hx, dz = vic.hz - att.hz, dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl; // direção atacante > vítima
  const Lx = vic.hx - ux * 0.55, Lz = vic.hz - uz * 0.55;                                                       // onde o atacante cai: logo antes da vítima
  if (Y.lastP < 0.42 && p >= 0.42) kittenPuff(vic.hx, 0.7, vic.hz, true);                                          // impacto
  if (Y.lastP < 0.52 && p >= 0.52) kittenPuff(vic.hx + ux * 0.2, 0.25, vic.hz + uz * 0.2, false);                  // poeirinha da rolada
  Y.lastP = p;
  ks.forEach((kt, i) => {
    // pose-base: brincando de leve (balança um pouquinho, rabo mexendo)
    const P = { x: kt.hx + Math.sin(now * 0.9 + i * 2) * 0.02, z: kt.hz + Math.cos(now * 0.7 + i) * 0.02, y: 0, yaw: kt.yaw, pitch: 0, roll: 0, crouch: 0, hX: 0, hY: 0, aL: 0, aR: 0, hind: 0, mouth: false, tailA: 0.35, tailF: 4 + i };
    const faceTo = (tx, tz) => Math.atan2(tx - P.x, tz - P.z);
    if (kt === att) {
      if (p < 0.2) { // agacha e balança o bumbum
        const c = ss(0, 0.1, p); P.crouch = c; P.yaw = faceTo(vic.hx, vic.hz); P.hX = -0.25 * c; P.x += Math.sin(now * 36) * 0.025 * c; P.tailA = 0.9; P.tailF = 18; P.aL = P.aR = -0.3 * c;
      } else if (p < 0.42) { // pula em arco
        const u = (p - 0.2) / 0.22; P.x = kt.hx + (Lx - kt.hx) * u; P.z = kt.hz + (Lz - kt.hz) * u; P.y = 4 * 0.6 * u * (1 - u); P.yaw = faceTo(vic.hx, vic.hz);
        P.pitch = -0.55 + 1.0 * u; P.aL = P.aR = -1.35; P.hX = -0.2; P.tailA = 0.3; P.tailF = 6;
      } else if (p < 0.82) { // lutinha: em cima da vítima, mordiscando
        P.x = Lx + Math.sin(now * 13) * 0.05; P.z = Lz + Math.cos(now * 11) * 0.05; P.y = Math.abs(Math.sin(now * 9)) * 0.06; P.yaw = faceTo(vic.hx, vic.hz) + Math.sin(now * 8) * 0.25;
        P.pitch = 0.3 + Math.sin(now * 18) * 0.08; P.hX = 0.35; P.hY = Math.sin(now * 14) * 0.4; P.mouth = true; P.aL = -1.0 + Math.sin(now * 20) * 0.3; P.aR = -1.0 - Math.sin(now * 20) * 0.3; P.roll = Math.sin(now * 11) * 0.14; P.tailA = 0.8; P.tailF = 14;
      } else { // volta saltitando
        const u = ss(0.82, 1, p); P.x = Lx + (kt.hx - Lx) * u; P.z = Lz + (kt.hz - Lz) * u; P.y = 0.16 * Math.sin(Math.PI * u) * Math.abs(Math.sin(now * 14)); P.yaw = faceTo(kt.hx, kt.hz) + (1 - u) * 0.0;
        P.pitch = 0.1 * (1 - u); P.tailA = 0.5; P.tailF = 9;
      }
    } else if (kt === vic) {
      const push = ss(0.4, 0.5, p) * (1 - ss(0.82, 1, p)); // empurrão (volta a zero no fim)
      P.x = kt.hx + ux * 0.2 * push; P.z = kt.hz + uz * 0.2 * push; P.yaw = faceTo(att.hx, att.hz); P.hY = 0;
      if (p < 0.4) { const w = ss(0.12, 0.4, p); P.crouch = 0.3 * w; P.hX = -0.2; P.tailA = 0.7; P.tailF = 12; P.x -= ux * 0.06 * w; P.z -= uz * 0.06 * w; }  // se prepara, "recuando" um tiquinho
      else {
        const roll = 2.75 * ss(0.4, 0.5, p) * (1 - ss(0.8, 0.92, p)); P.roll = roll; P.y = 0.14 * Math.sin(Math.PI * Math.min(1, ss(0.4, 0.5, p) * 1.0)) * (p < 0.5 ? 1 : 0);
        const belly = ss(0.48, 0.55, p) * (1 - ss(0.78, 0.84, p)); // 1 = de barriga para cima, brigando
        P.hind = Math.sin(now * 32) * 0.95 * belly; P.aL = (-1.4 + Math.sin(now * 21) * 0.55) * belly; P.aR = (-1.4 - Math.sin(now * 21) * 0.55) * belly;
        P.hX = -0.3 * belly + Math.sin(now * 9) * 0.2 * belly; P.hY = Math.sin(now * 12) * 0.5 * belly; P.mouth = belly > 0.5;
        P.x += -uz * Math.sin(now * 15) * 0.04 * belly; P.z += ux * Math.sin(now * 15) * 0.04 * belly; P.tailA = 0.7; P.tailF = 14;
        if (p > 0.9) P.y = 0.1 * Math.abs(Math.sin(now * 16)) * (1 - ss(0.9, 1, p)); // levanta saltitando
      }
    } else { // plateia: vira a cabeça para a ação, balança o bumbum de ansiedade e pula de empolgação na hora da lutinha
      P.yaw = faceTo((att.hx + vic.hx) / 2, (att.hz + vic.hz) / 2);
      const a = 0, into = ss(0.15, 0.3, p) * (1 - ss(0.85, 1, p));
      P.crouch = 0.2 * into; P.hX = -0.1; P.hY = Math.max(-0.7, Math.min(0.7, (p < 0.42 ? -1 : 1) * 0.5 * Math.sin(p * 6.3))); P.tailA = 0.6 + 0.4 * into; P.tailF = 8 + 8 * into; P.x += Math.sin(now * 30) * 0.015 * into;
      if (p > 0.45 && p < 0.85) P.y = Math.abs(Math.sin(now * 9 + i)) * 0.07; P.mouth = false; P.aL = P.aR = -0.2 * into + a;
    }
    // aplicar a pose
    kt.yawCur += wrapA(P.yaw - kt.yawCur) * Math.min(1, dt * 11);
    kt.g.position.set(P.x, P.y, P.z); kt.g.rotation.set(P.pitch, kt.yawCur, 0);
    const r = P.roll, c = P.crouch;
    kt.body.rotation.z = r;
    kt.body.position.set(0.45 * Math.sin(r), 0.45 - 0.45 * Math.cos(r) - 0.1 * Math.sin(r / 2), 0); // girar em torno do CENTRO do corpo (0,45 de altura), e não dos pés
    kt.body.scale.set(1 + 0.05 * c, 1 - 0.16 * c, 1 + 0.05 * c);
    kt.head.rotation.x = P.hX; kt.head.rotation.y = P.hY;
    kt.arms[0].rotation.x = P.aL; kt.arms[1].rotation.x = P.aR; kt.hind[0].rotation.x = P.hind; kt.hind[1].rotation.x = -P.hind;
    kt.mouth.visible = P.mouth; if (P.mouth) kt.mouth.scale.y = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now * 16));
    kt.tail.rotation.z = Math.sin(now * P.tailF + i) * P.tailA;
  });
  Y.puffs.forEach(q => { // as estrelinhas crescem, sobem e somem
    if (q.life >= 1) return;
    q.life = Math.min(1, q.life + dt / 0.6); const k = q.life; q.s.material.opacity = (q.star ? 1 : 0.55) * (1 - k * k); const sc = (q.star ? 0.5 + k * 1.2 : 0.8 + k * 1.6); q.s.scale.set(sc, sc, 1); q.s.position.y += dt * 0.5;
    if (q.life >= 1) q.s.visible = false;
  });
}
