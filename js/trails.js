// As trilhas: caminhos de terra batida, tortos como os de verdade, que ligam o ponto de partida a cada lugar do mundo.
// Antes eram tracinhos em linha reta; agora cada trilha é uma FITA curva desenhada no chão, com pedrinhas coloridas nas beiradas.
// O mesmo traçado (TRAILS) é usado pelo mapa (js/worldmap.js), pela decoração (js/decor.js: não plantar em cima, postes ao lado).
//
// CONCEITOS DESTE ARQUIVO
//  - CURVA POR SOMA DE SENOS: a trilha começa como uma reta do ponto A ao ponto B. Em cada ponto dela a gente empurra para o lado
//    (na direção da "normal", a perpendicular) um valor = soma de duas ondas de seno de tamanhos diferentes. O seno vale 0 nas pontas
//    (multiplicamos por um "envelope" sin(π·t)), então a trilha sempre começa e termina no lugar certo. Sementes fixas (mulberry32)
//    fazem a curva sair igual em toda visita.
//  - DESVIO DE OBSTÁCULOS: pontos que caem dentro do quintal cercado são empurrados para fora do retângulo; depois um "alisamento"
//    (média de vizinhos) tira as quinas. Assim a trilha contorna a cerca sem ficar dura.
//  - FITA (ribbon): para cada ponto da trilha criamos dois vértices, um de cada lado (ponto ± normal·largura/2), e ligamos tudo em
//    triângulos. A textura tem bordas transparentes e esfarrapadas, que dão o ar de caminho gasto pelo uso.
'use strict';

const TRAIL_START = { x: 0, z: 6 };        // o ponto de partida (onde a personagem nasce)
const trailZoneR = z => z.r || 5.5 * (z.size || 1); // raio de alcance da zona (igual ao de zones.js)

function makeTrail(a, b, seed, wig, width) {
  const rnd = mulberry32(seed), dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const A1 = wig * (0.7 + rnd() * 0.5), A2 = wig * 0.3 * (0.5 + rnd()), f1 = 0.8 + rnd() * 0.7, f2 = 2.2 + rnd() * 1.3, p1 = rnd() * 6.28, p2 = rnd() * 6.28;
  const n = Math.max(6, Math.ceil(L / 1.5));
  let pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, env = Math.pow(Math.sin(Math.PI * t), 0.7), off = env * (A1 * Math.sin(Math.PI * 2 * f1 * t + p1) + A2 * Math.sin(Math.PI * 2 * f2 * t + p2));
    pts.push({ x: a.x + dx * t + nx * off, z: a.z + dz * t + nz * off });
  }
  // contornar o quintal cercado da casa das cartas (retângulo + folga)
  const m = 2.5, rx0 = YARD.x0 - m, rx1 = YARD.x1 + m, rz0 = YARD.zb - m, rz1 = YARD.zf + m;
  pts.forEach((p, i) => {
    if (i === 0 || i === n) return;
    if (p.x > rx0 && p.x < rx1 && p.z > rz0 && p.z < rz1) { // dentro: sai pelo lado mais perto
      const d = [p.x - rx0, rx1 - p.x, p.z - rz0, rz1 - p.z], k = d.indexOf(Math.min(...d));
      if (k === 0) p.x = rx0; else if (k === 1) p.x = rx1; else if (k === 2) p.z = rz0; else p.z = rz1;
    }
  });
  for (let pass = 0; pass < 3; pass++) pts = pts.map((p, i) => (i === 0 || i === n) ? p : { x: (pts[i - 1].x + p.x * 2 + pts[i + 1].x) / 4, z: (pts[i - 1].z + p.z * 2 + pts[i + 1].z) / 4 }); // alisa as quinas
  let len = 0; pts.forEach((p, i) => { if (i) len += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z); p.s = len; });
  return { pts, len, width: width || 2.8 };
}
function trailAt(tr, s) { // ponto da trilha a "s" unidades do começo, com a normal (para botar coisas ao lado)
  const P = tr.pts; let i = 1; while (i < P.length - 1 && P[i].s < s) i++;
  const a = P[i - 1], b = P[i], k = (s - a.s) / ((b.s - a.s) || 1), tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
  return { x: a.x + tx * k, z: a.z + tz * k, nx: -tz / tl, nz: tx / tl };
}
function distToTrails(x, z) { // distância até a trilha mais próxima (para a decoração não nascer em cima dela)
  let best = 1e9;
  TRAILS.forEach(tr => { const P = tr.pts; for (let i = 1; i < P.length; i++) {
    const ax = P[i - 1].x, az = P[i - 1].z, bx = P[i].x - ax, bz = P[i].z - az, k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz || 1)));
    best = Math.min(best, Math.hypot(x - ax - bx * k, z - az - bz * k));
  } });
  return best;
}

// Quais trilhas existem: do ponto de partida até a frente de cada zona, e dois ramais da biblioteca até a lagoa e o balanço
const TRAILS = [];
zones.forEach((z, i) => {
  const dx = z.pos[0] - TRAIL_START.x, dz = z.pos[2] - TRAIL_START.z, d = Math.hypot(dx, dz), stop = Math.min(d - 1, trailZoneR(z) * 0.62); // para na frente do cenário
  const tr = makeTrail(TRAIL_START, { x: z.pos[0] - dx / d * stop, z: z.pos[2] - dz / d * stop }, 100 + i * 17, Math.min(6.5, d * 0.1), 2.9);
  tr.zone = z; TRAILS.push(tr);
});
TRAILS.push(makeTrail({ x: -9, z: -43 }, { x: POND.x + 8.5, z: POND.z + 1 }, 301, 4, 2.3)); // biblioteca > lagoa e cerejeira
TRAILS.push(makeTrail({ x: 9, z: -43 }, { x: SWING.x - 8.5, z: SWING.z + 1 }, 302, 4, 2.3)); // biblioteca > balanço

// ----- desenho no chão -----
(function buildTrails() {
  const tex = canvasTex(128, 128, (x, w, h) => { // terra batida: miolo claro, beiradas esfarrapadas e transparentes, pontinhos de areia e de sombra
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(196,150,100,0)'); g.addColorStop(0.1, 'rgba(196,150,100,.9)'); g.addColorStop(0.28, 'rgba(236,206,158,1)'); g.addColorStop(0.72, 'rgba(236,206,158,1)'); g.addColorStop(0.9, 'rgba(196,150,100,.9)'); g.addColorStop(1, 'rgba(196,150,100,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = mulberry32(5);
    for (let i = 0; i < 160; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,236,200,.55)' : 'rgba(150,104,70,.4)'; const px = w * (0.12 + r() * 0.76), py = r() * h, s = 1 + r() * 2.6; x.beginPath(); x.ellipse(px, py, s * 1.5, s, r() * 3, 0, 6.3); x.fill(); }
    for (let i = 0; i < 70; i++) { const py = r() * h, side = r() < 0.5 ? 0.1 : 0.9; x.fillStyle = 'rgba(70,50,40,.25)'; x.beginPath(); x.ellipse(w * (side + (r() - 0.5) * 0.08), py, 3 + r() * 3, 2 + r() * 2, r() * 3, 0, 6.3); x.fill(); } // sombrinhas na beirada: a grama amassada
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshLambertMaterial({ map: tex, color: 0xb99c78, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const pos = [], uv = [], idx = [], stones = [];
  const rnd = mulberry32(909);
  TRAILS.forEach((tr, ti) => {
    const P = tr.pts, base = pos.length / 3; // base = quantos vértices já existem (esta trilha começa depois deles)
    P.forEach((p, i) => {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl;
      const hw = tr.width / 2 * (0.88 + 0.2 * Math.sin(p.s * 0.45 + ti)); // a largura varia um pouco ao longo do caminho
      pos.push(p.x + nx * hw, 0.04, p.z + nz * hw, p.x - nx * hw, 0.04, p.z - nz * hw); uv.push(0, p.s / 5, 1, p.s / 5);
      if (i) { const k = base + (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } // dois triângulos por trecho (a ordem dos vértices decide que o lado de cima aparece)
    });
    // pedrinhas nas beiradas: umas na cor da zona (para cada caminho ter a sua), outras cinza-areia
    const col = tr.zone ? tr.zone.color : 0xcdb4f6, cols = [col, col, 0xd9cbb4, 0x8f7fa6, 0xf6ecd9];
    for (let s = 1.5; s < tr.len - 1; s += 1.6 + rnd() * 2.6) {
      const q = trailAt(tr, s), side = rnd() < 0.5 ? -1 : 1, off = tr.width / 2 + 0.15 + rnd() * 0.8, r = 0.13 + rnd() * 0.2;
      stones.push({ x: q.x + q.nx * off * side, y: r * 0.3, z: q.z + q.nz * off * side, sx: r * 1.25, sy: r * 0.7, sz: r, ry: rnd() * 3, c: cols[(rnd() * cols.length) | 0] });
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const ribbon = new THREE.Mesh(geo, mat); ribbon.renderOrder = 1; ribbon.receiveShadow = true; ribbon.userData.flat = true; world.add(ribbon);
  // a clareira do ponto de partida: um círculo de terra batida de borda macia, onde as trilhas se encontram
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(5.2, 36), new THREE.MeshLambertMaterial({ color: 0xb99c78, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, map: canvasTex(128, 128, (x, w, h) => {
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(236,206,158,1)'); g.addColorStop(0.7, 'rgba(226,190,140,.95)'); g.addColorStop(1, 'rgba(196,150,100,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }) }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(TRAIL_START.x, 0.042, TRAIL_START.z); plaza.renderOrder = 1; plaza.userData.flat = true; world.add(plaza);
  const st = instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), stones); world.add(st);
})();
