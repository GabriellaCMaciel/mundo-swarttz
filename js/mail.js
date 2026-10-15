// A tela das cartas: um carrossel de envelopes (um por depoimento da lista `letters` em config.js).
// Trocar de carta: setas na tela, setas do teclado, clicar numa carta do lado, arrastar ou girar a rodinha do mouse.
// Clicar na carta do meio: o envelope abre (a aba gira), o papel sobe de dentro dele e vira a carta para ler.
// Conceitos: classes CSS que disparam transições (a animação é feita pelo CSS; o JS só liga e desliga classes),
// "FLIP" (medir onde o papel está e onde vai ficar, e animar a diferença) e "async/await" para encadear etapas.
'use strict';

const mailUi = {
  root: document.getElementById('mail'), track: null, dots: document.getElementById('mailDots'), count: document.getElementById('mailCount'),
  big: document.getElementById('paperBig'), openBtn: document.getElementById('mailOpenBtn'),
  envs: [], cur: 0, isOpen: false, reading: false, lock: false, scale: 1
};
const wait = ms => new Promise(r => setTimeout(r, ms));
// Espera uma transição CSS terminar de verdade (com um limite de tempo, caso o navegador não avise)
const waitTransition = (el, prop, max) => new Promise(res => {
  const done = () => { el.removeEventListener('transitionend', on); res(); };
  const on = e => { if (e.target === el && e.propertyName === prop) done(); };
  el.addEventListener('transitionend', on); setTimeout(done, max);
});
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ENV_W = 340, ENV_H = 230, SPACING = 250; // tamanho do envelope e distância entre eles (em px, antes do ajuste de escala)

function envHtml(l, i) {
  return '<div class="env" data-i="' + i + '" role="button" aria-label="Carta de ' + esc(l.who) + '"><div class="env-bob">' +
    '<div class="env-back"></div>' +
    '<div class="env-paper"><span class="p-tag">' + esc(l.cat) + '</span><p>' + esc(l.text) + '</p></div>' +
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
  mailUi.root.querySelector('.prev').disabled = mailUi.cur === 0;
  mailUi.root.querySelector('.next').disabled = mailUi.cur === letters.length - 1;
}

function mailGo(i) {
  if (mailUi.lock || mailUi.reading) return;
  mailUi.cur = Math.max(0, Math.min(letters.length - 1, i)); layout();
}

async function openEnvelope() { // 1) a aba gira  2) o papel sobe  3) o papel cresce e vira a carta
  if (mailUi.lock || mailUi.reading || !letters.length) return;
  mailUi.lock = true;
  const el = mailUi.envs[mailUi.cur], small = el.querySelector('.env-paper'); el.classList.add('open');
  await waitTransition(small, 'transform', 3500); // espera o papel terminar de subir
  await wait(150);
  const l = letters[mailUi.cur], big = mailUi.big;
  big.innerHTML = '<button class="paper-back" type="button">← voltar às cartas</button>' +
    (l.photo ? '<img class="paper-photo" src="' + esc(l.photo) + '" alt="">' : '') +
    '<span class="p-tag">' + esc(l.cat) + '</span><p class="paper-greet">' + esc(l.greeting || 'Querida Gabriella,') + '</p>' +
    '<div class="paper-text">' + esc(l.text).split(/\n+/).map(t => '<p>' + t + '</p>').join('') + '</div>' +
    '<p class="paper-sign">com carinho,<b>' + esc(l.who) + '</b></p>';
  big.scrollTop = 0; big.hidden = false; big.style.transition = 'none'; big.style.transform = 'none'; big.style.opacity = '1';
  const r0 = small.getBoundingClientRect(), r1 = big.getBoundingClientRect(); // FLIP: onde o papel está x onde vai ficar
  big.style.transformOrigin = '0 0';
  big.style.transform = 'translate(' + (r0.left - r1.left) + 'px,' + (r0.top - r1.top) + 'px) scale(' + (r0.width / r1.width) + ')';
  void big.offsetWidth; // força o navegador a "ver" o ponto de partida antes de animar
  big.style.transition = 'transform .85s cubic-bezier(.22,.8,.25,1)'; big.style.transform = 'none';
  small.style.opacity = '0'; mailUi.root.classList.add('reading'); mailUi.reading = true;
  await wait(900); mailUi.lock = false; big.querySelector('.paper-back').focus({ preventScroll: true });
}

async function closeLetter() { // o papel volta para o envelope, a aba fecha
  if (!mailUi.reading || mailUi.lock) return;
  mailUi.lock = true;
  const el = mailUi.envs[mailUi.cur], small = el.querySelector('.env-paper'), big = mailUi.big;
  const r0 = small.getBoundingClientRect(), r1 = big.getBoundingClientRect();
  mailUi.root.classList.remove('reading');
  big.style.transition = 'transform .7s cubic-bezier(.5,0,.3,1), opacity .25s .5s';
  big.style.transform = 'translate(' + (r0.left - r1.left) + 'px,' + (r0.top - r1.top) + 'px) scale(' + (r0.width / r1.width) + ')'; big.style.opacity = '0';
  await wait(750); big.hidden = true; small.style.opacity = '';
  el.classList.remove('open'); await wait(900);
  mailUi.reading = false; mailUi.lock = false;
}

function openMail() {
  if (!letters.length) return;
  if (!mailUi.track) buildMail();
  mailUi.isOpen = true; mailUi.cur = Math.min(mailUi.cur, letters.length - 1);
  mailUi.envs.forEach(e => e.classList.remove('open')); mailUi.big.hidden = true; mailUi.root.classList.remove('reading');
  mailUi.reading = false; mailUi.lock = false;
  mailUi.root.hidden = false; fit(); layout();
  mailUi.root.focus({ preventScroll: true }); // o foco fica na tela (não em um botão), para Enter abrir a carta
}
function closeMail() { mailUi.isOpen = false; mailUi.root.hidden = true; panelOpen = false; }

// Esc fecha a carta aberta e, depois, a tela; setas trocam de carta; Enter/Espaço abrem a carta do meio
function mailKey(e) {
  if (!mailUi.isOpen) return false;
  if (e.code === 'Escape') { if (mailUi.reading) closeLetter(); else closeMail(); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') mailGo(mailUi.cur + 1);
  else if (e.code === 'ArrowLeft' || e.code === 'KeyA') mailGo(mailUi.cur - 1);
  else if ((e.code === 'Enter' || e.code === 'Space') && !mailUi.reading && !e.target.closest('button')) { e.preventDefault(); openEnvelope(); }
  else return true; // consome as outras teclas (o personagem não anda com a tela aberta)
  return true;
}

// ----- Mouse, toque e botões -----
(function wire() {
  const root = mailUi.root, stage = document.getElementById('mailStage');
  root.querySelector('.mail-close').addEventListener('click', closeMail);
  root.tabIndex = -1;
  root.querySelector('.prev').addEventListener('click', () => { mailGo(mailUi.cur - 1); root.focus({ preventScroll: true }); });
  root.querySelector('.next').addEventListener('click', () => { mailGo(mailUi.cur + 1); root.focus({ preventScroll: true }); });
  mailUi.openBtn.addEventListener('click', openEnvelope);
  mailUi.dots.addEventListener('click', e => { const b = e.target.closest('[data-dot]'); if (b) { mailGo(+b.dataset.dot); root.focus({ preventScroll: true }); } });
  mailUi.big.addEventListener('click', e => { if (e.target.closest('.paper-back')) closeLetter(); });
  let sx = null, moved = false;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; moved = false; });
  stage.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { moved = true; mailGo(mailUi.cur + (dx < 0 ? 1 : -1)); }
  });
  stage.addEventListener('click', e => { // clicar numa carta: se for do lado, ela vem para o meio; se for a do meio, abre
    if (moved) { moved = false; return; }
    const el = e.target.closest('.env'); if (!el) return;
    const i = +el.dataset.i;
    if (i === mailUi.cur) openEnvelope(); else mailGo(i);
  });
  let wheelAt = 0;
  root.addEventListener('wheel', e => { // rodinha do mouse (ou touchpad) troca de carta
    if (mailUi.reading || performance.now() - wheelAt < 380) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 8) return; wheelAt = performance.now(); mailGo(mailUi.cur + (d > 0 ? 1 : -1));
  }, { passive: true });
  addEventListener('resize', () => { if (mailUi.isOpen) { fit(); layout(); } });
})();
