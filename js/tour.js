// O "guia de passeio": tudo que diz ao visitante O QUE FAZER e PARA ONDE IR. Três peças, todas simples e em português:
//  1. BOAS-VINDAS (só na primeira visita): explica em uma frase o que é o mundo e oferece "Fazer o tour", "Explorar por conta própria" ou "Como controlar".
//  2. DOCK (a barrinha no pé da tela): sempre mostra o próximo passo ("Próximo lugar: Biblioteca · 2 de 5"). Um toque e o tour começa de onde parou.
//  3. TOUR: a personagem anda sozinha até cada lugar; ao chegar, uma caixinha explica o lugar e oferece "Abrir", "Próximo" ou "Sair". Nada é forçado:
//     se a pessoa mexer no joystick/teclado, a personagem para e o tour espera ("Continuar").
//
// CONCEITOS DESTE ARQUIVO
//  - MÁQUINA DE ESTADOS: o tour tem poucas "fases" (walk = andando, here = chegou, stopped = parou no caminho, end = terminou). Em vez de mexer no loop
//    do jogo, um relógio leve (setInterval a cada 350 ms) olha onde a personagem está e decide a fase. Barato e fácil de entender.
//  - RENDERIZAR SÓ QUANDO MUDA: o dock guarda uma "chave" do estado (fase + lugar + visitados). Só redesenha se a chave mudou, assim o foco do teclado não pula.
//  - "VISITADO" = a pessoa abriu a janela daquele lugar (o mesmo critério do selo de cada zona, em stamps.js) ou abriu pelo tour.
'use strict';

const TOUR_KEY = 'swarttz-boasvindas';  // guarda no navegador que a pessoa já viu as boas-vindas
const TOUR_ORDER = ['sobre', 'biblioteca', 'cinema', 'telefone', 'cartas']; // a ordem do passeio: quem sou, o que estudo, o que fiz, como falar, depoimentos
const TOUR_INFO = { // o que dizer em cada parada e o que o botão "Abrir" faz
  sobre: { name: 'Sobre', text: 'Aqui você conhece a Gabriella: foto, apresentação e quem ela é.', open: 'Abrir "Sobre"' },
  biblioteca: { name: 'Biblioteca', text: 'Cada livro que brilha é uma formação, carreira ou curso dela. Chegue perto de um livro para abrir só aquele.', open: 'Ver os livros' },
  cinema: { name: 'Cinema drive-in', text: 'Cada filme na tela gigante é um projeto dela. Dá para trocar de filme na bilheteria e clicar na tela para ver os detalhes.', open: 'Ver os projetos' },
  telefone: { name: 'Telefone', text: 'GitHub, LinkedIn e e-mail, a um toque. É o jeito mais rápido de falar com ela.', open: 'Ver os contatos' },
  cartas: { name: 'Cartas', text: 'Cartas de depoimento de quem já trabalhou ou estudou com a Gabriella. Abra a caixa de correio para ler.', open: 'Abrir a caixa de correio' }
};
const TOUR = { on: false, i: 0, phase: 'idle', seen: {}, key: '', dock: null, retry: 0 };
let welcomeOpen = false;

const tourStops = () => TOUR_ORDER.filter(id => zones.some(z => z.id === id)); // se algum lugar sair do mundo (ex.: Ateliê), o tour se ajusta sozinho
const tourVisited = id => !!TOUR.seen[id] || (typeof stampHas === 'function' && stampHas(id));
const tourZone = id => zones.find(z => z.id === id);
const tourNextIndex = from => { const s = tourStops(); for (let k = 0; k < s.length; k++) { const j = (from + k) % s.length; if (!tourVisited(s[j])) return j; } return -1; }; // o próximo lugar ainda NÃO visitado
const tourStore = {
  get() { try { return localStorage.getItem(TOUR_KEY); } catch (e) { return null; } },
  set() { try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) { /* sem armazenamento: as boas-vindas aparecem de novo, sem problema */ } }
};

// ===== 1. Boas-vindas =====
function openWelcome() {
  if (welcomeOpen || guideOpen || phase !== 'world') return;
  if (tourStore.get()) return; // já viu: vai direto ao mundo (o dock mostra o próximo passo)
  let el = document.getElementById('welcome');
  if (!el) {
    el = document.createElement('div'); el.id = 'welcome'; el.className = 'welcome'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'welTitle');
    el.innerHTML = '<div class="w-card"><p class="w-kicker">portfólio em 3D</p><h2 id="welTitle">Bem-vindo ao mundo da Gabriella</h2>' +
      '<p>Cada lugar daqui é uma parte do portfólio: quem ela é, o que estuda, os projetos que fez e como falar com ela. Você pode passear por conta própria ou deixar que eu te leve.</p>' +
      '<div class="w-acts"><button class="dk-btn primary" type="button" data-w="tour">Fazer o tour (1 minuto)</button>' +
      '<button class="dk-btn" type="button" data-w="free">Explorar por conta própria</button>' +
      '<button class="dk-btn quiet" type="button" data-w="keys">Como controlar a personagem</button></div></div>';
    document.body.appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (b) closeWelcome(b.dataset.w); });
  }
  welcomeOpen = true; guideOpen = true; el.hidden = false; syncLoop(); // guideOpen pausa o mundo e liga o teclado do "livro" (veja guideKey em guide.js)
  announce('Boas-vindas. Escolha: fazer o tour guiado, explorar por conta própria ou ver como controlar a personagem.');
  el.querySelector('[data-w="tour"]').focus();
}
function closeWelcome(choice) {
  if (!welcomeOpen) return;
  welcomeOpen = false; guideOpen = false; document.getElementById('welcome').hidden = true; tourStore.set(); syncLoop();
  if (choice === 'tour') tourStart(); else if (choice === 'keys') openGuide(); // "free" (ou Esc) só fecha
}
function welcomeKey(e) { // chamada por guideKey enquanto as boas-vindas estão abertas
  if (e.code === 'Escape') { e.preventDefault(); closeWelcome('free'); return; }
  if (e.code !== 'Tab') return;
  const f = [...document.querySelectorAll('#welcome button')]; const i = f.indexOf(document.activeElement);
  e.preventDefault(); f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1)].focus();
}

// ===== 2 e 3. Dock e tour =====
function tourStart() {
  const s = tourStops(); if (!s.length) return;
  TOUR.on = true; TOUR.i = 0; tourGo(0); // o tour SEMPRE começa pelo primeiro lugar (antes pulava os "já visitados" e parecia que já estava em andamento)
}
function tourGo(i) { // vai (andando) até a parada i
  const s = tourStops(); if (i >= s.length) { TOUR.phase = 'end'; tourRender(true); return; }
  TOUR.on = true; TOUR.i = i; TOUR.phase = 'walk'; TOUR.retry = 0; walkToZone(tourZone(s[i])); tourRender(true);
}
function tourExit() { TOUR.on = false; TOUR.phase = 'idle'; tourRender(true); announce('Tour encerrado. Você pode continuar explorando; o botão no pé da tela mostra o próximo lugar.'); }
function tourOpenHere() { const id = tourStops()[TOUR.i]; TOUR.seen[id] = true; openPanel(tourZone(id)); } // abrir pelo tour também conta como visitado

function dockEl() {
  if (TOUR.dock) return TOUR.dock;
  const d = document.createElement('div'); d.id = 'dock'; d.className = 'dock'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Guia do passeio'); d.hidden = true;
  document.querySelector('.hud').appendChild(d);
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-d]'); if (!b) return; const a = b.dataset.d, s = tourStops();
    if (a === 'start') tourStart();
    else if (a === 'open') tourOpenHere();
    else if (a === 'next') tourGo(TOUR.i + 1);
    else if (a === 'prev') tourGo(TOUR.i - 1);
    else if (a === 'goto') tourGo(+b.dataset.i);
    else if (a === 'resume') tourGo(TOUR.i);
    else if (a === 'exit') tourExit();
    else if (a === 'stamps') { TOUR.on = false; TOUR.phase = 'idle'; tourRender(true); openStamps(); }
    else if (a === 'again') tourGo(0);
  });
  TOUR.dock = d; return d;
}
// os pontinhos do topo são botões: tocar num deles leva direto àquele lugar (dá para voltar ou pular para qualquer parada)
const dots = (s, cur) => '<span class="dk-dots">' + s.map((id, k) => '<button type="button" class="dk-dot ' + (tourVisited(id) ? 'on ' : '') + (TOUR.on && k === cur ? 'cur' : '') + '" data-d="goto" data-i="' + k + '" aria-label="Ir para ' + ((TOUR_INFO[id] || {}).name || id) + (k === cur ? ' (lugar atual)' : '') + '"><i></i></button>').join('') + '</span>';
const prevBtn = '<button class="dk-btn" type="button" data-d="prev">‹ Voltar</button>';
function tourRender(force) {
  const d = dockEl(), s = tourStops(), done = s.filter(tourVisited).length;
  const blocked = phase !== 'world' || panelOpen || guideOpen || mailUi.isOpen;              // com uma janela aberta, o dock some (e o foco do teclado não cai nele)
  const cinBar = typeof cinEl !== 'undefined' && cinEl.sel && !cinEl.sel.hidden;              // a barra de filmes do cinema ocupa o mesmo lugar: aí o dock sobe para o topo
  const cardOn = !hud.card.hidden;                                                            // o cartão "toque para abrir" ocupa o topo: no modo compacto o dock espera
  const compact = !TOUR.on;
  const hide = blocked || (compact && (cinBar || cardOn)) || !s.length;
  const key = [TOUR.on, TOUR.phase, TOUR.i, done, hide, cinBar].join('|');
  if (!force && key === TOUR.key) return;
  TOUR.key = key; d.hidden = hide; d.classList.toggle('up', !!(TOUR.on && cinBar)); document.body.classList.toggle('touring', TOUR.on);
  if (hide) return;
  const hadFocus = d.contains(document.activeElement), cur = s[TOUR.i], info = TOUR_INFO[cur] || { name: cur, text: '', open: 'Abrir' };
  let html = '';
  if (!TOUR.on) { // modo compacto: uma frase e um botão
    if (done >= s.length) html = '<button class="dk-pill" type="button" data-d="start" aria-label="Você viu todos os lugares. Refazer o tour."><span class="dk-ic" aria-hidden="true">✦</span><span class="dk-tx"><b>Você viu tudo!</b><small>Toque para refazer o tour</small></span><span class="dk-go" aria-hidden="true">›</span></button>';
    else {
      html = '<button class="dk-pill" type="button" data-d="start" aria-label="Fazer o tour pelos ' + s.length + ' lugares do mundo.' + (done ? ' Você já viu ' + done + '.' : '') + '">' +
        '<span class="dk-ic" aria-hidden="true">🧭</span><span class="dk-tx"><b>Fazer o tour: ' + s.length + ' lugares</b><small>' + (done ? done + ' de ' + s.length + ' já visitados' : 'a personagem te leva, é rápido') + '</small></span><span class="dk-go" aria-hidden="true">›</span></button>'; }
  } else if (TOUR.phase === 'walk') {
    html = '<div class="dk-box"><p class="dk-top">' + dots(s, TOUR.i) + '<span>' + (TOUR.i + 1) + ' de ' + s.length + '</span></p><h2>Indo para ' + info.name + '…</h2>' +
      '<p class="dk-p">' + (touch ? 'Dica: se quiser andar você mesmo, arraste o joystick (o círculo no canto esquerdo).' : 'Dica: se quiser andar você mesmo, use W A S D ou as setas.') + '</p>' +
      '<div class="dk-acts">' + (TOUR.i > 0 ? prevBtn : '') + '<button class="dk-btn" type="button" data-d="next">Pular este lugar</button><button class="dk-btn quiet" type="button" data-d="exit">Sair do tour</button></div></div>';
  } else if (TOUR.phase === 'stopped') {
    html = '<div class="dk-box"><p class="dk-top">' + dots(s, TOUR.i) + '<span>' + (TOUR.i + 1) + ' de ' + s.length + '</span></p><h2>Você tomou o controle</h2><p class="dk-p">Sem problema! Quando quiser, eu levo você até ' + info.name + '.</p>' +
      '<div class="dk-acts"><button class="dk-btn primary" type="button" data-d="resume">Continuar até ' + info.name + '</button>' + (TOUR.i > 0 ? prevBtn : '') + '<button class="dk-btn quiet" type="button" data-d="exit">Sair do tour</button></div></div>';
  } else if (TOUR.phase === 'here') {
    const seen = tourVisited(cur), nx = s[TOUR.i + 1], nxName = nx ? (TOUR_INFO[nx] || {}).name : null;
    html = '<div class="dk-box"><p class="dk-top">' + dots(s, TOUR.i) + '<span>' + (TOUR.i + 1) + ' de ' + s.length + '</span></p><h2>' + info.name + '</h2><p class="dk-p">' + info.text + '</p>' +
      '<div class="dk-acts">' + (seen ? '<button class="dk-btn primary" type="button" data-d="next">' + (nxName ? 'Próximo: ' + nxName + ' ›' : 'Terminar o tour ›') + '</button><button class="dk-btn" type="button" data-d="open">Ver de novo</button>'
        : '<button class="dk-btn primary" type="button" data-d="open">' + info.open + '</button><button class="dk-btn" type="button" data-d="next">' + (nxName ? 'Próximo: ' + nxName + ' ›' : 'Terminar ›') + '</button>') +
      (TOUR.i > 0 ? prevBtn : '') + '<button class="dk-btn quiet" type="button" data-d="exit">Sair</button></div></div>';
  } else if (TOUR.phase === 'end') {
    html = '<div class="dk-box"><p class="dk-top">' + dots(s, -1) + '<span>fim do tour</span></p><h2>Pronto, agora o mundo é seu ✦</h2><p class="dk-p">Procure as gatas, a lagoa, a cerejeira e o balanço: cada descoberta rende um selo.</p>' +
      '<div class="dk-acts"><button class="dk-btn primary" type="button" data-d="stamps">Ver o álbum de selos</button>' + prevBtn + '<button class="dk-btn" type="button" data-d="again">Refazer o tour</button><button class="dk-btn quiet" type="button" data-d="exit">Explorar sozinho</button></div></div>';
  }
  d.innerHTML = html;
  if (TOUR.on) announce(TOUR.phase === 'walk' ? 'Indo para ' + info.name + '.' : TOUR.phase === 'here' ? info.name + '. ' + info.text : TOUR.phase === 'stopped' ? 'Tour em pausa.' : 'Fim do tour.');
  if (hadFocus || (TOUR.on && TOUR.phase !== 'walk')) { const f = d.querySelector('.primary') || d.querySelector('button'); if (f && !d.contains(document.activeElement)) { try { f.focus({ preventScroll: true }); } catch (e) { /* sem foco: tudo bem */ } } }
}
function tourTick() { // roda a cada 350 ms: decide a fase do tour olhando onde a personagem está
  if (phase !== 'world') return;
  if (TOUR.on && !panelOpen && !guideOpen && !mailUi.isOpen) {
    const s = tourStops(), z = s[TOUR.i] && tourZone(s[TOUR.i]);
    if (z && (TOUR.phase === 'walk' || TOUR.phase === 'stopped')) {
      const dist = Math.hypot(player.position.x - z.pos[0], player.position.z - z.pos[2]), reach = (z.r || 5.5 * (z.size || 1)) * 0.9;
      if (dist < reach) TOUR.phase = 'here';                       // chegou
      else if (TOUR.phase === 'walk' && !auto.on) { // parou antes de chegar: ou a pessoa assumiu o controle, ou a personagem esbarrou em algo (bilheteria, cerca...)
        const userMoving = Object.values(keys).some(Boolean) || Math.hypot(stick.x, stick.y) > 0.1;
        if (userMoving || TOUR.retry >= 6) TOUR.phase = 'stopped';
        else { // esbarrou: contorna. Tentativas ímpares dão um passo de lado (para a direita, depois para a esquerda), as pares voltam a seguir para o lugar.
          TOUR.retry++;
          if (TOUR.retry % 2) {
            const dx = z.pos[0] - player.position.x, dz = z.pos[2] - player.position.z, dl = Math.hypot(dx, dz) || 1, side = TOUR.retry % 4 === 1 ? 1 : -1;
            walkTo(player.position.x + dx / dl * 5 - dz / dl * 9 * side, player.position.z + dz / dl * 5 + dx / dl * 9 * side);
          } else walkToZone(z);
        }
      }
      else if (TOUR.phase === 'stopped' && auto.on) TOUR.phase = 'walk';
    }
  }
  tourRender(false);
}
setInterval(tourTick, 350);
