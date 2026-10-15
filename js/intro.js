// Renderizador, câmera, ajudantes e a abertura (notebook "hackeando" a Gabriella).
'use strict';

// ===== 1. O básico do Three.js: renderizador, cena e câmera =====
// Todo site 3D precisa de três coisas: um RENDERIZADOR (desenha na tela),
// uma CENA (o "palco" com os objetos) e uma CÂMERA (de onde a gente olha).
const $ = id => document.getElementById(id);
const hud = {
  hint: $('hint'), skip: $('skip'), brand: $('brand'), title: $('title'), card: $('card'),
  cardTitle: $('cardTitle'), cardText: $('cardText'), open: $('open'), joy: $('joy'),
  knob: $('knob'), keys: $('keys'), flash: $('flash'), panel: $('panel'), sheet: $('sheet')
};

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('stage'), antialias: true });
} catch (err) {
  document.body.insertAdjacentHTML('beforeend', '<p class="fail">Este navegador não conseguiu abrir o 3D. Tente em outro aparelho ou navegador.</p>');
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;               // sombras suaves no mundo
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0613);
scene.fog = new THREE.Fog(0x0b0613, 30, 90);     // neblina que esconde o fim do cenário
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 1 ? 50 + (1 - camera.aspect) * 50 : 50; // em pé (celular) abre mais o campo de visão
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ----- Ajudantes que a gente usa o tempo todo -----
const lam = (color, extra) => new THREE.MeshLambertMaterial(Object.assign({ color }, extra)); // material fosco e barato
const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);                   // começa e termina suave
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = new THREE.Clock();
const lookNow = new THREE.Vector3(); // para onde a câmera está olhando agora

function box(w, h, d, color, x, y, z, parent) { // caixa colorida em uma linha
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(color));
  m.position.set(x, y, z); parent.add(m); return m;
}
function canvasTex(w, h, draw) { // textura desenhada com o Canvas 2D (pintura, texto, padrões...)
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return new THREE.CanvasTexture(c);
}
function loadImg(src, cb) { const im = new Image(); im.onload = () => cb(im); im.src = src; }

// Brilho suave (falso "bloom"): uma bolinha de luz aditiva que sempre encara a câmera
const glowTex = canvasTex(128, 128, x => {
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
});
function glowSprite(color, size, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.set(size, size, 1); return s;
}

// ===== 2. A abertura: o notebook "hackeando" a Gabriella =====
const intro = new THREE.Group();
scene.add(intro);

intro.add(new THREE.AmbientLight(0x7a5cc0, 0.75));
const glow = new THREE.PointLight(0x7b3fe4, 1.6, 18); glow.position.set(0, 3, 3); intro.add(glow);
const warm = new THREE.PointLight(0xffc873, 1.1, 14); warm.position.set(-3.4, 1.9, -0.2); intro.add(warm);

// Fundo "chuva de código" (hacker), que desce bem devagar
const RAIN = '01{}<>/;=+*#$&';
const rainTex = canvasTex(512, 512, (x, w, h) => {
  x.font = '16px monospace';
  for (let c = 0; c < 32; c++) {
    const len = 6 + (Math.random() * 18 | 0), y0 = Math.random() * h;
    for (let r = 0; r < len; r++) {
      x.fillStyle = (r === len - 1 ? 'rgba(242,184,75,' : 'rgba(123,63,228,') + (0.12 + r / len * 0.7).toFixed(2) + ')';
      x.fillText(RAIN[(Math.random() * RAIN.length) | 0], c * 16, (y0 + r * 18) % h);
    }
  }
});
rainTex.wrapS = rainTex.wrapT = THREE.RepeatWrapping; rainTex.repeat.set(3, 2);
const rain = new THREE.Mesh(new THREE.PlaneGeometry(52, 28), new THREE.MeshBasicMaterial({ map: rainTex, transparent: true, opacity: 0.5, fog: false }));
rain.position.set(0, 8, -11); intro.add(rain);
const aura = glowSprite(0x7b3fe4, 11, 0.55); aura.position.set(0, 1.6, -2.2); intro.add(aura);

// Mesa de madeira (tábuas desenhadas no canvas)
const deskTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#1d1230'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#241538' : '#1a0f2e'; x.fillRect(0, i * h / 6, w, h / 6 - 3); }
});
const desk = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 5.4), new THREE.MeshLambertMaterial({ map: deskTex }));
desk.position.y = -0.15; intro.add(desk);

// Notebook: base, teclado e tampa
box(3.2, 0.12, 2.2, 0x2b2140, 0, 0.06, 0, intro);
box(2.8, 0.02, 1.1, 0x120b1c, 0, 0.13, 0.25, intro);
const lidPivot = new THREE.Group();          // o "pivô" fica na dobradiça: girar o pivô abre a tampa
lidPivot.position.set(0, 0.12, -1.1);
intro.add(lidPivot);
box(3.2, 0.08, 2.1, 0x2b2140, 0, 0, 1.05, lidPivot);

// Logo (a gata de óculos) na capa da tampa
const logoTex = new THREE.TextureLoader().load(ASSETS.logoDark);
const lidLogo = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.5), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true }));
lidLogo.rotation.x = -Math.PI / 2; lidLogo.position.set(0, 0.045, 1.05); lidPivot.add(lidLogo);

// Tela: um plano com uma textura desenhada num <canvas> 2D (é aqui que o texto "digita")
const termCanvas = document.createElement('canvas');
termCanvas.width = 610; termCanvas.height = 400;
const tctx = termCanvas.getContext('2d');
const termTex = new THREE.CanvasTexture(termCanvas);
const termScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.9), new THREE.MeshBasicMaterial({ map: termTex }));
termScreen.rotation.x = Math.PI / 2; termScreen.position.set(0, -0.045, 1.05); lidPivot.add(termScreen);

// Objetos na mesa: luminária, caneca e selos soltos
box(0.8, 0.1, 0.8, 0x2b2140, -3.5, 0.05, -0.6, intro);
const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), lam(0xf2b84b)); arm.position.set(-3.5, 1.0, -0.6); intro.add(arm);
const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.6, 20, 1, true), lam(0xf2b84b, { side: THREE.DoubleSide })); shade.position.set(-3.5, 2.05, -0.6); intro.add(shade);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c9 })); bulb.position.set(-3.5, 1.82, -0.6); intro.add(bulb);
const lampGlow = glowSprite(0xffc873, 3.4, 0.9); lampGlow.position.set(-3.5, 1.8, -0.6); intro.add(lampGlow);
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.46, 20), lam(0xff5fa2)); mug.position.set(3.0, 0.23, 0.9); intro.add(mug);
const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 16), lam(0xff5fa2)); handle.position.set(3.3, 0.24, 0.9); intro.add(handle);
const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.26, 20), lam(0x3a1f12)); coffee.rotation.x = -Math.PI / 2; coffee.position.set(3.0, 0.465, 0.9); intro.add(coffee);
[[-2.5, 1.5, 0xff5fa2, 0.25], [-2.0, 1.9, 0x37d0c0, -0.3], [-2.9, 2.0, 0xf2b84b, 0.5]].forEach(([x, z, c, r]) => {
  const s = box(0.7, 0.03, 0.9, c, x, 0.02, z, intro); s.rotation.y = r;
  box(0.5, 0.035, 0.7, 0xf6ecd9, x, 0.025, z, intro).rotation.y = r;
});

// O roteiro do "hack" (terminalLines) fica em js/config.js
const CPS = 20, PAUSE = 10; // letras por segundo e pausa entre linhas (em "letras")
const totalChars = terminalLines.reduce((n, l) => n + l[0].length + PAUSE, 0);
let logoImg = null;
loadImg(ASSETS.logoDark, im => { logoImg = im; });

function drawTerminal(typed, now) {
  tctx.fillStyle = '#0b0613'; tctx.fillRect(0, 0, 610, 400);
  tctx.fillStyle = '#7b3fe4'; tctx.fillRect(0, 0, 610, 34);
  tctx.font = '700 18px "JetBrains Mono", monospace';
  tctx.fillStyle = '#f6ecd9'; tctx.fillText('swarttz.dev | terminal', 14, 23);
  tctx.font = '700 22px "JetBrains Mono", monospace';
  let left = typed, y = 78, lastX = 18, lastY = 78;
  for (const [text, color] of terminalLines) {
    if (left <= 0) break;
    const shown = text.slice(0, left);
    tctx.fillStyle = color;
    tctx.fillText(shown, 18, y);
    lastX = 18 + tctx.measureText(shown).width; lastY = y;
    left -= text.length + PAUSE;
    y += 40;
  }
  if (typed > totalChars - 30 && logoImg) tctx.drawImage(logoImg, 462, 176, 126, 166); // a logo aparece no "acesso concedido"
  if (Math.floor(now * 2) % 2 === 0) { tctx.fillStyle = '#f2b84b'; tctx.fillRect(lastX + 4, lastY - 19, 12, 24); } // cursor piscando
  termTex.needsUpdate = true;
}
drawTerminal(0, 0);

// Posições da câmera em cada momento da abertura
const camClosed = new THREE.Vector3(0, 3.4, 6.6), lookClosed = new THREE.Vector3(0, 0.5, 0);
const camOpen = new THREE.Vector3(0, 1.9, 5.2), lookOpen = new THREE.Vector3(0, 1.0, -0.6);
const camDive = new THREE.Vector3(0, 1.59, -0.24), lookDive = new THREE.Vector3(0, 1.11, -1.45); // quase dentro da tela
const LID_OPEN = -1.95; // ângulo (radianos) da tampa aberta
const T_OPEN = 2.4, T_DIVE = 2.6; // duração (s) de abrir a tampa e de mergulhar na tela
camera.position.copy(camClosed);
lookNow.copy(lookClosed);

// Máquina de estados: fechado -> abrindo -> digitando -> mergulhando -> mundo
let phase = 'closed', phaseStart = 0;
function go(p) { phase = p; phaseStart = clock.elapsedTime; }

function wake() {
  if (phase !== 'closed') return;
  hud.hint.hidden = true; hud.title.hidden = true;
  go('opening');
}
window.addEventListener('pointerdown', wake);
window.addEventListener('keydown', wake);
hud.skip.addEventListener('pointerdown', e => e.stopPropagation());
hud.skip.addEventListener('click', () => startWorld());

function updateIntro(now, dt) {
  const e = now - phaseStart;
  rainTex.offset.y -= dt * 0.03;                             // o código cai devagarinho
  if (phase === 'closed') {
    glow.intensity = 1.4 + Math.sin(now * 2.2) * 0.5;       // o notebook "respira" roxo
    aura.material.opacity = 0.45 + Math.sin(now * 2.2) * 0.15;
    camera.position.set(Math.sin(now * 0.4) * 0.4, camClosed.y, camClosed.z);
  } else if (phase === 'opening') {
    const k = ease(Math.min(e / T_OPEN, 1));
    lidPivot.rotation.x = LID_OPEN * k;
    camera.position.lerpVectors(camClosed, camOpen, k);
    lookNow.lerpVectors(lookClosed, lookOpen, k);
    if (e >= T_OPEN) go('typing');
  } else if (phase === 'typing') {
    const n = Math.floor(e * CPS);
    drawTerminal(n, now);
    if (n > totalChars + 45) go('diving');                   // segura ~2 s no "acesso concedido"
  } else if (phase === 'diving') {
    const k = ease(Math.min(e / T_DIVE, 1));
    camera.position.lerpVectors(camOpen, camDive, k);
    lookNow.lerpVectors(lookOpen, lookDive, k);
    hud.flash.style.opacity = k > 0.78 ? String((k - 0.78) / 0.22) : '0'; // clarão na hora de entrar
    if (e >= T_DIVE) startWorld();
  }
  camera.lookAt(lookNow);
}

