// Porta de entrada: decide entre o MUNDO 3D e a VERSÃO SIMPLES (simples.html, uma página estática, sem JavaScript) e, para o 3D, carrega o resto dos arquivos.
//
// Por que existe: o mundo 3D precisa de WebGL, e nem todo aparelho tem (ou a pessoa não consegue usar o 3D: leitor de tela, pouca
// mobilidade, conexão lenta...). A versão simples mostra as mesmas informações como uma página comum, com títulos, listas e links.
// Como é HTML puro, ela também funciona para quem não executa JavaScript: pré-visualização de links, buscadores e leitores automáticos.
//
// Como se escolhe a versão (nesta ordem):
//   ?3d      na URL  -> mundo 3D (e esquece a escolha salva)
//   ?simples na URL  -> versão simples (e lembra a escolha neste navegador)
//   escolha salva    -> a que a pessoa escolheu da última vez
//   sem WebGL, ou o Three.js não carregou -> versão simples automaticamente (simples.html#aviso mostra um aviso explicando)
//
// Conceitos: carregamento dinâmico de scripts (document.createElement('script') com async = false mantém a ORDEM de execução)
// e "detecção de recurso" (testar se o WebGL existe em vez de adivinhar pelo navegador).
(function () {
  'use strict';
  const me = document.currentScript, V = ((me && me.src.match(/[?&]v=([^&]+)/)) || [])[1] || '';
  const KEY = 'swarttz-modo';
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) { /* sem armazenamento: tudo bem */ } }
  };
  function webglOK() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }
  function load(files, done) { // carrega em ordem; done() roda quando o último terminar
    files.forEach((f, i) => {
      const s = document.createElement('script'); s.src = 'js/' + f + '.js' + (V ? '?v=' + V : ''); s.async = false;
      if (i === files.length - 1 && done) s.onload = done;
      document.body.appendChild(s);
    });
  }
  const q = location.search;
  let simple = false, aviso = false;
  if (/[?&]3d\b/.test(q)) store.set(null);
  else if (/[?&]simples\b/.test(q)) { simple = true; store.set('simples'); }
  else if (store.get() === 'simples') simple = true;
  if (!simple && (!webglOK() || typeof THREE === 'undefined')) { simple = true; aviso = true; } // sem WebGL, ou o Three.js (CDN) não carregou
  if (simple) { location.replace('simples.html' + (aviso ? '#aviso' : '')); return; }
  window.SWARTTZ_MODE = '3d';
  load(['config', 'intro', 'garden', 'world', 'cherry', 'library', 'pond', 'kiara', 'mailbox', 'yardcats', 'phone', 'cinema', 'zones', 'trails', 'worldmap', 'decor', 'swing', 'playcats', 'mail', 'guide', 'stamps', 'ui', 'fpv', 'totop', 'tour', 'pick', 'interact']);
})();
