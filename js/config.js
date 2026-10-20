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

// CONTATOS: os ícones flutuantes do celular gigante e a lista do painel "Telefone" usam esta lista.
// Por enquanto são só os três que importam para quem contrata: GitHub, LinkedIn e e-mail.
// (Instagram, YouTube, TikTok, WhatsApp e currículo saíram até ficarem prontos; se voltarem, acrescente também o ícone em PH_ICONS, em js/phone.js.)
// url = o link do perfil. handle = o texto pequeno que aparece na lista do painel.
const SOCIALS = [
  { name: 'GitHub',   url: GITHUB, handle: 'GabriellaCMaciel' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/gabriellacmaciel/', handle: 'gabriellacmaciel' },
  { name: 'E-mail',   url: 'mailto:gabriellacunhamaciel@gmail.com', handle: 'gabriellacunhamaciel@gmail.com' }
];

// Textos do painel do mundo 3D (ui.js). A versão simples (simples.html) é uma página estática, sem JavaScript: se mudar o texto aqui, mude lá também.
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
  ['progresso [##########] 100%', '#37d0c0'],
  ['', '#f6ecd9'],
  ['>>> ACESSO CONCEDIDO <<<', '#ff5fa2']
];

// Depoimentos: cada um vira uma carta na caixa de correio, com o nome do remetente no envelope.
// São mensagens reais que as pessoas mandaram para a Gabriella, com o jeito de falar de cada uma mantido (só ajustei pontuação e tirei o que era conversa particular).
// who = nome de quem escreveu | cat = quem é a pessoa (aparece no papel) | text = o depoimento (use \n para separar parágrafos)
// Opcionais: greeting = saudação (padrão "Querida Gabriella,") | photo = foto de quem escreveu, ex.: 'assets/prof-ana.jpg'
const letters = [
  { cat: 'Cliente e parceiro de projeto no EFG', greeting: 'Bom dia!', who: 'Júlio Cézar', photo: 'assets/depo-jc-resolve.png', logo: true, photoAlt: 'Logo da JC Resolve',
    text: 'Eu gostei muito, mas muito mesmo, do site.\nFoi exatamente o que eu pensei, porém o quiz ficou melhor do que eu imaginava.' },
  { cat: 'Amiga e colega de trabalho no projeto START', greeting: 'Gaby,', who: 'Juliana Barbosa', photo: 'assets/depo-juliana.jpg', photoAlt: 'Foto de Juliana Barbosa',
    text: 'Seus projetos estão tops! Ficaram bem finalizados e organizados. Parabéns pela dedicação. Só se valorizar mais, sério. Você é uma menina dedicada, deu um baita duro por cada projeto.' },
  { cat: 'Amigo e colega de curso técnico no EFG', greeting: 'Gab, mulher, boa noite 🌙', who: 'Gabriel Carneiro', photo: 'assets/depo-gabriel.jpg', photoAlt: 'Foto de Gabriel Carneiro',
    text: 'Muito obrigado, Gab, por me ajudar e sempre me auxiliar quando eu preciso. Sou muito grato por vc.\nVc arrasou nessa apresentação, e é isso que importa. Vc foi incrível e estamos muito felizes com isso.' }
];

// Os filmes do CINEMA DRIVE-IN: cada filme é um projeto seu. A tela gigante passa um por vez e cada carrinho estacionado é um deles.
// title = nome (cabe na tela grande: prefira até ~16 letras) | tagline = uma frase curta (até ~60 letras) | status = "em cartaz" (pronto), "em produção" ou "em breve"
// stack = tecnologias | text = descrição do painel | color/color2 = as duas cores do cartaz | plate = a "placa" do carrinho (até 7 letras)
// url = link para ver o projeto rodando (ou '') | repo = link do código no GitHub (ou '')
const films = [
  { id: 'mundo', title: 'Mundo Swarttz', tagline: 'Este portfólio: um mundo 3D para explorar', status: 'em cartaz', year: 2026, plate: 'MUNDO',
    stack: ['Three.js', 'JavaScript', 'Canvas 2D'], color: 0x7b3fe4, color2: 0xff5fa2,
    text: 'O portfólio que você está explorando: um mundo 3D bordado à mão, com biblioteca, ateliê, gatas, cartas e uma versão simples em texto para leitores de tela.',
    url: 'https://gabriellacmaciel.github.io/mundo-swarttz/', repo: 'https://github.com/GabriellaCMaciel/mundo-swarttz' },
  { id: 'jc', title: 'JC Resolve', tagline: 'Site para um cliente de verdade, com loja e assistente', status: 'em produção', year: 2026, plate: 'JC',
    stack: ['HTML', 'CSS', 'JavaScript'], color: 0xf2b84b, color2: 0xf08a3c,
    text: 'Simulação de mercado do curso: site de manutenção residencial com serviços, loja virtual, conta, carrinho e um assistente que entende o problema do cliente.',
    url: 'https://requirements-engineering-project.vercel.app', repo: 'https://github.com/GabriellaCMaciel/requirements-engineering-project' },
  { id: 'pixelinha', title: 'PixeLinha', tagline: 'Gráficos de ponto cruz a partir de qualquer imagem', status: 'em produção', year: 2026, plate: 'PIXELIN',
    stack: ['React', 'Python', 'FastAPI', 'Supabase'], color: 0xe78faf, color2: 0xf4d56b,
    text: 'Gerador de gráficos de bordado: você envia uma imagem e recebe o gráfico de ponto cruz com as cores das linhas. Projeto full stack.',
    url: '', repo: 'https://github.com/GabriellaCMaciel/stitchlab' },
  { id: 'preco', title: 'Não Trabalho de Graça', tagline: 'Calculadora de preço por hora para freelancers', status: 'em produção', year: 2026, plate: 'PRECO/H',
    stack: ['React', 'MEI', 'Simples Nacional'], color: 0x37d0c0, color2: 0x5b88b2,
    text: 'Calculadora que mostra quanto um freelancer brasileiro precisa cobrar por hora, levando em conta as regras de MEI, autônomo e Simples Nacional.',
    url: '', repo: 'https://github.com/GabriellaCMaciel/nao-trabalho-de-graca' },
  { id: 'sala3d', title: 'Sala de Aula 3D', tagline: 'Homenagem ao professor, com a turma toda dentro', status: 'em produção', year: 2026, plate: 'SALA3D',
    stack: ['Three.js', 'JavaScript'], color: 0xf08a3c, color2: 0xff5fa2,
    text: 'Homenagem da turma de Web e Mobile ao professor: a sala de aula em 3D, com os lugares dos alunos e personagens para conversar.',
    url: '', repo: '' },
  { id: 'painel', title: 'Swartz Progress', tagline: 'Meu painel de aprendizados, entregas e conquistas', status: 'em produção', year: 2026, plate: 'PAINEL',
    stack: ['HTML', 'CSS', 'JavaScript', 'GitHub Pages'], color: 0xb79af5, color2: 0x37d0c0,
    text: 'Painel próprio para registrar o que aprendo, o que entrego e o que conquisto, publicado no GitHub Pages.',
    url: '', repo: 'https://github.com/GabriellaCMaciel/swartz-progress-panel' }
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
