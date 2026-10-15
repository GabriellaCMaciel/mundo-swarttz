// A zona Cartas em 3D: uma casinha (por enquanto só decoração, para dar contexto) e, na frente dela, a caixa de correio
// rosa, antiga, cheia de rosas, onde chegam as cartas de depoimento. A tela das cartas em si está em mail.js.
// Inspirada nas fotos de referência: caixa rosa com tampa arredondada e prateleira de madeira, cartas saindo pela
// fresta, envelope e pétalas na prateleira, roseiras em volta e uma bandeirinha levantada (carta nova!).
'use strict';

const mailbox = { flag: null, glow: null, smoke: [] };
const HOUSE = { dx: 3.2, dz: -8.8 }; // onde a casa fica em relação à caixa de correio (usado também por decor.js)
const ROSES = [0xf6c4cf, 0xf4a6b8, 0xfff1e6, 0xf7d2b8, 0xf2909f, 0xe98aa5];

function mailboxTex() { // a porta da caixa: rosa descascado com "CARTAS" em relevo
  return canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#e59db5'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { x.fillStyle = 'rgba(205,190,178,' + (0.12 + Math.random() * 0.2) + ')'; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 7, 1 + Math.random() * 4, Math.random() * 3, 0, 6.3); x.fill(); } // tinta descascada
    x.strokeStyle = 'rgba(160,90,110,0.5)'; x.lineWidth = 5; x.strokeRect(14, 14, w - 28, h - 28);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 104px Syne, serif';
    x.fillStyle = 'rgba(255,240,244,0.9)'; x.fillText('CARTAS', w / 2 - 3, h / 2 - 3); // luz do relevo
    x.fillStyle = 'rgba(150,80,100,0.85)'; x.fillText('CARTAS', w / 2 + 3, h / 2 + 3);  // sombra do relevo
    x.fillStyle = '#e59db5'; x.fillText('CARTAS', w / 2, h / 2);
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

  // ================= A CAIXA DE CORREIO =================
  const M = new THREE.Group(); M.position.set(0, 0, -0.6); M.scale.setScalar(1.65); g.add(M);
  bx(0.24, 1.55, 0.24, 0xc77a94, 0, 0.78, 0, M);                    // poste de madeira rosa
  bx(1.95, 0.1, 0.95, 0xc7b8aa, 0, 1.5, 0.35, M);                   // prateleira (madeira acinzentada)
  bx(0.14, 0.4, 0.8, 0xb8a899, -0.7, 1.3, 0.3, M); bx(0.14, 0.4, 0.8, 0xb8a899, 0.7, 1.3, 0.3, M); // suportes
  bx(1.5, 0.9, 1.1, 0xdc8aa4, 0, 2.02, 0, M);                       // corpo
  const arch = mk(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 22, 1, false, 0, Math.PI), 0xdc8aa4, 0, 2.47, 0, M); arch.rotation.z = Math.PI / 2; // tampa arredondada (meio cilindro deitado)
  bx(1.3, 0.05, 0.08, 0xd9889e, 0, 2.3, 0.56, M);                   // moldura da fresta
  bx(1.22, 0.15, 0.05, 0x1a0e22, 0, 2.2, 0.57, M);                  // fresta (escura)
  bx(1.34, 0.76, 0.05, 0xe69bb3, 0, 1.86, 0.56, M);                 // porta
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshLambertMaterial({ map: mailboxTex() })); door.position.set(0, 1.86, 0.6); M.add(door);
  mk(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 10), 0xf2b84b, 0, 2.08, 0.6, M).rotation.x = Math.PI / 2; // fechadura dourada
  // Cartas saindo pela fresta, uma em cada cor de papel
  [0xf6ecd9, 0xf1dfc0, 0xfbf3e6, 0xf3d9d6, 0xefe4cf].forEach((c, i) => {
    const l = mk(new THREE.BoxGeometry(0.95, 0.018, 0.62), c, -0.28 + i * 0.13, 2.21 + i * 0.012, 0.74 + (i % 2) * 0.05, M);
    l.rotation.set(-0.18 + i * 0.03, (i - 2) * 0.09, 0);
  });
  // Bandeirinha levantada ao lado: "tem carta nova!"
  const flag = new THREE.Group(); flag.position.set(0.8, 2.0, 0.1); M.add(flag); mailbox.flag = flag;
  mk(new THREE.BoxGeometry(0.06, 0.8, 0.05), 0xd9889e, 0, 0.4, 0, flag);
  mk(new THREE.BoxGeometry(0.4, 0.24, 0.04), 0xf2b84b, 0.2, 0.7, 0, flag);
  // Na prateleira: um envelope, pétalas e uma pequena pilha de cartinhas
  const env = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.53), new THREE.MeshLambertMaterial({ map: envelopeTex() })); env.rotation.set(-Math.PI / 2, 0, 0.35); env.position.set(-0.45, 1.56, 0.42); M.add(env);
  const petals = [];
  for (let i = 0; i < 9; i++) petals.push({ x: -0.8 + rnd() * 1.6, y: 1.57, z: 0.1 + rnd() * 0.65, sx: 0.09 + rnd() * 0.05, sy: 0.012, sz: 0.07, ry: rnd() * 3, c: ROSES[(rnd() * 6) | 0] });
  for (let i = 0; i < 16; i++) { const a = rnd() * 6.283, r = 0.8 + rnd() * 1.6; petals.push({ x: Math.cos(a) * r, y: 0.04, z: 0.6 + Math.sin(a) * r * 0.9, sx: 0.1 + rnd() * 0.06, sy: 0.012, sz: 0.07, ry: rnd() * 3, c: ROSES[(rnd() * 6) | 0] }); } // pétalas no chão (em coordenadas do M)
  M.add(instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), petals));
  // Brilho quente que chama a atenção para a fresta
  const glow = glowSprite(0xffd98a, 2.6, 0.55); glow.position.set(0, 2.25, 0.95); M.add(glow); mailbox.glow = glow;

  // ================= ROSEIRAS: arbustos com rosas grandes =================
  const roses = [];
  const roseBush = (x, y, z, r, n) => {
    veg.bush(x, y, z, r, 0, 0xffffff, [0x2f8f6b, 0x247a5a, 0x3aa17a][(rnd() * 3) | 0]);
    for (let i = 0; i < n; i++) {
      const u = 0.1 + rnd() * 0.9, ph = rnd() * 6.283, s = Math.sqrt(1 - u * u);
      roses.push({ x: x + Math.cos(ph) * s * r * 1.0, y: y + u * r * 0.78, z: z + Math.sin(ph) * s * r * 1.0, sx: 0.15 + rnd() * 0.11, c: ROSES[(rnd() * 6) | 0] });
    }
  };
  roseBush(-1.7, 0.45, -0.7, 0.95, 16); roseBush(1.9, 0.4, -0.9, 0.85, 14);   roseBush(0.2, 3.4, -0.2, 0.55, 8); // roseira que "cresce" em cima da caixa
  roseBush(-2.9, 0.5, -0.4, 0.8, 10); roseBush(3.3, 0.45, 0.2, 0.7, 9);
  for (let i = 0; i < 22; i++) { const a = rnd() * 6.283, r = 3 + rnd() * 4.5, qx = Math.cos(a) * r, qz = 2 + Math.sin(a) * r * 0.7; if (Math.abs(qx) < 3.6 && qz > -1.5) continue; veg.groundBush(Math.cos(a) * r, 2 + Math.sin(a) * r * 0.7, 0.3 + rnd() * 0.4, 8, ROSES[(rnd() * 6) | 0]); } // moitas pelo jardim

  // ================= A CASA (só decoração) =================
  const H = new THREE.Group(); H.position.set(HOUSE.dx, 0, HOUSE.dz); g.add(H);
  bx(7.5, 0.4, 5.5, 0xb9a89a, 0, 0.2, 0, H);                         // base de pedra
  bx(7, 3.6, 5, 0xf3e6cf, 0, 2.2, 0, H);                              // paredes cor de creme
  bx(7.3, 0.18, 5.3, 0xf2b84b, 0, 4.0, 0, H);                         // beiral dourado
  const roofGeo = new THREE.ConeGeometry(1, 1, 4); roofGeo.rotateY(Math.PI / 4); // gira a pirâmide ANTES de esticar (senão o telhado sai torto)
  const roof = mk(roofGeo, 0x8c3563, 0, 5.5, 0, H); roof.scale.set(5.9, 3, 4.3); // telhado de 4 águas
  mk(new THREE.SphereGeometry(0.22, 10, 8), 0xf2b84b, 0, 7.05, 0, H); // pontinha dourada
  bx(0.75, 2.2, 0.75, 0xb97a6b, 2.1, 5.3, -0.7, H); bx(1.0, 0.18, 1.0, 0x8c5a4c, 2.1, 6.45, -0.7, H); // chaminé
  // Porta rosa com moldura dourada, degrau e lampião
  bx(1.5, 2.6, 0.12, 0xf2b84b, 0, 1.7, 2.52, H); bx(1.2, 2.35, 0.14, 0xff7eb6, 0, 1.58, 2.56, H);
  mk(new THREE.SphereGeometry(0.08, 8, 6), 0xf2b84b, 0.4, 1.5, 2.66, H);
  bx(2.6, 0.3, 1.0, 0xb9a89a, 0, 0.15, 3.0, H); bx(1.8, 0.22, 0.7, 0xc9b8aa, 0, 0.11, 3.7, H);
  bx(0.08, 0.8, 0.08, 0x3a2350, 1.25, 2.9, 2.62, H); mk(new THREE.BoxGeometry(0.28, 0.36, 0.28), 0xffd98a, 1.25, 2.45, 2.62, H).material = new THREE.MeshBasicMaterial({ color: 0xffd98a });
  // Janelas acesas, com cortinas de luz, venezianas verde-água e jardineiras com flores
  [-2.2, 2.2].forEach(wx => {
    bx(1.6, 1.5, 0.1, 0xf2b84b, wx, 2.5, 2.52, H);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.25), new THREE.MeshBasicMaterial({ color: 0xffd98a })); glass.position.set(wx, 2.5, 2.6); H.add(glass);
    bx(0.07, 1.25, 0.04, 0xf2b84b, wx, 2.5, 2.63, H); bx(1.35, 0.07, 0.04, 0xf2b84b, wx, 2.5, 2.63, H);
    bx(0.45, 1.5, 0.08, 0x37d0c0, wx - 1.05, 2.5, 2.56, H); bx(0.45, 1.5, 0.08, 0x37d0c0, wx + 1.05, 2.5, 2.56, H);
    bx(1.6, 0.3, 0.45, 0x8a5a3a, wx, 1.6, 2.8, H);
    veg.bush(HOUSE.dx + wx, 1.9, HOUSE.dz + 2.85, 0.42, 14, ROSES[(rnd() * 6) | 0], 0x2f8f6b);
    veg.bush(HOUSE.dx + wx - 0.5, 1.85, HOUSE.dz + 2.85, 0.3, 8, 0xf2b84b, 0x3aa17a); veg.bush(HOUSE.dx + wx + 0.5, 1.85, HOUSE.dz + 2.85, 0.3, 8, 0xb79af5, 0x3aa17a);
    const wg = glowSprite(0xffc873, 4, 0.4); wg.position.set(wx, 2.5, 3.1); H.add(wg);
  });
  [-3.3, 3.3].forEach((x, i) => { roseBush(HOUSE.dx + x, 1.5, HOUSE.dz + 2.7, 1.1, 16); roseBush(HOUSE.dx + x * 0.93, 3.1, HOUSE.dz + 2.65, 0.65, 9); }); // rosas trepando nas paredes
  roseBush(HOUSE.dx - 1.1, 3.9, HOUSE.dz + 2.7, 0.5, 6);
  // Fumaça da chaminé (brilhos pálidos que sobem e somem)
  for (let i = 0; i < 4; i++) { const s = glowSprite(0xd8cfe8, 1.6, 0.3); s.position.set(HOUSE.dx + 2.1, 7, HOUSE.dz - 0.7); g.add(s); mailbox.smoke.push({ s, ph: i / 4 }); }

  // ================= CERCA, CAMINHO, POSTE E LUZINHAS =================
  const fz = -3.3;
  [[-7.6, 0.9], [5.4, 10]].forEach(([a, b]) => { // cerca branca de estacas com uma abertura no meio (por onde passa o caminho)
    for (let x = a; x <= b; x += 0.4) bx(0.14, 0.9, 0.07, 0xfff1f5, x, 0.45, fz, g);
    bx(b - a, 0.08, 0.05, 0xfff1f5, (a + b) / 2, 0.32, fz - 0.04, g); bx(b - a, 0.08, 0.05, 0xfff1f5, (a + b) / 2, 0.68, fz - 0.04, g);
  });
  const stones = [];
  for (let i = 0; i < 9; i++) { const t = i / 8; stones.push({ x: HOUSE.dx - 1.6 * t + (i % 2 ? 0.25 : -0.25), y: 0.04, z: HOUSE.dz + 5.2 + t * 7.2, sx: 0.5, sy: 0.05, sz: 0.4, ry: rnd() * 3, c: [0xb9a89a, 0xa89a8c, 0xc9b8aa][i % 3] }); }
  g.add(instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), stones));
  veg.post(5.3, -2.7, 2.7); lampPos.push(5.3, 2.9, -2.7);
  veg.post(-3.6, 1.6, 2.4); lampPos.push(-3.6, 2.6, 1.6);
  lights.swag({ x: 5.3, y: 2.7, z: -2.7 }, { x: HOUSE.dx + 3.5, y: 4.0, z: HOUSE.dz + 2.5 }, 0.5, 10);
  lights.swag({ x: HOUSE.dx - 3.5, y: 3.95, z: HOUSE.dz + 2.6 }, { x: HOUSE.dx + 3.5, y: 3.95, z: HOUSE.dz + 2.6 }, 0.55, 24); // fio no beiral da casa
  lights.swag({ x: -3.6, y: 2.4, z: 1.6 }, { x: 0, y: 3.4, z: -0.6 }, 0.6, 12); // do poste até a caixa
  for (let i = 0; i < 12; i++) lights.add(-3.4 + i * 0.3, 0.3 + Math.sin(i) * 0.05, fz + 0.3); // luzinhas no pé da cerca

  roses.length && g.add(instanced(new THREE.IcosahedronGeometry(1, 1), lam(0xffffff, { emissive: 0x331820 }), roses));
  veg.addTo(g); lights.addTo(g, 6); lampGlows(g, lampPos, 3.2);
  addButterflies(g, [[-2, 1], [2.5, 2.5], [-4.5, -2], [5, -1], [0, 4]], 6, rnd);
  mergeStatic(g); // as caixas das paredes, da cerca etc. viram poucas malhas (muito mais leve para a placa de vídeo)
}

function updateMailbox(now) {
  if (!mailbox.flag) return;
  mailbox.flag.rotation.z = -0.05 + Math.sin(now * 2.2) * 0.07;                 // a bandeirinha balança
  mailbox.glow.material.opacity = 0.5 + 0.25 * Math.sin(now * 2.6);               // a fresta pulsa
  mailbox.smoke.forEach(p => {                                                     // fumaça subindo
    const t = (now * 0.12 + p.ph) % 1;
    p.s.position.y = 7 + t * 3.2; p.s.position.x = HOUSE.dx + 2.1 + Math.sin(t * 4 + p.ph * 6) * 0.4;
    p.s.material.opacity = 0.32 * Math.sin(t * Math.PI); const k = 1.2 + t * 2.2; p.s.scale.set(k, k, 1);
  });
}
