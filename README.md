# Mundo Swarttz

Portfólio 3D interativo de **Gabriella Swarttz**, feito com HTML, CSS, JavaScript e [Three.js](https://threejs.org/).

Você abre o notebook, "hackeia" o perfil e entra num mundo com zonas para explorar: Sobre, Ateliê, Biblioteca, Álbum de selos, Telefone e Cartas. As gatas Kiara, Maria Marta, Zé Porempa, Mel e os três filhotes (Bangula, Ônix e Cat Noir) moram por lá.

## Como usar

- Computador: `WASD` ou setas para andar, `E` (ou clicar na coisa) para abrir uma zona, `Esc` para fechar.
- Celular: joystick na tela; toque na coisa (ou no cartão/botão "abrir") para abrir.

## Estrutura

```
index.html        página e elementos da interface
css/style.css     estilos (cores, painéis, joystick)
js/config.js      conteúdo editável: imagens, link do GitHub, texto do terminal, livros da biblioteca, depoimentos
js/intro.js       renderizador, câmera e a abertura do notebook
js/garden.js      ajudantes de jardim: flores, arbustos, árvores, postes, luzinhas e borboletas (usados no mundo todo)
js/world.js       chão, luzes, céu, personagem e gatas
js/library.js     a biblioteca: grande pavilhão aberto com jardim, lagoa, estantes, sofás, puffs e livros clicáveis
js/pond.js        a lagoa viva: peixes nadando e o gato Zé Porempa tentando pegá-los
js/cherry.js      a cerejeira grande (tronco grosso e curvo, galhos em tubo liso, sem emendas) ao lado do banco, na esquerda da lagoa: pétalas caindo ao vento e espalhadas pelo chão
js/kiara.js       a Kiara: segue a Gabriella e, quando ela para, vem se esfregar nas pernas pedindo carinho
js/swing.js       o balanço na árvore (cordas com flores e hera, livros coloridos empilhados, manta, cestos), à direita da biblioteca
js/playcats.js    Maria Julietta e o Mocca brincando perto do balanço: ela caça as borboletas, ele persegue e sobe no tronco atrás de um passarinho
js/mailbox.js     a zona Cartas em 3D: caixa de correio rosa, casinha inclinada e quintal com cerca completa e portão
js/yardcats.js    a Mel (no telhado, rosna se outro gato chega perto) e os filhotes brincando de lutinha no quintal
js/phone.js       o celular gigante da zona Telefone: flutua, gira devagar para os lados seguindo a pessoa, com ícones de redes e cartões de vidro
js/pick.js        toque/clique nas coisas do mundo: ícones do celular abrem os perfis, zonas abrem o painel
js/boot.js        porta de entrada: escolhe entre o mundo 3D e a versão simples e carrega os outros arquivos em ordem
js/simple.js      a versão simples (texto puro, acessível): mesmas informações do 3D, para leitor de tela, teclado e aparelhos sem WebGL
js/mail.js        a tela das cartas: carrossel de envelopes e a carta dobrada em três (animação por linha do tempo, reversível)
js/zones.js       cenários e etiquetas das outras zonas (sem círculos: tudo faz parte do mesmo mundo)
js/worldmap.js    o mapa do mundo numa tábua ao lado da placa "Sobre", com um X vermelho no lugar onde a pessoa está agora
js/decor.js       decoração do mundo inteiro: flores, árvores floridas, postes e fios de luz ligando as zonas
js/ui.js          painéis, controles e o loop principal
assets/           logos (SVG, versões para fundo escuro e claro) e foto
```

Os arquivos JS dependem uns dos outros, então a ordem das tags `<script>` no `index.html` importa.

## Como rodar

Use um servidor local (por exemplo, a extensão **Live Server** do VS Code) ou publique no GitHub Pages. Abrir o `index.html` com duplo clique não carrega as imagens, porque o navegador bloqueia texturas de arquivos locais. Precisa de internet para o Three.js e as fontes.

## Como editar

- Textos e links: `js/config.js` (terminal da abertura, GitHub, "Sobre" e soft skills, livros da biblioteca, depoimentos). O 3D e a versão simples leem os mesmos dados.
- Livros da biblioteca: lista `books` em `js/config.js` (título, tipo, status, carga horária, certificado, cor da capa). São 6 livros, bem espaçados num arco no fundo da biblioteca.
- Zonas (nome, cor, posição, texto do cartão): lista `zones` em `js/zones.js`.
- Conteúdo dos painéis: objeto `panels` em `js/ui.js`.
- Velocidade do personagem e tamanho do mundo: `SPEED` e `WORLD_LIMIT` em `js/ui.js` (a muralha de árvores da borda fica em `buildForestWall`, `js/decor.js`).
- Links das redes sociais: lista `SOCIALS` em `js/config.js` (cole o link do seu perfil em `url`; vazio = "em breve").
- Gatos: gato com mais de uma cor tem as cores PINTADAS no corpo (`coatTex` e `coatMat` em `js/world.js`), nunca esferas coladas por cima, que viram "caroços". Vale para todos os gatos, inclusive os próximos.
- Logo: `assets/logo-escuro.svg` (para fundo escuro) e `assets/logo-claro.svg` (para fundo claro); o caminho fica em `ASSETS` (`js/config.js`). Se a proporção mudar, ajuste o tamanho nos `drawImage` de `intro.js`, `zones.js` e `phone.js`.
- Acessibilidade: texto precisa de contraste WCAG AA (4,5:1; 3:1 para texto grande). Ao criar cartões ou cores novos, confira antes.
- Celular gigante: medidas em `PHONE`, posição dos ícones em `PH_SPOTS` e textos da tela/cartões em `js/phone.js`. O giro (só acompanha a pessoa) é limitado a ±0,38 rad (`want` em `updatePhone`).
- Olhos dos gatos: `buildCat(cor, mascara, { eye: cor })` ou `{ eye: { l: cor, r: cor } }` para olhos de cores diferentes (esquerdo/direito), em `js/world.js`.
- Gatos brincalhões: estados e velocidades em `js/playcats.js` (`updateJulietta`, `updateMocca`, `updateBird`). Com `prefers-reduced-motion` eles ficam parados.
- Regra de clique fora: clicar fora de algo que foi aberto (carta, tela dos Correios, painéis) fecha o que foi aberto. Em `js/mail.js` use `e.envHandled` para cliques que o próprio envelope já tratou.
- Acessibilidade: o site tem uma **versão simples** (texto puro) em `?simples` (e `?3d` volta ao mundo 3D); ela abre sozinha se o aparelho não tiver WebGL. No 3D, a tecla **H** (ou o botão Acessibilidade) abre o menu: ir direto a cada lugar, andar sozinho até lá, reduzir movimento. Clicar/tocar no chão também faz a personagem andar. Leitores de tela recebem avisos (região `#srLive`, função `announce()` em `js/intro.js`).
- Instruções de controle: ficam sempre no canto superior direito (`.keys`, `.hint`); quando algo abre na tela (painel, Correios, carta) elas vão para o canto inferior direito, discretas (`.panel-hint`, `.mail-keys`).
- Economia de energia: com um painel/Correios aberto ou a aba em segundo plano o loop de animação é parado (`syncLoop` em `js/ui.js`) e volta sozinho.
- Tamanho de cada zona: campo `size` da lista `zones` (1 = tamanho original). A casa das cartas tem as medidas e o giro em `CARTAS`, `YARD` e `HOUSE`, no topo de `js/mailbox.js`.

Os textos dos painéis, os depoimentos e as imagens dos selos ainda são provisórios.
