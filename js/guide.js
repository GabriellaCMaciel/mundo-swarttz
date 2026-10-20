// A tela de instruções: um "livro" 2D que abre assim que a pessoa entra no mundo (e pode ser reaberto pelo botão "?" no canto).
// Cada página tem duas metades: de um lado o texto curto com as palavras-chave em amarelo, do outro uma animação do hacker (a personagem)
// fazendo a ação: andar, correr, pular e interagir. A animação é feita só com SVG + CSS (css/guide.css): sem imagens, sem bibliotecas.
//
// CONCEITOS DESTE ARQUIVO
//  - Dados e visual separados: PAGES descreve o conteúdo; render() monta o HTML. Para mudar uma instrução, mexa só em PAGES.
//  - Virar a página: as páginas ficam empilhadas; a de cima ganha a classe "turned" e o CSS gira ela em torno da lombada (rotateY) com transição.
//  - Acessibilidade: é um diálogo (role="dialog"), o foco entra nele e volta ao fechar; Esc fecha; ← e → viram a página; as animações são
//    aria-hidden (o texto já diz tudo); com "reduzir movimento" as animações ficam paradas (classe "calm").
//  - Enquanto está aberta, o mundo fica pausado (guideOpen entra na conta de syncLoop em ui.js, como os painéis).
'use strict';

let guideOpen = false; // declarada aqui (e não em ui.js) porque ui.js usa em syncLoop e este arquivo é carregado antes dele

const GD = { el: null, page: 0, last: null };

// ----- o hacker (a mesma personagem do mundo: capuz roxo escuro, rosto preto, olhos e gola dourados) -----
function heroSvg() {
  return '<svg class="hero-svg" viewBox="0 0 120 160" aria-hidden="true" focusable="false">' +
    '<defs><radialGradient id="gAura" cx="50%" cy="60%" r="50%"><stop offset="0" stop-color="#7b3fe4" stop-opacity=".55"/><stop offset="1" stop-color="#7b3fe4" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="60" cy="96" r="58" fill="url(#gAura)"/>' +
    '<g class="h-fl"><ellipse cx="45" cy="150" rx="11" ry="6" fill="#07030d"/></g><g class="h-fr"><ellipse cx="75" cy="150" rx="11" ry="6" fill="#07030d"/></g>' +
    '<path class="h-cloak" d="M60 50 C86 68 98 116 102 148 H18 C22 116 34 68 60 50Z" fill="#2a1745" stroke="#7b3fe4" stroke-width="2"/>' +
    '<path class="h-arm" d="M82 84 Q100 74 112 60" fill="none" stroke="#2a1745" stroke-width="13" stroke-linecap="round"/><circle class="h-hand" cx="113" cy="58" r="7" fill="#07030d" stroke="#f2b84b" stroke-width="2"/>' +
    '<ellipse cx="60" cy="68" rx="22" ry="5.5" fill="none" stroke="#f2b84b" stroke-width="3"/>' +
    '<circle cx="60" cy="40" r="27" fill="#2a1745" stroke="#7b3fe4" stroke-width="2"/>' +
    '<ellipse cx="63" cy="43" rx="19" ry="17" fill="#07030d"/>' +
    '<g class="h-eyes"><circle cx="56" cy="43" r="3.6" fill="#f2b84b"/><circle cx="72" cy="43" r="3.6" fill="#f2b84b"/></g>' +
    '</svg>';
}

// ----- pedacinhos de desenho -----
const kbd = t => '<kbd>' + t + '</kbd>';
const hl = t => '<b class="hl">' + t + '</b>';   // palavra-chave em amarelo (o tom do site)
const ICON_RUN = '<svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="21" cy="6" r="3" fill="currentColor" stroke="none"/><path d="M18 11 L14 19M18 12 L23 15 L26 12M18 12 L13 11 L10 15M14 19 L19 23 L18 29M14 19 L9 22 L4 20"/><path d="M3 8 H8 M1.5 13 H6 M5 27 H10" stroke-width="2"/></svg>';
const ICON_JUMP = '<svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="16" cy="6" r="3" fill="currentColor" stroke="none"/><path d="M16 10 V19M16 12 L10 6M16 12 L22 6M16 19 L11 23 L12 27M16 19 L21 23 L20 27"/><path d="M6 31 Q16 27 26 31" stroke-width="2"/></svg>';
const ICON_ACC = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="7.3" r="1.5" fill="currentColor" stroke="none"/><path d="M6.8 9.8 H17.2 M12 9.8 V13.4 M12 13.4 L9.4 18 M12 13.4 L14.6 18"/></svg>';
const PIC_STICK = '<span class="pic pic-stick" aria-hidden="true"><i></i></span>';
const PIC_CLICK = '<span class="pic pic-click" aria-hidden="true"><i></i><u></u></span>';

// cena animada: kind = walk | run | jump | act ; caps = legendas que se revezam (ou ficam todas à mostra com "reduzir movimento")
function guideScene(kind, caps, pics) {
  return '<div class="g-scene s-' + kind + '" aria-hidden="true">' +
    '<div class="g-stars"></div><div class="g-ground"></div><div class="g-shadow"></div>' +
    (kind === 'act' ? '<div class="g-sign"><i></i><b></b></div><div class="g-key">E</div><div class="g-win"><i></i><i></i><i></i></div>' : '') +
    '<div class="g-hero">' + heroSvg() + '</div>' +
    (kind === 'run' ? '<div class="g-lines"><i></i><i></i><i></i><i></i></div>' : '') +
    '</div>' +
    '<div class="g-pics" aria-hidden="true">' + pics.map((p, i) => '<span class="g-pic c' + i + '">' + p + '</span>').join('') + '</div>' +
    '<div class="g-caps" aria-hidden="true">' + caps.map((c, i) => '<span class="c' + i + '">' + c + '</span>').join('') + '</div>';
}

// ----- o conteúdo: cada página = duas metades (esquerda e direita). "t" = texto, "a" = animação -----
const PAGES = [
  { title: 'Andar',
    halves: [
      { text: '<h2><span class="n">1</span>Andar</h2><p class="lead">Chegue a qualquer canto do mundo. Escolha o seu jeito:</p>' +
        '<ul class="g-list"><li><span class="k">Teclado</span>' + kbd('W') + kbd('A') + kbd('S') + kbd('D') + ' ou as ' + hl('setas') + '</li>' +
        '<li><span class="k">Celular</span>arraste o ' + hl('joystick') + ' do canto esquerdo</li>' +
        '<li><span class="k">Mouse ou toque</span>' + hl('clique no chão') + ': a personagem vai sozinha até lá</li></ul>' +
        '<p class="g-tip">Dica: não precisa segurar nada, é só clicar no chão.</p>' },
      { anim: () => guideScene('walk', ['Teclado: ' + hl('WASD') + ' ou ' + hl('setas'), 'Celular: ' + hl('joystick'), 'Mouse e toque: ' + hl('clique no chão')],
          ['<span class="kb">' + kbd('W') + kbd('A') + kbd('S') + kbd('D') + '</span>', PIC_STICK, PIC_CLICK]) }
    ] },
  { title: 'Correr e pular',
    halves: [
      { stack: true, anim: () => guideScene('run', ['Segure ' + hl('Shift') + ' e ande', ' ' + hl('R') + ' liga e desliga o "correr sempre"', 'Botão ' + hl('correr') + ' (canto da tela)'],
          [kbd('Shift'), kbd('R'), '<span class="ib">' + ICON_RUN + '</span>']),
        text: '<h2><span class="n">2</span>Correr</h2><ul class="g-list"><li><span class="k">Teclado</span>segure ' + hl('Shift') + ' enquanto anda</li>' +
          '<li><span class="k">Sempre</span>aperte ' + hl('R') + ' para ligar e desligar o "correr sempre"</li>' +
          '<li><span class="k">Celular e mouse</span>toque no botão ' + hl('correr') + ', no canto da tela</li></ul>' },
      { stack: true, anim: () => guideScene('jump', ['Aperte ' + hl('Espaço'), 'Botão ' + hl('pular') + ' (canto da tela)', 'Pule andando ou parado'],
          [kbd('Espaço'), '<span class="ib">' + ICON_JUMP + '</span>', '<span class="kb">' + kbd('↑') + '</span>']),
        text: '<h2><span class="n">3</span>Pular</h2><ul class="g-list"><li><span class="k">Teclado</span>aperte ' + hl('Espaço') + '</li>' +
          '<li><span class="k">Celular e mouse</span>toque no botão ' + hl('pular') + '</li>' +
          '<li><span class="k">Dica</span>dá para pular ' + hl('correndo') + ' e saltar mais longe</li></ul>' }
    ] },
  { title: 'Interagir',
    halves: [
      { text: '<h2><span class="n">4</span>Interagir</h2><p class="lead">Chegou perto de um lugar? Aparece um cartão com o nome dele.</p>' +
        '<ul class="g-list"><li><span class="k">Teclado</span>aperte ' + kbd('E') + ' ou ' + kbd('Enter') + '</li>' +
        '<li><span class="k">Mouse ou toque</span>' + hl('clique ou toque') + ' na coisa, ou no botão ' + hl('abrir') + '</li>' +
        '<li><span class="k">Fechar</span>' + kbd('Esc') + ', o ' + hl('✕') + ' ou um clique fora</li></ul>' +
        '<p class="g-tip">Também vale: ' + kbd('M') + ' abre o ' + hl('mapa') + ' e ' + kbd('H') + ' abre a ' + hl('acessibilidade') + '.</p>' },
      { anim: () => guideScene('act', ['Chegue perto e aperte ' + hl('E'), 'Ou ' + hl('clique') + ' / ' + hl('toque') + ' na coisa', 'O painel se abre: é só ler'],
          [kbd('E'), PIC_CLICK, '<span class="ib">' + ICON_ACC + '</span>']),
        extra: '<button class="g-accbtn" type="button" data-act="acc">' + ICON_ACC + '<span>Mais ajuda: ' + hl('Acessibilidade') + '</span></button>' }
    ] },
  { title: 'Selos',
    halves: [
      { text: '<h2><span class="n">7</span>Colecione selos</h2><p class="lead">Explorar e brincar rende selos de coleção.</p>' +
        '<ul class="g-list"><li>Visite os lugares, ' + hl('faça carinho') + ' nas gatas e nos filhotes, sacuda a cerejeira, dê ração aos peixes…</li>' +
        '<li>O ' + hl('álbum') + ' fica no botão de selo, no canto de cima. O que você ganha ' + hl('fica salvo') + ' neste navegador.</li></ul>' +
        '<p class="g-tip">Uma ' + hl('estrelinha dourada') + ' aparece perto do que ainda não foi tocado.</p>' },
      { anim: () => '<div class="g-stamps" aria-hidden="true">' + ['kiara', 'cerejeira', 'cinema', 'mundo'].map(id => '<span class="g-st">' + stampSvg(STAMPS.find(o => o.id === id)) + '</span>').join('') + '</div>',
        extra: '<button class="g-accbtn" type="button" data-act="stamps"><span>Abrir o ' + hl('álbum de selos') + '</span></button>' }
    ] }
];

function renderGuide() {
  const half = (h, i) => '<div class="g-half ' + (h.anim ? (h.text ? 'both' : 'anim') : 'text') + (i ? ' right' : ' left') + '">' +
    (h.anim ? '<div class="g-animwrap">' + h.anim() + '</div>' : '') + (h.text || '') + (h.extra || '') + '</div>';
  return '<div class="g-book" role="document">' +
    '<button class="g-x" type="button" data-act="close" aria-label="Fechar as instruções" title="Fechar">✕</button>' +
    '<button class="ibtn g-acc" type="button" data-act="acc" aria-label="Acessibilidade" data-tip="Acessibilidade">' + ICON_ACC + '</button>' +
    '<div class="g-pages">' + PAGES.map((p, i) => '<section class="g-page" data-i="' + i + '" aria-label="Página ' + (i + 1) + ' de ' + PAGES.length + ': ' + p.title + '"><div class="g-spread">' + p.halves.map(half).join('') + '</div></section>').join('') + '</div>' +
    '<footer class="g-foot"><button class="g-nav g-prev" type="button" data-act="prev" aria-label="Página anterior">‹</button>' +
    '<div class="g-dots" role="group" aria-label="Páginas">' + PAGES.map((p, i) => '<button type="button" data-act="go" data-i="' + i + '" aria-label="Ir para: ' + p.title + '"></button>').join('') + '</div>' +
    '<button class="g-nav g-next" type="button" data-act="next" aria-label="Próxima página">›</button>' +
    '<button class="btn g-done" type="button" data-act="close">Entendi, vamos explorar!</button></footer></div>';
}

function guidePage(i, silent) {
  GD.page = Math.max(0, Math.min(PAGES.length - 1, i));
  GD.el.querySelectorAll('.g-page').forEach((pg, k) => { // as páginas anteriores ficam "viradas" (giradas para a esquerda), a atual e as seguintes ficam empilhadas
    pg.classList.toggle('turned', k < GD.page); pg.inert = k !== GD.page; pg.setAttribute('aria-hidden', k !== GD.page ? 'true' : 'false'); pg.style.zIndex = k < GD.page ? k : 20 - k;
  });
  GD.el.querySelectorAll('.g-dots button').forEach((b, k) => b.setAttribute('aria-current', String(k === GD.page)));
  GD.el.querySelector('.g-prev').disabled = GD.page === 0;
  const last = GD.page === PAGES.length - 1;
  GD.el.querySelector('.g-next').hidden = last; GD.el.querySelector('.g-done').hidden = !last;
  if (!silent) announce('Página ' + (GD.page + 1) + ' de ' + PAGES.length + ': ' + PAGES[GD.page].title + '.');
}

function openGuide() {
  if (guideOpen || phase !== 'world') return;
  if (!GD.el) {
    GD.el = document.getElementById('guide'); GD.el.innerHTML = renderGuide();
    GD.el.addEventListener('click', e => {
      if (e.target === GD.el) return closeGuide();                                  // clicar fora do livro fecha
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'close') closeGuide(); else if (a === 'next') guidePage(GD.page + 1); else if (a === 'prev') guidePage(GD.page - 1);
      else if (a === 'go') guidePage(+b.dataset.i); else if (a === 'acc') { closeGuide(); openA11y(); } else if (a === 'stamps') { closeGuide(); openStamps(); }
    });
  }
  GD.last = document.activeElement; GD.el.classList.toggle('calm', !!calm);
  guideOpen = true; GD.el.hidden = false; guidePage(0, true); syncLoop();
  announce('Instruções do mundo: ' + PAGES.length + ' páginas. Use as setas para virar a página e Esc para fechar.');
  (GD.el.querySelector('.g-next') || GD.el.querySelector('.g-x')).focus();
}
function closeGuide() {
  if (!guideOpen) return;
  guideOpen = false; GD.el.hidden = true; syncLoop();
  const back = (GD.last && document.contains(GD.last) && !GD.last.closest('[hidden]')) ? GD.last : document.getElementById('helpBtn'); if (back) back.focus();
}
function guideKey(e) { // chamada por ui.js enquanto o livro está aberto (as teclas do jogo ficam desligadas)
  if (e.code === 'Escape') { e.preventDefault(); closeGuide(); }
  else if (e.code === 'ArrowRight') { e.preventDefault(); guidePage(GD.page + 1); }
  else if (e.code === 'ArrowLeft') { e.preventDefault(); guidePage(GD.page - 1); }
  else if (e.code === 'Tab') { // mantém o foco dentro do livro
    const f = [...GD.el.querySelectorAll('button')].filter(b => !b.hidden && !b.disabled && !b.closest('[inert]')); if (!f.length) return;
    const i = f.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
    e.preventDefault(); f[n].focus();
  }
}
document.getElementById('helpBtn').addEventListener('click', openGuide);
