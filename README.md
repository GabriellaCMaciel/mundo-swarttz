# Mundo Swarttz

Portfólio 3D interativo de **Gabriella Swarttz**, feito com HTML, CSS, JavaScript e [Three.js](https://threejs.org/).

Você abre o notebook, "hackeia" o perfil e entra num mundo com zonas para explorar: Sobre, Ateliê, Biblioteca, Cinema drive-in (os projetos), Telefone e Cartas. As gatas Kiara, Maria Marta, Zé Porempa, Mel e os três filhotes (Bangula, Ônix e Cat Noir) moram por lá.

## Como usar

- Computador: `WASD` ou setas para andar, `Shift` para correr (ou `R` liga/desliga), `Espaço` para pular, `E` (ou clicar na coisa) para abrir uma zona, `M` para ampliar o mapa, `H` para acessibilidade, `Esc` para fechar.
- Celular: joystick na tela e botões "correr" e "pular"; toque na coisa (ou no cartão/botão "abrir") para abrir; toque no mapinha para ampliar.
- Mapa: um mapinha redondo fica fixo no canto superior direito, com um X vermelho que acompanha a pessoa; ampliado, mostra o nome de cada lugar.

## Estrutura

```
index.html        o mundo 3D: página, elementos da interface e as tags de compartilhamento (og:image, favicon)
simples.html      a versão simples: página de portfólio comum em HTML puro, sem JavaScript, na estética do mundo
css/style.css     estilos do mundo 3D (cores, painéis, joystick)
css/simples.css   estilos da versão simples (cores e fontes iguais às do mundo)
js/config.js      conteúdo editável: imagens, link do GitHub, texto do terminal, filmes do cinema (projetos), livros da biblioteca, depoimentos
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
js/cinema.js      o cinema drive-in da zona de projetos: telão (16:9) que passa os prints do projeto em exibição, cartazes "em cartaz" com as informações de cada filme, 6 carrinhos nas vagas, cabine do projetor com feixe de luz, bilheteria com letreiro LED, ingresso e setas para escolher o filme, e o letreiro DRIVE-IN
js/guide.js       o livro de instruções (2D) que abre ao entrar no mundo: 3 páginas com o hacker animado andando, correndo, pulando e interagindo (estilos em css/guide.css)
js/pick.js        toque/clique nas coisas do mundo: ícones do celular abrem os perfis, zonas abrem o painel
js/boot.js        porta de entrada: manda para simples.html (escolha salva, ?simples ou aparelho sem WebGL) ou carrega o mundo 3D, com os arquivos em ordem
js/mail.js        a tela das cartas: carrossel de envelopes e a carta dobrada em três (animação por linha do tempo, reversível)
js/zones.js       cenários e etiquetas das outras zonas (sem círculos: tudo faz parte do mesmo mundo)
js/trails.js      as trilhas (curvas invisíveis) que ligam o ponto de partida a cada lugar; só guiam a decoração e os postes de luz
js/worldmap.js    o mapa redondo com o mesmo chão bordado do mundo (mapinha fixo no canto + versão ampliada) com um X vermelho no lugar onde a pessoa está agora
js/decor.js       decoração do mundo inteiro: flores, árvores floridas, postes e fios de luz ligando as zonas
js/ui.js          painéis, controles e o loop principal
assets/           logos (SVG, versões para fundo escuro e claro), foto, og-image.png (cartão de compartilhamento 1200x630), favicon-32.png e apple-touch-icon.png
```

Os arquivos JS do mundo 3D dependem uns dos outros, então a ordem da lista em `js/boot.js` importa.

## Como rodar

Use um servidor local (por exemplo, a extensão **Live Server** do VS Code) ou publique no GitHub Pages. Abrir o `index.html` com duplo clique não carrega as imagens, porque o navegador bloqueia texturas de arquivos locais. Precisa de internet para o Three.js e as fontes.

## Como editar

- Textos e links: `js/config.js` (terminal da abertura, GitHub, "Sobre" e soft skills, livros da biblioteca, depoimentos). O mundo 3D lê esses dados; a versão simples (`simples.html`) é HTML estático, então textos que mudarem aqui precisam ser mudados lá também.
- Projetos (cinema drive-in): lista `films` em `js/config.js` (título, frase, status, ano, tecnologias, descrição, cores, placa do carrinho, `shots` = prints do projeto, `url` do projeto rodando e `repo` do código). O TELÃO passa os prints (`shots`, imagens 16:9 em `assets/filmes/`) do filme em exibição, um a um; sem prints aparece "EM BREVE". Os CARTAZES na parede abaixo do telão trazem título, frase, status e tecnologias de cada filme. Na BILHETERIA (ao lado do estacionamento) escolha o filme: setas 3D, barra na tela (◀ ▶), teclas `[` e `]`, ou clique num cartaz ou carrinho; telão, cartazes, letreiro e ingresso mudam juntos, na hora. O painel (E) lista todos, com o botão "Passar na tela". Para um novo filme: acrescente um item em `films`, ponha os prints em `assets/filmes/` e liste-os em `shots`. Textos dos cartazes, letreiros e ingresso são medidos e encolhem até caber (`cinFit`, `cinTitle` em `js/cinema.js`). Status e links são provisórios: confira e ajuste.
- Livros da biblioteca: lista `books` em `js/config.js` (título, tipo, status, carga horária, certificado, cor da capa). São 6 livros, bem espaçados num arco no fundo da biblioteca.
- Zonas (nome, cor, posição, texto do cartão): lista `zones` em `js/zones.js`.
- Conteúdo dos painéis: objeto `panels` em `js/ui.js`.
- Velocidade do personagem e tamanho do mundo: `SPEED` e `WORLD_LIMIT` em `js/ui.js` (a muralha de árvores da borda fica em `buildForestWall`, `js/decor.js`).
- Links das redes sociais: lista `SOCIALS` em `js/config.js`. Por enquanto são só GitHub, LinkedIn e e-mail; para voltar com outra rede, acrescente a entrada em `SOCIALS`, o ícone em `PH_ICONS` (`js/phone.js`) e um ponto em `PH_SPOTS`.
- Gatos: gato com mais de uma cor tem as cores PINTADAS no corpo (`coatTex` e `coatMat` em `js/world.js`), nunca esferas coladas por cima, que viram "caroços". Vale para todos os gatos, inclusive os próximos.
- Logo: `assets/logo-escuro.svg` (para fundo escuro) e `assets/logo-claro.svg` (para fundo claro); o caminho fica em `ASSETS` (`js/config.js`). Se a proporção mudar, ajuste o tamanho nos `drawImage` de `intro.js`, `zones.js` e `phone.js`.
- Acessibilidade: texto precisa de contraste WCAG AA (4,5:1; 3:1 para texto grande). Ao criar cartões ou cores novos, confira antes.
- Celular gigante: medidas em `PHONE`, posição dos ícones em `PH_SPOTS` e textos da tela/cartões em `js/phone.js`. O giro (só acompanha a pessoa) é limitado a ±0,38 rad (`want` em `updatePhone`).
- Olhos dos gatos: `buildCat(cor, mascara, { eye: cor })` ou `{ eye: { l: cor, r: cor } }` para olhos de cores diferentes (esquerdo/direito), em `js/world.js`.
- Instruções: o conteúdo do livro está em `PAGES` (`js/guide.js`): cada página tem duas metades (texto e animação). Palavras-chave em amarelo com `hl()`, teclas com `kbd()`. O botão "?" do canto reabre; o ícone de acessibilidade ao lado abre o menu de acessibilidade. Com "reduzir movimento" as animações ficam paradas.
- Atividade do celular: o gráfico lê `data/activity.json`, atualizado todo dia pela rotina `.github/workflows/activity.yml` (aba Actions > Run workflow para rodar na hora).
- Controles: correr e pular em `js/ui.js` (`RUN_KEY`, `JUMP`, `resetInput`). O estado das teclas/joystick é zerado ao perder o foco, esconder a aba ou abrir um painel, para a personagem nunca andar sozinha. Velocidade de corrida: `RUN.mul` (`js/world.js`).
- Trilhas e mapa: lista `TRAILS` em `js/trails.js` (guias invisíveis, sementes fixas); ícones e nomes do mapa em `MAP_ICONS`/`mapPlaces` (`js/worldmap.js`).
- Depoimentos (cartas): lista `letters` em `js/config.js`. `cat` aparece como legenda embaixo do envelope selecionado (não na carta); `photo` (+ `photoAlt`) vira o SELO personalizado do envelope (a foto de quem escreveu), e `logo: true` mostra a imagem como logo, sem cortar. Imagens em `assets/depo-*`.
- Vegetação: as árvores (`tree` em `js/garden.js`) têm altura e inclinação variadas, calculadas a partir da posição.
- Peixes: as manchas de cor são pintadas na textura do corpo (`makeFish`, `js/pond.js`), igual ao pelo dos gatos.
- Gatos brincalhões: estados e velocidades em `js/playcats.js` (`updateJulietta`, `updateMocca`, `updateBird`). Com `prefers-reduced-motion` eles ficam parados.
- Regra de clique fora: clicar fora de algo que foi aberto (carta, tela dos Correios, painéis) fecha o que foi aberto. Em `js/mail.js` use `e.envHandled` para cliques que o próprio envelope já tratou.
- Acessibilidade: o site tem uma **versão simples** (texto puro) em `simples.html` (`?simples` abre e lembra a escolha; `?3d` volta ao mundo 3D); ela abre sozinha, com um aviso, se o aparelho não tiver WebGL. No 3D, a tecla **H** (ou o botão Acessibilidade) abre o menu: ir direto a cada lugar, andar sozinho até lá, reduzir movimento. Clicar/tocar no chão também faz a personagem andar. Leitores de tela recebem avisos (região `#srLive`, função `announce()` em `js/intro.js`).
- Dicas na tela: o aviso da abertura (`.hint`) fica embaixo, no centro. Quando algo abre (painel, Correios, carta), a dica de fechar fica no canto inferior direito (`.panel-hint`, `.mail-keys`). As instruções de movimento ficam só no livro (`js/guide.js`) e no menu de acessibilidade.
- Economia de energia: com um painel/Correios aberto ou a aba em segundo plano o loop de animação é parado (`syncLoop` em `js/ui.js`) e volta sozinho.
- Tamanho de cada zona: campo `size` da lista `zones` (1 = tamanho original). A casa das cartas tem as medidas e o giro em `CARTAS`, `YARD` e `HOUSE`, no topo de `js/mailbox.js`.

Os textos dos painéis ainda são provisórios.
