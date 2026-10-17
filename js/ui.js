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
  biblioteca: z => heading(z, 'Cada livro que brilha nas estantes é uma formação. Escolha um aqui ou clique nele no mundo.') +
    '<div class="shelf">' + books.map(b => '<button class="bk" type="button" data-book="' + b.id + '" style="border-left-color:' + hex(b.color) + '"><span>' + b.title +
      '<small>' + b.kind + ' · ' + b.org + '</small></span></button>').join('') + '</div>',
  selos: z => heading(z, 'Imagens provisórias. Cada projeto terá vários selos, com prints dele rodando.') +
    '<div class="stamps">' + [['#ff5fa2', '#7b3fe4'], ['#37d0c0', '#7b3fe4'], ['#f2b84b', '#ff5fa2'], ['#7b3fe4', '#37d0c0'], ['#f08a3c', '#ff5fa2'], ['#b79af5', '#37d0c0']]
      .map((c, i) => '<div class="stamp"><div class="shot" style="background:linear-gradient(135deg,' + c[0] + ',' + c[1] + ')"><span>print do projeto</span></div><b>Projeto ' + (i + 1) + '</b></div>').join('') + '</div>',
  telefone: z => heading(z, 'Toque numa rede (aqui ou no celular gigante) para abrir o meu perfil.') + // a lista SOCIALS fica em config.js
    '<div class="links">' + SOCIALS.map(s => s.url
      ? '<a class="link on" href="' + s.url + '"' + (/^mailto:/.test(s.url) ? '' : ' target="_blank" rel="noopener noreferrer"') + '><span>' + s.name + '</span><small>' + (s.handle || 'abrir') + ' ↗</small></a>'
      : '<div class="link off"><span>' + s.name + '</span><small>em breve</small></div>').join('') + '</div>'
};
// O painel de um livro da biblioteca: curso, certificação ou graduação
function bookHtml(b) {
  return '<button class="back" type="button" data-back="1">← todos os livros</button>' +
    '<h2 id="sheetTitle" style="color:' + hex(b.color) + '">' + b.title + '</h2><p class="sub">' + b.kind + ' · ' + b.org + '</p>' +
    '<dl class="facts"><dt>Status</dt><dd>' + b.status + '</dd><dt>Carga horária</dt><dd>' + b.hours + '</dd><dt>Certificado</dt><dd>' + b.cert + '</dd></dl>' +
    '<p>' + b.text + '</p>' +
    (b.topics.length ? '<div class="chips">' + b.topics.map(t => '<span class="chip" style="cursor:default">' + t + '</span>').join('') + '</div>' : '') +
    '<p class="sub">(conteúdo provisório)</p>';
}

let panelOpen = false;
function showSheet(html) { // coloca o conteúdo na folha do painel e leva o foco para o botão de fechar
  hud.sheet.innerHTML = '<button class="close" type="button" aria-label="Fechar">✕</button>' + html;
  hud.panel.hidden = false;
  hud.sheet.querySelector('.close').focus();
}
function openPanel(z) {
  if (panelOpen || !z) return;
  panelOpen = true;
  if (z.id === 'cartas') return openMail(); // a caixa de correio tem tela própria (js/mail.js)
  // perto de um livro da biblioteca, abre direto o livro; senão, a lista de livros
  showSheet(z.id === 'biblioteca' && activeBook ? bookHtml(activeBook.data) : panels[z.id](z));
}
function openBook(b) { // chamado também pelo clique do mouse em um livro 3D (library.js)
  if (panelOpen) return;
  panelOpen = true; showSheet(bookHtml(b));
}
function closePanel() { panelOpen = false; hud.panel.hidden = true; if (mailUi.isOpen) closeMail(); }
hud.sheet.addEventListener('click', e => {
  if (e.target.closest('.close')) return closePanel();
  const bk = e.target.closest('[data-book]');
  if (bk) return showSheet(bookHtml(books.find(b => b.id === bk.dataset.book)));
  if (e.target.closest('[data-back]')) return showSheet(panels.biblioteca(zones.find(z => z.id === 'biblioteca')));
});
hud.panel.addEventListener('click', e => { if (e.target === hud.panel) closePanel(); });
hud.open.addEventListener('click', () => openPanel(activeZone));
hud.card.addEventListener('click', () => openPanel(activeZone)); // o cartão inteiro também é um botão (bom para o dedo)

// ===== 6. Controles: teclado e joystick de toque =====
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (phase !== 'world') return;
  if (mailKey(e)) return; // com a tela das cartas aberta, ela cuida das teclas
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
  scene.fog = new THREE.Fog(WORLD_FOG, 42, 104);
  hud.hint.hidden = true; hud.title.hidden = true; hud.skip.hidden = true; hud.brand.hidden = false;
  if (touch) { hud.joy.hidden = false; hud.open.textContent = 'abrir'; } else hud.keys.hidden = false; // no celular não existe a tecla E
  camera.position.set(player.position.x, CAM_Y, player.position.z + CAM_Z);
  lookNow.set(player.position.x, 1.5, player.position.z);
  hud.flash.style.transition = 'none'; hud.flash.style.opacity = '1';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    hud.flash.style.transition = 'opacity 1.2s'; hud.flash.style.opacity = '0';
  }));
}

// ===== 8. O coração: o loop que roda ~60 vezes por segundo =====
const SPEED = 11, WORLD_LIMIT = 84; // WORLD_LIMIT = até onde dá para andar (raio a partir do centro). Logo depois dele começa a muralha de árvores (js/decor.js)
// Limite de caminhada: dois círculos ao mesmo tempo. O segundo é o da CÂMERA, que fica CAM_Z unidades atrás da personagem (no +z):
// sem ele, ao andar para a borda de trás a câmera passaria por dentro das árvores e se veria o "fim" do mundo.
// Conceito: projetar um ponto de volta para dentro de um círculo (ele fica na borda, na mesma direção do centro).
function clampToWorld(p) {
  for (let i = 0; i < 3; i++) { // alternar as duas projeções converge para um ponto dentro dos dois círculos
    let r = Math.hypot(p.x, p.z); if (r > WORLD_LIMIT) { p.x *= WORLD_LIMIT / r; p.z *= WORLD_LIMIT / r; }
    const cz = p.z + CAM_Z; r = Math.hypot(p.x, cz); if (r > WORLD_LIMIT) { const k = WORLD_LIMIT / r; p.x *= k; p.z = cz * k - CAM_Z; }
  }
}
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
    clampToWorld(player.position); // borda do mundo
    player.rotation.y = angLerp(player.rotation.y, Math.atan2(ix, iz), Math.min(1, dt * 12));
    sparkTimer += dt; if (sparkTimer > 0.07) { emitSpark(); sparkTimer = 0; }
  }
  player.userData.body.position.y = moving ? Math.abs(Math.sin(now * 11)) * 0.14 : Math.sin(now * 2) * 0.03;

  // 3) Kiara segue a Gabriella e, quando ela para, vem se esfregar pedindo carinho (js/kiara.js)
  updateKiara(dt, now, moving);

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
  updateLibrary(now, dt); updatePondLife(now, dt);
  updateGarden(now); updateCherry(now); updateSwing(now); updatePlayCats(now, dt); updateMailbox(now, dt); updatePhone(now, dt);

  // 6) o sol (e suas sombras) acompanha o personagem; a câmera também, com suavidade
  sun.position.set(player.position.x + 12, 26, player.position.z + 10);
  sun.target.position.set(player.position.x, 0, player.position.z);
  const k = 1 - Math.pow(0.0005, dt);
  const boost = libraryCamBoost(); // na biblioteca a câmera sobe e se afasta um pouco
  camWant.set(player.position.x, CAM_Y + LIB_CAM.y * boost, player.position.z + CAM_Z + LIB_CAM.z * boost);
  lookWant.set(player.position.x, 1.5 + LIB_CAM.look * boost, player.position.z);
  camera.position.lerp(camWant, k);
  lookNow.lerp(lookWant, k);
  camera.lookAt(lookNow);
}

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = clock.elapsedTime;
  if (phase === 'world') updateWorld(dt, now); else updateIntro(now, dt);
  // Com a tela das cartas aberta o mundo 3D fica escondido atrás dela: não desenhar poupa a placa de vídeo e deixa a animação da carta fluida
  if (!mailUi.isOpen) renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
