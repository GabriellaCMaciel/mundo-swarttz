// As trilhas: linhas curvas, tortas como as de verdade, que ligam o ponto de partida a cada lugar do mundo.
// ELAS NÃO SÃO MAIS DESENHADAS NO CHÃO (a faixa de areia não combinava com o chão bordado do Mundo Swarttz). O traçado (TRAILS) continua
// existindo só como "guia invisível": a decoração (js/decor.js) usa para não plantar em cima e para alinhar os postes de luz ao lado do caminho.
//
// CONCEITOS DESTE ARQUIVO
//  - CURVA POR SOMA DE SENOS: a trilha começa como uma reta do ponto A ao ponto B. Em cada ponto dela a gente empurra para o lado
//    (na direção da "normal", a perpendicular) um valor = soma de duas ondas de seno de tamanhos diferentes. O seno vale 0 nas pontas
//    (multiplicamos por um "envelope" sin(π·t)), então a trilha sempre começa e termina no lugar certo. Sementes fixas (mulberry32)
//    fazem a curva sair igual em toda visita.
//  - DESVIO DE OBSTÁCULOS: pontos que caem dentro do quintal cercado são empurrados para fora do retângulo; depois um "alisamento"
//    (média de vizinhos) tira as quinas. Assim a trilha contorna a cerca sem ficar dura.
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
