// A VERSÃO SIMPLES: as mesmas informações do mundo 3D, numa página comum e acessível (leitor de tela, teclado, zoom, sem WebGL).
// Tudo vem de js/config.js (ABOUT, SOFT_SKILLS, books, letters, SOCIALS, ASSETS): editou lá, mudou aqui e no 3D.
//
// Boas práticas de acessibilidade usadas aqui (para estudar):
//  - HTML semântico: <header>, <nav>, <main>, <section>, <article>, <dl>, <blockquote>. Leitores de tela navegam por esses "marcos".
//  - Um <h1> só e títulos em ordem (h2, h3), para dar para pular de seção em seção.
//  - aria-labelledby liga cada seção ao seu título; link "Pular para o conteúdo" aparece ao apertar Tab.
//  - Links com texto que faz sentido sozinho (não "clique aqui") e aviso de que abrem em outra aba.
'use strict';

const escS = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderSimple(why, can3d) {
  document.documentElement.classList.add('simple-mode');
  ['toSimple', 'stage', 'mail', 'panel', 'flash', 'toast'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
  const hud = document.querySelector('.hud'); if (hud) hud.remove();
  const ext = s => (/^mailto:/.test(s.url) ? '' : ' target="_blank" rel="noopener noreferrer"');
  const social = SOCIALS.map(s => s.url
    ? '<li><a href="' + escS(s.url) + '"' + ext(s) + '>' + escS(s.name) + '<span class="vh">' + (/^mailto:/.test(s.url) ? '' : ' (abre em outra aba)') + '</span></a>' + (s.handle ? ' <span class="muted">' + escS(s.handle) + '</span>' : '') + '</li>'
    : '<li>' + escS(s.name) + ' <span class="muted">(em breve)</span></li>').join('');
  const bookList = books.map(b =>
    '<article class="s-card"><h3>' + escS(b.title) + '</h3><p class="muted">' + escS(b.kind) + ' · ' + escS(b.org) + '</p>' +
    '<dl><dt>Status</dt><dd>' + escS(b.status) + '</dd><dt>Carga horária</dt><dd>' + escS(b.hours) + '</dd><dt>Certificado</dt><dd>' + escS(b.cert) + '</dd></dl>' +
    '<p>' + escS(b.text) + '</p>' + (b.topics.length ? '<ul class="tags">' + b.topics.map(t => '<li>' + escS(t) + '</li>').join('') + '</ul>' : '') + '</article>').join('');
  const cartas = letters.map(l =>
    '<figure class="s-card"><p class="muted">' + escS(l.cat) + '</p><blockquote><p>' + escS(l.greeting || 'Querida Gabriella,') + '</p>' +
    String(l.text).split('\n').map(p => '<p>' + escS(p) + '</p>').join('') + '</blockquote><figcaption>com carinho, <strong>' + escS(l.who) + '</strong></figcaption></figure>').join('');
  const html =
    '<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>' +
    '<header class="s-head"><h1>Gabriella Swarttz</h1><p class="s-role">Portfólio · versão simples</p>' +
    (why ? '<p class="s-note" role="status">' + escS(why) + '</p>' : '') +
    (can3d ? '<p><a class="s-3d" href="?3d">Abrir o mundo 3D interativo</a></p>' : '') +
    '<nav aria-label="Seções do portfólio"><ul class="s-nav"><li><a href="#sobre">Sobre</a></li><li><a href="#atelie">Ateliê</a></li><li><a href="#biblioteca">Biblioteca</a></li><li><a href="#selos">Álbum de selos</a></li><li><a href="#telefone">Telefone</a></li><li><a href="#cartas">Correios</a></li></ul></nav></header>' +
    '<main id="conteudo" tabindex="-1">' +
    '<section id="sobre" aria-labelledby="h-sobre"><h2 id="h-sobre">Sobre</h2><img class="s-photo" src="' + escS(ASSETS.photo) + '" alt="Foto de Gabriella Swarttz sorrindo, de blazer preto" width="200" height="200">' + ABOUT.map(t => '<p>' + escS(t) + '</p>').join('') + '</section>' +
    '<section id="atelie" aria-labelledby="h-atelie"><h2 id="h-atelie">Ateliê · soft skills</h2><ul class="tags">' + SOFT_SKILLS.map(t => '<li>' + escS(t) + '</li>').join('') + '</ul></section>' +
    '<section id="biblioteca" aria-labelledby="h-bib"><h2 id="h-bib">Biblioteca · formação</h2>' + bookList + '</section>' +
    '<section id="selos" aria-labelledby="h-selos"><h2 id="h-selos">Álbum de selos · projetos</h2><p>Os projetos vão aparecer aqui, cada um com prints dele rodando. (Conteúdo provisório.)</p></section>' +
    '<section id="telefone" aria-labelledby="h-tel"><h2 id="h-tel">Telefone · redes e contatos</h2><ul class="s-links">' + social + '</ul></section>' +
    '<section id="cartas" aria-labelledby="h-cartas"><h2 id="h-cartas">Correios · depoimentos</h2>' + cartas + '</section>' +
    '</main><footer class="s-foot"><p>Gabriella Swarttz · Valparaíso de Goiás, Brasil</p></footer>';
  const root = document.createElement('div'); root.id = 'simple'; root.innerHTML = html; document.body.appendChild(root);
  document.title = 'Gabriella Swarttz | Portfólio (versão simples)';
}
