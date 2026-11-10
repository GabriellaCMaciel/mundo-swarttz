#!/usr/bin/env node
// Cérebro do LANÇAMENTO AUTOMÁTICO (.github/workflows/release.yml). Só lê arquivos e o git: quem faz commit, tag e Release é o workflow.
//
// Comandos:
//   node scripts/release.js tipo          -> diz que versão lançar olhando o "## [Não lançado]" do CHANGELOG.md:
//                                            "minor" se tem "### Adicionado" (função nova), "patch" se só tem correções/ajustes,
//                                            "nenhum" se a seção está vazia (nada para lançar).
//   node scripts/release.js tags          -> lista, uma por linha, "vX.Y.Z <commit>" das versões do CHANGELOG que ainda NÃO têm tag.
//   node scripts/release.js notas X.Y.Z   -> imprime as notas daquela versão (o trecho do CHANGELOG), usadas na Release do GitHub.
//
// CONCEITO: "fonte da verdade". O CHANGELOG.md é quem manda: o que está escrito lá decide se sai versão nova e de que tipo.
// MAJOR (2.0.0) nunca sai sozinho: mudança grande é decisão de pessoa, pelo botão "Run workflow" da aba Actions.
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const root = path.join(__dirname, '..');
const log = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const git = cmd => execSync('git ' + cmd, { cwd: root, encoding: 'utf8' }).trim();

// Versões antigas, de antes do script de versão existir: não têm commit "chore: release vX.Y.Z", então o commit de cada uma fica anotado aqui.
const ANTIGAS = {
  '0.1.0': 'b53598648eab9e9e0b56744d9dc74c9081f9fee6',
  '0.2.0': '1a424f8ec7ae416db5233f4c516042bbdd0a42b9',
  '0.3.0': 'c3d6df1626a6bb5832bfc6a7bfdff760093d53a9',
  '1.0.0': 'a2e9358a258b0564f86550ddbf25350c059aff34',
  '1.0.1': '0e36799e59b45058991f9ca0b8879944f9ba05b0',
  '1.1.0': '3dffd66c6472e8a429e49d3bb9ecb69b62d9c7ee',
  '1.1.1': 'ae196e37c1e5059f8ef4582bf72e870bbbe555c7'
};

// o texto entre um título "## [...]" e o próximo
function secao(titulo) {
  const i = log.indexOf(titulo);
  if (i < 0) return null;
  const resto = log.slice(i + titulo.length);
  const fim = resto.search(/\n## \[/);
  return (fim < 0 ? resto : resto.slice(0, fim)).replace(/^[^\n]*\n/, ''); // tira o resto da linha do título (a data)
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'tipo') {
  const s = secao('## [Não lançado]');
  if (s === null) { console.error('Erro: não achei "## [Não lançado]" em CHANGELOG.md'); process.exit(1); }
  console.log(!s.trim() ? 'nenhum' : /^### Adicionado/m.test(s) ? 'minor' : 'patch');
} else if (cmd === 'tags') {
  const existentes = new Set(git('tag -l').split('\n').filter(Boolean));
  const versoes = [...log.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map(m => m[1]).reverse(); // da mais antiga para a mais nova
  for (const v of versoes) {
    if (existentes.has('v' + v)) continue;
    let commit = ANTIGAS[v] || '';
    if (!commit) commit = git(`log --format=%H -n1 --fixed-strings --grep="chore: release v${v}" HEAD`); // o commit que lançou a versão
    if (!commit) { console.error(`Aviso: não achei o commit da versão ${v}; ela fica sem tag.`); continue; }
    console.log(`v${v} ${commit}`);
  }
} else if (cmd === 'notas') {
  const s = secao(`## [${arg}]`);
  console.log((s && s.trim()) || 'Veja o CHANGELOG.md para os detalhes.');
} else {
  console.error('use: node scripts/release.js tipo | tags | notas X.Y.Z');
  process.exit(1);
}
