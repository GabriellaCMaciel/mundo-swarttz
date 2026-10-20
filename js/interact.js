// O SISTEMA DE INTERAÇÕES: tudo que dá para tocar no mundo (as gatas, os filhotes, o Zé Porempa, os peixes, a cerejeira, o balanço, a própria Gabriella).
// Clicar/tocar na coisa faz ela reagir (balão de fala, corações, balanço, pétalas) e pode render um selo (js/stamps.js).
// Com o teclado: a tecla F interage com a coisa mais perto.
//
// CONCEITOS DESTE ARQUIVO
//  - REGISTRO (lista de "interativos"): cada coisa é um item da lista INTERACTS com nome, onde ela está (uma função, porque os bichos andam),
//    o tamanho da área de clique (r), o que acontece (on) e um selo opcional. Para tornar algo novo clicável, é só acrescentar um item.
//  - RAIO E ESFERA: pick.js lança um "raio invisível" da tela até o mundo. Em vez de testar o raio contra cada malha 3D (os bichos têm dezenas de peças
//    e se mexem), testamos a DISTÂNCIA do raio até um ponto (distanceSqToPoint): se for menor que r, acertou. Simples e barato.
//  - DISCO NO CHÃO: a lagoa é um círculo plano; o raio cruza o chão e vemos se o ponto de encontro está dentro do círculo.
//  - POOL (reuso): os balões de fala são criados uma vez e reaproveitados, como os corações da Kiara.
//  - MARCADORES: uma estrelinha dourada paira sobre o que ainda não foi tocado (e some depois). Convida a explorar, sem escrever instrução nenhuma.
'use strict';

const INTER = { list: [], emotes: [], hops: [], marks: [], tip: null, near: null, builtMarks: false };
const _iv = new THREE.Vector3(), _ih = new THREE.Vector3();
const _pick = i => { const v = new THREE.Vector3(); i.pos(v); return v; };
const pick1 = a => a[(Math.random() * a.length) | 0];

// ---------- balões de fala ----------
const EMOTE_N = 5;
function buildEmotes() {
  for (let i = 0; i < EMOTE_N; i++) {
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 112;
    const tex = new THREE.CanvasTexture(cv), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false }));
    sp.renderOrder = 12; sp.visible = false; world.add(sp); INTER.emotes.push({ sp, cv, tex, life: 1, base: new THREE.Vector3() });
  }
}
function emote(text, at) { // texto curto em um balão que sobe e some
  const e = INTER.emotes.find(q => q.life >= 1) || INTER.emotes[0], x = e.cv.getContext('2d'), W = e.cv.width, H = e.cv.height;
  x.clearRect(0, 0, W, H);
  let s = 52; const FAM = 'Nunito, system-ui, sans-serif';
  for (; s > 22; s -= 2) { x.font = '800 ' + s + 'px ' + FAM; if (x.measureText(text).width <= W - 70) break; } // o texto encolhe até caber: nunca fica cortado
  const tw = Math.min(W - 16, x.measureText(text).width + 52), bx = (W - tw) / 2;
  x.fillStyle = '#fff6e2'; x.strokeStyle = '#3a2060'; x.lineWidth = 6;
  x.beginPath(); if (x.roundRect) x.roundRect(bx, 6, tw, 76, 36); else x.rect(bx, 6, tw, 76); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(W / 2 - 12, 80); x.lineTo(W / 2, 104); x.lineTo(W / 2 + 12, 80); x.closePath(); x.fillStyle = '#fff6e2'; x.fill(); x.stroke();
  x.fillStyle = '#fff6e2'; x.fillRect(W / 2 - 9, 76, 18, 8); // apaga a linha entre o balão e o "rabinho"
  x.fillStyle = '#2a1745'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 ' + s + 'px ' + FAM; x.fillText(text, W / 2, 46);
  e.tex.needsUpdate = true; e.life = 0; e.base.copy(at); e.sp.visible = true; e.sp.scale.set(2.4, 0.84, 1);
}
function heartsAt(p, n = 3) { // reaproveita os corações da Kiara (kiara.js)
  for (let i = 0; i < n; i++) { const h = hearts.find(q => q.life >= 1); if (!h) break; h.life = -i * 0.12; h.s.visible = true; h.s.position.set(p.x + (Math.random() - 0.5) * 0.7, p.y + 0.3, p.z + (Math.random() - 0.5) * 0.7); }
}
function hop(o) { INTER.hops.push({ o, t: 0 }); }

// ---------- a lista do que dá para tocar ----------
// pos(v) coloca em v o ponto do mundo (centro da coisa) | r = raio da área de clique | disc = círculo no chão (lagoa) | mark = false: sem estrelinha
const objPos = (get, dy = 0.8) => v => { const o = get(); if (!o) return v.set(0, -99, 0); o.getWorldPosition(v); v.y += dy; return v; };
function buildInteracts() {
  const L = INTER.list;
  const pet = (id, name, get, dy, says, stampFn, opts = {}) => L.push(Object.assign({ id, name, pos: objPos(get, dy), r: 1.15, reach: 20, says, hop: true, hearts: true, done: stampFn, getObj: get }, opts));
  pet('kiara', 'Kiara', () => kiara, 0.75, ['prrrr ♥', 'miau!', 'mrrrau ♥'], () => stampGrant('kiara'));
  pet('maria', 'Maria Marta', () => maria, 0.75, ['miau.', 'prrr…', 'mrrp!'], () => stampGrant('maria'));
  pet('mel', 'Mel', () => yardCats.mel && yardCats.mel.g, 0.5, ['rrrrr!', 'hmpf.', 'tsc!'], () => stampGrant('mel'), { hop: false, hearts: false, r: 1.5 });
  (yardCats.kittens || []).forEach(k => pet('kit-' + k.name, k.name, () => k.g, 0.5, ['miau!', 'miii!', 'prr!'], () => { if (stampMark('filhotes', k.name) >= 3) stampGrant('filhotes'); }, { hop: false, r: 1.0 }));
  if (PCATS.ready) {
    pet('jul', 'Maria Julietta', () => PCATS.J.g, 0.6, ['miau!', 'brincar!', 'prr!'], () => { if (stampMark('turma', 'jul') >= 3) stampGrant('turma'); }, { hop: false, r: 1.0 });
    pet('moc', 'Mocca', () => PCATS.M.g, 0.5, ['miii!', 'oba!', 'prr!'], () => { if (stampMark('turma', 'moc') >= 3) stampGrant('turma'); }, { hop: false, r: 1.0 });
    pet('bird', 'Passarinho', () => PCATS.B.g, 0.2, ['piu!', 'piu piu!', 'tui!'], () => { if (stampMark('turma', 'bird') >= 3) stampGrant('turma'); }, { hop: false, hearts: false, r: 1.5 });
  }
  if (pondLife.ready) pet('ze', 'Zé Porempa', () => pondLife.ze, 0.8, ['nham?', 'miau!', 'glub…'], () => stampGrant('ze'), { hop: false, r: 1.3 });
  // a lagoa: um disco no chão. Cada toque joga ração: anel na água e os peixes vêm nadando
  L.push({ id: 'lagoa', name: 'Lagoa', disc: true, pos: v => v.set(POND.x, 0.1, POND.z), r: POND.r - 0.4, reach: 22, mark: false,
    on(hit) { const x = hit.x, z = hit.z; emitRing(x, z, 1.4, 0.7); pondLife.food = { x, z, until: clock.elapsedTime + 4.5 }; emote('glub!', _ih.set(x, 1.4, z)); if (stampCount('racao') >= 3) stampGrant('peixes'); } });
  // a cerejeira: sacudir faz chover pétalas
  L.push({ id: 'cerejeira', name: 'Cerejeira', pos: v => v.set(CHERRY.x, 5.2, CHERRY.z), r: 4.4, reach: 26,
    on() { cherryState.burst = 1; emote('✿ ✿ ✿', _ih.set(CHERRY.x, CHERRY.h + 1.6, CHERRY.z)); stampGrant('cerejeira'); } });
  // o balanço: dá um empurrãozinho
  L.push({ id: 'balanco', name: 'Balanço', pos: v => { swing.pivot.getWorldPosition(v); v.y = 2.1; return v; }, r: 2.4, reach: 24,
    on() { swing.kick = 1; swing.pivot.getWorldPosition(_ih); _ih.y = 4.3; emote('wheee!', _ih); stampGrant('balanco'); } });
  // a própria Gabriella: um pulinho e um oi
  L.push({ id: 'eu', name: 'Gabriella', pos: v => { player.getWorldPosition(v); v.y += 0.9; return v; }, r: 1.0, reach: 6, mark: false,
    on() { jump(); player.getWorldPosition(_ih); _ih.y = 2.7; emote(pick1(['oi!', 'oi, você!', '✨']), _ih); } });
}

// ---------- acertar o alvo ----------
function pickInteract(ev) { // devolve {it, hit} do interativo sob o dedo/mouse (ou null)
  if (!INTER.list.length) return null;
  pickSetup(ev);
  const ray = pickRay.ray; let best = null, bd = 1e9;
  for (const it of INTER.list) {
    it.pos(_iv); if (_iv.y < -50) continue;
    if (Math.hypot(player.position.x - _iv.x, player.position.z - _iv.z) > it.reach) continue; // longe demais para tocar
    if (it.disc) continue;
    const d2 = ray.distanceSqToPoint(_iv); if (d2 > it.r * it.r) continue;
    const d = ray.origin.distanceTo(_iv); if (d < bd) { bd = d; best = { it, hit: _iv.clone() }; }
  }
  if (best) return best;
  for (const it of INTER.list) { // discos (lagoa): só se nenhum bichinho foi escolhido
    if (!it.disc) continue;
    const p = ray.intersectPlane(groundPlane, _ih); if (!p) continue;
    it.pos(_iv); if (Math.hypot(p.x - _iv.x, p.z - _iv.z) <= it.r && Math.hypot(player.position.x - _iv.x, player.position.z - _iv.z) <= it.reach) return { it, hit: p.clone() };
  }
  return null;
}
function interactDo(res) {
  const it = res.it; it.pos(_iv);
  if (it.on) it.on(res.hit); else { // reação padrão de bichinho
    const p = _iv.clone(); p.y += 0.9;
    emote(pick1(it.says), p); if (it.hearts) heartsAt(p, 3); if (it.hop) { const o = it.getObj(); if (o) hop(o); }
    if (it.done) it.done();
  }
  if (it.mark !== false) stampMark('did', it.id);
  INTER.marks.forEach(m => { if (m.it === it) m.sp.visible = false; });
  }
function interactNearest() { // a coisa mais perto da personagem (tecla F)
  let best = null, bd = 3.8;
  for (const it of INTER.list) {
    it.pos(_iv); if (_iv.y < -50) continue;
    let d = Math.hypot(player.position.x - _iv.x, player.position.z - _iv.z); if (it.disc) d = Math.max(0, d - it.r); else d -= it.r * 0.5;
    if (it.id === 'eu') continue;
    if (d < bd) { bd = d; best = { it, hit: _iv.clone() }; if (it.disc) { best.hit.set(player.position.x, 0.1, player.position.z); } }
  }
  return best;
}
// dica discreta: nome da coisa perto do cursor (só o nome, nenhuma instrução)
function interactTip(res, ev) {
  if (!INTER.tip) { const t = document.createElement('div'); t.className = 'itip'; t.hidden = true; document.body.appendChild(t); INTER.tip = t; }
  const t = INTER.tip;
  if (!res || !ev) { t.hidden = true; return; }
  t.textContent = res.it.name; t.hidden = false; t.style.left = Math.min(innerWidth - 150, ev.clientX + 16) + 'px'; t.style.top = (ev.clientY + 14) + 'px';
}

// ---------- marcadores (estrelinhas) ----------
function buildMarks() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,232,150,.9)'); g.addColorStop(1, 'rgba(255,232,150,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  x.fillStyle = '#fff3c4'; x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 6 : 17, a = i * Math.PI / 4 - Math.PI / 2; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.closePath(); x.fill();
  const tex = new THREE.CanvasTexture(cv);
  INTER.list.forEach(it => {
    if (it.mark === false) return;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0.9 })); sp.renderOrder = 9; sp.scale.set(0.9, 0.9, 1); sp.visible = false; world.add(sp);
    INTER.marks.push({ it, sp });
  });
}

// ---------- todo quadro ----------
function updateInteract(now, dt) {
  if (!INTER.builtMarks) { // espera os bichos existirem (alguns são criados depois do primeiro quadro)
    if (typeof PCATS !== 'undefined' && PCATS.ready && pondLife.ready && yardCats.kittens.length === 3 && yardCats.mel && swing.pivot && cherryState.ready) {
      buildEmotes(); buildInteracts(); buildMarks(); INTER.builtMarks = true;
    } else return;
  }
  const did = SEL.stat.did || [], pp = player.position;
  INTER.marks.forEach(m => { // estrelinha: só perto, só no que ainda não foi tocado
    const it = m.it; it.pos(_iv); const d = Math.hypot(pp.x - _iv.x, pp.z - _iv.z);
    const show = d < 13 && _iv.y > -50 && !did.includes(it.id) && !calm;
    m.sp.visible = show; if (show) { m.sp.position.set(_iv.x, _iv.y + (it.r > 2 ? it.r * 0.9 : 1.05) + Math.sin(now * 2.4) * 0.12, _iv.z); const s = 0.8 + Math.sin(now * 3) * 0.1; m.sp.scale.set(s, s, 1); }
  });
  INTER.emotes.forEach(e => { // balões sobem e somem
    if (e.life >= 1) return;
    e.life = Math.min(1, e.life + dt / 1.9); if (e.life < 0) return;
    e.sp.position.set(e.base.x, e.base.y + e.life * 0.9, e.base.z); e.sp.material.opacity = Math.min(1, e.life * 8, (1 - e.life) * 3.2);
    if (e.life >= 1) e.sp.visible = false;
  });
  for (let i = INTER.hops.length - 1; i >= 0; i--) { // pulinho de alegria (só nos bichos cujo y ninguém mexe)
    const h = INTER.hops[i]; h.t += dt / 0.5; h.o.position.y = Math.sin(Math.min(1, h.t) * Math.PI) * 0.45; if (h.t >= 1) { h.o.position.y = 0; INTER.hops.splice(i, 1); }
  }
  // Kiara se esfregando em você por alguns segundos = carinho também conta
  if (typeof kiaraRub !== 'undefined' && kiaraRub.mode === 'rub' && kiaraRub.idle > 0.6) { INTER.rubT = (INTER.rubT || 0) + dt; if (INTER.rubT > 3) stampGrant('kiara'); } else INTER.rubT = 0;
  // primeiros passos
  if (!SEL.got.chegada && Math.hypot(pp.x, pp.z - 6) > 3) stampGrant('chegada');
}
