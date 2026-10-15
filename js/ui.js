// Painéis de conteúdo, controles (teclado e toque), entrada no mundo e o loop principal.
'use strict';

// ===== 5. Painéis de conteúdo (abrem quando você aperta E ou toca em "abrir") =====
// Os textos de cada painel são PROVISÓRIOS: troque as frases (e os depoimentos em config.js).
const heading = (z, sub) => '<h2 id="sheetTitle" style="color:' + hex(z.color) + '">' + z.name + '</h2><p class="sub">' + sub + '</p>';
const panels = {
  sobre: z => heading(z, 'Texto provisório: troque pela sua apresentação.') +
    '<div class="about"><img src="' + ASSETS.photo + '" alt="Foto de Gabriella Swarttz"><div>' +
    '<p>Sou a Gabriella Swarttz. Estudo Desenvolvimento Web e Mobile, sou monitora no projeto START e estou construindo meu caminho até a engenharia de IA.</p>' +
    '<p>Gosto de livros, gatos, pintura, bordado, selos e de tudo que é colorido.</p></div></div>',
  atelie: z => heading(z, 'Soft skills (lista provisória). Depois cada uma vira uma ilustração ou um bordado.') +
    '<div class="chips">' + ['Didática', 'Criatividade', 'Comunicação', 'Trabalho em equipe', 'Resiliência', 'Organização'].map(s => '<span class="chip" style="cursor:default">' + s + '</span>').join('') + '</div>',
  biblioteca: z => heading(z, 'Formação e cursos (provisório).') +
    '<p>Técnico em Desenvolvimento Web e Mobile, Escola do Futuro de Goiás (em andamento).</p>' +
    '<p>Trilhas na Alura: Front-End com React, Back-End com Python e Engenharia de Agentes de IA (em andamento).</p>' +
    '<p>Certificações e graduação: em breve.</p>',
  selos: z => heading(z, 'Imagens provisórias. Cada projeto terá vários selos, com prints dele rodando.') +
    '<div class="stamps">' + [['#ff5fa2', '#7b3fe4'], ['#37d0c0', '#7b3fe4'], ['#f2b84b', '#ff5fa2'], ['#7b3fe4', '#37d0c0'], ['#f08a3c', '#ff5fa2'], ['#b79af5', '#37d0c0']]
      .map((c, i) => '<div class="stamp"><div class="shot" style="background:linear-gradient(135deg,' + c[0] + ',' + c[1] + ')">print do projeto</div><b>Projeto ' + (i + 1) + '</b></div>').join('') + '</div>',
  telefone: z => heading(z, 'Mais links em breve.') +
    '<div class="links"><a class="link on" href="' + GITHUB + '" target="_blank" rel="noopener noreferrer"><span>GitHub</span><small>GabriellaCMaciel ↗</small></a>' +
    ['LinkedIn', 'Instagram', 'E-mail', 'WhatsApp', 'YouTube'].map(n => '<div class="link off"><span>' + n + '</span><small>em breve</small></div>').join('') + '</div>',
  cartas: z => heading(z, 'Depoimentos de exemplo. Escolha uma categoria para filtrar.') +
    '<div class="chips"><button class="chip" type="button" data-cat="">Todas</button>' + ['Professores', 'Colegas', 'Mentores', 'Clientes'].map(c => '<button class="chip" type="button" data-cat="' + c + '">' + c + '</button>').join('') + '</div>' +
    '<div class="letters" id="letters"></div>'
};
function renderLetters(cat) {
  const list = letters.filter(l => !cat || l.cat === cat);
  $('letters').innerHTML = list.map(l => '<div class="letter"><span class="tag">' + l.cat + ' · exemplo</span><p>' + l.text + '</p><cite>' + l.who + '</cite></div>').join('');
  hud.sheet.querySelectorAll('.chip[data-cat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === (cat || ''))));
}

let panelOpen = false;
function openPanel(z) {
  if (panelOpen || !z) return;
  panelOpen = true;
  hud.sheet.innerHTML = '<button class="close" type="button" aria-label="Fechar">✕</button>' + panels[z.id](z);
  if (z.id === 'cartas') renderLetters('');
  hud.panel.hidden = false;
  hud.sheet.querySelector('.close').focus();
}
function closePanel() { panelOpen = false; hud.panel.hidden = true; }
hud.sheet.addEventListener('click', e => {
  if (e.target.closest('.close')) return closePanel();
  const chip = e.target.closest('.chip[data-cat]');
  if (chip) renderLetters(chip.dataset.cat);
});
hud.panel.addEventListener('click', e => { if (e.target === hud.panel) closePanel(); });
hud.open.addEventListener('click', () => openPanel(activeZone));

// ===== 6. Controles: teclado e joystick de toque =====
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (phase !== 'world') return;
  if (e.code === 'Escape') closePanel();
  else if ((e.code === 'KeyE' || e.code === 'Enter') && !panelOpen && activeZone) openPanel(activeZone);
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
const stick = { x: 0, y: 0 };

(function setupJoystick() {
  const R = 44; // até onde o botão pode ir
  let id = null;
  const el = hud.joy;
  function move(e) {
    const r = el.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    stick.x = dx / R; stick.y = dy / R;
    hud.knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
  }
  function end(e) {
    if (e.pointerId !== id) return;
    id = null; stick.x = 0; stick.y = 0;
    hud.knob.style.transform = 'translate(-50%, -50%)';
  }
  el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); move(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
})();

// ===== 7. Entrar no mundo =====
const CAM_Y = 9, CAM_Z = 17; // altura e distância da câmera em relação ao personagem
function startWorld() {
  if (phase === 'world') return;
  phase = 'world';
  intro.visible = false;
  world.visible = true;
  scene.background = skyTex;
  scene.fog = new THREE.Fog(WORLD_FOG, 45, 125);
  hud.hint.hidden = true; hud.title.hidden = true; hud.skip.hidden = true; hud.brand.hidden = false;
  if (touch) hud.joy.hidden = false; else hud.keys.hidden = false;
  camera.position.set(player.position.x, CAM_Y, player.position.z + CAM_Z);
  lookNow.set(player.position.x, 1.5, player.position.z);
  hud.flash.style.transition = 'none'; hud.flash.style.opacity = '1';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    hud.flash.style.transition = 'opacity 1.2s'; hud.flash.style.opacity = '0';
  }));
}

// ===== 8. O coração: o loop que roda ~60 vezes por segundo =====
const SPEED = 9, LIMIT = 48;
const camWant = new THREE.Vector3(), lookWant = new THREE.Vector3();
function angLerp(a, b, t) { // gira suave pelo caminho mais curto
  const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

function updateWorld(dt, now) {
  // 1) ler o que a pessoa apertou (parado enquanto um painel está aberto)
  let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + stick.x;
  let iz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + stick.y;
  if (panelOpen) { ix = 0; iz = 0; }
  const len = Math.hypot(ix, iz);
  if (len > 1) { ix /= len; iz /= len; }
  const moving = len > 0.08;

  // 2) mover e girar o personagem
  if (moving) {
    player.position.x += ix * SPEED * dt; player.position.z += iz * SPEED * dt;
    const r = Math.hypot(player.position.x, player.position.z);
    if (r > LIMIT) { player.position.x *= LIMIT / r; player.position.z *= LIMIT / r; } // borda do mundo
    player.rotation.y = angLerp(player.rotation.y, Math.atan2(ix, iz), Math.min(1, dt * 12));
    sparkTimer += dt; if (sparkTimer > 0.07) { emitSpark(); sparkTimer = 0; }
  }
  player.userData.body.position.y = moving ? Math.abs(Math.sin(now * 11)) * 0.14 : Math.sin(now * 2) * 0.03;

  // 3) Kiara segue a Gabriella (pestinha carente)
  const kx = player.position.x - kiara.position.x, kz = player.position.z - kiara.position.z, kd = Math.hypot(kx, kz);
  const kMoving = kd > 3.2;
  if (kMoving) {
    kiara.position.x += kx / kd * SPEED * 0.9 * dt; kiara.position.z += kz / kd * SPEED * 0.9 * dt;
  }
  kiara.rotation.y = angLerp(kiara.rotation.y, Math.atan2(kx, kz), Math.min(1, dt * (kMoving ? 10 : 4)));
  kiara.userData.body.position.y = kMoving ? Math.abs(Math.sin(now * 14)) * 0.16 : 0;
  kiara.userData.tail.rotation.z = Math.sin(now * (kMoving ? 9 : 4)) * 0.4;

  // 4) Maria Marta fica na biblioteca, se lambendo, e olha para quem chega perto
  const mx = player.position.x - maria.position.x, mz = player.position.z - maria.position.z;
  if (Math.hypot(mx, mz) < 9) maria.rotation.y = angLerp(maria.rotation.y, Math.atan2(mx, mz), Math.min(1, dt * 3));
  maria.userData.head.rotation.x = Math.sin(now * 1.5) * 0.15;
  maria.userData.tail.rotation.z = Math.sin(now * 1.6) * 0.25;

  // 5) selos flutuando, vaga-lumes, faíscas e zonas reagindo
  if (!calm) {
    floaters.forEach(s => {
      s.position.y = s.userData.y0 + Math.sin(now * 1.5 + s.userData.i) * 0.15;
      s.rotation.y = Math.sin(now * 0.8 + s.userData.i) * 0.25;
    });
    updateMotes(now);
  }
  updateSparks(dt);
  checkZones(now);

  // 6) o sol (e suas sombras) acompanha o personagem; a câmera também, com suavidade
  sun.position.set(player.position.x + 12, 26, player.position.z + 10);
  sun.target.position.set(player.position.x, 0, player.position.z);
  const k = 1 - Math.pow(0.0005, dt);
  camWant.set(player.position.x, CAM_Y, player.position.z + CAM_Z);
  lookWant.set(player.position.x, 1.5, player.position.z);
  camera.position.lerp(camWant, k);
  lookNow.lerp(lookWant, k);
  camera.lookAt(lookNow);
}

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = clock.elapsedTime;
  if (phase === 'world') updateWorld(dt, now); else updateIntro(now, dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
