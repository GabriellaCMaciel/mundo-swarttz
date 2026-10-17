// Painéis de conteúdo, controles (teclado e toque), entrada no mundo e o loop principal.
'use strict';

// ===== 5. Painéis de conteúdo (abrem quando você aperta E ou toca em "abrir") =====
// Os textos de cada painel são PROVISÓRIOS: troque as frases (e os depoimentos em config.js).
const heading = (z, sub) => '<h2 id="sheetTitle" style="color:' + hex(z.color) + '">' + z.name + '</h2><p class="sub">' + sub + '</p>';
const panels = {
  sobre: z => heading(z, 'Texto provisório: troque pela sua apresentação.') +
    '<div class="about"><img src="' + ASSETS.photo + '" alt="Foto de Gabriella Swarttz"><div>' +
    ABOUT.map(t => '<p>' + t + '</p>').join('') + '</div></div>', // os textos ficam em config.js (ABOUT)
  atelie: z => heading(z, 'Soft skills (lista provisória). Depois cada uma vira uma ilustração ou um bordado.') +
    '<div class="chips">' + SOFT_SKILLS.map(s => '<span class="chip" style="cursor:default">' + s + '</span>').join('') + '</div>',
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

// ----- Painel "Acessibilidade e atalhos": ir direto a um lugar, andar sozinho até lá, reduzir movimento, versão simples -----
function a11yHtml() {
  return '<h2 id="sheetTitle" style="color:var(--gold)">Acessibilidade e atalhos</h2>' +
    '<p class="sub">Tudo aqui funciona só com teclado, toque ou leitor de tela. Se preferir, a versão simples tem as mesmas informações em texto puro.</p>' +
    '<p><a class="link on" href="?simples"><span>Abrir a versão simples (sem 3D)</span><small>texto puro ↗</small></a></p>' +
    '<h3 class="az-h">Ir direto para um lugar</h3>' +
    '<ul class="az-list">' + zones.map(z => '<li><span>' + z.name + '</span><span class="az-btns"><button class="btn" type="button" data-az="open:' + z.id + '">Abrir</button><button class="btn" type="button" data-az="walk:' + z.id + '">Ir até lá</button></span></li>').join('') + '</ul>' +
    '<h3 class="az-h">Preferências</h3>' +
    '<label class="az-check"><input type="checkbox" id="azCalm"' + (calm ? ' checked' : '') + '> Reduzir movimento (gatos, borboletas, pétalas e luzes ficam parados)</label>' +
    '<label class="az-check"><input type="checkbox" id="azRun"' + (runLock ? ' checked' : '') + '> Correr sempre (sem precisar segurar Shift)</label>' +
    '<h3 class="az-h">Como se mover</h3>' +
    '<ul class="az-keys"><li><b>Teclado:</b> WASD ou setas para andar, Shift para correr (R liga e desliga o "correr sempre"), Espaço para pular, E ou Enter para abrir, Esc para fechar, H para esta ajuda.</li>' +
    '<li><b>Mouse ou toque:</b> clique ou toque no chão para andar até lá sozinho; toque num lugar para abrir. No celular há o joystick e os botões "correr" e "pular" (também aparecem no computador, para quem usa só o mouse).</li>' +
    '<li><b>Sem segurar nada:</b> use "Ir até lá" acima: a personagem anda sozinha.</li></ul>';
}
function openA11y() { if (panelOpen || phase !== 'world') return; panelOpen = true; showSheet(a11yHtml()); }
document.getElementById('a11yBtn').addEventListener('click', openA11y);

let panelOpen = false;
let lastFocus = null; // quem tinha o foco antes de abrir um painel: o foco volta para ele ao fechar (quem usa teclado ou leitor de tela não "se perde")
function showSheet(html) { // coloca o conteúdo na folha do painel e leva o foco para o botão de fechar
  if (hud.panel.hidden && !mailUi.isOpen) lastFocus = document.activeElement;
  hud.sheet.innerHTML = '<button class="close" type="button" aria-label="Fechar">✕</button>' + html;
  hud.panel.hidden = false; syncLoop();
  document.getElementById('panelHint').textContent = touch ? 'toque fora do painel ou no ✕ para fechar' : 'clique fora do painel, ✕ ou Esc para fechar'; // instrução de "algo aberto": canto inferior direito
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
function closePanel() {
  panelOpen = false; hud.panel.hidden = true; if (mailUi.isOpen) closeMail(); syncLoop();
  if (lastFocus && lastFocus.isConnected && !lastFocus.hidden && lastFocus !== document.body) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* sem foco: tudo bem */ } }
  lastFocus = null;
}
// "Armadilha de foco": com um painel aberto, a tecla Tab gira só entre os botões e links DENTRO dele (Shift+Tab volta). É o padrão para janelas modais.
hud.panel.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = [...hud.sheet.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')].filter(el => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || !hud.sheet.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
hud.sheet.addEventListener('click', e => {
  if (e.target.closest('.close')) return closePanel();
  const az = e.target.closest('[data-az]');
  if (az) { // botões do painel de acessibilidade: "Abrir" mostra o conteúdo; "Ir até lá" faz a personagem andar sozinha
    const [act, id] = az.dataset.az.split(':'), z = zones.find(o => o.id === id); closePanel();
    if (act === 'open') openPanel(z); else walkToZone(z);
    return;
  }
  const bk = e.target.closest('[data-book]');
  if (bk) return showSheet(bookHtml(books.find(b => b.id === bk.dataset.book)));
  if (e.target.closest('[data-back]')) return showSheet(panels.biblioteca(zones.find(z => z.id === 'biblioteca')));
});
hud.sheet.addEventListener('change', e => { // caixinhas "Reduzir movimento" e "Correr sempre"
  if (e.target.id === 'azRun') setRun(e.target.checked);
  if (e.target.id === 'azCalm') { calm = e.target.checked; try { localStorage.setItem(CALM_KEY, calm ? '1' : '0'); } catch (err) { /* sem armazenamento: vale só nesta visita */ } }
});
hud.panel.addEventListener('click', e => { if (e.target === hud.panel) closePanel(); });
hud.open.addEventListener('click', () => openPanel(activeZone));
hud.card.addEventListener('click', () => openPanel(activeZone)); // o cartão inteiro também é um botão (bom para o dedo)

// ===== 6. Controles: teclado e joystick de toque =====
// POR QUE "ANDAR SEM PARAR" ACONTECIA: guardamos quais teclas estão apertadas (keys) e o joystick (stick). Elas só "soltam" quando o navegador avisa (keyup, pointerup).
// Só que o aviso pode nunca chegar: trocar de aba/janela com a tecla apertada, abrir um menu do sistema, soltar o dedo fora da tela, tecla Cmd no Mac... Aí o estado fica
// "preso" e a personagem anda sozinha. A solução é um "zerar tudo" (resetInput) chamado sempre que o foco muda ou algo abre por cima do mundo.
const keys = {};
const stick = { x: 0, y: 0 };
const RUN_KEY = 'swarttz-corre';
let runLock = (() => { try { return localStorage.getItem(RUN_KEY) === '1'; } catch (e) { return false; } })(); // "correr sempre" (para quem não consegue segurar Shift)
const JUMP = { v: 7.6, g: 24, vy: 0, air: false, squash: 0 }; // v = impulso (altura ≈ v²/2g ≈ 1,2), g = gravidade
let resetStick = () => { };
function resetInput() { // esquece tudo que estava apertado
  for (const k in keys) keys[k] = false;
  stick.x = 0; stick.y = 0; resetStick();
}
function setRun(on) { runLock = on; hud.btnRun.setAttribute('aria-pressed', on ? 'true' : 'false'); try { localStorage.setItem(RUN_KEY, on ? '1' : '0'); } catch (e) { /* sem armazenamento: vale só nesta visita */ } }
function jump() { // pulo: dá um impulso para cima; a gravidade (em updateWorld) traz de volta
  if (phase !== 'world' || panelOpen || mailUi.isOpen || JUMP.air) return;
  JUMP.vy = JUMP.v; JUMP.air = true; JUMP.squash = -1; // squash < 0 = "esticar" no começo do pulo
}
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) { resetInput(); return; } // atalho do navegador/sistema: o keyup dessas combinações costuma se perder
  keys[e.code] = true;
  if (phase !== 'world') return;
  if (mailKey(e)) return; // com a tela das cartas aberta, ela cuida das teclas
  const onControl = e.target && e.target.closest && e.target.closest('button, a, input, select, textarea'); // com um botão em foco, Espaço e Enter são dele
  if (e.code === 'Escape') closePanel();
  else if ((e.code === 'KeyE' || e.code === 'Enter') && !panelOpen && activeZone && !onControl) openPanel(activeZone);
  else if (e.code === 'KeyH' && !panelOpen) openA11y();
  else if (e.code === 'Space' && !onControl) { e.preventDefault(); jump(); }
  else if (e.code === 'KeyR' && !e.repeat && !panelOpen) setRun(!runLock);
});
window.addEventListener('keyup', e => { keys[e.code] = false; if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt') resetInput(); });
window.addEventListener('blur', resetInput);                                  // a janela perdeu o foco
document.addEventListener('visibilitychange', () => { if (document.hidden) resetInput(); }); // a aba foi para o segundo plano
window.addEventListener('contextmenu', () => { if (!touch) resetInput(); });   // menu do botão direito: o navegador engole os keyup. (No toque, um segurar longo não pode soltar o joystick.)
hud.btnRun.setAttribute('aria-pressed', runLock ? 'true' : 'false');
hud.btnRun.addEventListener('click', () => setRun(!runLock));
hud.btnJump.addEventListener('pointerdown', e => { e.preventDefault(); jump(); }); // pointerdown: o pulo sai no instante do toque, sem esperar o "click"
hud.btnJump.addEventListener('click', e => { if (e.detail === 0) jump(); });       // detail 0 = veio do teclado (Enter/Espaço no botão em foco)

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
    if (e && e.pointerId !== id) return;
    id = null; stick.x = 0; stick.y = 0;
    hud.knob.style.transform = 'translate(-50%, -50%)';
  }
  resetStick = () => end(null);
  el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); move(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end); // o navegador tirou o "ímã" do dedo (ex.: algo abriu por cima): também é soltar
})();

// ===== 7. Entrar no mundo =====
const CAM_Y = 9, CAM_Z = 17; // altura e distância da câmera em relação ao personagem
const LOOK_Y = 2.6, FOV_ADD = 6; // a câmera mira um pouco mais alto e abre mais o campo de visão na vertical: dá para ver mais do que fica no alto (copas, ícones do celular, a biblioteca)
function startWorld() {
  if (phase === 'world') return;
  phase = 'world';
  intro.visible = false;
  world.visible = true;
  scene.background = skyTex;
  scene.fog = new THREE.Fog(WORLD_FOG, 42, 104);
  hud.hint.hidden = true; hud.title.hidden = true; hud.skip.hidden = true; hud.brand.hidden = false;
  document.getElementById('a11yBtn').hidden = false;
  announce('Você entrou no mundo 3D. Aperte H para o menu de acessibilidade, onde dá para ir direto a cada lugar. A versão simples, em texto puro, está no menu e no início da página.');
  hud.acts.hidden = false; // botões "correr" e "pular": para toque e também para quem usa só o mouse
  if (touch) { hud.joy.hidden = false; hud.open.textContent = 'abrir'; } else hud.keys.hidden = false; // no celular não existe a tecla E
  camera.position.set(player.position.x, CAM_Y, player.position.z + CAM_Z);
  camera.userData.fovAdd = FOV_ADD; resize();
  lookNow.set(player.position.x, LOOK_Y, player.position.z);
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
// ----- Andar sozinho (para quem não consegue segurar teclas): clique/toque no chão ou "Ir até lá" no painel de acessibilidade -----
// A personagem anda em linha reta até o ponto, como se alguém apertasse a tecla por ela. Qualquer tecla, o joystick ou abrir um painel cancelam.
const auto = { on: false, x: 0, z: 0, best: 1e9, since: 0, t0: 0 };
const marker = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.65, 24), new THREE.MeshBasicMaterial({ color: 0xf2b84b, transparent: true, opacity: 0.85, depthWrite: false }));
marker.rotation.x = -Math.PI / 2; marker.position.y = 0.09; marker.visible = false; world.add(marker);
function walkTo(x, z) { const p = { x, z }; clampToWorld(p); auto.on = true; auto.x = p.x; auto.z = p.z; auto.best = 1e9; auto.since = clock.elapsedTime; auto.t0 = clock.elapsedTime; marker.position.x = p.x; marker.position.z = p.z; marker.visible = true; }
function walkToZone(z) { // para um ponto dentro do alcance da zona, do lado de quem vem do ponto de partida (0, 6)
  const dx = z.pos[0], dz = z.pos[2] - 6, d = Math.hypot(dx, dz) || 1, k = Math.max(0, d - z.r * 0.6) / d; walkTo(dx * k, 6 + dz * k);
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
  if (panelOpen) { ix = 0; iz = 0; auto.on = false; }
  if (ix || iz) auto.on = false; // quem aperta uma tecla ou mexe no joystick assume o controle
  if (auto.on) { // andar sozinho: vai na direção do ponto marcado e para quando chega
    const ax = auto.x - player.position.x, az = auto.z - player.position.z, ad = Math.hypot(ax, az);
    // "cão de guarda": se a distância não diminui por 1 s, ou passa de 30 s, desiste (antes, um ponto impossível de alcançar fazia andar para sempre)
    if (ad < auto.best - 0.25) { auto.best = ad; auto.since = now; }
    if (ad < 0.35 || now - auto.since > 1 || now - auto.t0 > 30) auto.on = false; else { ix = ax / ad; iz = az / ad; }
  }
  marker.visible = auto.on; if (auto.on) marker.scale.setScalar(calm ? 1 : 1 + Math.sin(now * 8) * 0.15);
  const len = Math.hypot(ix, iz);
  if (len > 1) { ix /= len; iz /= len; }
  const moving = len > 0.08;
  const running = moving && (keys.ShiftLeft || keys.ShiftRight || runLock);
  RUN.mul += ((running ? 1.8 : 1) - RUN.mul) * Math.min(1, dt * 8); // acelera e freia suave

  // 2) mover e girar o personagem
  if (moving) {
    player.position.x += ix * SPEED * RUN.mul * dt; player.position.z += iz * SPEED * RUN.mul * dt;
    clampToWorld(player.position); // borda do mundo
    player.rotation.y = angLerp(player.rotation.y, Math.atan2(ix, iz), Math.min(1, dt * 12));
    sparkTimer += dt; if (sparkTimer > (running ? 0.04 : 0.07) && !JUMP.air) { emitSpark(); sparkTimer = 0; }
  }
  // pulo: física simples. Velocidade vertical (vy) diminui com a gravidade; a altura (y) soma a velocidade; chegou ao chão, pousa.
  if (JUMP.air) {
    JUMP.vy -= JUMP.g * dt; player.position.y += JUMP.vy * dt;
    if (player.position.y <= 0) { player.position.y = 0; JUMP.vy = 0; JUMP.air = false; JUMP.squash = 1; for (let i = 0; i < 3; i++) emitSpark(); } // pousou: "achata" um pouquinho e solta faíscas
  }
  JUMP.squash *= 1 - Math.min(1, dt * 9);
  const pb = player.userData.body;
  pb.scale.set(1 + 0.07 * JUMP.squash, 1 - 0.09 * JUMP.squash, 1 + 0.07 * JUMP.squash); // esticar ao subir, achatar ao pousar
  pb.rotation.x += ((running ? 0.16 : 0) - pb.rotation.x) * Math.min(1, dt * 10);       // correndo, inclina o corpo para a frente
  pb.position.y = JUMP.air ? 0 : moving ? Math.abs(Math.sin(now * (running ? 17 : 11))) * (running ? 0.2 : 0.14) : Math.sin(now * 2) * 0.03;

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
  updateLibrary(now, dt); updateGarden(now); updateCherry(now); updatePhone(now, dt); updateWorldMap(now);
  if (!calm) { updatePondLife(now, dt); updateSwing(now); updatePlayCats(now, dt); updateMailbox(now, dt); } // com "reduzir movimento" a lagoa, o balanço, os gatinhos e o quintal ficam parados

  // 6) o sol (e suas sombras) acompanha o personagem; a câmera também, com suavidade
  sun.position.set(player.position.x + 12, 26, player.position.z + 10);
  sun.target.position.set(player.position.x, 0, player.position.z);
  const k = 1 - Math.pow(0.0005, dt);
  const boost = libraryCamBoost(); // na biblioteca a câmera sobe e se afasta um pouco
  camWant.set(player.position.x, CAM_Y + LIB_CAM.y * boost, player.position.z + CAM_Z + LIB_CAM.z * boost);
  lookWant.set(player.position.x, LOOK_Y + LIB_CAM.look * boost, player.position.z);
  camera.position.lerp(camWant, k);
  lookNow.lerp(lookWant, k);
  camera.lookAt(lookNow);
}

// ===== 9. Economia de energia: o loop só roda quando alguém pode VER o mundo =====
// Com um painel (ou a tela dos Correios) aberto, o mundo fica atrás de um fundo escuro e parado: não tem por que calcular gatos, borboletas, pétalas
// e sombras 60 vezes por segundo. Na aba em segundo plano, idem. Então o loop é PARADO (cancelAnimationFrame) e retomado quando volta a ser útil.
// Conceito: requestAnimationFrame agenda UM quadro; quem não agenda o próximo, para tudo. O último quadro desenhado continua na tela.
let rafId = 0;
function step() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = clock.elapsedTime;
  if (phase === 'world') updateWorld(dt, now); else updateIntro(now, dt);
  renderer.render(scene, camera);
}
function loop() { step(); rafId = requestAnimationFrame(loop); }
function syncLoop() { // chame sempre que algo mudar: painel abriu/fechou, aba ficou visível/escondida
  const hidden = document.hidden, covered = phase === 'world' && (panelOpen || mailUi.isOpen);
  if (covered) resetInput(); // abriu algo por cima: esquece teclas e joystick (o keyup/pointerup pode não chegar mais ao mundo)
  document.querySelectorAll('.hud, #stage, #toSimple').forEach(el => { el.inert = covered; }); // com algo aberto por cima, o resto da página sai do teclado e do leitor de tela ("inert")
  document.documentElement.classList.toggle('paused', hidden); // aba escondida: pausa também as animações de CSS (a tela dos Correios, aberta, continua animada)
  if (!hidden && !covered && !rafId) { clock.oldTime = performance.now(); rafId = requestAnimationFrame(loop); } // oldTime: o tempo parado não vira um "pulo" na animação
  else if ((hidden || covered) && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
}
document.addEventListener('visibilitychange', syncLoop);
window.addEventListener('resize', () => { if (!rafId && !document.hidden) renderer.render(scene, camera); }); // redimensionar apaga o canvas: redesenha uma vez, mesmo parado
syncLoop();
