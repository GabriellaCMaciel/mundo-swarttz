// A zona Cartas em 3D: a caixa de correio rosa (onde chegam as cartas de depoimento), a casinha da Gabriella e o quintal
// cercado, onde moram a Mel (no telhado) e os três filhotes (js/yardcats.js). A tela das cartas em si está em mail.js.
// Inspirada nas fotos de referência: caixa rosa com tampa arredondada e prateleira de madeira, cartas saindo pela
// fresta, envelope e pétalas na prateleira, roseiras em volta e uma bandeirinha levantada (carta nova!).
//
// COMO ESTÁ ORGANIZADO: tudo aqui dentro usa as coordenadas do GRUPO da zona. A origem (0,0,0) é o pé da caixa de correio
// e o grupo inteiro é girado em CARTAS.rot (em zones.js). É assim que a casa fica inclinada, e não de frente para a câmera:
// em vez de girar cada peça, giramos o "palco" todo de uma vez (um grupo pai gira todos os filhos junto).
'use strict';

const mailbox = { flag: null, glow: null, smoke: [], smokeBase: null };
const CARTAS = { x: -46, z: 16, rot: 0.62 };               // onde a caixa fica no mundo e o quanto o palco é girado (radianos)
const YARD = { x0: -17, x1: 5, zf: -3.2, zb: -26.2, gx: -3, gw: 3 }; // o quintal cercado (frente = zf, fundo = zb); gx/gw = centro e largura do portão
const YARD_ARENA = { x: -11.5, z: -8.2 };                  // o cantinho da frente da casa onde os três filhotes brincam
const HOUSE = { x: -6, z: -16.6, s: 1.25 };                // a casa: posição e ampliação (1.25 = 25% maior que o desenho original)
const ROSES = [0xf6c4cf, 0xf4a6b8, 0xfff1e6, 0xf7d2b8, 0xf2909f, 0xe98aa5];
{ // centro e raio do quintal em coordenadas do MUNDO (decor.js usa para não plantar árvores em cima dele)
  const lx = (YARD.x0 + YARD.x1) / 2, lz = (YARD.zf + YARD.zb) / 2, c = Math.cos(CARTAS.rot), s = Math.sin(CARTAS.rot);
  YARD.cx = CARTAS.x + lx * c + lz * s; YARD.cz = CARTAS.z - lx * s + lz * c;
  YARD.r = Math.hypot(YARD.x1 - YARD.x0, YARD.zf - YARD.zb) / 2 + 2;
}
// Converte um ponto da casa (desenhada em tamanho original) para o grupo da zona, já com a ampliação
const hp = (x, y, z) => [HOUSE.x + x * HOUSE.s, y * HOUSE.s, HOUSE.z + z * HOUSE.s];

function mailboxTex() { // a porta da caixa: rosa descascado com "CARTAS" em relevo
  return canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#e59db5'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { x.fillStyle = 'rgba(205,190,178,' + (0.12 + Math.random() * 0.2) + ')'; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 7, 1 + Math.random() * 4, Math.random() * 3, 0, 6.3); x.fill(); } // tinta descascada
    x.strokeStyle = 'rgba(160,90,110,0.5)'; x.lineWidth = 5; x.strokeRect(14, 14, w - 28, h - 28);
    // O texto agora é MEDIDO: a fonte encolhe até a palavra caber dentro da moldura, com folga dos dois lados
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '800 100px Syne, serif';
    const size = Math.min(100, 100 * (w - 140) / x.measureText('CARTAS').width);
    x.font = '800 ' + size + 'px Syne, serif';
    x.fillStyle = 'rgba(255,240,244,0.9)'; x.fillText('CARTAS', w / 2 + 2, h / 2 + 3); // luz do relevo (embaixo)
    x.fillStyle = '#9c3f5f'; x.fillText('CARTAS', w / 2, h / 2);                          // a letra em si: rosa escuro, para dar leitura
  });
}
function envelopeTex() { // o envelope esquecido na prateleira
  return canvasTex(256, 170, (x, w, h) => {
    x.fillStyle = '#f1dfc0'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(150,115,80,0.6)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(w / 2, h * 0.58); x.lineTo(w, 0); x.moveTo(0, h); x.lineTo(w * 0.42, h * 0.5); x.moveTo(w, h); x.lineTo(w * 0.58, h * 0.5); x.stroke();
    x.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
}

function buildMailbox(g) {
  const rnd = mulberry32(31), veg = new VegBatch(rnd), lights = new Lights(), lampPos = [];
  const mk = (geo, color, x, y, z, parent) => { const m = new THREE.Mesh(geo, lam(color)); m.position.set(x, y, z); parent.add(m); return m; };
  const WHITE = 0xfff1f5, GOLD = 0xf2b84b;

  // ================= A CAIXA DE CORREIO (menor que antes: escala 1.15) =================
  const M = new THREE.Group(); M.scale.setScalar(1.15); g.add(M);
  bx(0.24, 1.55, 0.24, 0xc77a94, 0, 0.78, 0, M);                    // poste de madeira rosa
  bx(1.95, 0.1, 0.95, 0xc7b8aa, 0, 1.5, 0.35, M);                   // prateleira (madeira acinzentada)
  bx(0.14, 0.4, 0.8, 0xb8a899, -0.7, 1.3, 0.3, M); bx(0.14, 0.4, 0.8, 0xb8a899, 0.7, 1.3, 0.3, M); // suportes
  bx(1.5, 0.9, 1.1, 0xdc8aa4, 0, 2.02, 0, M);                       // corpo
  const arch = mk(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 22, 1, false, 0, Math.PI), 0xdc8aa4, 0, 2.47, 0, M); arch.rotation.z = Math.PI / 2; // tampa arredondada (meio cilindro deitado)
  bx(1.3, 0.05, 0.08, 0xd9889e, 0, 2.3, 0.56, M);                   // moldura da fresta
  bx(1.22, 0.15, 0.05, 0x1a0e22, 0, 2.2, 0.57, M);                  // fresta (escura)
  bx(1.34, 0.76, 0.05, 0xe69bb3, 0, 1.86, 0.56, M);                 // porta
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshLambertMaterial({ map: mailboxTex() })); door.position.set(0, 1.86, 0.6); M.add(door);
  mk(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 10), GOLD, 0, 2.08, 0.6, M).rotation.x = Math.PI / 2; // fechadura dourada
  // Cartas saindo pela fresta, uma em cada cor de papel
  [0xf6ecd9, 0xf1dfc0, 0xfbf3e6, 0xf3d9d6, 0xefe4cf].forEach((c, i) => {
    const l = mk(new THREE.BoxGeometry(0.95, 0.018, 0.62), c, -0.28 + i * 0.13, 2.21 + i * 0.012, 0.74 + (i % 2) * 0.05, M);
    l.rotation.set(-0.18 + i * 0.03, (i - 2) * 0.09, 0);
  });
  // Bandeirinha levantada ao lado: "tem carta nova!"
  const flag = new THREE.Group(); flag.position.set(0.8, 2.0, 0.1); M.add(flag); mailbox.flag = flag;
  mk(new THREE.BoxGeometry(0.06, 0.8, 0.05), 0xd9889e, 0, 0.4, 0, flag);
  mk(new THREE.BoxGeometry(0.4, 0.24, 0.04), GOLD, 0.2, 0.7, 0, flag);
  // Na prateleira: um envelope e pétalas; no chão, mais pétalas
  const env = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.53), new THREE.MeshLambertMaterial({ map: envelopeTex() })); env.rotation.set(-Math.PI / 2, 0, 0.35); env.position.set(-0.45, 1.56, 0.42); M.add(env);
  const petals = [];
  for (let i = 0; i < 9; i++) petals.push({ x: -0.8 + rnd() * 1.6, y: 1.57, z: 0.1 + rnd() * 0.65, sx: 0.09 + rnd() * 0.05, sy: 0.012, sz: 0.07, ry: rnd() * 3, c: ROSES[(rnd() * 6) | 0] });
  for (let i = 0; i < 14; i++) { const a = rnd() * 6.283, r = 0.8 + rnd() * 1.3; petals.push({ x: Math.cos(a) * r, y: 0.04, z: 0.3 + Math.sin(a) * r * 0.9, sx: 0.1 + rnd() * 0.06, sy: 0.012, sz: 0.07, ry: rnd() * 3, c: ROSES[(rnd() * 6) | 0] }); } // pétalas no chão (em coordenadas do M)
  M.add(instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), petals));
  // Brilho quente que chama a atenção para a fresta
  const glow = glowSprite(0xffd98a, 2.4, 0.55); glow.position.set(0, 2.25, 0.95); M.add(glow); mailbox.glow = glow;

  // ================= ROSEIRAS: arbustos com rosas grandes =================
  const roses = [];
  const roseBush = (x, y, z, r, n) => {
    veg.bush(x, y, z, r, 0, 0xffffff, [0x2f8f6b, 0x247a5a, 0x3aa17a][(rnd() * 3) | 0]);
    for (let i = 0; i < n; i++) {
      const u = 0.1 + rnd() * 0.9, ph = rnd() * 6.283, s = Math.sqrt(1 - u * u);
      roses.push({ x: x + Math.cos(ph) * s * r * 1.0, y: y + u * r * 0.78, z: z + Math.sin(ph) * s * r * 1.0, sx: 0.15 + rnd() * 0.11, c: ROSES[(rnd() * 6) | 0] });
    }
  };
  roseBush(-1.5, 0.4, -0.5, 0.8, 13); roseBush(1.6, 0.35, -0.6, 0.72, 11); roseBush(0.1, 3.45, -0.15, 0.45, 7); // a de cima "cresce" em cima da caixa
  roseBush(-2.5, 0.4, 0.5, 0.65, 8); roseBush(2.7, 0.38, 0.6, 0.6, 7);

  // ================= O QUINTAL: cerca branca completa em volta, com portão =================
  const { x0, x1, zf, zb, gx, gw } = YARD, STEP = 0.42;
  const gL = gx - gw / 2, gR = gx + gw / 2; // as duas "laterais" do portão
  const fenceX = (xa, xb, z) => { // um trecho de cerca ao longo de X: estacas + dois travessões
    for (let x = xa; x <= xb + 0.01; x += STEP) bx(0.14, 0.9, 0.07, WHITE, x, 0.45, z, g);
    bx(xb - xa, 0.08, 0.05, WHITE, (xa + xb) / 2, 0.32, z - 0.04, g); bx(xb - xa, 0.08, 0.05, WHITE, (xa + xb) / 2, 0.68, z - 0.04, g);
  };
  const fenceZ = (za, zb2, x) => { // um trecho de cerca ao longo de Z (os lados): as estacas ficam viradas para o outro lado
    for (let z = za; z >= zb2 - 0.01; z -= STEP) bx(0.07, 0.9, 0.14, WHITE, x, 0.45, z, g);
    bx(0.05, 0.08, za - zb2, WHITE, x - 0.04, 0.32, (za + zb2) / 2, g); bx(0.05, 0.08, za - zb2, WHITE, x - 0.04, 0.68, (za + zb2) / 2, g);
  };
  fenceX(x0, gL, zf); fenceX(gR, x1, zf);          // frente (com o vão do portão)
  fenceX(x0, x1, zb);                               // fundos
  fenceZ(zf, zb, x0); fenceZ(zf, zb, x1);           // lados: agora a cerca fecha o quintal inteiro
  [[x0, zf], [x1, zf], [x0, zb], [x1, zb]].forEach(([x, z]) => { bx(0.22, 1.15, 0.22, WHITE, x, 0.58, z, g); mk(new THREE.SphereGeometry(0.15, 8, 6), GOLD, x, 1.25, z, g); }); // moirões dos cantos
  // Portão: dois pilares mais altos com bolinha dourada, uma lanterninha e as duas folhas abertas para dentro
  [gL, gR].forEach(x => {
    bx(0.3, 1.7, 0.3, WHITE, x, 0.85, zf, g); mk(new THREE.SphereGeometry(0.2, 10, 8), GOLD, x, 1.85, zf, g);
    lampPos.push(x, 2.3, zf);
  });
  [[gL, 1, 1.15], [gR, -1, -1.15]].forEach(([hx, dir, open]) => {
    const leaf = new THREE.Group(); leaf.position.set(hx, 0, zf); leaf.rotation.y = open; g.add(leaf); // girar a folha em volta da dobradiça
    for (let k = 0.3; k < gw / 2 - 0.1; k += STEP) bx(0.14, 0.9, 0.07, WHITE, dir * k, 0.45, 0, leaf);
    bx(gw / 2 - 0.3, 0.08, 0.05, WHITE, dir * (gw / 4), 0.32, 0, leaf); bx(gw / 2 - 0.3, 0.08, 0.05, WHITE, dir * (gw / 4), 0.68, 0, leaf);
  });
  lights.swag({ x: gL, y: 1.95, z: zf }, { x: gR, y: 1.95, z: zf }, 0.45, 8); // arquinho de luzinhas sobre o portão
  for (let x = x0 + 0.6; x < gL - 0.3; x += 0.9) lights.add(x, 0.98, zf); // luzinhas no alto da cerca da frente
  for (let x = gR + 0.5; x < x1 - 0.2; x += 0.9) lights.add(x, 0.98, zf);

  // ================= A CASA (só decoração), ampliada e com telhado de duas águas =================
  const H = new THREE.Group(); H.position.set(HOUSE.x, 0, HOUSE.z); H.scale.setScalar(HOUSE.s); g.add(H);
  bx(7.5, 0.4, 5.5, 0xb9a89a, 0, 0.2, 0, H);                         // base de pedra
  bx(7, 3.6, 5, 0xf3e6cf, 0, 2.2, 0, H);                              // paredes cor de creme
  bx(7.3, 0.18, 5.3, GOLD, 0, 4.0, 0, H);                             // faixa dourada no topo das paredes
  // Telhado de duas águas: duas "lajes" inclinadas que se encontram na cumeeira + dois triângulos fechando as pontas.
  // A inclinação (phi) vem da trigonometria: tan(phi) = altura / metade da largura.
  const half = 2.9, rise = 2.4, phi = Math.atan2(rise, half), slab = Math.hypot(half, rise) + 0.2;
  [1, -1].forEach(s => { // s = +1 água da frente, -1 água de trás
    const r = bx(8, 0.22, slab, 0x8c3563, 0, 4.1 + rise / 2 + 0.05, s * half / 2, H); r.rotation.x = s * phi;
  });
  bx(8.2, 0.16, 0.36, GOLD, 0, 4.1 + rise + 0.18, 0, H);               // cumeeira dourada
  const gableShape = new THREE.Shape(); gableShape.moveTo(-2.7, 0); gableShape.lineTo(2.7, 0); gableShape.lineTo(0, rise + 0.12); gableShape.closePath();
  [1, -1].forEach(s => { // as duas empenas (o triângulo da parede lateral, embaixo do telhado)
    const t = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), new THREE.MeshLambertMaterial({ color: 0xf3e6cf, side: THREE.DoubleSide }));
    t.rotation.y = s * Math.PI / 2; t.position.set(s * 3.52, 4.0, 0); H.add(t);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 20), lam(GOLD)); ring.position.set(s * 3.56, 5.1, 0); ring.rotation.y = Math.PI / 2; H.add(ring); // janelinha redonda do sótão
    const pane = new THREE.Mesh(new THREE.CircleGeometry(0.4, 18), new THREE.MeshBasicMaterial({ color: 0xffd98a })); pane.position.set(s * 3.55, 5.1, 0); pane.rotation.y = s * Math.PI / 2; H.add(pane);
  });
  bx(0.75, 2.8, 0.75, 0xb97a6b, 2.1, 5.9, -1.1, H); bx(1.0, 0.18, 1.0, 0x8c5a4c, 2.1, 7.4, -1.1, H); // chaminé
  // Porta rosa com moldura dourada, degrau e lampião
  bx(1.5, 2.6, 0.12, GOLD, 0, 1.7, 2.52, H); bx(1.2, 2.35, 0.14, 0xff7eb6, 0, 1.58, 2.56, H);
  mk(new THREE.SphereGeometry(0.08, 8, 6), GOLD, 0.4, 1.5, 2.66, H);
  bx(2.6, 0.3, 1.0, 0xb9a89a, 0, 0.15, 3.0, H); bx(1.8, 0.22, 0.7, 0xc9b8aa, 0, 0.11, 3.7, H);
  bx(0.08, 0.8, 0.08, 0x3a2350, 1.25, 2.9, 2.62, H); mk(new THREE.BoxGeometry(0.28, 0.36, 0.28), 0xffd98a, 1.25, 2.45, 2.62, H).material = new THREE.MeshBasicMaterial({ color: 0xffd98a });
  // Janelas acesas, com venezianas verde-água e jardineiras com flores
  [-2.2, 2.2].forEach(wx => {
    bx(1.6, 1.5, 0.1, GOLD, wx, 2.5, 2.52, H);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.25), new THREE.MeshBasicMaterial({ color: 0xffd98a })); glass.position.set(wx, 2.5, 2.6); H.add(glass);
    bx(0.07, 1.25, 0.04, GOLD, wx, 2.5, 2.63, H); bx(1.35, 0.07, 0.04, GOLD, wx, 2.5, 2.63, H);
    bx(0.45, 1.5, 0.08, 0x37d0c0, wx - 1.05, 2.5, 2.56, H); bx(0.45, 1.5, 0.08, 0x37d0c0, wx + 1.05, 2.5, 2.56, H);
    bx(1.6, 0.3, 0.45, 0x8a5a3a, wx, 1.6, 2.8, H);
    const b1 = hp(wx, 1.9, 2.85), b2 = hp(wx - 0.5, 1.85, 2.85), b3 = hp(wx + 0.5, 1.85, 2.85);
    veg.bush(b1[0], b1[1], b1[2], 0.5, 14, ROSES[(rnd() * 6) | 0], 0x2f8f6b);
    veg.bush(b2[0], b2[1], b2[2], 0.36, 8, GOLD, 0x3aa17a); veg.bush(b3[0], b3[1], b3[2], 0.36, 8, 0xb79af5, 0x3aa17a);
    const wg = glowSprite(0xffc873, 5, 0.4); wg.position.set(wx, 2.5, 3.1); H.add(wg);
  });
  [-3.3, 3.3].forEach(x => { // rosas trepando nas paredes
    const a = hp(x, 1.5, 2.7), b = hp(x * 0.93, 3.1, 2.65);
    roseBush(a[0], a[1], a[2], 1.3, 17); roseBush(b[0], b[1], b[2], 0.8, 10);
  });
  { const a = hp(-1.1, 3.9, 2.7); roseBush(a[0], a[1], a[2], 0.6, 6); }
  // Fumaça da chaminé (brilhos pálidos que sobem e somem)
  mailbox.smokeBase = hp(2.1, 7.7, -1.1);
  for (let i = 0; i < 4; i++) { const s = glowSprite(0xd8cfe8, 1.8, 0.3); s.position.set(mailbox.smokeBase[0], mailbox.smokeBase[1], mailbox.smokeBase[2]); g.add(s); mailbox.smoke.push({ s, ph: i / 4 }); }

  // ================= CAMINHO, CANTEIROS, POSTES E LUZINHAS =================
  const doorX = HOUSE.x, doorZ = HOUSE.z + 2.5 * HOUSE.s + 2.0; // onde o caminho termina: no degrau da porta
  const stones = [];
  for (let i = 0; i < 10; i++) { // pedras do portão até a porta, numa curvinha suave
    const t = i / 9, x = gx + (doorX - gx) * t + Math.sin(t * Math.PI * 2) * 0.55, z = zf - 0.5 + (doorZ - (zf - 0.5)) * t;
    stones.push({ x, y: 0.04, z, sx: 0.58, sy: 0.05, sz: 0.46, ry: rnd() * 3, c: [0xb9a89a, 0xa89a8c, 0xc9b8aa][i % 3] });
  }
  for (let i = 0; i < 4; i++) stones.push({ x: gx + 1.4 + i * 0.5 - 0.5, y: 0.04, z: zf + 0.7 + i * 0.8, sx: 0.5, sy: 0.05, sz: 0.4, ry: rnd() * 3, c: [0xb9a89a, 0xa89a8c][i % 2] }); // do portão até a caixa de correio
  g.add(instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), stones));
  // Canteiros por dentro da cerca (a frente fica livre para os filhotes brincarem)
  const bed = (x, z) => veg.groundBush(x, z, 0.5 + rnd() * 0.4, 9, FLOWER_COLS[(rnd() * 6) | 0]);
  for (let x = x0 + 1.2; x < x1 - 0.8; x += 2.4) bed(x, zb + 0.9);
  for (let z = zb + 3; z < zf - 7; z += 2.4) { bed(x0 + 0.95, z); bed(x1 - 0.95, z); }
  for (let z = zf - 7; z < zf - 1; z += 2.6) { if (z < zf - 1.8) { veg.groundBush(x1 - 0.95, z, 0.4, 7, 0xf2b84b); veg.groundBush(x0 + 0.95, z, 0.4, 7, 0xb79af5); } }
  const tr = [[x0 + 2.6, zb + 2.6, 6.2, true], [x1 - 2.4, zb + 2.6, 5.6, false]]; // duas árvores nos cantos dos fundos, com luzinhas
  tr.forEach(([tx, tz, h, bl]) => {
    const cr = veg.tree(tx, tz, h, bl);
    for (let i = 0; i < 12; i++) { const u = rnd() * 6.283, v = rnd() * 3.14; lights.add(tx + Math.cos(u) * Math.sin(v) * cr * 1.05, h * 0.72 + Math.cos(v) * cr * 0.8, tz + Math.sin(u) * Math.sin(v) * cr * 1.05); }
  });
  veg.post(2.4, 1.1, 2.7); lampPos.push(2.4, 2.9, 1.1);
  veg.post(x0 + 1.5, zf - 6, 2.6); lampPos.push(x0 + 1.5, 2.8, zf - 6);
  veg.post(x1 - 1.5, zf - 6, 2.6); lampPos.push(x1 - 1.5, 2.8, zf - 6);
  lights.swag({ x: 2.4, y: 2.7, z: 1.1 }, { x: gR, y: 1.95, z: zf }, 0.5, 10);
  lights.swag({ x: 2.4, y: 2.7, z: 1.1 }, { x: 0, y: 3.5, z: 0 }, 0.5, 8);                      // do poste até a caixa
  const e1 = hp(-3.5, 3.95, 2.6), e2 = hp(3.5, 3.95, 2.6);
  lights.swag({ x: e1[0], y: e1[1], z: e1[2] }, { x: e2[0], y: e2[1], z: e2[2] }, 0.6, 24);       // fio no beiral da casa
  lights.swag({ x: x0 + 1.5, y: 2.6, z: zf - 6 }, { x: e1[0], y: e1[1], z: e1[2] }, 1.0, 14);
  lights.swag({ x: x1 - 1.5, y: 2.6, z: zf - 6 }, { x: e2[0], y: e2[1], z: e2[2] }, 1.0, 14);
  // Brinquedos dos filhotes: um novelo de lã rosa e uma bolinha dourada
  const yarn = mk(new THREE.SphereGeometry(0.28, 12, 10), 0xff7eb6, YARD_ARENA.x + 2.6, 0.28, YARD_ARENA.z + 0.9, g);
  const ball = mk(new THREE.SphereGeometry(0.17, 10, 8), GOLD, YARD_ARENA.x - 2.3, 0.17, YARD_ARENA.z - 1.0, g);
  yarn.castShadow = ball.castShadow = true;

  roses.length && g.add(instanced(new THREE.IcosahedronGeometry(1, 1), lam(0xffffff, { emissive: 0x331820 }), roses));
  veg.addTo(g); lights.addTo(g, 6); lampGlows(g, lampPos, 3.2);
  addButterflies(g, [[-2, 1.5], [3, 2.5], [-8, -8], [-14, -14], [0, -10]], 6, rnd);

  // Mel (no telhado) e os três filhotes (no quintal): js/yardcats.js
  buildYardCats(g, H, rise, half);
  mergeStatic(g); // as caixas das paredes, da cerca etc. viram poucas malhas (muito mais leve para a placa de vídeo)
}

function updateMailbox(now, dt) {
  if (!mailbox.flag) return;
  mailbox.flag.rotation.z = -0.05 + Math.sin(now * 2.2) * 0.07;                 // a bandeirinha balança
  mailbox.glow.material.opacity = 0.5 + 0.25 * Math.sin(now * 2.6);               // a fresta pulsa
  const b = mailbox.smokeBase;
  mailbox.smoke.forEach(p => {                                                     // fumaça subindo
    const t = (now * 0.12 + p.ph) % 1;
    p.s.position.y = b[1] + t * 3.4; p.s.position.x = b[0] + Math.sin(t * 4 + p.ph * 6) * 0.4;
    p.s.material.opacity = 0.32 * Math.sin(t * Math.PI); const k = 1.3 + t * 2.4; p.s.scale.set(k, k, 1);
  });
  updateYardCats(now, dt);
}
