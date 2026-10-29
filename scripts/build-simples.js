#!/usr/bin/env node
// Mantém a versão simples (simples.html) em dia com o mundo 3D: gera as partes que SÃO cópia do js/config.js e confere o resto.
//
// POR QUE EXISTE: o texto do portfólio mora em js/config.js (o mundo 3D lê de lá), mas a versão simples é HTML puro, sem JavaScript, então
// ela precisava de uma CÓPIA escrita à mão. Cópia à mão desatualiza (já aconteceu: "Amiga e colega..." nos depoimentos). A regra agora é:
// config.js é a fonte da verdade e este script escreve a cópia.
//
// Como usar (no terminal, dentro da pasta do projeto):
//   node scripts/build-simples.js           -> reescreve as partes automáticas do simples.html
//   node scripts/build-simples.js --check   -> só confere: sai com erro se o simples.html estiver desatualizado (usado nos testes)
//
// O QUE É GERADO (entre os marcadores <!-- AUTO:nome --> e <!-- /AUTO:nome --> do simples.html; NÃO edite dentro deles):
//   cta          os botões de contato do topo           (vem de SOCIALS)
//   sobre        os parágrafos "Quem sou eu"            (vem de ABOUT)
//   depoimentos  as cartas                              (vem de letters)
//   tiles        os cartões da seção Contato            (vem de SOCIALS)
// O QUE É CONFERIDO (texto escrito à mão de propósito, mais curto que o do mundo 3D): formação (livros), projeto em destaque.
//   Se um título ou número de horas mudar no config.js e a seção "Formação" não acompanhar, o --check avisa o que ajustar.
//
// CONCEITO: "fonte única da verdade" (single source of truth): cada informação é escrita em UM lugar só; o resto é derivado ou conferido.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const FILE = path.join(root, 'simples.html');
const check = process.argv.includes('--check');

// Lê o config.js sem abrir o navegador: ele só define constantes. O código roda isolado (vm) e devolve o que interessa.
const cfgSrc = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');
const cfg = vm.runInNewContext(cfgSrc + '\n;({ SOCIALS, ABOUT, letters, books, films })', { console: { info() {} } });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');

// Ícones de cada contato (o mesmo desenho do mundo 3D). Para um contato novo em SOCIALS (Instagram, YouTube...), acrescente o ícone aqui.
// k = sufixo da classe de cor no CSS (btn-gh, tile-gh...) | box = viewBox | a = tamanho no botão | t = tamanho no cartão | extra = atributos do traço
const ICONS = {
  'GitHub': { k: 'gh', box: '0 0 16 16', a: 22, t: 44, extra: '', inner: "<path fill=\"currentColor\" d=\"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z\"/>" },
  'LinkedIn': { k: 'li', box: '0 0 24 24', a: 22, t: 44, extra: '', inner: "<path fill=\"currentColor\" d=\"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z\"/>" },
  'E-mail': { k: 'ml', box: '-50 -50 100 100', a: 24, t: 48, extra: ' fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"', inner: "<rect x=\"-46\" y=\"-32\" width=\"92\" height=\"64\" rx=\"10\"/><path d=\"M-40 -24 L0 6 L40 -24\"/>" }
};
const svg = (ic, size) => '<svg viewBox="' + ic.box + '" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false"' + ic.extra + '>' + ic.inner + '</svg>';
const iconOf = s => { const ic = ICONS[s.name]; if (!ic) { console.error('Erro: o contato "' + s.name + '" não tem ícone. Acrescente-o em ICONS (scripts/build-simples.js).'); process.exit(1); } return ic; };
const isMail = s => /^mailto:/.test(s.url);
const ext = ' target="_blank" rel="noopener noreferrer"';
const vh = '<span class="vh"> (abre em outra aba)</span>';

const gen = {
  cta: () => cfg.SOCIALS.map(s => { const ic = iconOf(s);
    return ['        <li>',
      '          <a class="btn btn-' + ic.k + '" href="' + escAttr(s.url) + '"' + (isMail(s) ? '' : ext) + '>',
      '            ' + svg(ic, ic.a),
      '            ' + esc(s.name) + (isMail(s) ? '' : vh),
      '          </a>', '        </li>'].join('\n'); }).join('\n'),
  sobre: () => cfg.ABOUT.map(p => '        <p>' + esc(p) + '</p>').join('\n'),
  depoimentos: () => cfg.letters.map(l =>
    ['      <figure class="carta">', '        <blockquote>',
      ...l.text.split('\n').map(p => '          <p>' + esc(p) + '</p>'),
      '        </blockquote>',
      '        <figcaption><strong>' + esc(l.who) + '</strong><span>' + esc(l.cat) + '</span></figcaption>', '      </figure>'].join('\n')).join('\n'),
  tiles: () => cfg.SOCIALS.map(s => { const ic = iconOf(s);
    return ['      <li>',
      '        <a class="tile tile-' + ic.k + '" href="' + escAttr(s.url) + '"' + (isMail(s) ? '' : ext) + '>',
      '          ' + svg(ic, ic.t),
      '          <span class="tile-n">' + esc(s.name) + (isMail(s) ? '' : vh) + '</span>',
      '          <span class="tile-h">' + esc(s.handle) + '</span>',
      '        </a>', '      </li>'].join('\n'); }).join('\n')
};

let html = fs.readFileSync(FILE, 'utf8'), changed = [];
for (const name of Object.keys(gen)) {
  const re = new RegExp('(<!-- AUTO:' + name + ' -->)[\\s\\S]*?(\\n[ \\t]*<!-- /AUTO:' + name + ' -->)');
  if (!re.test(html)) { console.error('Erro: não achei os marcadores AUTO:' + name + ' em simples.html'); process.exit(1); }
  const novo = html.replace(re, (_, a, b) => a + '\n' + gen[name]() + b);
  if (novo !== html) changed.push(name);
  html = novo;
}

// Conferências (texto escrito à mão): o que mudou no config.js e ainda não está na versão simples?
const problemas = [];
const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
for (const b of cfg.books) {
  if (!plain.includes(b.title)) problemas.push('Formação: o título "' + b.title + '" (' + b.org + ') não aparece em simples.html. Ajuste a seção "Formação".');
  const n = b.hours && (b.hours.match(/\d+/) || [])[0];
  if (n && !plain.includes(n)) problemas.push('Formação: as horas de "' + b.title + '" (' + b.hours + ') não aparecem em simples.html.');
}
const jc = cfg.films.find(f => f.id === 'jc');
if (jc && jc.repo && !html.includes(jc.repo)) problemas.push('Projeto: o repositório do JC Resolve (' + jc.repo + ') não aparece em simples.html.');
if (jc && jc.url && !html.includes(jc.url)) problemas.push('Projeto: o link do JC Resolve (' + jc.url + ') não aparece em simples.html. Se o protótipo voltou ao ar, acrescente o botão.');

if (check) {
  if (changed.length) console.error('simples.html está DESATUALIZADO em: ' + changed.join(', ') + '. Rode: node scripts/build-simples.js');
  problemas.forEach(p => console.error(p));
  if (changed.length || problemas.length) process.exit(1);
  console.log('simples.html está em dia com o config.js.');
} else {
  if (changed.length) { fs.writeFileSync(FILE, html); console.log('simples.html atualizado: ' + changed.join(', ') + '.'); } else console.log('simples.html já estava em dia.');
  problemas.forEach(p => console.warn('Atenção: ' + p));
  const nProj = cfg.films.length;
  if (nProj > 1) console.log('Obs.: o mundo 3D mostra ' + nProj + ' projetos; a versão simples destaca só o JC Resolve (escolha manual).');
}
