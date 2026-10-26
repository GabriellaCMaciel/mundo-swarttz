# Mundo Swarttz

Portfólio 3D interativo de **Gabriella Swarttz**, feito com HTML, CSS, JavaScript e [Three.js](https://threejs.org/).

Você abre o notebook, "hackeia" o perfil e entra num mundo com zonas para explorar: Sobre, Biblioteca, Cinema drive-in (os projetos), Telefone e Cartas. As gatas Kiara, Maria Marta, Zé Porempa, Mel e os três filhotes (Bangula, Ônix e Cat Noir) moram por lá.

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
js/guide.js       o livro de instruções (2D) que abre ao entrar no mundo: 5 páginas (andar, correr e pular, interagir, nos lugares, selos). Tudo o que antes era dica na tela mora aqui
js/pick.js        toque/clique nas coisas do mundo: ícones do celular abrem os perfis, zonas abrem o painel
js/interact.js    o sistema de interações: tudo que dá para clicar/tocar (gatas, filhotes, Zé Porempa, lagoa, cerejeira, balanço) reage com balão de fala, corações etc.; tecla F interage com o mais perto
js/stamps.js      os selos colecionáveis: lista STAMPS (arte em SVG, nome, descrição, pista), álbum, aviso ao ganhar e salvamento no navegador (localStorage)
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
- Livros da biblioteca: lista `books` em `js/config.js` (título, tipo, status, carga horária, certificado, cor da capa). São 7 livros (formação acadêmica, carreiras da Alura, bootcamp e inglês), repartidos sozinhos num arco no fundo da biblioteca.
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
- Dicas na tela: não há mais dicas de controle espalhadas ("abrir (E)", "clique fora…"): o tutorial (`js/guide.js`) explica tudo. Só o aviso da abertura (`.hint`) continua. Textos de leitura das janelas usam a fonte Nunito (`--font-body`), com bastante espaço em volta.
- Economia de energia: com um painel/Correios aberto ou a aba em segundo plano o loop de animação é parado (`syncLoop` em `js/ui.js`) e volta sozinho.
- Tamanho de cada zona: campo `size` da lista `zones` (1 = tamanho original). A casa das cartas tem as medidas e o giro em `CARTAS`, `YARD` e `HOUSE`, no topo de `js/mailbox.js`.



- Interações: cada coisa clicável é um item de `INTERACTS` em `js/interact.js` (`buildInteracts`): nome, onde está (`pos`), raio do clique (`r`) e o que acontece. O clique é testado pela distância do "raio" até um ponto, não pelas malhas 3D.
- Selos: para criar um, acrescente um item em `STAMPS` (`js/stamps.js`) e chame `stampGrant('id')` onde a conquista acontece. O progresso fica em `localStorage` (`swarttz-selos`). O botão "Zerar coleção" do álbum recomeça tudo (útil para demonstrar).
- Chão: as cores dos retalhos estão em `patchTex` (`js/world.js`); foram clareadas para dar mais contraste com a personagem e os objetos escuros.
- Desempenho: o que mantém o mundo fluido (não desfaça sem medir): (1) `instanced()` em `js/garden.js` liga o corte por campo de visão (`frustumCulled`) e os arbustos têm uma versão simples de longe (LOD); (2) o telão do cinema usa uma textura por print e a transição é só opacidade (`js/cinema.js`), sem redesenhar canvas por quadro; (3) só 3 luzes de ponto de verdade, reaproveitadas pelas zonas mais próximas (`updateZoneLights` em `js/zones.js`); (4) resolução adaptativa (`perfStep` em `js/ui.js`) e `powerPreference: 'high-performance'`; MSAA desligado em telas 2x ou mais (`js/intro.js`).


## Ateliê (temporariamente fora)
O Ateliê (soft skills) está desligado por enquanto. Para trazê-lo de volta, troque `ATELIE_ATIVO` para `true` em `js/config.js`: cenário, cartão, painel, ícone do mapa e o selo "Mãos à Obra" voltam juntos.

## Guia de passeio (tour)
Para quem não sabe o que fazer no mundo (`js/tour.js` + `css/tour.css`):
- **Boas-vindas** na primeira visita: "Fazer o tour", "Explorar por conta própria" ou "Como controlar a personagem". Quem já viu não vê de novo (guardado em `localStorage`).
- **Dock** no pé da tela, sempre visível: "Próximo lugar: Biblioteca · 2 de 5". Um toque começa (ou continua) o tour. No fim vira "Abrir o álbum de selos".
- **Tour**: a personagem anda sozinha até cada lugar, uma caixinha explica e oferece "Abrir", "Próximo" ou "Sair". Se a pessoa mexer no joystick ou no teclado, o tour espera ("Continuar").
- A ordem e os textos estão em `TOUR_ORDER` e `TOUR_INFO` no começo de `js/tour.js`. Lugares que saem do mundo (como o Ateliê, por enquanto) saem do tour sozinhos.

## Versionamento
O portfólio usa o **Versionamento Semântico** (`MAJOR.MINOR.PATCH`, por exemplo `1.2.0`). A versão atual aparece no menu de acessibilidade do mundo 3D, no rodapé da versão simples e no console do navegador. O histórico completo está no [CHANGELOG.md](CHANGELOG.md), e cada versão tem uma _tag_ (`v1.2.0`) e uma Release aqui no GitHub.

| Número | Quando sobe | Exemplos deste projeto |
| --- | --- | --- |
| **MAJOR** (`2.0.0`) | Mudança grande, que reformula a experiência ou quebra o que existia | Trocar o conceito do mundo, mudar a forma de navegar por completo |
| **MINOR** (`1.3.0`) | Função nova que não quebra nada | Um lugar novo, o tour guiado, os selos, o Ateliê voltando |
| **PATCH** (`1.2.1`) | Correção ou ajuste pequeno | Texto, contraste, bug, desempenho sem função nova |

Sobe o MAJOR: MINOR e PATCH voltam a zero. Sobe o MINOR: o PATCH volta a zero.

**Como lançar uma versão nova** (o número fica em `VERSION`, em `js/config.js`; não edite na mão):
1. Escreva o que mudou no `CHANGELOG.md`, embaixo de `## [Não lançado]` (grupos: Adicionado, Alterado, Corrigido, Desempenho).
2. **Pelo GitHub:** aba **Actions** > **Lançar nova versão** > **Run workflow** > escolha `patch`, `minor` ou `major`. Ele sobe o número, cria o commit, a tag e a Release.
3. **Ou no terminal:** `node scripts/bump-version.js patch` (ou `minor`, `major`), depois `git add -A && git commit -m "chore: release vX.Y.Z" && git tag -a vX.Y.Z -m "vX.Y.Z" && git push --follow-tags`.

O script troca juntos o `VERSION`, o `?v=` do `index.html` (que força o navegador a baixar os arquivos novos) e o rodapé da versão simples. Por isso, o `?v=` agora é sempre o número da versão: toda publicação precisa de uma versão nova (no mínimo um `patch`).
