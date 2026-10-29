// ===== Modo de diagnóstico (?debug) =====
// Serve para TESTAR EM APARELHOS DE VERDADE (celular, tablet, outro notebook): mostra, num cantinho da tela, o que está acontecendo por trás
// (quadros por segundo, resolução, placa de vídeo, erros) e tem um botão que copia tudo num texto, pronto para colar numa conversa ou issue.
// Como usar: abra o site com ?debug no fim do endereço, por exemplo  https://gabriellacmaciel.github.io/mundo-swarttz/?debug
// SEM ?debug este arquivo não faz NADA (a primeira linha de código já sai da função): visitantes normais nunca veem nem pagam por isto.
//
// CONCEITO: "observabilidade". Em vez de adivinhar por que o site está lento num celular que você não tem na mão, o próprio site conta.
// Por isso este arquivo carrega logo no começo da lista (js/boot.js): assim ele já está de olho nos erros dos arquivos que vêm depois.
(function () {
  if (!/[?&]debug(=|&|$)/.test(location.search)) return; // sem ?debug: sai aqui, sem criar nada

  const erros = [];                                      // os últimos erros de JavaScript (guardamos no máximo 8)
  const guarda = txt => { if (erros.length < 8) erros.push(txt); else erros.shift(), erros.push(txt); };
  window.addEventListener('error', e => guarda((e.message || 'erro') + (e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '')));
  window.addEventListener('unhandledrejection', e => guarda('promessa rejeitada: ' + (e.reason && e.reason.message || e.reason)));

  // --- Quadros por segundo (FPS) ---
  // Contamos quantas vezes o navegador pede um quadro novo (requestAnimationFrame) em cada janela de meio segundo.
  const fps = { atual: 0, min: Infinity, soma: 0, n: 0 };
  let cont = 0, t0 = performance.now();
  (function quadro() {
    cont++;
    const t = performance.now();
    if (t - t0 >= 500) {
      fps.atual = Math.round(cont * 1000 / (t - t0)); cont = 0; t0 = t;
      if (typeof phase !== 'undefined' && phase === 'world') { if (fps.n >= 4) fps.min = Math.min(fps.min, fps.atual); fps.soma += fps.atual; fps.n++; } // os primeiros ~2 s (carregando texturas) não entram no "pior" // só conta quando o mundo já está aberto (a abertura não vale)
    }
    requestAnimationFrame(quadro);
  })();

  // --- Placa de vídeo ---
  // Alguns navegadores escondem o nome da placa; quando aparece "SwiftShader" ou "llvmpipe", o WebGL está rodando no processador (lento).
  function gpu() {
    try {
      const gl = (typeof renderer !== 'undefined' && renderer.getContext && renderer.getContext());
      if (!gl) return 'ainda não iniciou';
      const x = gl.getExtension('WEBGL_debug_renderer_info');
      return (x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) + ' · WebGL' + (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? '2' : '1');
    } catch (e) { return 'indisponível'; }
  }

  // --- Montagem do texto do relatório ---
  function linhas() {
    const m = fps.n ? Math.round(fps.soma / fps.n) : 0;
    const L = [
      ['versão', typeof VERSION !== 'undefined' ? VERSION : '?'],
      ['aparelho', navigator.userAgent],
      ['tela', innerWidth + '×' + innerHeight + ' (pixel ×' + (window.devicePixelRatio || 1) + ')'],
      ['toque', (navigator.maxTouchPoints || 0) + ' ponto(s)' + (matchMedia('(pointer:coarse)').matches ? ' · dedo' : ' · mouse')],
      ['orientação', innerWidth >= innerHeight ? 'deitado' : 'em pé'],
      ['placa', gpu()],
      ['qualidade', typeof PERF !== 'undefined' ? 'resolução ×' + (+PERF.dpr).toFixed(2) + ' (mín ' + (+PERF.min).toFixed(2) + ', máx ' + (+PERF.max).toFixed(2) + ')' : '?'],
      ['quadros/s', fps.atual + ' agora · média ' + m + ' · pior ' + (fps.n ? fps.min : '-')],
      ['fase', typeof phase !== 'undefined' ? phase : '?'],
      ['1ª pessoa', typeof FPV !== 'undefined' ? (FPV.on ? 'ligada' : 'desligada') + (FPV.always ? ' (sempre)' : '') + (FPV.zone ? ' · ' + FPV.zone.id : '') : '?'],
      ['painel', typeof panelOpen !== 'undefined' ? (panelOpen ? 'aberto' : 'fechado') : '?'],
      ['erros', erros.length ? erros.length + ': ' + erros.join(' | ') : 'nenhum']
    ];
    if (typeof renderer !== 'undefined' && renderer.info) L.splice(7, 0, ['desenho', renderer.info.render.triangles + ' triângulos · ' + renderer.info.render.calls + ' chamadas']);
    return L;
  }
  const texto = () => '# Diagnóstico Mundo Swarttz — ' + new Date().toLocaleString('pt-BR') + '\n' + linhas().map(l => l[0] + ': ' + l[1]).join('\n');

  // --- Caixinha na tela ---
  function monta() {
    const box = document.createElement('div');
    box.id = 'debugBox';
    box.setAttribute('aria-hidden', 'true');              // é só para quem está testando; leitor de tela não precisa narrar
    box.style.cssText = 'position:fixed;left:6px;top:calc(env(safe-area-inset-top,0px) + 6px);z-index:99;max-width:min(330px,calc(100vw - 12px));padding:6px 8px;border-radius:8px;background:rgba(10,5,18,.88);color:#e8f5ee;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;box-shadow:0 2px 10px rgba(0,0,0,.5);pointer-events:none'; // pointer-events:none = a caixa NÃO pega toques: tocar "através" dela continua funcionando no mundo (só o botão abaixo recebe toque)
    const pre = document.createElement('div');
    pre.style.cssText = 'white-space:pre-wrap;word-break:break-word;max-height:34vh;overflow:hidden';
    const bt = document.createElement('button');
    bt.type = 'button'; bt.textContent = 'Copiar relatório';
    bt.style.cssText = 'margin-top:5px;padding:4px 8px;border-radius:6px;border:1px solid #7fd4a8;background:#16301f;color:#e8f5ee;font:inherit;cursor:pointer;pointer-events:auto';
    bt.addEventListener('click', async e => {
      e.stopPropagation();
      try { await navigator.clipboard.writeText(texto()); bt.textContent = 'Copiado!'; }
      catch (err) { window.prompt('Copie o texto abaixo:', texto()); } // se o navegador bloquear a área de transferência, mostra o texto para copiar na mão
      setTimeout(() => { bt.textContent = 'Copiar relatório'; }, 1800);
    });
    // O toque no BOTÃO não pode "andar" nem clicar no mundo por baixo dele
    ['pointerdown', 'touchstart', 'click'].forEach(ev => bt.addEventListener(ev, e => e.stopPropagation()));
    box.append(pre, bt);
    document.body.appendChild(box);
    const atualiza = () => { pre.textContent = linhas().filter(l => l[0] !== 'aparelho').map(l => l[0] + ': ' + l[1]).join('\n'); }; // o texto do aparelho é longo: fica só no relatório copiado
    atualiza(); setInterval(atualiza, 500);
  }
  if (document.body) monta(); else document.addEventListener('DOMContentLoaded', monta);

  window.DEBUG = { relatorio: texto, erros, fps };        // para olhar pelo console, se quiser: DEBUG.relatorio()
})();
