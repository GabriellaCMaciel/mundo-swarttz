// ===== Conteúdo editável do portfólio =====
// Quase tudo que você vai querer trocar com frequência está aqui.
'use strict';

// Imagens (ficam na pasta assets/)
const ASSETS = {
  logoDark: 'assets/logo-escuro.svg',   // logo (SVG) para fundos escuros (notebook, terminal)
  logoLight: 'assets/logo-claro.svg',   // logo (SVG) para fundos claros (bilhete do quadro, cartão do celular)
  photo: 'assets/foto.jpg'              // sua foto (quadro "Sobre")
};

// Link do GitHub mostrado no telefone
const GITHUB = 'https://github.com/GabriellaCMaciel';

// REDES SOCIAIS: os ícones flutuantes do celular gigante e a lista do painel "Telefone" usam esta lista.
// url = o link do SEU PERFIL naquela rede. Enquanto estiver '' (vazio), o ícone mostra "em breve" ao ser tocado.
// Exemplos: LinkedIn 'https://www.linkedin.com/in/seu-perfil' | E-mail 'mailto:voce@email.com' | WhatsApp 'https://wa.me/55DDDNUMERO'
// handle = o texto pequeno que aparece na lista do painel (seu @ ou nome de usuário).
const SOCIALS = [
  { name: 'GitHub',    url: GITHUB, handle: 'GabriellaCMaciel' },
  { name: 'LinkedIn',  url: 'https://www.linkedin.com/in/gabriellacmaciel/', handle: 'gabriellacmaciel' },
  { name: 'Instagram', url: 'https://www.instagram.com/gabriellaswarttz/', handle: '@gabriellaswarttz' },
  { name: 'E-mail',    url: 'mailto:gabriellacunhamaciel@gmail.com', handle: 'gabriellacunhamaciel@gmail.com' },
  { name: 'WhatsApp',  url: 'https://wa.me/5561981024070', handle: 'chamar no WhatsApp' }, // wa.me/ + 55 (Brasil) + DDD + número, só dígitos
  { name: 'YouTube',   url: 'https://www.youtube.com/channel/UCdCcbj2feCNZjauq3Kz1mZw', handle: 'meu canal' },
  { name: 'TikTok',    url: 'https://www.tiktok.com/@gabriella.swarttz', handle: '@gabriella.swarttz' },
  { name: 'Currículo', url: '', handle: '' }
];

// Textos compartilhados pelo painel do mundo 3D (ui.js) e pela versão simples (simple.js): mude aqui e muda nos dois.
const ABOUT = [
  'Sou a Gabriella Swarttz. Estudo Desenvolvimento Web e Mobile, sou monitora no projeto START e estou construindo meu caminho até a engenharia de IA.',
  'Gosto de livros, gatos, pintura, bordado, selos e de tudo que é colorido.'
];
const SOFT_SKILLS = ['Didática', 'Criatividade', 'Comunicação', 'Trabalho em equipe', 'Resiliência', 'Organização'];

// O roteiro do "hack" da abertura (o notebook invadindo a conta da Gabriella). Cada linha: [texto, cor]. Mantenha cada linha com até ~36 letras (a logo aparece à direita no final).
// Linhas que começam com "ALERTA" deixam a barra do terminal vermelha e piscando devagar (1 vez por segundo).
const terminalLines = [
  ['$ ssh invasor@swarttz.dev', '#b79af5'],
  ['conectando ............ ok', '#f6ecd9'],
  ['driblando o firewall .. ok', '#f6ecd9'],
  ['quebrando a senha: ********', '#f2b84b'],
  ['ALERTA: INVASAO DETECTADA!', '#ff7a93'],
  ['alvo: conta de Gabriella Swarttz', '#ff7a93'],
  ['copiando projetos e habilidades', '#f6ecd9'],
  ['copiando selos, cartas e gatas', '#f6ecd9'],
  ['progresso [##########] 100%', '#37d0c0'],
  ['', '#f6ecd9'],
  ['>>> ACESSO CONCEDIDO <<<', '#ff5fa2']
];

// Depoimentos (provisórios): cada um vira uma carta na caixa de correio, com o nome do remetente no envelope.
// who = nome de quem escreveu | cat = categoria (aparece no papel) | text = o depoimento (use \n para separar parágrafos)
// Opcionais: greeting = saudação (padrão "Querida Gabriella,") | photo = foto de quem escreveu, ex.: 'assets/prof-ana.jpg'
const letters = [
  { cat: 'Professores', text: 'Texto de exemplo: aprende rápido, ajuda a turma e entrega tudo com capricho.', who: 'Nome do(a) professor(a)' },
  { cat: 'Professores', text: 'Texto de exemplo: explica conceitos difíceis de um jeito simples e paciente.', who: 'Outro(a) professor(a)' },
  { cat: 'Colegas', text: 'Texto de exemplo: é a pessoa que não deixa o grupo travar e ainda deixa tudo bonito.', who: 'Nome do(a) colega' },
  { cat: 'Mentores', text: 'Texto de exemplo: curiosa, constante e com uma visão clara do próprio caminho.', who: 'Nome do(a) mentor(a)' },
  { cat: 'Clientes', text: 'Texto de exemplo: entendeu o que eu precisava e entregou o site antes do prazo.', who: 'Nome do(a) cliente' }
];

// Os livros da biblioteca: cada um vira um livro brilhante nas estantes (a ordem é da esquerda para a direita).
// short = nome curto na capa | kind = tipo | status, hours e cert = linhas do painel | topics = assuntos | color = cor da capa.
// Tudo aqui é PROVISÓRIO: troque pelos dados reais (carga horária, link do certificado, etc.).
const books = [
  { id: 'efg', short: 'EFG', kind: 'Curso técnico', title: 'Técnico em Desenvolvimento Web e Mobile', org: 'Escola do Futuro de Goiás (EFG)',
    status: 'Em andamento', hours: 'a preencher', cert: 'a preencher', color: 0x7b3fe4,
    text: 'Formação técnica em desenvolvimento de sites e aplicativos, com projetos em equipe e simulações de mercado.',
    topics: ['HTML', 'CSS', 'JavaScript', 'Git', 'Lógica de programação'] },
  { id: 'react', short: 'REACT', kind: 'Trilha Alura', title: 'Front-End com React', org: 'Alura',
    status: 'Em andamento', hours: 'a preencher', cert: 'a preencher', color: 0x37d0c0,
    text: 'Trilha de front-end focada em construir interfaces modernas com React.',
    topics: ['React', 'Componentes', 'Hooks', 'Interfaces'] },
  { id: 'python', short: 'PYTHON', kind: 'Trilha Alura', title: 'Back-End com Python', org: 'Alura',
    status: 'Em andamento', hours: 'a preencher', cert: 'a preencher', color: 0xf2b84b,
    text: 'Trilha de back-end com Python: lógica do servidor, APIs e bancos de dados.',
    topics: ['Python', 'APIs', 'Bancos de dados'] },
  { id: 'ia', short: 'IA', kind: 'Trilha Alura', title: 'Engenharia de Agentes de IA', org: 'Alura',
    status: 'Em andamento', hours: 'a preencher', cert: 'a preencher', color: 0xff5fa2,
    text: 'Trilha sobre como criar agentes de inteligência artificial, meu objetivo de longo prazo.',
    topics: ['Agentes de IA', 'Prompts', 'Automação'] },
  { id: 'grad', short: 'GRAD', kind: 'Graduação', title: 'Engenharia de Software', org: 'Gran Faculdade',
    status: 'a preencher', hours: 'a preencher', cert: 'a preencher', color: 0xf08a3c,
    text: 'Graduação em Engenharia de Software. Texto provisório: conte aqui a sua trajetória e o que pretende estudar.',
    topics: [] },
  { id: 'cert', short: 'CERTIF.', kind: 'Certificados', title: 'Certificações', org: 'Em breve',
    status: 'Em breve', hours: '-', cert: 'em breve', color: 0xb79af5,
    text: 'Aqui vão aparecer os certificados de cursos e eventos, cada um com link para conferir.',
    topics: [] }
];
