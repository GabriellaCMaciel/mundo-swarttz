// ===== Conteúdo editável do portfólio =====
// Quase tudo que você vai querer trocar com frequência está aqui.
'use strict';

// Imagens (ficam na pasta assets/)
const ASSETS = {
  logoDark: 'assets/logo-escuro.png',   // logo para fundos escuros (notebook, terminal)
  logoLight: 'assets/logo-claro.png',   // logo para fundos claros (bilhete do quadro)
  photo: 'assets/foto.jpg'              // sua foto (quadro "Sobre")
};

// Link do GitHub mostrado no telefone
const GITHUB = 'https://github.com/GabriellaCMaciel';

// O roteiro do "hack". Cada linha: [texto, cor]
const terminalLines = [
  ['$ ssh visitante@swarttz.dev', '#b79af5'],
  ['conectando .............. ok', '#f6ecd9'],
  ['driblando o firewall .... ok', '#f6ecd9'],
  ['lendo perfil: Gabriella Swarttz', '#f2b84b'],
  ['projetos ok | habilidades ok', '#f6ecd9'],
  ['selos ok | gatas ok (miau)', '#f6ecd9'],
  ['', '#f6ecd9'],
  ['>>> ACESSO CONCEDIDO <<<', '#ff5fa2']
];

// Depoimentos (provisórios). Troque pelos reais: cat = categoria, text = o que a pessoa disse, who = quem disse.
const letters = [
  { cat: 'Professores', text: 'Texto de exemplo: aprende rápido, ajuda a turma e entrega tudo com capricho.', who: 'Nome do(a) professor(a)' },
  { cat: 'Professores', text: 'Texto de exemplo: explica conceitos difíceis de um jeito simples e paciente.', who: 'Nome do(a) professor(a)' },
  { cat: 'Colegas', text: 'Texto de exemplo: é a pessoa que não deixa o grupo travar e ainda deixa tudo bonito.', who: 'Nome do(a) colega' },
  { cat: 'Mentores', text: 'Texto de exemplo: curiosa, constante e com uma visão clara do próprio caminho.', who: 'Nome do(a) mentor(a)' },
  { cat: 'Clientes', text: 'Texto de exemplo: entendeu o que eu precisava e entregou o site antes do prazo.', who: 'Nome do(a) cliente' }
];
