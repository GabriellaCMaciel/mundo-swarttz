// A tela das cartas: um carrossel de envelopes (um por depoimento da lista `letters` em config.js).
// Trocar de carta: setas na tela, setas do teclado, clicar numa carta do lado, arrastar ou girar a rodinha do mouse.
// Clicar na carta do meio: a aba do envelope abre, a carta DOBRADA em três sobe de dentro, vai para o centro da tela e se desdobra.
//
// COMO A ANIMAÇÃO FUNCIONA (conceito importante): uma "linha do tempo" única.
// Em vez de várias transições CSS soltas (que não sabem voltar direito), existe UM relógio, `ts` (em segundos, de 0 a TT), e uma
// função renderLetter(ts) que desenha o quadro exato daquele instante: onde está a aba, a altura da carta, o ângulo de cada dobra.
//  - Abrir  = fazer o relógio andar de 0 até TT.
//  - Fechar = fazer o relógio andar de TT de volta até 0. É exatamente o filme ao contrário, por isso a física fica coerente.
//  - Se a pessoa fechar no meio da abertura, o relógio só muda de direção a partir de onde estava.
// A carta de verdade é uma folha com três pedaços (painéis) ligados por dobradiças. Cada painel gira em volta da sua borda
// (transform-origin) com rotateX em 3D, como papel de verdade dobrado em três, e as duas faces (frente escrita, verso em branco)
// usam backface-visibility para só aparecer a que está virada para você.
'use strict';

const mailUi = {
  root: document.getElementById('mail'), track: null, dots: document.getElementById('mailDots'), count: document.getElementById('mailCount'),
  big: document.getElementById('paperBig'), openBtn: document.getElementById('mailOpenBtn'), back: document.getElementById('letterBack'),
  envs: [], cur: 0, isOpen: false, scale: 1,
  state: 'closed',            // 'closed' | 'opening' | 'open' | 'closing'
  reading: false, lock: false // reading = há uma carta aberta/abrindo; lock = animação em andamento
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ENV_W = 340, ENV_H = 230, SPACING = 250; // tamanho do envelope e distância entre eles (em px, antes do ajuste de escala)

function envHtml(l, i) {
  return '<div class="env" data-i="' + i + '" role="button" aria-label="Carta de ' + esc(l.who) + '"><div class="env-bob">' +
    '<div class="env-back"></div>' +
    '<div class="env-front"><svg viewBox="0 0 340 230" aria-hidden="true"><polygon points="0,0 170,122 0,230" fill="#f1e1cf"/><polygon points="340,0 170,122 340,230" fill="#ecd9c4"/>' +
    '<polygon points="0,230 170,116 340,230" fill="#f8ecde"/><path d="M0 0 L170 122 L340 0 M0 230 L170 116 L340 230" fill="none" stroke="rgba(150,110,80,.35)" stroke-width="1.5"/></svg></div>' +
    '<div class="env-from"><small>De</small><b>' + esc(l.who) + '</b></div>' +
    '<div class="env-stamp"><i></i></div>' +
    '<div class="env-flap"><div class="f-out"><svg viewBox="0 0 340 125" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,0 340,0 170,125" fill="#fbf0e2" stroke="rgba(150,110,80,.4)" stroke-width="1.5"/></svg><span class="env-seal">♥</span></div>' +
    '<div class="f-in"><svg viewBox="0 0 340 125" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,0 340,0 170,125" fill="#d6b99f" stroke="rgba(120,80,60,.4)" stroke-width="1.5"/></svg></div></div>' +
    '</div></div>';
}

function buildMail() {
  mailUi.track = document.createElement('div'); mailUi.track.className = 'mail-track';
  mailUi.track.innerHTML = letters.map(envHtml).join('');
  document.getElementById('mailStage').replaceChildren(mailUi.track);
  mailUi.envs = [...mailUi.track.querySelectorAll('.env')];
  mailUi.dots.innerHTML = letters.map((_, i) => '<button type="button" data-dot="' + i + '" aria-label="Carta ' + (i + 1) + '"></button>').join('');
  const petals = mailUi.root.querySelector('.mail-petals');
  if (!petals.children.length) for (let i = 0; i < 16; i++) { // pétalas caindo ao fundo (puro enfeite)
    const p = document.createElement('i'); p.style.cssText = 'left:' + (Math.random() * 100) + '%;animation-delay:' + (-Math.random() * 14) + 's;animation-duration:' + (9 + Math.random() * 8) + 's;--s:' + (0.6 + Math.random() * 0.9); petals.appendChild(p);
  }
}

function fit() { // ajusta o tamanho do carrossel à tela (celular ou computador)
  const st = document.getElementById('mailStage').getBoundingClientRect();
  mailUi.scale = Math.max(0.5, Math.min(1.15, innerWidth * 0.82 / ENV_W, (st.height - 20) / (ENV_H + 190)));
  if (mailUi.track) mailUi.track.style.transform = 'scale(' + mailUi.scale + ')';
}

function layout() { // posição de cada envelope: o do meio de frente, os outros ficando para trás e girados
  const sp = Math.min(SPACING, (innerWidth / mailUi.scale) * 0.36);
  mailUi.envs.forEach((el, i) => {
    const o = i - mailUi.cur, a = Math.abs(o);
    el.style.transform = 'translate(-50%,-50%) translateX(' + (o * sp) + 'px) translateZ(' + (-a * 150) + 'px) rotateY(' + (-o * 26) + 'deg) scale(' + (o === 0 ? 1 : 0.92) + ')';
    el.style.opacity = a > 2 ? 0 : 1 - a * 0.28;
    el.style.zIndex = 10 - a; el.style.pointerEvents = a > 2 ? 'none' : 'auto';
    el.classList.toggle('cur', o === 0);
  });
  mailUi.count.textContent = (mailUi.cur + 1) + ' de ' + letters.length;
  mailUi.dots.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', String(i === mailUi.cur)));
  if (mailUi.isOpen && mailUi.said !== mailUi.cur) announce('Carta ' + (mailUi.cur + 1) + ' de ' + letters.length + ', de ' + letters[mailUi.cur].who + '. Aperte Enter para abrir.');
  mailUi.said = mailUi.cur; // só avisa quando a carta muda (e não a cada redimensionamento da janela)
  mailUi.root.querySelector('.prev').disabled = mailUi.cur === 0;
  mailUi.root.querySelector('.next').disabled = mailUi.cur === letters.length - 1;
}

function mailGo(i) {
  if (mailUi.state !== 'closed') return;
  mailUi.cur = Math.max(0, Math.min(letters.length - 1, i)); layout();
}

// ===================== A CARTA: conteúdo, folha de três painéis e linha do tempo =====================
function letterInner(l) { // o miolo da carta (usado na folha que dobra e na versão final, que rola)
  // .paper-flow = tudo menos a assinatura. A folha é uma coluna flex e a assinatura tem margin-top:auto,
  // então ela sempre vai para o canto inferior direito da folha, não importa o tamanho do texto.
  return '<div class="paper-flow">' + (l.photo ? '<img class="paper-photo" src="' + esc(l.photo) + '" alt="">' : '') +
    '<span class="p-tag">' + esc(l.cat) + '</span><p class="paper-greet">' + esc(l.greeting || 'Querida Gabriella,') + '</p>' +
    '<div class="paper-text">' + esc(l.text).split(/\n+/).map(t => '<p>' + t + '</p>').join('') + '</div></div>' +
    '<p class="paper-sign">com carinho,<b>' + esc(l.who) + '</b></p>';
}

const TT = 3.6;             // duração total da abertura, em segundos de "linha do tempo"
const POCKET_BOTTOM = 206, RISE = 190; // dentro do envelope: onde a base da carta dobrada fica e quanto ela sobe (px do envelope)
const T_OVERLAY = 1.5;      // a partir daqui a carta sai do envelope e passa a voar solta pela tela
const SHEET = { el: null, p1: null, p3: null, sh: [], shadow: null, geo: null, overlay: false };
const anim = { ts: 0, dir: 0, raf: 0, last: 0 };
const clamp01 = t => Math.max(0, Math.min(1, t));
const soft = t => t * t * (3 - 2 * t);                          // suaviza o começo e o fim (smoothstep)
const easeCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

function prepLetter() { // mede onde a carta vai ficar lida e monta a folha de três painéis
  const l = letters[mailUi.cur], big = mailUi.big, inner = letterInner(l);
  big.innerHTML = inner; big.style.height = ''; big.hidden = false; big.style.visibility = 'hidden';
  let r = big.getBoundingClientRect();
  const h = Math.floor(r.height / 102) * 34, H = h * 3; // h múltiplo de 34 (a altura de uma linha da pauta)
  big.style.height = H + 'px'; r = big.getBoundingClientRect();
  big.hidden = true; big.style.visibility = ''; big.scrollTop = 0;
  const W = r.width;

  const page = off => '<div class="paper-big paper-page" style="width:' + W + 'px;height:' + H + 'px;top:' + (-off) + 'px">' + inner + '</div>';
  const face = (cls, off) => '<div class="sh-face ' + cls + '">' + (off === null ? '' : page(off)) + '<i class="sh-shade"></i></div>';
  const el = document.createElement('div'); el.className = 'sheet3d'; el.style.cssText = 'width:' + W + 'px;height:' + H + 'px';
  el.innerHTML = '<i class="sh-shadow"></i>' +
    '<div class="sh-panel p2" style="top:' + h + 'px;height:' + h + 'px">' + face('front e-t e-b', h) + '</div>' +
    '<div class="sh-panel p1" style="top:0;height:' + h + 'px">' + face('front e-b', 0) + face('back e-t', null) + '</div>' +
    '<div class="sh-panel p3" style="top:' + 2 * h + 'px;height:' + h + 'px">' + face('front e-t', 2 * h) + face('back e-b', null) + '</div>';
  SHEET.el = el; SHEET.p1 = el.querySelector('.p1'); SHEET.p3 = el.querySelector('.p3');
  SHEET.sh = [...el.querySelectorAll('.p1 .sh-shade'), ...el.querySelectorAll('.p3 .sh-shade')];
  SHEET.shadow = el.querySelector('.sh-shadow'); SHEET.overlay = false; el.style.zIndex = 2; // z-index 2: entre o fundo do envelope (1) e a frente dele (3)

  const env = mailUi.envs[mailUi.cur], bobEl = env.querySelector('.env-bob'), er = bobEl.getBoundingClientRect(), sc = er.width / ENV_W;
  bobEl.appendChild(el); // começa dentro do envelope
  const k0 = 296 / W; // a carta dobrada, dentro do envelope, tem 296px de largura (em px do envelope)
  SHEET.geo = {
    W, H, h, k0, sc, er,
    cx0: er.left + (22 + 148) * sc, cy0: er.top + (POCKET_BOTTOM - RISE - h * k0 / 2) * sc, // onde o centro da carta dobrada está quando sai do envelope (tela)
    cxF: r.left + W / 2, cyF: r.top + H / 2,                                                // onde o centro da carta lida fica (tela)
    kC: Math.min(0.9, (innerWidth - 24) / W)                                                // tamanho da carta ainda dobrada, no meio da tela
  };
}

function renderLetter(ts) { // desenha o quadro do instante ts (0 = envelope fechado, TT = carta aberta e lida)
  const S = SHEET, g = S.geo, seg = (a, b) => clamp01((ts - a) / (b - a));
  const env = mailUi.envs[mailUi.cur], bob = env.querySelector('.env-bob'), flap = env.querySelector('.env-flap');

  // 1) A aba gira 180° em volta da borda de cima (0 a 0,7 s). Ao passar da metade ela vai para trás do papel.
  const fA = soft(seg(0, 0.7));
  flap.style.transform = 'perspective(800px) rotateX(' + fA * 180 + 'deg)'; flap.style.zIndex = fA > 0.5 ? 1 : 4;

  // 2) Onde a folha mora neste instante: dentro do envelope ou solta na tela
  const over = ts >= T_OVERLAY;
  if (over !== S.overlay) {
    (over ? mailUi.root : bob).appendChild(S.el); S.overlay = over;
    S.el.style.zIndex = over ? 30 : 2;
    mailUi.root.classList.toggle('reading', over);
  }
  if (!over) { // sobe de dentro do envelope (0,5 a 1,5 s), ainda dobrada e atrás da frente do envelope
    const y = POCKET_BOTTOM - RISE * easeCubic(seg(0.5, 1.5)) - 2 * g.h * g.k0;
    S.el.style.transform = 'translate(22px,' + y + 'px) scale(' + g.k0 + ')';
  } else { // sai do envelope, vai para o centro e cresce (1,5 a 2,5 s), depois se desdobra e termina de crescer (até 3,6 s)
    const fC = easeCubic(seg(T_OVERLAY, 2.5)), kS = g.k0 * g.sc;
    const k = ts < 2.5 ? lerp(kS, g.kC, fC) : lerp(g.kC, 1, soft(seg(2.5, TT)));
    const cx = lerp(g.cx0, g.cxF, fC), cy = lerp(g.cy0, g.cyF, fC);
    S.el.style.transform = 'translate(' + (cx - k * g.W / 2) + 'px,' + (cy - k * g.H / 2) + 'px) scale(' + k + ')';
  }

  // 3) As dobradiças: o painel de cima desdobra primeiro (2,4 a 3,1 s), o de baixo logo depois (2,9 a 3,6 s).
  // O ângulo vai de 180° (deitado em cima do painel do meio) até 0° (aberto, plano). O sinal escolhe para que lado ele gira.
  const t1 = 180 * (1 - easeCubic(seg(2.4, 3.1))), t3 = 180 * (1 - easeCubic(seg(2.9, TT)));
  S.p1.style.transform = 'translateZ(4px) rotateX(' + (-t1) + 'deg)';
  S.p3.style.transform = 'translateZ(2px) rotateX(' + t3 + 'deg)';
  const s1 = 0.32 * Math.sin(t1 * Math.PI / 180), s3 = 0.32 * Math.sin(t3 * Math.PI / 180); // sombra: o papel escurece quando está inclinado
  S.sh[0].style.opacity = S.sh[1].style.opacity = s1; S.sh[2].style.opacity = S.sh[3].style.opacity = s3;
  // sombra da folha: cobre só o trecho que já está aberto
  const top = g.h - g.h * Math.max(0, Math.cos(t1 * Math.PI / 180)), bottom = 2 * g.h + g.h * Math.max(0, Math.cos(t3 * Math.PI / 180));
  S.shadow.style.top = top + 'px'; S.shadow.style.height = (bottom - top) + 'px';
}

function stepLetter(now) {
  // Math.max(0, ...): o relógio do requestAnimationFrame pode ser um pouquinho ANTERIOR ao performance.now() de quando o clique aconteceu.
  // Sem isso o primeiro quadro tinha dt negativo, a carta "voltava" para antes do começo e fechava sozinha logo depois de abrir (acontecia só às vezes).
  const dt = Math.max(0, Math.min((now - anim.last) / 1000, 0.05)); anim.last = now;
  anim.ts += anim.dir * dt * (anim.dir > 0 ? 1 : 1.2); // fechar é um pouquinho mais rápido
  if (anim.ts >= TT) { anim.ts = TT; anim.dir = 0; renderLetter(TT); return finishOpen(); }
  if (anim.dir < 0 && anim.ts <= 0) { anim.ts = 0; anim.dir = 0; renderLetter(0); return finishClose(); }
  renderLetter(anim.ts); anim.raf = requestAnimationFrame(stepLetter);
}
function playLetter(dir) { anim.dir = dir; anim.last = performance.now(); cancelAnimationFrame(anim.raf); anim.raf = requestAnimationFrame(stepLetter); }

function finishOpen() { // a carta está plana e aberta: trocamos a folha 3D pela versão que rola (idêntica por fora)
  mailUi.state = 'open'; mailUi.lock = false;
  mailUi.big.hidden = false; mailUi.big.scrollTop = 0; SHEET.el.style.display = 'none';
  mailUi.big.setAttribute('tabindex', '-1'); mailUi.big.setAttribute('aria-label', 'Carta de ' + letters[mailUi.cur].who);
  mailUi.big.focus({ preventScroll: true }); // o leitor de tela começa a ler a carta (as teclas Esc, etc. continuam valendo: o tratamento é na janela)
}
function finishClose() { // a carta voltou para dentro do envelope e a aba fechou
  if (SHEET.el) SHEET.el.remove();
  SHEET.el = null; mailUi.big.hidden = true;
  const env = mailUi.envs[mailUi.cur];
  if (env) { env.querySelector('.env-bob').style.animationPlayState = ''; env.querySelector('.env-flap').style.cssText = ''; }
  mailUi.root.classList.remove('opening', 'reading');
  mailUi.state = 'closed'; mailUi.reading = false; mailUi.lock = false;
  setMailHint(false);
  mailUi.root.focus({ preventScroll: true });
}

// Instrução de controles da tela das cartas (canto inferior direito): uma para escolher a carta e outra para a carta aberta
function setMailHint(reading) {
  const t = typeof touch !== 'undefined' && touch;
  document.getElementById('mailKeys').textContent = reading
    ? (t ? 'toque fora da carta ou no ✕ para voltar' : 'clique fora da carta, ✕ ou Esc para voltar')
    : (t ? 'arraste para trocar · toque na carta para abrir' : 'setas, arrastar ou rodinha para trocar · clique ou Enter para abrir · Esc volta');
}
function openEnvelope() { // clicou no envelope do meio
  if (mailUi.state !== 'closed' || !letters.length) return;
  setMailHint(true);
  mailUi.envs[mailUi.cur].querySelector('.env-bob').style.animationPlayState = 'paused'; // o balanço do envelope para (a carta não "sai" de algo que balança)
  prepLetter(); anim.ts = 0; renderLetter(0);
  mailUi.state = 'opening'; mailUi.reading = true; mailUi.lock = true; mailUi.root.classList.add('opening');
  playLetter(1);
}
function closeLetter() { // X do canto, Esc ou botão: roda o filme de trás para frente, a partir de onde estiver
  if (mailUi.state !== 'open' && mailUi.state !== 'opening') return;
  if (mailUi.state === 'open') { renderLetter(TT); SHEET.el.style.display = ''; mailUi.big.hidden = true; } // volta à folha 3D no mesmo lugar
  mailUi.state = 'closing'; mailUi.lock = true;
  playLetter(-1);
}

function openMail() {
  if (!letters.length) return;
  if (!mailUi.track) buildMail();
  mailUi.isOpen = true; mailUi.cur = Math.min(mailUi.cur, letters.length - 1);
  abortLetter(); mailUi.root.hidden = false; mailUi.said = -1; fit(); layout();
  mailUi.root.focus({ preventScroll: true }); // o foco fica na tela (não em um botão), para Enter abrir a carta
  setMailHint(false); syncLoop();
}
function abortLetter() { // para qualquer animação e deixa tudo no estado "fechado" (usado ao abrir e ao fechar a tela)
  cancelAnimationFrame(anim.raf); anim.dir = 0; anim.ts = 0;
  if (SHEET.el) { SHEET.el.remove(); SHEET.el = null; }
  mailUi.envs.forEach(e => { e.querySelector('.env-bob').style.animationPlayState = ''; e.querySelector('.env-flap').style.cssText = ''; });
  mailUi.big.hidden = true; mailUi.root.classList.remove('opening', 'reading');
  mailUi.state = 'closed'; mailUi.reading = false; mailUi.lock = false;
}
function closeMail() { abortLetter(); mailUi.isOpen = false; mailUi.root.hidden = true; panelOpen = false; syncLoop(); }

// Esc volta da carta e, depois, fecha a tela; setas trocam de carta; Enter/Espaço abrem a carta do meio
function mailKey(e) {
  if (!mailUi.isOpen) return false;
  if (e.code === 'Escape') { if (mailUi.state === 'closed') closeMail(); else closeLetter(); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') mailGo(mailUi.cur + 1);
  else if (e.code === 'ArrowLeft' || e.code === 'KeyA') mailGo(mailUi.cur - 1);
  else if ((e.code === 'Enter' || e.code === 'Space') && mailUi.state === 'closed' && !e.target.closest('button')) { e.preventDefault(); openEnvelope(); }
  else return true; // consome as outras teclas (o personagem não anda com a tela aberta)
  return true;
}

// ----- Mouse, toque e botões -----
(function wire() {
  const root = mailUi.root, stage = document.getElementById('mailStage');
  root.querySelector('.mail-close').addEventListener('click', closeMail);
  mailUi.back.addEventListener('click', closeLetter); // o X solto no canto superior direito: fora da carta
  root.tabIndex = -1;
  root.querySelector('.prev').addEventListener('click', () => { mailGo(mailUi.cur - 1); root.focus({ preventScroll: true }); });
  root.querySelector('.next').addEventListener('click', () => { mailGo(mailUi.cur + 1); root.focus({ preventScroll: true }); });
  mailUi.openBtn.addEventListener('click', openEnvelope);
  mailUi.dots.addEventListener('click', e => { const b = e.target.closest('[data-dot]'); if (b) { mailGo(+b.dataset.dot); root.focus({ preventScroll: true }); } });
  let sx = null, moved = false, dragged = false;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; moved = false; dragged = false; });
  stage.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { moved = true; dragged = true; mailGo(mailUi.cur + (dx < 0 ? 1 : -1)); }
  });
  stage.addEventListener('click', e => { // clicar numa carta: se for do lado, ela vem para o meio; se for a do meio, abre
    if (moved) { moved = false; return; }
    const el = e.target.closest('.env'); if (!el) return;
    e.envHandled = true; // avisa o clique-fora (logo abaixo) que este clique já foi usado num envelope
    const i = +el.dataset.i;
    if (i === mailUi.cur) openEnvelope(); else mailGo(i);
  });
  // CLICAR FORA FECHA O QUE FOI ABERTO (regra do site inteiro: quem abre algo com um clique, fecha com um clique na parte de fora).
  // Carta aberta: clicar fora do papel fecha a carta (volta para o envelope). Só os envelopes na tela: clicar no vazio fecha a tela dos correios.
  // "Dentro" = papel, envelopes, botões e setas. O arrasto para trocar de carta não conta como clique.
  root.addEventListener('click', e => {
    if (dragged) { dragged = false; return; }
    if (e.envHandled) return;
    if (e.target.closest('button, .mail-dots, .mail-keys')) return;
    if (mailUi.state !== 'closed') { if (!e.target.closest('.paper-big, .sheet3d')) closeLetter(); }
    else if (!e.target.closest('.env')) closeMail();
  });
  let wheelAt = 0;
  root.addEventListener('wheel', e => { // rodinha do mouse (ou touchpad) troca de carta
    if (mailUi.state !== 'closed' || performance.now() - wheelAt < 380) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 8) return; wheelAt = performance.now(); mailGo(mailUi.cur + (d > 0 ? 1 : -1));
  }, { passive: true });
  addEventListener('resize', () => { if (mailUi.isOpen) { fit(); layout(); } });
})();
