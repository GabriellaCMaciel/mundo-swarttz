// Visão em 1ª pessoa: ao chegar numa área (Sobre, Biblioteca, Cinema, Telefone, Cartas) a câmera sai de trás da personagem e vai para os OLHOS dela.
// Ao sair da área, volta sozinha para a visão de trás.
//
// Dentro da área os controles ficam "estilo jogo":
//   W / ↑  anda para a frente     S / ↓  anda para trás     A / D  andam de lado
//   ← / →  giram a cabeça         arrastar o mouse ou o dedo na tela também gira (e inclina para cima/baixo)
//   joystick (celular): para cima = frente, para os lados = de lado
// Fora das áreas nada muda: as teclas continuam andando nos eixos do mundo.
//
// CONCEITOS:
//   - Yaw e pitch: yaw é o giro para os lados (0 olha para +z; π olha para -z, que é "para o fundo do mundo"); pitch é o olhar para cima/baixo.
//   - Movimento relativo à câmera: o que a pessoa aperta (frente, de lado) é "girado" pelo yaw para virar um passo nos eixos do mundo (x, z).
//   - Mistura (blend): FPV.k vai de 0 (visão de trás) a 1 (1ª pessoa) em ~0,6 s; a câmera é uma mistura das duas posições, por isso a troca é suave.
'use strict';

const FPV = {
  on: false,        // true = a pessoa está dentro de uma área (alvo da câmera)
  k: 0,             // 0..1: quanto da câmera já está nos olhos (a animação da troca)
  zone: null,       // a área em que estamos
  yaw: Math.PI, pitch: 0,
  dragged: false,   // o último arrastar foi para olhar (e não um toque): quem trata cliques deve ignorar esse clique (veja fpvDragged)
};
const FPV_EYE = 2.0;      // altura dos olhos (a personagem tem ~2,5 de altura)
const FPV_EXIT = 2.5;     // folga na saída: a câmera só volta depois de sair desta distância além do raio da área (evita "piscar" na borda)
const FPV_TURN = 1.9;     // rad/s com as setas
const FPV_SENS = 0.0045;  // rad por pixel arrastado
const FPV_PITCH = [-0.7, 1.1];
const FPV_KEY = 'swarttz-fpv-dica';
const fpvTmp = new THREE.Vector3();

function fpvDragged() { return FPV.dragged; } // pick.js e library.js ignoram o "click" que vem logo depois de um arrastar

// Para onde olhar ao entrar na área: o que é "a atração" de cada lugar (o telão, o telefone, a estante...)
function fpvFocus(z, out) {
  if (z.id === 'cinema' && CIN.screen) CIN.screen.getWorldPosition(out);
  else if (z.id === 'telefone' && phoneRig.built) out.set(phoneRig.wx, 4.2, phoneRig.wz);
  else if (z.id === 'biblioteca' && LIB.center) out.set(LIB.center.x, 3, LIB.center.z);
  else out.set(z.pos[0], 2.4, z.pos[2]);
  return out;
}
function fpvAim(z) { // vira a cabeça para a atração da área
  fpvFocus(z, fpvTmp);
  const dx = fpvTmp.x - player.position.x, dz = fpvTmp.z - player.position.z, dist = Math.hypot(dx, dz) || 1;
  FPV.yaw = Math.atan2(dx, dz);
  FPV.pitch = THREE.MathUtils.clamp(Math.atan2(fpvTmp.y - (player.position.y + FPV_EYE), dist), FPV_PITCH[0] * 0.4, 0.8);
}
function fpvTip() { // dica rápida nas primeiras vezes (depois a pessoa já sabe)
  let n = 0; try { n = +localStorage.getItem(FPV_KEY) || 0; localStorage.setItem(FPV_KEY, String(n + 1)); } catch (e) { /* sem armazenamento: mostra sempre */ }
  if (n < 3) showToast(touch ? 'Visão em 1ª pessoa: arraste a tela para olhar. Saia da área para voltar.' : 'Visão em 1ª pessoa: arraste o mouse ou use ← → para olhar. Saia da área para voltar.');
}

// Chamada todo quadro, no começo de updateWorld: decide se estamos numa área e anima a troca de câmera.
function fpvUpdate(dt) {
  const px = player.position.x, pz = player.position.z;
  const dist = z => Math.hypot(px - z.pos[0], pz - z.pos[2]);
  let zone = FPV.zone && dist(FPV.zone) <= FPV.zone.r + FPV_EXIT ? FPV.zone : null; // continua na mesma área até passar da folga de saída
  if (!zone) { let best = 1e9; for (const z of zones) { if (!z.built) continue; const d = dist(z); if (d < z.r && d < best) { best = d; zone = z; } } } // senão, entra na mais próxima cujo raio já alcançamos
  if (zone && zone !== FPV.zone) { fpvAim(zone); fpvTip(); announce('Visão em primeira pessoa em ' + zone.name + '.'); }
  else if (!zone && FPV.zone) announce('Visão de trás.');
  FPV.zone = zone; FPV.on = !!zone;
  FPV.k = calm ? (FPV.on ? 1 : 0) : THREE.MathUtils.clamp(FPV.k + (FPV.on ? dt : -dt) / 0.6, 0, 1); // "reduzir movimento": troca de uma vez
  player.visible = FPV.k < 0.55; // com a câmera nos olhos o corpo some (senão a câmera ficaria dentro do capuz)
  if (FPV.on) { // setas giram a cabeça
    const t = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
    if (t) FPV.yaw += t * FPV_TURN * dt;
  }
}

// O que foi apertado (vx: para o lado, vz: para trás) vira um passo nos eixos do mundo, girado pelo yaw.
function fpvMove(vx, vz) {
  const c = Math.cos(FPV.yaw), s = Math.sin(FPV.yaw);
  return [-c * vx - s * vz, s * vx - c * vz];
}

// Mistura a câmera de trás (camWant/lookWant, calculadas em ui.js) com a dos olhos. Devolve o quanto "trava" a câmera (1 = direto, sem suavização).
function fpvBlend(camWant, lookWant) {
  const s = FPV.k * FPV.k * (3 - 2 * FPV.k); // suaviza o começo e o fim da troca
  const cp = Math.cos(FPV.pitch), fx = Math.sin(FPV.yaw) * cp, fy = Math.sin(FPV.pitch), fz = Math.cos(FPV.yaw) * cp;
  const ex = player.position.x + fx * 0.25, ey = player.position.y + FPV_EYE, ez = player.position.z + fz * 0.25; // um pouco à frente do rosto
  camWant.x += (ex - camWant.x) * s; camWant.y += (ey - camWant.y) * s; camWant.z += (ez - camWant.z) * s;
  lookWant.x += (ex + fx * 10 - lookWant.x) * s; lookWant.y += (ey + fy * 10 - lookWant.y) * s; lookWant.z += (ez + fz * 10 - lookWant.z) * s;
  return s;
}

// Olhar arrastando (mouse ou dedo) no mundo. Um toque curto continua sendo um toque (abre coisas, anda até o ponto): só passa de 8 px vira "olhar".
(function fpvDrag() {
  const el = renderer.domElement; let id = null, lx = 0, ly = 0, moved = 0;
  el.addEventListener('pointerdown', e => {
    FPV.dragged = false;
    if (!FPV.on || phase !== 'world' || panelOpen || mailUi.isOpen || e.button > 0) return;
    id = e.pointerId; lx = e.clientX; ly = e.clientY; moved = 0;
    try { el.setPointerCapture(id); } catch (err) { /* sem captura: o arrastar só vale dentro do canvas */ }
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (moved < 8) return;
    FPV.dragged = true;
    FPV.yaw -= dx * FPV_SENS;                                                                          // arrastar para a direita gira a cabeça para a direita
    FPV.pitch = THREE.MathUtils.clamp(FPV.pitch - dy * FPV_SENS, FPV_PITCH[0], FPV_PITCH[1]);          // arrastar para cima olha para cima
  });
  const end = e => { if (e.pointerId === id) id = null; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
})();
