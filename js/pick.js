// Tocar/clicar nas coisas do mundo 3D: os ícones do celular levam ao perfil, e as zonas abrem o painel (sem precisar do botão E).
//
// CONCEITO: raycaster ("raio invisível"). Do ponto da tela onde o dedo/mouse tocou sai um raio que atravessa o mundo 3D;
// intersectObjects devolve os objetos atingidos, do mais perto para o mais longe. Primeiro testamos os ícones (poucos e pequenos),
// depois os cenários das zonas (recursivo: o raio olha todos os filhos do grupo da zona).
'use strict';

const pickRay = new THREE.Raycaster(), pickNdc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pickHit = new THREE.Vector3(); // o chão: plano horizontal na altura 0
const toastEl = document.getElementById('toast');
let toastTimer = 0;
function showToast(msg) { // aviso rápido embaixo da tela (também é lido por leitores de tela: aria-live)
  toastEl.textContent = msg; toastEl.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
}
function pickSetup(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  pickNdc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  pickRay.setFromCamera(pickNdc, camera);
}
function pickIcon(ev) { // ícone de rede social sob o dedo/mouse (ou null)
  if (!phoneRig.built) return null;
  pickSetup(ev);
  const hit = pickRay.intersectObjects(phoneRig.hits, false)[0];
  return hit ? hit.object.userData.social : null;
}
// Cinema: cartaz, carrinho ou seta da bilheteria sob o dedo/mouse. Devolve uma função que executa a escolha (ou null).
function pickCinema(ev) {
  if (!CIN.built || !CIN.zone.built || Math.hypot(player.position.x - CIN.zone.pos[0], player.position.z - CIN.zone.pos[2]) > 40) return null;
  pickSetup(ev);
  const hit = pickRay.intersectObjects(CIN.hits, true)[0]; if (!hit) return null;
  for (let o = hit.object; o; o = o.parent) {
    if (o.userData.film !== undefined) { const i = o.userData.film; return () => { cinemaSelect(i); showToast('Em exibição: ' + films[i].title); }; }
    if (o.userData.cinBtn) { const d = o.userData.cinBtn; return () => cinemaStep(d); }
  }
  return null;
}
const PICK_REACH = 9; // a zona só abre por toque se a personagem estiver a menos de (raio da zona + isto)
function pickZone(ev) { // zona cujo cenário está sob o dedo/mouse e perto da personagem (ou null)
  const near = zones.filter(z => z.built && Math.hypot(player.position.x - z.pos[0], player.position.z - z.pos[2]) < z.r + PICK_REACH);
  if (!near.length) return null;
  pickSetup(ev);
  const hits = pickRay.intersectObjects(near.map(z => z.group), true);
  for (const h of hits) {
    if (!h.object.isMesh) continue; // brilhos e etiquetas (sprites) não contam: são grandes e transparentes
    for (let o = h.object; o; o = o.parent) if (o.userData.zoneId) return zones.find(z => z.id === o.userData.zoneId);
  }
  return null;
}
function openSocial(s) {
  if (!s.url) return showToast(s.name + ': link em breve');
  if (/^mailto:/.test(s.url)) location.href = s.url; else window.open(s.url, '_blank', 'noopener,noreferrer');
  showToast('Abrindo ' + s.name + '…');
}

renderer.domElement.addEventListener('click', e => {
  if (phase !== 'world' || panelOpen || mailUi.isOpen) return; // o clique em livros da biblioteca é tratado em library.js (vem antes e abre o painel)
  const s = pickIcon(e); if (s) return openSocial(s);
  const cin = pickCinema(e); if (cin) return cin(); // cartaz, carrinho ou seta da bilheteria: escolhe o filme
  const z = pickZone(e); if (z) return openPanel(z);
  // clicou no chão: a personagem anda até lá (ajuda quem não consegue segurar teclas). O raio atravessa a tela até encontrar o plano y = 0.
  pickSetup(e); const hit = pickRay.ray.intersectPlane(groundPlane, pickHit); if (hit) walkTo(hit.x, hit.z);
});
let pickMoveT = 0;
renderer.domElement.addEventListener('pointermove', e => { // mouse: cursor de "mãozinha" sobre o que é clicável (no máximo ~8 vezes por segundo)
  if (e.pointerType === 'touch' || phase !== 'world' || panelOpen) return;
  const now = performance.now(); if (now - pickMoveT < 120) return; pickMoveT = now;
  renderer.domElement.style.cursor = (pickIcon(e) || pickCinema(e) || pickZone(e) || hoverBook) ? 'pointer' : '';
});
