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

// Os filmes do CINEMA DRIVE-IN: cada filme é um projeto seu.
//  - Os CARTAZES na parede do cinema mostram as informações do filme (título, frase, status e tecnologias).
//  - O TELÃO passa as IMAGENS do projeto (lista `shots`: prints dele rodando, em assets/filmes/, de preferência 16:9, ex. 1280x720).
//  - Na BILHETERIA o visitante escolhe o filme; o telão, os cartazes e o ingresso mudam juntos.
// title = nome (cabe no cartaz: até ~22 letras) | tagline = frase curta (até ~60 letras) | status = "em cartaz" (pronto), "em produção" ou "lançamento previsto" (futuro)
// stack = tecnologias (as 4 primeiras vão para o cartaz) | text = descrição do painel | color/color2 = as duas cores do cartaz | plate = placa do carrinho (até 7 letras)
// shots = prints para o telão (sem prints, o telão mostra o status, ex. "lançamento previsto") | url = projeto rodando (ou '') | repo = código no GitHub (só se o repositório for PÚBLICO, senão '')
const films = [
  { id: 'mundo', title: 'Mundo Swarttz', tagline: 'Este portfólio: um mundo 3D para explorar', status: 'em cartaz', year: 2026, plate: 'MUNDO',
    stack: ['Three.js', 'JavaScript', 'Canvas 2D'], color: 0x7b3fe4, color2: 0xff5fa2,
    text: 'O portfólio que você está explorando: um mundo 3D bordado à mão, com biblioteca, ateliê, gatas, cartas e uma versão simples em texto para leitores de tela.',
    shots: ['assets/filmes/mundo-1.jpg', 'assets/filmes/mundo-2.jpg', 'assets/filmes/mundo-3.jpg', 'assets/filmes/mundo-4.jpg'],
    url: 'https://gabriellacmaciel.github.io/mundo-swarttz/', repo: 'https://github.com/GabriellaCMaciel/mundo-swarttz' },
  { id: 'jc', title: 'JC Resolve', tagline: 'Manutenção residencial com loja e agendamento online', status: 'em produção', year: 2026, plate: 'JC',
    stack: ['Next.js', 'React', 'TypeScript', 'PostgreSQL'], color: 0xf2b84b, color2: 0x2f8f6b,
    text: 'Simulação de mercado do curso: site de uma empresa de manutenção residencial, com assistente que entende o problema, loja de materiais, checkout com agendamento de visita e painel administrativo.',
    shots: ['assets/filmes/jc-1.jpg', 'assets/filmes/jc-2.jpg', 'assets/filmes/jc-3.jpg'],
    url: '', repo: 'https://github.com/GabriellaCMaciel/requirements-engineering-project' }, // o protótipo online mudou de endereço: coloque o link novo em url quando tiver
  { id: 'pixelinha', title: 'PixeLinha', tagline: 'Transforme qualquer imagem em gráfico de ponto cruz', status: 'em cartaz', year: 2026, plate: 'PIXELIN',
    stack: ['React', 'Python', 'FastAPI', 'Supabase'], color: 0xe78faf, color2: 0xf4d56b,
    text: 'Você escolhe uma foto e recebe o gráfico de ponto cruz com as linhas DMC, a quantidade de novelos e um PDF para imprimir. Projeto full stack.',
    shots: ['assets/filmes/pixelinha-1.jpg', 'assets/filmes/pixelinha-2.jpg'],
    url: 'https://pixelinha.vercel.app', repo: 'https://github.com/GabriellaCMaciel/pixelinha' },
  { id: 'preco', title: 'Não Trabalho de Graça', tagline: 'Uma estimativa de valor por hora, com imposto e férias', status: 'em produção', year: 2026, plate: 'PRECO/H',
    stack: ['React', 'Vite', 'MEI', 'Simples Nacional'], color: 0x37d0c0, color2: 0x5b88b2,
    text: 'Calculadora que estima, a partir dos dados que a pessoa informa, um valor por hora, por dia e por projeto para freelancers brasileiros, com as regras de MEI, autônomo e Simples Nacional de 2026. É uma estimativa para planejamento, não uma recomendação de quanto cobrar.',
    shots: ['assets/filmes/preco-1.jpg', 'assets/filmes/preco-2.jpg', 'assets/filmes/preco-3.jpg'],
    url: '', repo: '' },
  { id: 'painel', title: 'Swartz Progress', tagline: 'Meu painel de aprendizados, entregas e conquistas', status: 'lançamento previsto', year: 2026, plate: 'PAINEL',
    stack: ['HTML', 'CSS', 'JavaScript', 'GitHub API'], color: 0xb79af5, color2: 0x37d0c0,
    text: 'Painel próprio, ainda em desenvolvimento, para registrar o que aprendo, o que entrego e o que conquisto. Lançamento previsto: em breve.',
    shots: [], url: '', repo: '' }
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
