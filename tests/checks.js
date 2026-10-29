#!/usr/bin/env node
// Verificações RÁPIDAS (sem navegador): pegam os erros bobos antes de eles chegarem ao site publicado.
// Roda em poucos segundos: `npm run test:rapido`. Também é a primeira parte de `npm test`.
//
// O que confere:
//   1. A versão é a MESMA em todo lugar (config.js, ?v= do index.html, rodapé do simples.html e topo do CHANGELOG.md).
//   2. O simples.html está em dia com o config.js (scripts/build-simples.js --check).
//   3. Todo arquivo local citado (imagens, CSS, scripts) existe, e todo script de js/ está na lista de carregamento do boot.js.
//   4. O conteúdo do config.js é coerente: ids únicos, depoimentos completos e "em cartaz" só com link de verdade.
//
// CONCEITO: "teste de consistência". Não testa o que o site FAZ (isso é nos testes do navegador, tests/mundo.spec.js), testa se as
// partes que precisam concordar entre si de fato concordam.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const falhas = [];
let total = 0;
function confere(nome, ok, detalhe) { total++; if (ok) console.log('  ok    ' + nome); else { console.log('  FALHA ' + nome + (detalhe ? '\n          ' + detalhe : '')); falhas.push(nome); } }

const cfgSrc = read('js/config.js');
const cfg = vm.runInNewContext(cfgSrc + '\n;({ VERSION, SOCIALS, letters, books, films })', { console: { info() {} } });

// 1. versão
console.log('Versão');
const index = read('index.html'), simples = read('simples.html'), log = read('CHANGELOG.md');
const vIndex = [...index.matchAll(/\?v=(\d[0-9A-Za-z.\-]*)/g)].map(m => m[1]);
confere('VERSION no config.js é MAJOR.MINOR.PATCH (' + cfg.VERSION + ')', /^\d+\.\d+\.\d+$/.test(cfg.VERSION));
confere('todos os ?v= do index.html valem ' + cfg.VERSION + ' (' + vIndex.length + ' encontrados)', vIndex.length > 0 && vIndex.every(v => v === cfg.VERSION), 'achei: ' + [...new Set(vIndex)].join(', '));
const vSimples = (simples.match(/<span data-version>([^<]*)<\/span>/) || [])[1];
confere('rodapé do simples.html vale ' + cfg.VERSION, vSimples === cfg.VERSION, 'achei: ' + vSimples);
const topo = (log.match(/^## \[(\d+\.\d+\.\d+)\]/m) || [])[1];
confere('a versão mais nova do CHANGELOG.md é ' + cfg.VERSION, topo === cfg.VERSION, 'achei: ' + topo);

// 2. simples.html em dia
console.log('Versão simples');
const b = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-simples.js'), '--check'], { encoding: 'utf8' });
confere('simples.html está em dia com o config.js', b.status === 0, (b.stderr || b.stdout || '').trim().split('\n').join('\n          '));

// 3. arquivos
console.log('Arquivos');
const existe = rel => fs.existsSync(path.join(root, rel.split(/[?#]/)[0]));
for (const f of ['index.html', 'simples.html', '404.html']) {
  const html = read(f);
  // 404.html usa endereços completos de propósito; aqui só olhamos caminhos locais (sem http, mailto, # ou data:)
  const locais = [...html.matchAll(/(?:src|href)="([^"#:][^":]*)"/g)].map(m => m[1]).filter(u => !/^(https?:|mailto:|data:|\/\/)/.test(u) && !u.startsWith('?') && u !== 'index.html?3d');
  const faltam = [...new Set(locais.filter(u => !existe(u.replace(/^\.\//, ''))))];
  confere(f + ': arquivos locais citados existem (' + locais.length + ')', !faltam.length, 'faltando: ' + faltam.join(', '));
}
const semComentarios = cfgSrc.replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, ''); // tira os comentários (um deles cita um arquivo de exemplo que não existe)
const assetsCfg = [...new Set([...semComentarios.matchAll(/'(assets\/[^']+)'/g)].map(m => m[1]))];
const assetsFalta = assetsCfg.filter(a => !existe(a));
confere('config.js: imagens citadas existem (' + assetsCfg.length + ')', !assetsFalta.length, 'faltando: ' + assetsFalta.join(', '));
const boot = read('js/boot.js'), lista = (boot.match(/load\(\[([^\]]+)\]/) || [])[1] || '';
const carregados = [...lista.matchAll(/'([a-z0-9]+)'/g)].map(m => m[1]);
const noDisco = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, '')).filter(n => n !== 'boot');
confere('todo arquivo de js/ está na lista do boot.js (e vice-versa)', noDisco.every(n => carregados.includes(n)) && carregados.every(n => noDisco.includes(n)),
  'fora da lista: ' + noDisco.filter(n => !carregados.includes(n)).join(', ') + ' | na lista, sem arquivo: ' + carregados.filter(n => !noDisco.includes(n)).join(', '));

// 4. conteúdo
console.log('Conteúdo (config.js)');
const dup = lista => lista.filter((x, i) => lista.indexOf(x) !== i);
confere('ids dos livros são únicos', !dup(cfg.books.map(x => x.id)).length);
confere('ids dos projetos são únicos', !dup(cfg.films.map(x => x.id)).length);
confere('todo depoimento tem quem escreveu, quem é e texto', cfg.letters.every(l => l.who && l.cat && l.text));
const semLink = cfg.films.filter(f => f.status === 'em cartaz' && !f.url);
confere('projeto "em cartaz" tem link para abrir', !semLink.length, 'sem link: ' + semLink.map(f => f.title).join(', '));
confere('todo contato tem nome, link e texto', cfg.SOCIALS.every(s => s.name && s.url && s.handle));

console.log('\n' + (total - falhas.length) + ' de ' + total + ' verificações passaram.');
if (falhas.length) { console.error('Falharam: ' + falhas.join(' | ')); process.exit(1); }
