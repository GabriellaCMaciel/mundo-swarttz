// OS SELOS: um álbum de conquistas. Conforme a pessoa explora o mundo e interage com as coisas e os bichinhos, ela ganha selos colecionáveis.
// Cada selo tem arte própria (um SVG desenhado à mão aqui mesmo), um nome e uma frase curta. O que a pessoa já ganhou fica salvo no navegador dela.
//
// CONCEITOS DESTE ARQUIVO
//  - DADOS E VISUAL SEPARADOS: STAMPS é só a lista (id, nome, descrição, pista, cores, desenho). Para criar um selo novo, acrescente um item nela e
//    chame stampGrant('id') no lugar do mundo em que a conquista acontece.
//  - SVG: imagem feita de formas (círculos, caminhos, retângulos) em código. Escala sem ficar pixelada e dá para pintar com gradientes.
//    O desenho de cada selo fica numa "janela" de 92 × 82 unidades; a moldura de selo de correio (bordinha dentada) é desenhada por stampSvg().
//  - PERSISTÊNCIA: localStorage guarda um JSON {got: {id: data}, stat: {...}} para o selo continuar ganho na próxima visita. Se o navegador não
//    deixar guardar (janela anônima, por exemplo), os selos valem só até fechar a página. Nada quebra.
//  - FILA DE AVISOS: se dois selos saem juntos, o aviso do segundo espera o primeiro terminar (stampQueue).
//  - CONTADORES (stat): para conquistas de "vários passos" (pular 10 vezes, fazer carinho nos 3 filhotes), guardamos o progresso em stat.
'use strict';

const STAMP_KEY = 'swarttz-selos';
const SEL = { got: {}, stat: {}, queue: [], showing: false, svgN: 0, toast: null, timer: 0, ready: false };

// ---------- pedaços de desenho reutilizáveis ----------
// carinha de gato: s = tamanho, fur = cor do pelo, inner = cor de dentro da orelha, eye = cor dos olhos
const catHead = (cx, cy, s, fur, inner, eye, extra = '') =>
  '<g transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')">' +
  '<path d="M-17 -6 L-15 -24 L-3 -13Z M17 -6 L15 -24 L3 -13Z" fill="' + fur + '"/>' +
  '<path d="M-14 -9 L-13.5 -19 L-6 -13Z M14 -9 L13.5 -19 L6 -13Z" fill="' + inner + '"/>' +
  '<ellipse cx="0" cy="0" rx="20" ry="17" fill="' + fur + '"/>' + extra +
  '<ellipse cx="-7.5" cy="-1" rx="3.2" ry="3.8" fill="' + eye + '"/><ellipse cx="7.5" cy="-1" rx="3.2" ry="3.8" fill="' + eye + '"/>' +
  '<ellipse cx="-7.5" cy="-1" rx="1.1" ry="3" fill="#120b1c"/><ellipse cx="7.5" cy="-1" rx="1.1" ry="3" fill="#120b1c"/>' +
  '<path d="M-2.4 5 H2.4 L0 7.6Z" fill="#e86f9a"/><path d="M0 7.6 Q-3 11 -6 9 M0 7.6 Q3 11 6 9" fill="none" stroke="#120b1c" stroke-width="1" stroke-linecap="round"/>' +
  '<path d="M-20 4 L-31 2 M-20 8 L-31 10 M20 4 L31 2 M20 8 L31 10" stroke="#f6ecd9" stroke-width="1" stroke-linecap="round" opacity=".75"/></g>';
const sparkle = (x, y, r, c = '#fff3c4') => '<path d="M' + x + ' ' + (y - r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="' + c + '"/>';
const foot = (x, y, rot, s, c) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')" fill="' + c + '"><ellipse cx="0" cy="8" rx="7" ry="10"/><circle cx="-8" cy="-7" r="3.4"/><circle cx="-2.6" cy="-11" r="3.6"/><circle cx="3.4" cy="-10" r="3.4"/><circle cx="8.4" cy="-5" r="3"/></g>';
const paw = (x, y, s, c) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="' + c + '"><ellipse cx="0" cy="5" rx="9" ry="7.5"/><ellipse cx="-9" cy="-5" rx="3.6" ry="4.6"/><ellipse cx="-3" cy="-10" rx="3.6" ry="4.8"/><ellipse cx="3.4" cy="-10" rx="3.6" ry="4.8"/><ellipse cx="9.4" cy="-5" rx="3.6" ry="4.6"/></g>';
const hero = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><ellipse cx="0" cy="40" rx="15" ry="4" fill="#07030d" opacity=".35"/>' +
  '<path d="M0 -4 C16 6 22 30 24 40 H-24 C-22 30 -16 6 0 -4Z" fill="#2a1745" stroke="#b79af5" stroke-width="1.6"/>' +
  '<ellipse cx="0" cy="14" rx="13" ry="3.2" fill="none" stroke="#f2b84b" stroke-width="2"/>' +
  '<circle cx="0" cy="-12" r="16" fill="#2a1745" stroke="#b79af5" stroke-width="1.6"/><ellipse cx="2" cy="-10" rx="11.5" ry="10" fill="#07030d"/>' +
  '<circle cx="-3" cy="-10" r="2.3" fill="#f2b84b"/><circle cx="7" cy="-10" r="2.3" fill="#f2b84b"/></g>';

// ---------- a lista dos selos ----------
// name = nome | desc = frase de quem ganhou | hint = pista de quem ainda não ganhou | c1/c2 = cores do fundo | art = o desenho (janela 92 × 82)
const STAMPS = [
  { id: 'chegada', name: 'Primeiros Passos', desc: 'Você saiu andando pelo mundo da Gabriella.', hint: 'Ande pelo mundo.', c1: '#7b3fe4', c2: '#2a1745',
    art: foot(34, 54, -14, 1.05, '#ffd98a') + foot(58, 34, 12, 0.9, '#ffe9b0') + '<path d="M8 72 Q22 66 30 70 M62 12 Q74 8 84 14" stroke="#f6ecd9" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round" fill="none"/>' + sparkle(74, 60, 5) + sparkle(14, 22, 4) },
  { id: 'sobre', name: 'Prazer em Conhecer', desc: 'Você parou para ouvir quem é a Gabriella.', hint: 'Abra o painel "Sobre".', c1: '#ff5fa2', c2: '#7b3fe4',
    art: '<circle cx="46" cy="40" r="30" fill="#fff" opacity=".14"/>' + hero(46, 22, 1.0) + sparkle(14, 18, 5) + sparkle(78, 62, 4, '#ffd98a') },
  { id: 'atelie', name: 'Mãos à Obra', desc: 'Você mergulhou nas cores e linhas do Ateliê.', hint: 'Abra o painel "Ateliê".', c1: '#f2b84b', c2: '#ff6f91',
    art: '<path d="M46 10 C70 8 86 26 80 46 C76 60 60 62 56 54 C53 47 44 50 44 58 C44 70 30 72 20 64 C8 54 12 12 46 10Z" fill="#f6ecd9" stroke="#3a2060" stroke-width="2.4"/>' +
      '<circle cx="28" cy="30" r="7" fill="#ff5fa2"/><circle cx="46" cy="22" r="7" fill="#37d0c0"/><circle cx="64" cy="28" r="7" fill="#7b3fe4"/><circle cx="26" cy="50" r="6" fill="#f08a3c"/>' +
      '<g transform="rotate(35 70 62)"><rect x="60" y="50" width="6" height="30" rx="3" fill="#8a5a3a"/><path d="M60 50 H66 L63 36Z" fill="#7b3fe4"/></g>' },
  { id: 'biblioteca', name: 'Leitora de Plantão', desc: 'Você abriu um livro da Biblioteca e foi ler.', hint: 'Abra um livro na Biblioteca.', c1: '#37d0c0', c2: '#1b5f7a',
    art: '<path d="M46 22 C36 14 22 14 10 18 V64 C22 60 36 60 46 68Z" fill="#f6ecd9"/><path d="M46 22 C56 14 70 14 82 18 V64 C70 60 56 60 46 68Z" fill="#fff6e2"/>' +
      '<path d="M46 22 V68" stroke="#3a2060" stroke-width="2"/><path d="M16 28 Q28 25 40 29 M16 36 Q28 33 40 37 M16 44 Q28 41 40 45 M52 29 Q64 25 76 28 M52 37 Q64 33 76 36 M52 45 Q64 41 76 44" stroke="#9b8ab8" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M62 14 V42 L67 37 L72 42 V16Z" fill="#ff4d6d"/>' + sparkle(18, 10, 5) + sparkle(80, 72, 4, '#ffd98a') },
  { id: 'estante', name: 'Estante Completa', desc: 'Você abriu todos os livros da Biblioteca, um por um.', hint: 'Abra todos os livros da Biblioteca.', c1: '#f2b84b', c2: '#7b3fe4',
    art: '<ellipse cx="46" cy="70" rx="30" ry="4.5" fill="#07030d" opacity=".35"/>' +
      '<rect x="14" y="54" width="64" height="13" rx="2.5" fill="#ff4d6d"/><rect x="14" y="54" width="64" height="3.4" rx="1.7" fill="#ff8aa0"/><rect x="20" y="59" width="40" height="2.4" rx="1.2" fill="#fff3c4"/>' +
      '<rect x="19" y="41" width="56" height="13" rx="2.5" fill="#37d0c0"/><rect x="19" y="41" width="56" height="3.4" rx="1.7" fill="#8ff0e4"/><rect x="25" y="46.5" width="30" height="2.4" rx="1.2" fill="#fff3c4"/>' +
      '<rect x="24" y="28" width="48" height="13" rx="2.5" fill="#7b3fe4"/><rect x="24" y="28" width="48" height="3.4" rx="1.7" fill="#b79af5"/><rect x="30" y="33.5" width="26" height="2.4" rx="1.2" fill="#fff3c4"/>' +
      '<path d="M46 12 L50 20 L59 21 L52.5 27 L54 36 L46 31.5 L38 36 L39.5 27 L33 21 L42 20Z" fill="#fff3c4" stroke="#f2b84b" stroke-width="1.6" stroke-linejoin="round"/>' + sparkle(14, 22, 5) + sparkle(80, 34, 4, '#ffd98a') + sparkle(78, 12, 3) },
  { id: 'cinema', name: 'Sessão Especial', desc: 'Você escolheu um filme na bilheteria do drive-in.', hint: 'Escolha um filme na bilheteria do cinema.', c1: '#f08a3c', c2: '#7b3fe4',
    art: '<rect x="12" y="34" width="68" height="38" rx="4" fill="#1a0f2e"/><g transform="rotate(-12 12 34)"><rect x="12" y="20" width="68" height="14" rx="3" fill="#1a0f2e"/><path d="M20 20 L30 34 M38 20 L48 34 M56 20 L66 34" stroke="#f6ecd9" stroke-width="7"/></g>' +
      '<rect x="12" y="34" width="68" height="8" fill="#f6ecd9"/><path d="M20 34 L12 42 M38 34 L30 42 M56 34 L48 42 M74 34 L66 42" stroke="#1a0f2e" stroke-width="6"/>' +
      '<path d="M46 50 L50 58 L58 58 L52 63 L54 71 L46 66 L38 71 L40 63 L34 58 L42 58Z" fill="#f2b84b"/>' },
  { id: 'telefone', name: 'Papo Reto', desc: 'Você chegou perto do celular gigante para falar com ela.', hint: 'Abra o painel "Telefone" ou toque num contato.', c1: '#b79af5', c2: '#4b2a9a',
    art: '<rect x="28" y="6" width="38" height="70" rx="7" fill="#1a0f2e" stroke="#f6ecd9" stroke-width="2"/><rect x="32" y="14" width="30" height="54" rx="3" fill="#3a2060"/>' +
      '<circle cx="40" cy="24" r="4" fill="#ff5fa2"/><circle cx="54" cy="24" r="4" fill="#37d0c0"/><circle cx="40" cy="38" r="4" fill="#f2b84b"/><circle cx="54" cy="38" r="4" fill="#7b3fe4"/><circle cx="40" cy="52" r="4" fill="#ff9bc7"/><circle cx="54" cy="52" r="4" fill="#5b88b2"/>' +
      '<path d="M72 18 Q82 24 72 30 M76 12 Q90 24 76 36" stroke="#ffd98a" stroke-width="3" fill="none" stroke-linecap="round"/>' },
  { id: 'cartas', name: 'Correio Elegante', desc: 'Você abriu uma carta que a Gabriella recebeu.', hint: 'Abra uma carta na caixa de correio.', c1: '#ff7eb6', c2: '#b8477f',
    art: '<rect x="10" y="20" width="72" height="46" rx="4" fill="#fff6e2" stroke="#7a3a5a" stroke-width="2"/><path d="M10 22 L46 48 L82 22" fill="#f3dfe8" stroke="#7a3a5a" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M46 56 C28 44 34 32 42 34 C45 35 46 38 46 40 C46 38 47 35 50 34 C58 32 64 44 46 56Z" fill="#ff4d6d"/><path d="M10 66 L34 44 M82 66 L58 44" stroke="#7a3a5a" stroke-width="1.6" opacity=".6"/>' + sparkle(80, 12, 5) },
  { id: 'mundo', name: 'Volta ao Mundo', desc: 'Você conheceu todos os cantos: Sobre, ' + (ATELIE_ATIVO ? 'Ateliê, ' : '') + 'Biblioteca, Cinema, Telefone e Cartas.', hint: 'Visite os ' + (ATELIE_ATIVO ? 6 : 5) + ' lugares do mundo.', c1: '#2f8f6b', c2: '#1b3a5a',
    art: '<circle cx="46" cy="41" r="32" fill="#f6ecd9" stroke="#f2b84b" stroke-width="3"/><circle cx="46" cy="41" r="25" fill="none" stroke="#3a2060" stroke-width="1.2" stroke-dasharray="2 4"/>' +
      '<path d="M46 12 L53 41 H39Z" fill="#ff4d6d"/><path d="M46 70 L53 41 H39Z" fill="#2a1745"/><circle cx="46" cy="41" r="3.5" fill="#f2b84b"/>' +
      '<path d="M46 6 V12 M46 70 V76 M10 41 H16 M76 41 H82" stroke="#f2b84b" stroke-width="3" stroke-linecap="round"/>' },
  { id: 'kiara', name: 'Amiga da Kiara', desc: 'A Kiara pediu carinho e você deu de coração.', hint: 'Pare de andar e deixe a Kiara se esfregar, ou faça carinho nela.', c1: '#f2b84b', c2: '#f08a3c',
    art: '<circle cx="46" cy="42" r="32" fill="#fff" opacity=".18"/>' + catHead(46, 44, 1.2, '#fffaf0', '#f4a6b8', '#2f8f6b', '<path d="M-20 -2 C-20 -14 -8 -17 -2 -12 C-4 -4 -8 4 -20 6Z" fill="#f08a3c"/><circle cx="12" cy="-10" r="4" fill="#f08a3c"/>') +
      '<path d="M70 14 C62 8 62 18 70 24 C78 18 78 8 70 14Z" fill="#ff4d6d"/>' },
  { id: 'maria', name: 'Maria Marta Aprova', desc: 'A branquinha da Biblioteca ronronou para você.', hint: 'Faça carinho na Maria Marta, na Biblioteca.', c1: '#7b3fe4', c2: '#37d0c0',
    art: '<rect x="14" y="62" width="64" height="10" rx="2" fill="#ff5fa2"/><rect x="20" y="54" width="54" height="9" rx="2" fill="#f2b84b"/>' + catHead(46, 36, 1.15, '#fffaf0', '#f4a6b8', '#f5cf1f') + '<path d="M70 12 L72 18 L78 18 L73 22 L75 28 L70 24 L65 28 L67 22 L62 18 L68 18Z" fill="#ffd98a"/>' },
  { id: 'mel', name: 'Respeito pela Mel', desc: 'Você cutucou a Mel lá do telhado e ela não gostou nada.', hint: 'Cutuque a gata que vive no telhado da casa.', c1: '#1a0f2e', c2: '#4b2a9a',
    art: '<circle cx="64" cy="20" r="12" fill="#fff3c4"/><circle cx="68" cy="17" r="10" fill="#4b2a9a" opacity=".55"/><path d="M4 74 L46 40 L88 74Z" fill="#8a3a4a"/><path d="M4 74 L46 40 L88 74" fill="none" stroke="#ff9bc7" stroke-width="2"/>' +
      '<g transform="translate(46 40)"><path d="M-14 0 C-14 -16 -6 -22 0 -22 C6 -22 14 -16 14 0Z" fill="#0d080a"/><path d="M-9 -20 L-7 -31 L-1 -22Z M9 -20 L7 -31 L1 -22Z" fill="#0d080a"/>' +
      '<path d="M-5 -16 L-1 -14 M5 -16 L1 -14" stroke="#ffd98a" stroke-width="2.4" stroke-linecap="round"/><circle cx="-4" cy="-13" r="1.6" fill="#ffd98a"/><circle cx="4" cy="-13" r="1.6" fill="#ffd98a"/><path d="M14 -2 C26 -6 26 -20 18 -22" stroke="#0d080a" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>' + sparkle(16, 16, 4) + sparkle(30, 30, 3) },
  { id: 'filhotes', name: 'Três Pestinhas', desc: 'Bangula, Ônix e Cat Noir ganharam um carinho seu.', hint: 'Faça carinho nos três filhotes da casa.', c1: '#ff9bc7', c2: '#b79af5',
    art: catHead(24, 52, 0.8, '#a9a9b8', '#f4a6b8', '#f5cf1f') + catHead(68, 52, 0.8, '#161018', '#a14a6a', '#f5cf1f') + catHead(46, 32, 0.9, '#fffaf0', '#f4a6b8', '#2f8f6b', '<path d="M-20 -4 C-12 -16 12 -16 20 -4 C12 -8 -12 -8 -20 -4Z" fill="#161018"/>') + sparkle(80, 14, 4) + sparkle(10, 20, 3) },
  { id: 'turma', name: 'Turma do Balanço', desc: 'Julietta, Mocca e o passarinho brincaram com você.', hint: 'Faça carinho na Julietta, no Mocca e no passarinho do balanço.', c1: '#5b88b2', c2: '#37d0c0',
    art: '<path d="M0 40 Q46 30 92 42" stroke="#8a5a3a" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="30" cy="30" rx="13" ry="10" fill="#4aa3df"/><circle cx="40" cy="22" r="7" fill="#4aa3df"/><path d="M46 21 L53 24 L46 26Z" fill="#f2b84b"/><circle cx="41" cy="20" r="1.6" fill="#120b1c"/><path d="M18 30 L6 36 L18 36Z" fill="#2f7fb0"/><path d="M26 34 Q32 44 22 44" fill="#fff" opacity=".0"/>' +
      '<g transform="translate(64 62)"><path d="M0 0 C-16 -14 -22 -4 -14 6 C-8 12 -2 6 0 0Z" fill="#ff7eb6"/><path d="M0 0 C16 -14 22 -4 14 6 C8 12 2 6 0 0Z" fill="#ffd98a"/><circle cx="-10" cy="-2" r="3" fill="#fff" opacity=".7"/><circle cx="10" cy="-2" r="3" fill="#fff" opacity=".7"/><rect x="-1.4" y="-6" width="2.8" height="14" rx="1.4" fill="#2a1745"/></g>' + catHead(24, 64, 0.55, '#fffaf0', '#f4a6b8', '#4aa3df') + sparkle(80, 22, 4) },
  { id: 'ze', name: 'Zé Guloso', desc: 'O Zé Porempa quase pegou um peixinho. Você viu tudo.', hint: 'Faça carinho no Zé Porempa, na lagoa.', c1: '#37d0c0', c2: '#2a5f8a',
    art: '<path d="M0 62 Q12 56 24 62 T48 62 T72 62 T92 62" stroke="#f6ecd9" stroke-width="2" fill="none" opacity=".6"/><ellipse cx="34" cy="38" rx="20" ry="11" fill="#ff9f4a"/><path d="M52 38 L70 26 V50Z" fill="#ff7f2a"/><circle cx="22" cy="35" r="2.6" fill="#120b1c"/><path d="M30 28 Q34 36 30 48" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>' + paw(68, 58, 1.0, '#fffaf0') + sparkle(14, 14, 4) },
  { id: 'peixes', name: 'Hora da Ração', desc: 'Você jogou comidinha e os peixes vieram correndo.', hint: 'Toque na água da lagoa algumas vezes.', c1: '#5b88b2', c2: '#1b3a5a',
    art: '<ellipse cx="46" cy="46" rx="38" ry="22" fill="none" stroke="#b79af5" stroke-width="2" opacity=".7"/><ellipse cx="46" cy="46" rx="26" ry="14" fill="none" stroke="#b79af5" stroke-width="2" opacity=".85"/><ellipse cx="46" cy="46" rx="13" ry="7" fill="none" stroke="#f6ecd9" stroke-width="2"/>' +
      '<g fill="#ff9f4a"><ellipse cx="22" cy="30" rx="9" ry="4.6"/><path d="M30 30 L38 25 V35Z"/></g><g fill="#ffd98a"><ellipse cx="68" cy="62" rx="9" ry="4.6" transform="rotate(180 68 62)"/><path d="M60 62 L52 57 V67Z"/></g>' +
      '<circle cx="46" cy="10" r="2.4" fill="#f2b84b"/><circle cx="40" cy="16" r="2" fill="#f2b84b"/><circle cx="52" cy="17" r="2" fill="#f2b84b"/>' },
  { id: 'cerejeira', name: 'Chuva de Pétalas', desc: 'Você sacudiu a cerejeira e choveu flor.', hint: 'Toque na cerejeira da lagoa.', c1: '#ffc2da', c2: '#e0709c',
    art: '<path d="M42 78 L44 48 L40 36 M44 48 L56 34" stroke="#6b4a2f" stroke-width="6" stroke-linecap="round" fill="none"/>' +
      '<g><circle cx="26" cy="28" r="15" fill="#ffd9e8"/><circle cx="46" cy="18" r="17" fill="#ffb0cf"/><circle cx="66" cy="28" r="15" fill="#f7a1c7"/><circle cx="46" cy="34" r="14" fill="#ffc2da"/><circle cx="34" cy="38" r="10" fill="#ffe3ee"/><circle cx="60" cy="40" r="10" fill="#ffd0e2"/></g>' +
      '<g fill="#fff" opacity=".9"><ellipse cx="16" cy="56" rx="3.4" ry="2" transform="rotate(30 16 56)"/><ellipse cx="74" cy="52" rx="3.4" ry="2" transform="rotate(-30 74 52)"/><ellipse cx="28" cy="70" rx="3.4" ry="2" transform="rotate(-10 28 70)"/><ellipse cx="66" cy="72" rx="3.4" ry="2" transform="rotate(40 66 72)"/><ellipse cx="82" cy="30" rx="3" ry="1.8"/></g>' },
  { id: 'balanco', name: 'Vai e Vem', desc: 'Você deu um empurrãozinho no balanço.', hint: 'Toque no balanço.', c1: '#9ad66a', c2: '#2f8f6b',
    art: '<rect x="4" y="8" width="84" height="7" rx="3.5" fill="#6b4a2f"/><path d="M26 15 L22 56 M66 15 L70 56" stroke="#f6ecd9" stroke-width="2.4"/><rect x="16" y="56" width="60" height="8" rx="3" fill="#d9b98c" stroke="#8a5a3a" stroke-width="1.6"/>' +
      '<path d="M10 34 Q4 48 10 62 M82 34 Q88 48 82 62" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/><circle cx="30" cy="48" r="3" fill="#ff7eb6"/><circle cx="62" cy="46" r="3" fill="#f2b84b"/><path d="M0 78 H92" stroke="#1b6b3a" stroke-width="4"/>' },
  { id: 'pulo', name: 'Pula-Pula', desc: 'Dez pulos! A Gabriella não para quieta.', hint: 'Pule dez vezes.', c1: '#7b3fe4', c2: '#ff5fa2',
    art: '<ellipse cx="46" cy="72" rx="22" ry="5" fill="#07030d" opacity=".35"/>' + hero(46, 24, 0.82) + '<path d="M12 40 Q8 52 14 60 M80 40 Q84 52 78 60" stroke="#f6ecd9" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="2 5"/>' + sparkle(80, 14, 5, '#ffd98a') + sparkle(12, 18, 4) },
  { id: 'mapa', name: 'Cartógrafa', desc: 'Você abriu o mapa para ver o mundo de cima.', hint: 'Abra o mapa do mundo.', c1: '#f2b84b', c2: '#b5792b',
    art: '<path d="M8 14 L32 20 L58 12 L84 20 V68 L58 60 L32 68 L8 62Z" fill="#fff1c9" stroke="#7a4a1e" stroke-width="2" stroke-linejoin="round"/><path d="M32 20 V68 M58 12 V60" stroke="#7a4a1e" stroke-width="1.6" opacity=".6"/>' +
      '<path d="M14 54 Q26 30 42 44 T72 28" stroke="#7a4a1e" stroke-width="2.2" fill="none" stroke-dasharray="2 5" stroke-linecap="round"/><path d="M68 22 L78 34 M78 22 L68 34" stroke="#ff4d6d" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="54" r="3.4" fill="#2f8f6b"/>' },
  { id: 'acess', name: 'Mundo para Todos', desc: 'Você conheceu as opções de acessibilidade.', hint: 'Abra o menu de acessibilidade.', c1: '#4b2a9a', c2: '#1a0f2e',
    art: '<circle cx="46" cy="41" r="30" fill="none" stroke="#f6ecd9" stroke-width="4"/><circle cx="46" cy="22" r="4.4" fill="#f6ecd9"/><path d="M26 31 H66 M46 31 V47 M46 47 L36 64 M46 47 L56 64" stroke="#f6ecd9" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' + sparkle(80, 12, 5, '#ffd98a') + sparkle(10, 70, 4, '#ffd98a') },
  { id: 'colecao', name: 'Álbum Completo', desc: 'Todos os selos do mundo da Gabriella são seus!', hint: 'Ganhe todos os outros selos.', c1: '#ffd98a', c2: '#f08a3c', gold: true,
    art: '<circle cx="46" cy="41" r="34" fill="none" stroke="#7a4a1e" stroke-width="2" stroke-dasharray="3 5"/><path d="M46 8 L55 31 L80 32 L60 48 L67 72 L46 58 L25 72 L32 48 L12 32 L37 31Z" fill="#fff6e2" stroke="#7a4a1e" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M46 22 L51 35 L65 36 L54 45 L58 59 L46 51 L34 59 L38 45 L27 36 L41 35Z" fill="#f2b84b"/>' }
];
if (!ATELIE_ATIVO) STAMPS.splice(STAMPS.findIndex(x => x.id === 'atelie'), 1); // sem Ateliê no mundo, o selo dele também fica de fora

// ---------- o selo inteiro: moldura de correio com bordinha dentada + janela com o desenho ----------
function stampSvg(s) {
  const n = ++SEL.svgN, m = 'sm' + n, g = 'sg' + n;
  let holes = '';
  for (let x = 6; x < 120; x += 12) holes += '<circle cx="' + x + '" cy="0" r="4"/><circle cx="' + x + '" cy="140" r="4"/>';
  for (let y = 6; y < 140; y += 12) holes += '<circle cx="0" cy="' + y + '" r="4"/><circle cx="120" cy="' + y + '" r="4"/>';
  return '<svg class="stamp-svg" viewBox="0 0 120 140" aria-hidden="true" focusable="false">' +
    '<defs><mask id="' + m + '"><rect width="120" height="140" fill="#fff"/><g fill="#000">' + holes + '</g></mask>' +
    '<linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + s.c1 + '"/><stop offset="1" stop-color="' + s.c2 + '"/></linearGradient></defs>' +
    '<g mask="url(#' + m + ')"><rect width="120" height="140" fill="' + (s.gold ? '#fff0c2' : '#fff6e2') + '"/></g>' +
    '<rect x="11" y="11" width="98" height="88" rx="3" fill="url(#' + g + ')" stroke="' + (s.gold ? '#7a4a1e' : '#3a2060') + '" stroke-width="1.6"/>' +
    '<g transform="translate(14 14)"><svg width="92" height="82" viewBox="0 0 92 82" overflow="hidden">' + s.art + '</svg></g>' +
    '<rect x="11" y="106" width="98" height="22" rx="3" fill="' + (s.gold ? '#f2b84b' : s.c2) + '" opacity=".9"/>' +
    '<path d="M22 117 H98" stroke="#fff6e2" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round" opacity=".85"/>' +
    '<circle cx="60" cy="117" r="5" fill="' + (s.gold ? '#fff6e2' : s.c1) + '" stroke="#fff6e2" stroke-width="1.6"/>' +
    '</svg>';
}

// ---------- guardar e ler ----------
function stampsLoad() {
  try { const j = JSON.parse(localStorage.getItem(STAMP_KEY) || 'null'); if (j && j.got) { SEL.got = j.got; SEL.stat = j.stat || {}; } } catch (e) { /* sem armazenamento ou dado estragado: começa do zero */ }
}
function stampsSave() { try { localStorage.setItem(STAMP_KEY, JSON.stringify({ v: 1, got: SEL.got, stat: SEL.stat })); } catch (e) { /* sem armazenamento: vale só nesta visita */ } }
const stampHas = id => !!SEL.got[id];
const stampTotal = () => STAMPS.length, stampDone = () => STAMPS.filter(s => SEL.got[s.id]).length;

// contadores: soma 1 (ou n) a um contador e devolve o valor novo
function stampCount(key, n = 1) { SEL.stat[key] = (SEL.stat[key] || 0) + n; stampsSave(); return SEL.stat[key]; }
// conjuntos: guarda "este item já foi visto" e devolve quantos itens diferentes já foram (para "faça carinho nos 3 filhotes")
function stampMark(key, item) { const a = SEL.stat[key] || (SEL.stat[key] = []); if (!a.includes(item)) { a.push(item); stampsSave(); } return a.length; }

// abrir um livro: rende o selo de leitora e, quando TODOS os livros já foram abertos (guardamos quais, no navegador), o selo da estante completa
function stampBook(id) {
  stampGrant('biblioteca');
  if (typeof books !== 'undefined' && stampMark('livros', id) >= books.length) stampGrant('estante');
}
const ZONE_STAMPS = ['sobre', 'atelie', 'biblioteca', 'cinema', 'telefone', 'cartas'].filter(z => z !== 'atelie' || ATELIE_ATIVO);
function stampGrant(id) {
  if (!SEL.ready || SEL.got[id]) return false;
  const s = STAMPS.find(o => o.id === id); if (!s) return false;
  SEL.got[id] = Date.now(); stampsSave(); stampsBadge();
  SEL.queue.push(s); stampNext();
  announce('Novo selo: ' + s.name + '. ' + s.desc);
  if (ZONE_STAMPS.includes(id) && ZONE_STAMPS.every(z => SEL.got[z])) stampGrant('mundo'); // conheceu todos os cantos
  if (id !== 'colecao' && STAMPS.every(o => o.id === 'colecao' || SEL.got[o.id])) stampGrant('colecao'); // o último de todos
  return true;
}

// ---------- o aviso que aparece ao ganhar (um por vez) ----------
function stampNext() {
  if (SEL.showing || !SEL.queue.length) return;
  // com uma janela aberta (painel, tutorial, cartas) o aviso espera: assim ele nunca tampa o que a pessoa está lendo. syncLoop (ui.js) chama stampNext ao fechar.
  if (panelOpen || guideOpen || mailUi.isOpen) return;
  const s = SEL.queue.shift(); SEL.showing = true;
  const t = SEL.toast; t.innerHTML = '<div class="st-art">' + stampSvg(s) + '</div><div class="st-txt"><small>Novo selo!</small><b>' + s.name + '</b><span>' + s.desc + '</span></div>';
  t.hidden = false; t.classList.remove('out'); void t.offsetWidth; t.classList.add('in'); // void offsetWidth: força o navegador a "ver" a mudança, para a animação recomeçar
  clearTimeout(SEL.timer); SEL.timer = setTimeout(stampHide, 5200);
}
function stampHide() {
  const t = SEL.toast; t.classList.remove('in'); t.classList.add('out');
  SEL.timer = setTimeout(() => { t.hidden = true; SEL.showing = false; stampNext(); }, 450);
}

// ---------- o álbum (abre no painel) ----------
function stampsBadge() {
  const el = document.getElementById('stampsCount'); if (el) el.textContent = stampDone() + '/' + stampTotal();
  const b = document.getElementById('stampsBtn'); if (b) b.setAttribute('aria-label', 'Álbum de selos: ' + stampDone() + ' de ' + stampTotal() + ' selos');
}
function stampsHtml() {
  const done = stampDone(), tot = stampTotal(), pct = Math.round(done / tot * 100);
  return '<h2 id="sheetTitle">Álbum de selos</h2>' +
    '<p class="sub">Explore o mundo e converse com os bichinhos para completar a coleção. O que você ganhar fica guardado neste navegador.</p>' +
    '<div class="st-prog" role="img" aria-label="' + done + ' de ' + tot + ' selos"><div class="st-bar"><i style="width:' + pct + '%"></i></div><b>' + done + ' de ' + tot + '</b></div>' +
    '<ul class="st-grid">' + STAMPS.map(s => {
      const got = !!SEL.got[s.id];
      return '<li class="st-card' + (got ? ' got' : ' lock') + '"><div class="st-art">' + stampSvg(s) + (got ? '' : '<span class="st-q" aria-hidden="true">?</span>') + '</div>' +
        '<h3>' + s.name + '</h3><p>' + (got ? s.desc : '<span class="st-hint">Pista: ' + s.hint + '</span>') + '</p>' +
        '<span class="vh">' + (got ? 'Conquistado' : 'Ainda não conquistado') + '</span></li>';
    }).join('') + '</ul>' +
    '<div class="st-foot"><button class="btn ghost" type="button" id="stReset">Zerar coleção</button></div>';
}
function openStamps() { if (panelOpen || phase !== 'world') return; panelOpen = true; showSheet(stampsHtml()); }
let stResetArmed = 0;
function stampsReset() { // dois cliques: o primeiro só avisa, o segundo apaga
  const b = document.getElementById('stReset');
  if (!stResetArmed) { stResetArmed = 1; b.textContent = 'Tem certeza? Clique de novo'; setTimeout(() => { stResetArmed = 0; const q = document.getElementById('stReset'); if (q) q.textContent = 'Zerar coleção'; }, 4000); return; }
  stResetArmed = 0; SEL.got = {}; SEL.stat = {}; stampsSave(); stampsBadge(); showSheet(stampsHtml());
}

(function stampsInit() {
  stampsLoad();
  const t = document.createElement('button'); t.type = 'button'; t.className = 'stamp-toast'; t.hidden = true; t.setAttribute('aria-label', 'Novo selo conquistado. Abrir o álbum de selos');
  t.addEventListener('click', () => { clearTimeout(SEL.timer); SEL.timer = 0; t.hidden = true; SEL.showing = false; openStamps(); stampNext(); });
  document.body.appendChild(t); SEL.toast = t; SEL.ready = true;
  const b = document.getElementById('stampsBtn'); if (b) b.addEventListener('click', openStamps);
  stampsBadge();
})();
