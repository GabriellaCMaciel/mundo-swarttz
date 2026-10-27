// Botão "Voltar ao topo" para as janelas que abrem na tela e têm rolagem (painéis dos lugares, carta aberta, livro de instruções, boas-vindas).
//
// Como funciona (conceito: "position: sticky"):
//   O botão fica dentro de uma caixinha de altura zero no FIM do conteúdo que rola. Com "sticky + bottom", o navegador a mantém
//   grudada no canto de baixo da janela enquanto você rola, então o botão parece flutuar sem a gente calcular posição nenhuma.
//   Por estar dentro da janela, ele também entra na ordem do teclado (Tab) e na "armadilha de foco" dos painéis.
//
// Quando aparece: só depois de rolar um pouco (até TOPO_MIN pixels; em janelas que rolam pouco, depois da metade do que dá para rolar).
// Em janelas que nem rolam, ele nunca aparece.
// Quem chama: showSheet (js/ui.js), finishOpen (js/mail.js), renderGuide/guide (js/guide.js) e openWelcome (js/tour.js).
const TOPO_MIN = 240; // no máximo quantos pixels rolar antes de o botão aparecer
const topoPassou = box => { const resto = box.scrollHeight - box.clientHeight; return resto > 60 && box.scrollTop > Math.min(TOPO_MIN, resto / 2); }; // true = já rolou o bastante para mostrar o botão

function addTopButton(box) {
  if (!box) return;
  const old = box.querySelector(':scope > .totop-wrap'); if (old) old.remove();   // o conteúdo é refeito (innerHTML) a cada abertura; evita botão duplicado
  const w = document.createElement('div'); w.className = 'totop-wrap';
  w.innerHTML = '<button class="totop" type="button" aria-label="Voltar ao topo" title="Voltar ao topo" hidden><span aria-hidden="true">↑</span></button>';
  box.appendChild(w);
  const btn = w.firstChild, show = () => { btn.hidden = !topoPassou(box); };
  if (!box._topoLigado) { // os "ouvintes" ficam presos na própria janela e são criados uma vez só
    box._topoLigado = true;
    box.addEventListener('scroll', () => { const b = box.querySelector(':scope > .totop-wrap .totop'); if (b) b.hidden = !topoPassou(box); }, { passive: true });
    box.addEventListener('click', e => {
      if (!e.target.closest('.totop')) return;
      e.stopPropagation();
      box.scrollTo({ top: 0, behavior: (typeof calm !== 'undefined' && calm) ? 'auto' : 'smooth' }); // "reduzir movimento" liga: sobe de uma vez, sem animação
      // o botão some ao chegar no topo; leva o foco do teclado para o começo da janela para quem usa Tab ou leitor de tela não ficar "perdido"
      let f = box.querySelector('.close, .g-x, a[href], button:not(.totop)');
      if (!f) { box.setAttribute('tabindex', '-1'); f = box; }
      try { f.focus({ preventScroll: true }); } catch (err) { /* sem foco: tudo bem */ }
    });
  }
  show();
}
