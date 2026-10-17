// O balanço pendurado numa árvore, à direita da biblioteca (inspirado na foto de referência): cordas enfeitadas de
// hera e flores coloridas, tábua de madeira com um livro aberto e uma manta de tricô, cestos de flores, pilha de livros,
// folhas caídas, luzinhas e borboletas. Ele balança devagar, como se tivesse uma brisa.
// Conceitos: "pivô" (um grupo que gira em torno do galho faz o balanço inteiro oscilar como um pêndulo)
// e Group (tudo que está dentro do grupo anda junto com ele).
'use strict';

const swing = { pivot: null, g: null, bf: [] }; // g = grupo do balanço e bf = as borboletas dele (usados por playcats.js)

function knitTex() { // textura de tricô: fileirinhas de "V" em bege
  return canvasTex(128, 128, (x, w) => {
    x.fillStyle = '#f1e6d2'; x.fillRect(0, 0, w, w);
    x.strokeStyle = 'rgba(160,130,95,0.45)'; x.lineWidth = 2;
    for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) { const px = c * 8, py = r * 8; x.beginPath(); x.moveTo(px, py + 1); x.lineTo(px + 4, py + 7); x.lineTo(px + 8, py + 1); x.stroke(); }
  });
}

function buildSwing() {
  const rnd = mulberry32(2024), veg = new VegBatch(rnd), lights = new Lights(), lampPos = [];
  const g = new THREE.Group(); g.position.set(SWING.x, 0, SWING.z); world.add(g); swing.g = g;
  const mk = (geo, color, x, y, z, parent) => { const m = new THREE.Mesh(geo, lam(color)); m.position.set(x, y, z); parent.add(m); return m; };
  const FL = [0xff7eb6, 0xf2b84b, 0xfff1f5, 0xb79af5, 0xf08a3c, 0x37d0c0, 0xff5fa2]; // flores coloridas

  // ----- A árvore: tronco, galho comprido (de onde o balanço pende) e copa florida -----
  const TX = 5.2, TZ = -0.3;
  mk(new THREE.CylinderGeometry(0.55, 0.9, 6.4, 10), 0x6b4a2f, TX, 3.2, TZ, g);
  mk(new THREE.ConeGeometry(1.2, 0.9, 8), 0x6b4a2f, TX, 0.3, TZ, g); // base do tronco mais larga
  const branch = mk(new THREE.CylinderGeometry(0.17, 0.34, 7.6, 9), 0x6b4a2f, 1.4, 5.45, TZ, g);
  branch.rotation.z = Math.PI / 2 + 0.1; // deitado, com a ponta fina para a esquerda e um pouquinho mais baixa
  const twig = mk(new THREE.CylinderGeometry(0.1, 0.18, 2.6, 7), 0x6b4a2f, 4.0, 6.5, TZ - 0.4, g); twig.rotation.z = 0.7; // galhinho
  // Dois "poleiros" de madeira para o passarinho (ver playcats.js): um galhinho baixo no tronco, onde o Mocca consegue chegar pulando,
  // e um galhinho comprido que sai da copa, lá em cima, na frente da folhagem (para o passarinho aparecer).
  const stub = mk(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 6), 0x6b4a2f, TX - 1.23, 1.2, TZ + 0.3, g); stub.rotation.z = Math.PI / 2;
  const limb = (a, b, r0, r1) => { // cilindro que vai do ponto a até o ponto b (a ponta fina é a b)
    const d = new THREE.Vector3().subVectors(b, a), m = mk(new THREE.CylinderGeometry(r1, r0, d.length(), 6), 0x6b4a2f, 0, 0, 0, g);
    m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
  };
  limb(new THREE.Vector3(TX - 0.4, 5.6, TZ + 0.1), new THREE.Vector3(3.0, 6.55, 2.6), 0.16, 0.06);
  mk(new THREE.SphereGeometry(0.1, 6, 5), 0x6b4a2f, 3.0, 6.55, 2.6, g);
  // O galho continua À VISTA e cada bolota de folhas fica ENCOSTADA nele (sem espaço vazio entre os dois):
  //  - by(x) = altura do centro do galho em x (ele é inclinado: y = 5,45 + 0,1·(x − 1,4));
  //  - rb(x) = raio do galho em x (é mais fino na ponta esquerda, 0,17, e mais grosso junto ao tronco, 0,34);
  //  - a "bolota" (moita) tem altura de 0,78·r, então para a parte de baixo dela ficar a meio caminho dentro do galho o centro vai em
  //    by(x) + 0,5·rb(x) + 0,78·r. Assim as bolotas afundam só um pouquinho e o galho aparece embaixo delas, inteiro e visível.
  const by = x => 5.45 + 0.1 * (x - 1.4), rb = x => 0.17 + 0.17 * (x + 2.4) / 7.6;
  const onBranch = (x, r, z) => [x, by(x) + 0.5 * rb(x) + 0.78 * r, z, r];
  [onBranch(3.3, 1.9, -0.2), onBranch(1.5, 1.6, -0.5), onBranch(-0.3, 1.45, -0.3), onBranch(-1.8, 1.15, -0.3), [TX, 8.0, TZ, 2.9], [7.5, 7.0, 0.4, 2.1], [4.6, 8.6, -0.6, 2.2]].forEach(([x, y, z, r]) =>
    veg.bush(x, y, z, r, 22, [0xfff1f5, 0xff7eb6, 0xf2b84b][(rnd() * 3) | 0], [0xf4a6c9, 0xcdb4f6, 0xe58ab8, 0x4cb88a][(rnd() * 4) | 0])); // copa florida: rosa, lilás e um pouco de verde
  for (let i = 0; i < 26; i++) { // luzinhas na copa e ao longo do galho
    const u = rnd() * 6.283, v = rnd() * 3.14; lights.add(TX - 2.5 + Math.cos(u) * Math.sin(v) * 5.5, 6.9 + Math.cos(v) * 1.8, TZ + Math.sin(u) * Math.sin(v) * 2.5);
  }
  for (let i = 0; i < 14; i++) lights.add(-2 + i * 0.52, 5.0 + i * 0.03, TZ + 0.3);

  // ----- O balanço: um pivô no galho. Tudo que está dentro dele balança junto -----
  const pivot = new THREE.Group(); pivot.position.set(0, 5.3, TZ); g.add(pivot); swing.pivot = pivot;
  const L = 4.2, SY = -L - 0.1; // comprimento das cordas e altura da tábua (em relação ao pivô)
  [-1.15, 1.15].forEach(rx => mk(new THREE.CylinderGeometry(0.05, 0.05, L, 6), 0xc9a56a, rx, -L / 2, 0, pivot)); // cordas
  const seat = mk(new THREE.BoxGeometry(3.0, 0.14, 0.85), 0xd9b98c, 0, SY, 0, pivot); // tábua clara
  [-1.15, 1.15].forEach(rx => mk(new THREE.BoxGeometry(0.2, 0.16, 0.2), 0xb08a5a, rx, SY, 0, pivot)); // nós das cordas

  // Livro aberto sobre a tábua (capa marrom + duas páginas inclinadas com um desenho colorido)
  const book = new THREE.Group(); book.position.set(-0.55, SY + 0.1, 0.02); book.rotation.y = 0.18; pivot.add(book);
  mk(new THREE.BoxGeometry(1.5, 0.05, 0.9), 0x8a5a3a, 0, 0, 0, book);
  [-1, 1].forEach(s => {
    const page = mk(new THREE.BoxGeometry(0.7, 0.04, 0.84), 0xf6ecd9, s * 0.37, 0.07, 0, book); page.rotation.z = -s * 0.16;
    const art = mk(new THREE.PlaneGeometry(0.46, 0.42), s < 0 ? 0xf08a3c : 0x37d0c0, s * 0.37, 0.1, 0.05, book); art.rotation.set(-Math.PI / 2, 0, -s * 0.16); art.material.side = THREE.DoubleSide;
    mk(new THREE.PlaneGeometry(0.46, 0.06), 0x7b3fe4, s * 0.37, 0.101, -0.28, book).rotation.set(-Math.PI / 2, 0, -s * 0.16);
  });

  // Manta de tricô bege, jogada sobre a ponta direita da tábua, com franjas
  const knit = new THREE.MeshLambertMaterial({ map: knitTex(), emissive: 0x4a3f33 }); // emissive: um brilhinho próprio, senão a luz roxa do mundo deixa a manta cinza
  const bl = (w, h, d, x, y, z, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), knit); m.position.set(x, y, z); m.rotation.z = rz; pivot.add(m); return m; };
  bl(1.3, 0.09, 0.98, 0.78, SY + 0.12, 0.02);                // em cima da tábua
  bl(0.09, 1.0, 0.96, 1.46, SY - 0.38, 0.04, 0.05);          // caindo pela ponta
  bl(0.62, 0.5, 0.07, 1.1, SY - 0.17, 0.5, 0);               // caindo um pouco pela frente
  for (let i = 0; i < 12; i++) { mk(new THREE.BoxGeometry(0.035, 0.22, 0.035), 0xf1e6d2, 1.46 + 0.02, SY - 0.95, -0.44 + i * 0.08, pivot); } // franja da ponta
  for (let i = 0; i < 7; i++) { mk(new THREE.BoxGeometry(0.035, 0.16, 0.035), 0xf1e6d2, 0.84 + i * 0.087, SY - 0.5, 0.52, pivot); }            // franja da frente

  // Cordas enfeitadas: hera em espiral e flores coloridas (tudo em "lotes" de InstancedMesh, filhos do pivô)
  const leaves = [], blooms = [];
  [-1.15, 1.15].forEach((rx, ri) => {
    for (let i = 0; i < 34; i++) {
      const t = i / 33, y = -0.15 - t * (L - 0.3), a = i * 1.25 + ri * 2, rr = 0.08 + (i % 3) * 0.015;
      leaves.push({ x: rx + Math.cos(a) * rr, y, z: Math.sin(a) * rr, sx: 0.09 + rnd() * 0.04, sy: 0.04, sz: 0.15 + rnd() * 0.05, ry: a, rz: 0.4 + rnd() * 0.6, c: [0x3aa17a, 0x4cb88a, 0x2f8f6b][(rnd() * 3) | 0] });
    }
    for (let i = 0; i < 13; i++) { // flores em intervalos, de várias cores
      const y = -0.35 - i * 0.3 - rnd() * 0.1, a = i * 2.3 + ri;
      blooms.push({ x: rx + Math.cos(a) * 0.12, y, z: Math.sin(a) * 0.12, sx: 0.1 + rnd() * 0.06, c: FL[(i + ri * 3) % 7] });
    }
    for (let i = 0; i < 6; i++) blooms.push({ x: rx + (rnd() - 0.5) * 0.3, y: -0.12 - rnd() * 0.25, z: (rnd() - 0.5) * 0.3, sx: 0.14 + rnd() * 0.06, c: FL[(i + ri) % 7] }); // buquê no alto
    for (let i = 0; i < 4; i++) leaves.push({ x: rx + (rnd() - 0.5) * 0.3, y: SY - 0.12 - i * 0.12, z: 0.2 * (rnd() - 0.5), sx: 0.12, sy: 0.05, sz: 0.22, ry: rnd() * 3, rz: 1.2, c: GREENS[i % 5] }); // hera pendurada na tábua
  });
  pivot.add(instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), leaves));
  pivot.add(instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff, { emissive: 0x2a1020 }), blooms));

  // ----- No chão: cestos de flores, pilha de livros, folhas caídas, florzinhas, postes e borboletas -----
  const basket = (x, z, dom) => {
    mk(new THREE.CylinderGeometry(0.46, 0.34, 0.6, 12), 0xc99a62, x, 0.3, z, g);
    [0.15, 0.45].forEach(y => { const ring = mk(new THREE.TorusGeometry(y === 0.15 ? 0.4 : 0.45, 0.025, 5, 16), 0x9b6f3d, x, y, z, g); ring.rotation.x = Math.PI / 2; });
    const handle = mk(new THREE.TorusGeometry(0.34, 0.03, 5, 12, Math.PI), 0x9b6f3d, x, 0.6, z, g);
    veg.bush(x, 0.62, z, 0.42, 16, dom, GREENS[(rnd() * 5) | 0]);
  };
  basket(-3.2, 1.0, 0xff7eb6); basket(-2.35, 1.7, 0xf2b84b);
  // Pilha de livros com personalidade: cada livro tem uma cor, um tamanho, um giro e um detalhe dourado próprios.
  // Um livro é um grupo de peças: capa de baixo, capa de cima, lombada (a lateral colorida) e as páginas creme, um pouco recuadas
  // para aparecerem como "miolo" entre as capas. Uma fitinha marca a página e uma moldura dourada enfeita a capa.
  const stack = new THREE.Group(); stack.position.set(-2.5, 0, 2.6); g.add(stack);
  const bookBlock = (w, h, d, color, ry, ox, y, gold, ribbon) => {
    const b = new THREE.Group(); b.position.set(ox, y, 0); b.rotation.y = ry; stack.add(b);
    const t = 0.03; // espessura da capa
    mk(new THREE.BoxGeometry(w, t, d), color, 0, -h / 2 + t / 2, 0, b);                    // capa de baixo
    mk(new THREE.BoxGeometry(w, t, d), color, 0, h / 2 - t / 2, 0, b);                     // capa de cima
    mk(new THREE.BoxGeometry(t * 1.6, h, d), color, -w / 2 + t * 0.8, 0, 0, b);            // lombada
    mk(new THREE.BoxGeometry(w - 2 * t, h - 2 * t, d - 0.05), 0xf3e7cc, t * 0.6, 0, 0, b);  // páginas (recuadas)
    if (gold) { // faixas douradas na lombada e uma moldura na capa
      [-0.3, 0.3].forEach(k => mk(new THREE.BoxGeometry(t * 1.9, h * 0.1, d * 1.02), 0xf2c45a, -w / 2 + t * 0.8, k * h, 0, b));
      mk(new THREE.BoxGeometry(w * 0.5, 0.004, d * 0.5), 0xf2c45a, w * 0.08, h / 2 + 0.002, 0, b);
      mk(new THREE.BoxGeometry(w * 0.42, 0.006, d * 0.36), color, w * 0.08, h / 2 + 0.004, 0, b);
    }
    if (ribbon) { const r = mk(new THREE.BoxGeometry(0.03, 0.01, 0.34), ribbon, w * 0.2, -h * 0.1, d / 2 + 0.12, b); r.rotation.z = 0.05; } // fitinha saindo das páginas
    return b;
  };
  const SP = [ // [largura, altura, profundidade, cor, giro, deslocamento em x, dourado?, fitinha]
    [1.05, 0.17, 0.74, 0x7b3fe4, 0.0, 0.0, true, 0xff5fa2], [0.92, 0.15, 0.66, 0xff5fa2, 0.45, 0.06, false, 0xf2b84b], [0.98, 0.19, 0.7, 0x37d0c0, -0.3, -0.05, true, 0x7b3fe4],
    [0.8, 0.13, 0.6, 0xf2b84b, 0.8, 0.05, false, null], [0.86, 0.16, 0.62, 0xb79af5, -0.15, 0.0, true, 0xff5fa2], [0.7, 0.14, 0.5, 0xf08a3c, 0.55, 0.04, false, null]
  ];
  let sy = 0; SP.forEach(([w, h, d, c, ry, ox, gold, rib]) => { bookBlock(w, h, d, c, ry, ox, sy + h / 2, gold, rib); sy += h; });
  // No topo: um vasinho de suculenta, para a pilha parecer de alguém que mora ali
  const pot = mk(new THREE.CylinderGeometry(0.17, 0.12, 0.2, 10), 0xd9825b, 0.02, sy + 0.1, 0, stack);
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, lf = mk(new THREE.ConeGeometry(0.07, 0.26, 5), i % 2 ? 0x4cb88a : 0x3aa17a, Math.cos(a) * 0.07, sy + 0.3, Math.sin(a) * 0.07, stack); lf.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); }
  mk(new THREE.SphereGeometry(0.06, 8, 6), 0xff7eb6, 0, sy + 0.4, 0, stack); // uma florzinha rosa no meio
  // Uns livros caídos de lado perto da pilha (um aberto), e florzinhas no caminho
  const lie = bookBlock(0.8, 0.14, 0.58, 0xff7eb6, 0.9, 0, 0.07, true, null); lie.parent.remove(lie); lie.position.set(-0.8, 0.07, 0.6); stack.add(lie);
  const lie2 = bookBlock(0.72, 0.12, 0.52, 0x5b8cff, -0.5, 0, 0.06, false, 0xf2b84b); lie2.parent.remove(lie2); lie2.position.set(0.85, 0.06, 0.55); stack.add(lie2);
  const fall = [];
  for (let i = 0; i < 46; i++) { const a = rnd() * 6.283, r = 1 + rnd() * 6; fall.push({ x: Math.cos(a) * r, y: 0.04, z: Math.sin(a) * r * 0.8 + 1, sx: 0.13 + rnd() * 0.08, sy: 0.015, sz: 0.1, ry: rnd() * 3, c: [0xe8a24a, 0xd4783a, 0xf2b84b, 0xc4572f][i % 4] }); }
  g.add(instanced(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), fall));
  for (let i = 0; i < 16; i++) { const a = rnd() * 6.283, r = 2.8 + rnd() * 4.5, px = Math.cos(a) * r, pz = Math.sin(a) * r * 0.85 + 1; if (Math.abs(px) < 3 && pz > -1.5 && pz < 5) continue; veg.groundBush(Math.cos(a) * r, Math.sin(a) * r * 0.85 + 1, 0.45 + rnd() * 0.55, 10, FL[(rnd() * 7) | 0]); } // moitas floridas
  for (let i = 0; i < 40; i++) { const a = rnd() * 6.283, r = 1.5 + rnd() * 6.5; veg.groundBush(Math.cos(a) * r, Math.sin(a) * r * 0.85 + 1, 0.16 + rnd() * 0.1, 4, [0xf2b84b, 0xfff1f5, 0xf08a3c, 0xb79af5][i % 4]); } // florzinhas do campo
  [[-5, 2.5], [3.2, 3.6]].forEach(([x, z]) => { veg.post(x, z, 3.2); lampPos.push(x, 3.4, z); });
  lights.swag({ x: -5, y: 3.2, z: 2.5 }, { x: 3.2, y: 3.2, z: 3.6 }, 0.8, 18);
  veg.addTo(g); lights.addTo(g, 6); lampGlows(g, lampPos, 3.4);
  const bf0 = butterflies.length;
  addButterflies(g, [[-1.5, 1.5], [1.5, 2.5], [-3, -1], [2.5, 0], [0, 3.5]], 8, rnd);
  swing.bf = butterflies.slice(bf0); // guardadas para a Maria Julietta caçar (playcats.js)
  enableShadows(g);
}
buildSwing();

function updateSwing(now) { // pêndulo suave: a tábua vai e vem, e gira um tiquinho
  if (!swing.pivot) return;
  swing.pivot.rotation.x = Math.sin(now * 0.95) * 0.08 + Math.sin(now * 0.37) * 0.02;
  swing.pivot.rotation.z = Math.sin(now * 0.6 + 1) * 0.012;
}
