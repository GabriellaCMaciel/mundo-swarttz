// A decoração do mundo inteiro: flores, arbustos, árvores floridas, postes de luz e fios de luzinhas
// que se espalham por todo o chão e ligam as zonas umas às outras. A biblioteca já tem um jardim próprio
// (em library.js) e aqui a decoração continua a partir de onde ele acaba, sem nenhuma borda no meio.
'use strict';

function buildDecor() {
  const rnd = mulberry32(77), veg = new VegBatch(rnd), lights = new Lights(), lampPos = [];

  // Lugares onde NÃO se planta nada: em cima das zonas, no ponto de partida e em cima das trilhas
  const spots = zones.map(z => ({ x: z.pos[0], z: z.pos[2], r: (z.r || 5.5) + (z.id === 'biblioteca' ? 11.5 : 3.5) }));
  spots.push({ x: 0, z: 6, r: 6 }, { x: POND.x, z: POND.z, r: POND.r + 2.5 }); // ponto de partida e lagoa
  // Onde NÃO nascem árvores (só moitas baixas): no corredor entre o ponto de partida e a câmera, e na frente da lagoa
  const noTree = (x, z) => (Math.abs(x) < 9 && z > -4) || (Math.abs(x - POND.x) < POND.r + 14 && z > POND.z + 2 && z < POND.z + 20);
  const trails = zones.map(z => ({ len: Math.hypot(z.pos[0], z.pos[2]), x: z.pos[0], z: z.pos[2], r: z.r || 5.5 }));
  const onTrail = (px, pz, w) => trails.some(t => { // distância do ponto até o segmento que vai do centro até a zona
    const k = Math.max(0, Math.min(1, (px * t.x + pz * t.z) / (t.len * t.len)));
    return Math.hypot(px - t.x * k, pz - t.z * k) < w;
  });
  const free = (x, z, w) => !spots.some(s => Math.hypot(x - s.x, z - s.z) < s.r) && !onTrail(x, z, w);
  // Quanto mais perto de uma zona, mais enfeitado (o jardim "nasce" em volta das construções)
  const nearness = (x, z) => Math.min(...zones.map(zn => Math.hypot(x - zn.pos[0], z - zn.pos[2]) - (zn.r || 5.5)));

  const centers = [];
  for (let i = 0, ok = 0; i < 2600 && ok < 560; i++) {
    const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 66, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!free(x, z, 3.4)) continue;
    if (rnd() > 0.2 + 0.8 * Math.exp(-Math.max(0, nearness(x, z)) / 14)) continue; // mais denso perto das zonas
    ok++;
    const roll = rnd(), dom = FLOWER_COLS[(rnd() * 6) | 0];
    if (roll < 0.34) { veg.groundBush(x, z, 0.6 + rnd() * 0.7, 9, dom); if (ok % 6 === 0) centers.push([x, z]); }
    else if (roll < 0.7) { for (let k = 0; k < 4; k++) veg.groundBush(x + (rnd() - 0.5) * 2, z + (rnd() - 0.5) * 2, 0.2 + rnd() * 0.14, 4, FLOWER_COLS[(rnd() * 6) | 0]); }
    else if (roll < 0.86 && nearness(x, z) > 7 && !noTree(x, z)) { // árvores só um pouco mais longe das construções
      const h = 4.6 + rnd() * 2.6, cr = veg.tree(x, z, h, rnd() < 0.5);
      if (rnd() < 0.7) for (let k = 0; k < 12; k++) { const u = rnd() * 6.283, v = rnd() * 3.14; lights.add(x + Math.cos(u) * Math.sin(v) * cr * 1.05, h * 0.72 + Math.cos(v) * cr * 0.8, z + Math.sin(u) * Math.sin(v) * cr * 1.05); }
    } else veg.groundBush(x, z, 0.5 + rnd() * 0.5, 6, dom);
  }

  // Postes de luz dos dois lados de cada trilha, ligados por fios de luzinhas: assim as zonas ficam "interligadas"
  zones.forEach(z => {
    const d = Math.hypot(z.pos[0], z.pos[2]), ux = z.pos[0] / d, uz = z.pos[2] / d, R = z.r || 5.5;
    [-1, 1].forEach(side => {
      let prev = null;
      for (let t = 9; t < d - R - 2.5; t += 8.5) {
        const x = ux * t - uz * side * 3.1, zz = uz * t + ux * side * 3.1, h = 3.2;
        veg.post(x, zz, h); lampPos.push(x, h + 0.2, zz);
        if (prev) lights.swag(prev, { x, y: h, z: zz }, 0.9, 16);
        prev = { x, y: h, z: zz };
      }
    });
  });

  veg.addTo(world); lights.addTo(world, 6);
  lampGlows(world, lampPos, 3.6);
  addButterflies(world, centers.length ? centers : [[0, 0]], 6, rnd);
}
buildDecor();
