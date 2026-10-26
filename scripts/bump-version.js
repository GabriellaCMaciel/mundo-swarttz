#!/usr/bin/env node
// Sobe a versão do portfólio de uma vez, em todos os lugares onde ela aparece.
//
// Como usar (no terminal, dentro da pasta do projeto):
//   node scripts/bump-version.js patch   -> 1.2.0 vira 1.2.1  (correção pequena)
//   node scripts/bump-version.js minor   -> 1.2.0 vira 1.3.0  (função nova)
//   node scripts/bump-version.js major   -> 1.2.0 vira 2.0.0  (mudança grande)
//   node scripts/bump-version.js 1.4.2   -> define o número na mão
//
// O que ele troca:
//   1. js/config.js      -> const VERSION = 'x.y.z'
//   2. index.html        -> todos os ?v=... (o navegador baixa os arquivos novos)
//   3. simples.html      -> <span data-version>x.y.z</span> do rodapé
//   4. CHANGELOG.md      -> abre a seção "## [x.y.z] - data" com o que estava em "[Não lançado]"
//
// CONCEITO: SemVer = MAJOR.MINOR.PATCH. Subir o MAJOR zera MINOR e PATCH; subir o MINOR zera o PATCH.
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, t) => fs.writeFileSync(path.join(root, f), t);
const fail = msg => { console.error('Erro: ' + msg); process.exit(1); };

const cfg = read('js/config.js');
const m = cfg.match(/const VERSION = '(\d+)\.(\d+)\.(\d+)';/);
if (!m) fail("não achei `const VERSION = 'x.y.z';` em js/config.js");
const [maj, min, pat] = [+m[1], +m[2], +m[3]], atual = `${maj}.${min}.${pat}`;

const tipo = process.argv[2];
let nova;
if (tipo === 'major') nova = `${maj + 1}.0.0`;
else if (tipo === 'minor') nova = `${maj}.${min + 1}.0`;
else if (tipo === 'patch') nova = `${maj}.${min}.${pat + 1}`;
else if (/^\d+\.\d+\.\d+$/.test(tipo || '')) nova = tipo;
else fail('use: node scripts/bump-version.js patch | minor | major | x.y.z');
if (nova === atual) fail('a versão nova é igual à atual (' + atual + ')');

// 1. js/config.js
write('js/config.js', cfg.replace(/const VERSION = '[^']*';/, `const VERSION = '${nova}';`));

// 2. index.html: troca todos os ?v=...
const idx = read('index.html');
if (!/\?v=/.test(idx)) fail('não achei nenhum ?v= em index.html');
write('index.html', idx.replace(/(\?v=)(?=\d)[0-9A-Za-z.\-]+/g, `$1${nova}`));

// 3. simples.html: rodapé
const sim = read('simples.html');
if (!/<span data-version>[^<]*<\/span>/.test(sim)) fail('não achei <span data-version> em simples.html');
write('simples.html', sim.replace(/(<span data-version>)[^<]*(<\/span>)/, `$1${nova}$2`));

// 4. CHANGELOG.md: abre a seção da nova versão logo abaixo de "[Não lançado]"
let log = read('CHANGELOG.md');
if (!log.includes('## [Não lançado]')) fail('não achei "## [Não lançado]" em CHANGELOG.md');
const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // AAAA-MM-DD no horário de Brasília
const naoLancado = log.split('## [Não lançado]')[1].split(/\n## \[/)[0]; // o que está escrito entre "[Não lançado]" e a próxima seção
const vazio = naoLancado.trim() === '';
log = log.replace('## [Não lançado]', `## [Não lançado]\n\n## [${nova}] - ${hoje}`);
write('CHANGELOG.md', log);

console.log(`Versão: ${atual} -> ${nova}`);
if (vazio) console.log('Atenção: a seção "[Não lançado]" do CHANGELOG.md estava vazia. Escreva o que mudou embaixo de "## [' + nova + ']".');
console.log('Próximos passos:\n  git add -A && git commit -m "chore: release v' + nova + '"\n  git tag -a v' + nova + ' -m "v' + nova + '"\n  git push --follow-tags');
