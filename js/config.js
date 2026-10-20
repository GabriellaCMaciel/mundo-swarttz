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
// short = nome curto na capa | kind = tipo | status, period, hours e cert = linhas do painel | topics = assuntos | color = cor da capa.
// period e hours são opcionais: se faltarem, a linha some do painel (assim nunca aparece "a preencher" para o visitante).
// Se o número de livros mudar, a biblioteca 3D (js/library.js) reparte o arco sozinha e a conquista "Estante Completa" passa a exigir todos.
// As horas das trilhas da Alura vêm da página oficial de cada carreira (conferido em 20/10/2026).
const books = [
  { id: 'efg', short: 'EFG', kind: 'Curso técnico', title: 'Técnico em Desenvolvimento Web e Mobile', org: 'Escola do Futuro de Goiás',
    status: 'Em andamento', period: 'Fevereiro de 2026 a agosto de 2027', cert: 'Ao concluir o curso', color: 0x7b3fe4,
    text: 'Formação técnica em desenvolvimento de sites e aplicativos para web e celular, com projetos em equipe e simulações de mercado.',
    topics: ['Desenvolvimento Web', 'Desenvolvimento Mobile'] },
  { id: 'grad', short: 'GRAD', kind: 'Graduação', title: 'Bacharelado em Engenharia de Software', org: 'Gran Faculdade',
    status: 'Previsão de conclusão: novembro de 2029', period: 'Novembro de 2025 a novembro de 2029', cert: 'Diploma ao concluir a graduação', color: 0xf08a3c,
    text: 'Graduação em Engenharia de Software: o caminho para projetar, construir e manter sistemas com método e qualidade.',
    topics: ['Engenharia de Software'] },
  { id: 'react', short: 'REACT', kind: 'Carreira Alura', title: 'Desenvolvimento Front-End React', org: 'Alura',
    status: 'Em andamento', hours: '554 horas de aulas', cert: 'Ainda sem certificado: estou fazendo a carreira', color: 0x37d0c0,
    text: 'Do primeiro componente à liderança técnica! Minha carreira em desenvolvimento front-end React: do básico ao avançado, com TypeScript, arquitetura e performance. As tecnologias abaixo são as citadas na página oficial da carreira.',
    topics: ['HTML', 'CSS', 'Acessibilidade e SEO', 'Layouts responsivos', 'JavaScript', 'Manipulação do DOM', 'localStorage', 'Requisições HTTP', 'Node.js', 'npm', 'ESLint', 'Git e GitHub', 'Figma',
             'React', 'JSX', 'TypeScript', 'Arquitetura', 'Testes avançados', 'Performance', 'Escalabilidade', 'Liderança técnica'] },
  { id: 'python', short: 'PYTHON', kind: 'Carreira Alura', title: 'Desenvolvimento Back-End Python', org: 'Alura',
    status: 'Em andamento', hours: '496 horas de aulas', cert: 'Ainda sem certificado: estou fazendo a carreira', color: 0xf2b84b,
    text: 'Domine o back-end com Python: criar APIs com Django, FastAPI e Flask, aplicar arquitetura, trabalhar com CI/CD e enfrentar desafios reais do mercado. As tecnologias abaixo são as citadas na descrição e nas etapas da carreira.',
    topics: ['Python', 'Pensamento computacional', 'Lógica de programação', 'Django', 'FastAPI', 'Flask', 'APIs', 'Aplicações web', 'Arquitetura', 'Qualidade', 'Segurança', 'Escalabilidade', 'Desempenho', 'CI/CD', 'Deploy em produção'] },
  { id: 'ia', short: 'IA', kind: 'Carreira Alura', title: 'Engenharia de Agentes de IA', org: 'Alura',
    status: 'Em andamento', hours: '234 horas de aulas, em 24 cursos', cert: 'Ainda sem certificado: estou fazendo a carreira', color: 0xff5fa2,
    text: 'Aprender a criar, implantar e monitorar soluções inteligentes de ponta a ponta, do conceito até a produção em escala. As tecnologias abaixo são as citadas na página oficial da carreira.',
    topics: ['Python', 'Pandas', 'LLMs', 'APIs da OpenAI e do Gemini', 'Agentes de IA', 'RAG', 'Machine Learning', 'Deep Learning', 'Fine tuning', 'MLOps'] },
  { id: 'matera', short: 'MATERA', kind: 'Bootcamp', title: 'Bootcamp Teste de Software', org: 'Instituto Matera',
    status: 'Concluído', period: '17 de março a 3 de abril de 2025', hours: '24 horas, online', cert: 'Emitido em abril de 2025', color: 0x6bb7ff,
    text: 'Curso online de 24 horas, de segunda a quinta-feira, sobre teste de software, promovido pelo Instituto Matera.',
    topics: ['Teste de software'] },
  { id: 'toefl', short: 'TOEFL', kind: 'Inglês · B1', title: 'TOEFL ITP Level 2', org: 'Mastertest Educational',
    status: 'Concluído', period: 'Teste feito em 13 de outubro de 2026', cert: 'Declaração da Mastertest Educational', color: 0x8fd45a,
    text: 'Meu nível de inglês é B1 (intermediário): fui classificada com 91,48% no teste de nivelamento.',
    topics: ['Inglês B1'] }
];
