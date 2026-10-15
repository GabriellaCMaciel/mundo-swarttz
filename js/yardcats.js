// Os gatos da casa da zona Cartas: a Mel, sentada no telhado, e os três filhotes (Bangula, Ônix e Cat Noir) brincando de lutinha.
// Conceitos para estudar neste arquivo:
//  - HIERARQUIA DE GRUPOS: a Mel está dentro de um grupo inclinado (que acompanha a água do telhado), dentro do grupo da casa,
//    dentro do grupo da zona. Cada pai move e gira os filhos junto, e getWorldPosition() descobre onde ela está no mundo inteiro.
//  - MÁQUINA DE ESTADOS COM SUAVIZAÇÃO: a Mel tem dois humores (calma / rosnando). Em vez de trocar de uma vez, uma variável
//    "g" (0 a 1) caminha devagar até o valor desejado, e todas as poses (orelhas, cabeça, tremor) são calculadas a partir dela.
//  - ANIMAÇÃO POR CICLO: os filhotes seguem um ciclo de 6,4 s. Em cada trecho um deles "ataca" e outro "reage" (veja act()).
'use strict';

const yardCats = { mel: null, kittens: [], K: null };
const _yw = new THREE.Vector3();
const SQ = x => Math.max(0, Math.min(1, x));

// Manchas de pelo: bolinhas achatadas coladas na superfície de um elipsoide, todas desenhadas numa única chamada (instanced)
function furPatches(center, radii, n, colors, rnd, size = 1, skipBelow = -0.6) {
  const items = [], d = new THREE.Object3D(), nrm = new THREE.Vector3();
  while (items.length < n) {
    const u = rnd() * 2 - 1, a = rnd() * 6.283, s = Math.sqrt(1 - u * u);
    const ux = Math.cos(a) * s, uy = u, uz = Math.sin(a) * s;
    if (uy < skipBelow) continue; // nada na barriga/embaixo
    d.position.set(center[0] + ux * radii[0] * 1.01, center[1] + uy * radii[1] * 1.01, center[2] + uz * radii[2] * 1.01);
    nrm.set(ux / radii[0], uy / radii[1], uz / radii[2]).normalize();
    d.lookAt(d.position.x + nrm.x, d.position.y + nrm.y, d.position.z + nrm.z); // vira a mancha para fora do corpo
    const r = (0.07 + rnd() * 0.11) * size;
    items.push({ x: d.position.x, y: d.position.y, z: d.position.z, sx: r * (0.8 + rnd() * 0.7), sy: r * (0.8 + rnd() * 0.7), sz: r * 0.35, rx: d.rotation.x, ry: d.rotation.y, rz: d.rotation.z, c: colors[(rnd() * colors.length) | 0] });
  }
  return instanced(new THREE.SphereGeometry(1, 8, 6), lam(0xffffff), items);
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

  const fur = lam(0x2b2023);
  const ell = (r, sx, sy, sz, x, y, z, parent, m = fur) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); parent.add(o); return o; };
  ell(0.5, 0.82, 1.08, 0.8, 0, 0.62, 0, body);                         // tronco (um elipsoide em pé: ela está sentada)
  [-1, 1].forEach(s => {
    ell(0.32, 0.9, 0.85, 1.2, s * 0.3, 0.28, -0.08, body);             // as ancas
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.6, 8), fur); leg.position.set(s * 0.16, 0.3, 0.3); body.add(leg); // patas da frente
    ell(0.1, 1, 0.6, 1.4, s * 0.16, 0.05, 0.36, body);                  // patinhas
  });
  const patchCols = [0xa95a1d, 0xa95a1d, 0xeadfca, 0x0d080a, 0x0d080a, 0x0d080a, 0x0d080a, 0x0d080a]; // laranja, branco e preto (o preto repete bastante: o escuro tem que mandar)
  body.add(furPatches([0, 0.62, 0], [0.5 * 0.82, 0.5 * 1.08, 0.5 * 0.8], 34, patchCols, rnd));
  [-1, 1].forEach(s => body.add(furPatches([s * 0.3, 0.28, -0.08], [0.32 * 0.9, 0.32 * 0.85, 0.32 * 1.2], 9, patchCols, rnd, 1)));
  ell(0.2, 1, 1.3, 0.5, 0.0, 0.7, 0.37, body, lam(0xeadfca)).scale.set(0.5, 0.7, 0.28); // um peitinho branco mal misturado

  const head = new THREE.Group(); head.position.set(0, 1.42, 0.12); body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), fur));
  head.add(furPatches([0, 0, 0], [0.34, 0.34, 0.34], 8, patchCols, rnd, 0.55, -0.2));
  const ears = [], eyes = [];
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 4), fur); ear.position.set(s * 0.2, 0.3, 0); ear.userData.s = s; head.add(ear); ears.push(ear);
    const eye = catEye(0x58d36a); eye.position.set(s * 0.13, 0.05, 0.3); head.add(eye); eyes.push(eye); // olhos verdes (com pupila preta, como todos os gatos)
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: 0xc46a7c })); nose.position.set(0, -0.04, 0.33); head.add(nose);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4a0e18 })); mouth.scale.set(1.2, 0.7, 0.8); mouth.position.set(0, -0.13, 0.27); mouth.visible = false; head.add(mouth);
  const fangs = [];
  [-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 5), new THREE.MeshBasicMaterial({ color: 0xfffaf2 })); f.position.set(s * 0.05, -0.09, 0.33); f.rotation.x = Math.PI; f.visible = false; head.add(f); fangs.push(f); });

  // Rabo enrolado em volta das patas (um pedaço de rosquinha deitado)
  const tail = new THREE.Group(); tail.position.set(0, 0.1, -0.02); body.add(tail);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.075, 8, 22, 3.9), fur); arc.rotation.x = Math.PI / 2; arc.rotation.z = 0.5; tail.add(arc);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), lam(0x0d080a)); tip.position.set(Math.cos(0.5 + 3.9) * 0.5, 0, -Math.sin(0.5 + 3.9) * 0.5); tail.add(tip);

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
  k.scale.setScalar(0.78);                                  // filhote: menor que os adultos...
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
  return { g: k, body, head, tail, arms, mouth, name, color };
}

function buildKittens(parent) {
  const K = new THREE.Group(); K.position.set(YARD_ARENA.x, 0, YARD_ARENA.z); parent.add(K);
  // Posições e direções do olhar (yaw) no cluster; o centro do trio fica na origem para o grupo poder girar sem "voar"
  const defs = [['Bangula', 0xb79af5, -0.4, 0.0, 1.95], ['Ônix', 0x37d0c0, 0.75, 0.15, Math.PI], ['Cat Noir', 0xf2b84b, 0.15, -0.85, -1.265]];
  const cx = defs.reduce((a, d) => a + d[2], 0) / 3, cz = defs.reduce((a, d) => a + d[3], 0) / 3;
  defs.forEach(([name, col, x, z, yaw], i) => {
    const kt = buildKitten(name, col);
    kt.x = (x - cx) * 1.2; kt.z = (z - cz) * 1.2; kt.yaw = yaw; // 1.2: os filhotes ficaram maiores, então se afastam um pouco
    kt.g.position.set(kt.x, 0, kt.z); kt.g.rotation.y = yaw; K.add(kt.g);
    const label = makeLabel(name, col, 0.7); label.position.y = 2.3 + i * 0.8; kt.g.add(label); catLabels.push([label, kt.g]); // etiquetas em alturas diferentes para não se sobrepor
    yardCats.kittens.push(kt);
  });
  yardCats.K = K;
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

  // ----- Filhotes: um ciclo de lutinha de 6,4 s -----
  const K = Y.K, T = 6.4, tm = now % T;
  K.rotation.y = Math.sin(now * 0.45) * 0.3;                                       // o trio gira devagar, como quem rola no chão
  const win = (s, d) => { const p = (tm - s) / d; return p < 0 || p > 1 ? 0 : Math.pow(Math.sin(Math.PI * p), 0.6); }; // sobe e desce suave dentro da janela [s, s+d]
  const hop = (a, f) => Math.abs(Math.sin(now * f)) * a;
  const [A, B, C] = Y.kittens;
  const base = i => 0.28 * (0.5 + 0.5 * Math.sin(now * 2.1 + i * 2.2));            // sempre se mexendo um pouquinho
  const aA = Math.max(base(0), win(0.0, 2.0)), aB = Math.max(base(1), win(2.1, 2.0)), aC = Math.max(base(2), win(4.2, 2.0));
  const place = (kt, lunge, up, jitter) => { // posição = lugar base + avanço na direção do olhar
    const yaw = kt.yaw + Math.sin(now * 3 + kt.x * 5) * jitter;
    kt.g.rotation.y = yaw;
    kt.g.position.set(kt.x + Math.sin(yaw) * lunge, up, kt.z + Math.cos(yaw) * lunge);
  };
  const chomp = (kt, a) => { kt.mouth.visible = a > 0.3; kt.mouth.scale.y = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now * 16)); };

  // Bangula: tapinhas rápidos na cara do Ônix (patinha da frente indo e voltando)
  place(A, 0.38 * aA, hop(0.07, 13) * aC, 0.1);
  const slap = 0.5 + 0.5 * Math.sin(now * 19);
  A.arms[1].rotation.x = -(0.35 + 1.25 * slap) * aA; A.arms[0].rotation.x = -0.3 * aA * (1 - slap);
  A.head.rotation.x = 0.12 * aA; A.head.rotation.y = Math.sin(now * 5) * 0.12; A.mouth.visible = false;
  A.body.rotation.z = Math.sin(now * 14) * 0.15 * aC;                               // sacode quando o Cat Noir morde
  // Ônix: leva os tapinhas (a cabeça balança) e morde o rabo do Cat Noir
  place(B, 0.48 * aB, hop(0.08, 11) * aA, 0.12);
  B.head.rotation.x = 0.5 * aB + Math.sin(now * 15) * 0.08 * aB;
  B.head.rotation.y = Math.sin(now * 19) * 0.32 * aA;
  B.arms[0].rotation.x = -0.9 * aB; B.arms[1].rotation.x = -0.9 * aB;              // abraça o rabo com as duas patinhas
  chomp(B, aB);
  B.body.rotation.z = Math.sin(now * 12) * 0.1;
  // Cat Noir: morde o Bangula e sacode o rabo quando é mordido
  place(C, 0.5 * aC, hop(0.09, 12) * aB, 0.1);
  C.head.rotation.x = 0.45 * aC + Math.sin(now * 14) * 0.07 * aC; C.head.rotation.y = Math.sin(now * 4) * 0.1;
  C.arms[0].rotation.x = -0.6 * aC; C.arms[1].rotation.x = -0.4 * aC;
  chomp(C, aC);
  [A, B, C].forEach((kt, i) => { kt.tail.rotation.z = Math.sin(now * (5 + i) + i) * (0.3 + 0.6 * [aC, aA, aB][i]); }); // o rabo chicoteia mais em quem acabou de ser atacado
}
