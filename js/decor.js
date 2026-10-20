// A decoração do mundo inteiro: flores, arbustos, árvores floridas, postes de luz e fios de luzinhas
// que se espalham por todo o chão e ligam as zonas umas às outras. A biblioteca já tem um jardim próprio
// (em library.js) e aqui a decoração continua a partir de onde ele acaba, sem nenhuma borda no meio.
'use strict';

// MURALHA DE FLORESTA: duas a três fileiras de árvores baixas-poligonais em anel, logo depois do limite onde dá para andar (WORLD_LIMIT, em ui.js).
// Cada árvore é um tronco + 4 "bolas" de folhas simples (20 triângulos cada), então 400 árvores custam pouco.
// Conceito: coordenadas polares. Para espalhar em círculo a gente sorteia um ângulo (a) e um raio (r) e converte: x = sen(a)·r, z = cos(a)·r.
function buildForestWall(veg, rnd) {
  const cols = [0x1d6650, 0x247a5a, 0x2f8f6b, 0x164f40, 0x3a2a7a, 0x4a2f8a]; // verdes e roxos escuros, combinando com o resto do mundo
  [[95, 3.0, 7, 10], [103, 3.4, 9, 13], [113, 4.0, 11, 16]].forEach(([r0, step, hMin, hMax]) => { // [raio da fileira, espaço entre árvores, altura mínima e máxima]
    const n = Math.round(2 * Math.PI * r0 / step);
    for (let i = 0; i < n; i++) {
      const a = (i + rnd() * 0.8) / n * 2 * Math.PI, r = r0 + (rnd() - 0.5) * 3.5, x = Math.sin(a) * r, z = Math.cos(a) * r;
      const h = hMin + rnd() * (hMax - hMin), cr = h * 0.34, col = cols[(rnd() * cols.length) | 0];
      veg.trunks.push({ x, y: h * 0.3, z, sx: 0.4 + h * 0.03, sy: h * 0.6, sz: 0.4 + h * 0.03, c: 0x4a3322 });
      veg.leaves.push({ x, y: h * 0.62, z, sx: cr * 1.2, sy: cr * 0.95, sz: cr * 1.2, ry: rnd() * 3, c: col });
      veg.leaves.push({ x: x + cr * 0.7, y: h * 0.52, z: z + cr * 0.3, sx: cr * 0.85, sy: cr * 0.7, sz: cr * 0.85, ry: rnd() * 3, c: col });
      veg.leaves.push({ x: x - cr * 0.7, y: h * 0.5, z: z - cr * 0.3, sx: cr * 0.8, sy: cr * 0.7, sz: cr * 0.8, ry: rnd() * 3, c: col });
      veg.leaves.push({ x, y: h * 0.86, z, sx: cr * 0.8, sy: cr * 0.75, sz: cr * 0.8, ry: rnd() * 3, c: col });
    }
  });
}

function buildDecor() {
  const rnd = mulberry32(77), veg = new VegBatch(rnd), lights = new Lights(), lampPos = [];

  // Lugares onde NÃO se planta nada: em cima das zonas, no ponto de partida e em cima das trilhas
  const zr = z => z.r || 5.5 * (z.size || 1); // raio da zona (as pequenas foram ampliadas: veja zones.js)
  const spots = zones.map(z => ({ x: z.pos[0], z: z.pos[2], r: zr(z) + (z.id === 'biblioteca' ? 11.5 : z.id === 'cinema' ? 6 : 3.5) }));
  spots.push({ x: 0, z: 6, r: 6 }, { x: POND.x, z: POND.z, r: POND.r + 2.5 }, { x: CHERRY.x, z: CHERRY.z, r: 7 }, { x: SWING.x + 3, z: SWING.z, r: 10 }, { x: YARD.cx, z: YARD.cz, r: YARD.r }); // ponto de partida, lagoa, balanço e o quintal da casa das cartas
  // Onde NÃO nascem árvores (só moitas baixas): no corredor entre o ponto de partida e a câmera, e na frente da lagoa
  const noTree = (x, z) => (Math.abs(x) < 9 && z > -4) || (Math.abs(x - POND.x) < POND.r + 14 && z > POND.z + 2 && z < POND.z + 20) || Math.hypot(x - YARD.cx, z - YARD.cz) < YARD.r + 6;
  const onTrail = (px, pz, w) => distToTrails(px, pz) < w; // as trilhas são curvas (js/trails.js): a distância é até o traçado de verdade
  const free = (x, z, w) => !spots.some(s => Math.hypot(x - s.x, z - s.z) < s.r) && !onTrail(x, z, w);
  // Quanto mais perto de uma zona, mais enfeitado (o jardim "nasce" em volta das construções)
  const nearness = (x, z) => Math.min(...zones.map(zn => Math.hypot(x - zn.pos[0], z - zn.pos[2]) - zr(zn)));

  const centers = [];
  for (let i = 0, ok = 0; i < 6000 && ok < 1000; i++) {
    const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 104, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!free(x, z, 3.4)) continue;
    if (rnd() > 0.12 + 0.88 * Math.exp(-Math.max(0, nearness(x, z)) / 14)) continue; // mais denso perto das zonas
    ok++;
    const roll = rnd(), dom = FLOWER_COLS[(rnd() * 6) | 0];
    if (roll < 0.34) { veg.groundBush(x, z, 0.6 + rnd() * 0.7, 9, dom); if (ok % 6 === 0) centers.push([x, z]); }
    else if (roll < 0.7) { for (let k = 0; k < 4; k++) veg.groundBush(x + (rnd() - 0.5) * 2, z + (rnd() - 0.5) * 2, 0.2 + rnd() * 0.14, 4, FLOWER_COLS[(rnd() * 6) | 0]); }
    else if (roll < 0.86 && nearness(x, z) > 7 && !noTree(x, z)) { // árvores só um pouco mais longe das construções
      const h = 4.6 + rnd() * 2.6, cr = veg.tree(x, z, h, rnd() < 0.5);
      if (rnd() < 0.7) for (let k = 0; k < 12; k++) { const u = rnd() * 6.283, v = rnd() * 3.14; lights.add(x + Math.cos(u) * Math.sin(v) * cr * 1.05, h * 0.72 + Math.cos(v) * cr * 0.8, z + Math.sin(u) * Math.sin(v) * cr * 1.05); }
    } else veg.groundBush(x, z, 0.5 + rnd() * 0.5, 6, dom);
  }

  // Postes de luz: um GUIA do caminho, não um enfeite espalhado. Dois lados de cada trilha, em pares alinhados e com o mesmo espaçamento.
  // Para não virar ruído visual, um poste só é aceito se:
  //  - não estiver em cima de uma zona, da lagoa, da cerejeira, do balanço ou do quintal (usa a mesma lista "spots" da vegetação);
  //  - não estiver em cima de OUTRA trilha (perto do início as trilhas se cruzam e antes os postes se amontoavam ali);
  //  - não ficar muito perto de outro poste já colocado (distância mínima), o que também desfaz o aperto nas curvas fechadas.
  // Os fios de luzinhas só ligam postes vizinhos da mesma fileira; se um poste foi recusado, a fileira "quebra" e o fio recomeça depois.
  const LAMP_STEP = 10, LAMP_SIDE = 2.7, LAMP_MIN = 5.5, LAMP_H = 3.2;
  const lampSpots = spots.map((sp, i) => i < zones.length ? { x: sp.x, z: sp.z, r: zr(zones[i]) * 0.95 } : sp); // perto das zonas os postes vão até a entrada do cenário
  const placed = [];
  TRAILS.filter(tr => tr.zone).forEach(tr => {
    const others = TRAILS.filter(o => o !== tr);
    const onOther = (x, z) => others.some(o => { const P = o.pts; for (let i = 1; i < P.length; i++) {
      const ax = P[i - 1].x, az = P[i - 1].z, bx = P[i].x - ax, bz = P[i].z - az, k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz || 1)));
      if (Math.hypot(x - ax - bx * k, z - az - bz * k) < o.width / 2 + 0.7) return true; } return false; });
    [-1, 1].forEach(side => {
      let prev = null;
      for (let s = 9; s < tr.len - 2; s += LAMP_STEP) {
        const q = trailAt(tr, s), x = q.x + q.nx * side * LAMP_SIDE, zz = q.z + q.nz * side * LAMP_SIDE;
        const ok = !lampSpots.some(sp => Math.hypot(x - sp.x, zz - sp.z) < sp.r) && !onOther(x, zz) && !placed.some(pp => Math.hypot(x - pp.x, zz - pp.z) < LAMP_MIN);
        if (!ok) { prev = null; continue; }
        placed.push({ x, z: zz });
        veg.post(x, zz, LAMP_H); lampPos.push(x, LAMP_H + 0.2, zz);
        if (prev) lights.swag(prev, { x, y: LAMP_H, z: zz }, 0.9, 16);
        prev = { x, y: LAMP_H, z: zz };
      }
    });
  });

  buildForestWall(veg, rnd); // muralha de árvores em volta de todo o mundo (esconde o "fim" do cenário)

  veg.addTo(world); lights.addTo(world, 6);
  lampGlows(world, lampPos, 3.6);
  addButterflies(world, centers.length ? centers : [[0, 0]], 6, rnd);
}
buildDecor();
