# Histórico de mudanças

Todas as mudanças importantes do **Mundo Swarttz** ficam registradas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e as versões seguem o [Versionamento Semântico](https://semver.org/lang/pt-BR/) (`MAJOR.MINOR.PATCH`). As regras estão no README, na seção "Versionamento".

> As versões anteriores à 1.2.0 foram numeradas depois, olhando o histórico do Git. As datas e os pontos de cada uma estão nas _tags_ do repositório.

## [Não lançado]
### Adicionado
- Visão em 1ª pessoa: ao chegar em uma área (Sobre, Biblioteca, Cinema, Telefone, Cartas), a câmera vai para os olhos da personagem, olhando para a atração do lugar. W/S andam para onde você olha, A/D andam de lado, as setas ← → ou arrastar o mouse/dedo viram a cabeça. Ao sair da área, a visão volta sozinha para trás da personagem.

## [1.3.0] - 2026-10-26
### Adicionado
- Botão "Voltar ao topo" (seta dourada no canto) nas janelas que rolam: painéis dos lugares, álbum de selos, acessibilidade, carta aberta, livro de instruções e boas-vindas. Só aparece depois de rolar um pouco e respeita "reduzir movimento".

## [1.2.1] - 2026-10-26
### Corrigido
- O botão "Você viu tudo!" do pé da tela não aparece mais para sempre: depois de visitar todos os lugares do tour, ele some.

## [1.2.0] - 2026-10-26
### Adicionado
- Sistema de versões (Major, Minor e Patch): número da versão no código (`VERSION` em `js/config.js`), no menu de acessibilidade e no rodapé da versão simples.
- Este histórico de mudanças (`CHANGELOG.md`).
- Comando `node scripts/bump-version.js` e ação "Lançar nova versão" no GitHub, que sobem a versão, criam a _tag_ e a Release sozinhos.

### Alterado
- O parâmetro `?v=` do `index.html` (que força o navegador a baixar a versão nova) agora usa o número da versão, em vez de uma data.

## [1.1.1] - 2026-10-22
### Corrigido
- O tour guiado sempre começa pelo primeiro lugar (antes pulava os lugares já visitados e parecia estar no meio).
- Botão "Voltar" em todas as paradas do tour, e os pontinhos do topo levam direto a cada lugar.

## [1.1.0] - 2026-10-21
### Adicionado
- Tour guiado: a personagem anda sozinha por cada lugar, explica e oferece "Abrir", "Próximo" e "Sair".
- Barra no pé da tela com o próximo lugar a visitar (por exemplo, "Fazer o tour: 5 lugares").
- Boas-vindas na primeira visita, com a escolha entre fazer o tour, explorar sozinho ou ver os controles.

### Alterado
- A frase da intro agora diz "toque ou aperte uma tecla para começar".

## [1.0.1] - 2026-10-21
### Corrigido
- Sofás da biblioteca mais escuros, para a Maria Marta (branca) aparecer.

## [1.0.0] - 2026-10-20
Primeira versão completa, apresentada ao professor.

### Adicionado
- Cinema drive-in: cada filme na tela gigante é um projeto, com prints reais, bilheteria e links.
- Selos colecionáveis com álbum salvo no navegador (inclui "Estante Completa").
- Interações com as gatas, a lagoa, a cerejeira e o balanço.
- Biblioteca com a formação real: EFG, Gran Faculdade, as três carreiras da Alura e o Bootcamp Matera, com carga horária e tecnologias.
- Caminhos com postes de luz em pares até cada lugar e também entre os lugares.

### Alterado
- Janelas de informação redesenhadas, com mais espaço e fonte legível.
- Dicas repetidas de controle saíram da tela e ficaram só no tutorial.
- Chão mais claro, para dar contraste; árvores do meio do mapa menores, para não tapar a visão.
- O Ateliê está desligado por enquanto (`ATELIE_ATIVO` em `js/config.js`).

### Desempenho
- Luzes reaproveitadas entre as zonas, resolução adaptativa, menos detalhe para arbustos distantes e troca de prints do cinema pela placa de vídeo.

### Corrigido
- Travamento perto da casa das cartas.
- A janela do drive-in só abre ao clicar na tela do cinema, não no chão do estacionamento.
- Textos que ficavam para fora ou cortados em janelas, tutorial e cartões no celular.
- Link e status dos filmes (PixeLinha "em cartaz") e texto da calculadora como estimativa.

## [0.3.0] - 2026-10-17
### Adicionado
- Versão simples em texto (`simples.html`) e menu de acessibilidade, com "Ir até lá", andar clicando e opção de reduzir movimento.
- Correr e pular, minimapa com a posição, livro de instruções animado e muralha de árvores em volta do mundo.
- Depoimentos como cartas com foto, atividade real do GitHub no celular gigante e cartão de compartilhamento.
- Mais bichinhos brincando perto do balanço (Maria Julietta, Mocca e um passarinho).

### Desempenho
- O mundo para de ser desenhado enquanto uma janela o cobre ou a aba está escondida.

## [0.2.0] - 2026-10-16
### Adicionado
- Links reais das redes no telefone gigante e a cerejeira com pétalas caindo.
- Novo logo (gato em SVG) em todos os lugares.

### Alterado
- Contraste de textos no padrão WCAG AA.
- Gatas com mais de uma cor passaram a ter a cor pintada no pelo, sem esferas empilhadas.

## [0.1.0] - 2026-10-15
### Adicionado
- Primeira versão do mundo 3D: biblioteca ao ar livre com livros clicáveis, jardim, lagoa com peixes, balanço, casa e caixa de Cartas, telefone gigante e as gatas (Kiara, Zé Porempa, Mel e os filhotes).
