# Mundo Swarttz

Portfólio 3D interativo de **Gabriella Swarttz**, feito com HTML, CSS, JavaScript e [Three.js](https://threejs.org/).

Você abre o notebook, "hackeia" o perfil e entra num mundo com zonas para explorar: Sobre, Ateliê, Biblioteca, Álbum de selos, Telefone e Cartas. As gatas Kiara e Maria Marta moram por lá.

## Como usar

- Computador: `WASD` ou setas para andar, `E` para abrir uma zona, `Esc` para fechar.
- Celular: joystick na tela e botão "abrir".

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
js/kiara.js       a Kiara: segue a Gabriella e, quando ela para, vem se esfregar nas pernas pedindo carinho
js/swing.js       o balanço na árvore (cordas com flores e hera, livro, manta, cestos), à direita da biblioteca
js/mailbox.js     a zona Cartas em 3D: casinha decorativa e caixa de correio rosa com rosas
js/mail.js        a tela das cartas: carrossel de envelopes e a animação de abrir a carta
js/zones.js       cenários e etiquetas das outras zonas (sem círculos: tudo faz parte do mesmo mundo)
js/decor.js       decoração do mundo inteiro: flores, árvores floridas, postes e fios de luz ligando as zonas
js/ui.js          painéis, controles e o loop principal
assets/           logos e foto
```

Os arquivos JS dependem uns dos outros, então a ordem das tags `<script>` no `index.html` importa.

## Como rodar

Use um servidor local (por exemplo, a extensão **Live Server** do VS Code) ou publique no GitHub Pages. Abrir o `index.html` com duplo clique não carrega as imagens, porque o navegador bloqueia texturas de arquivos locais. Precisa de internet para o Three.js e as fontes.

## Como editar

- Textos e links: `js/config.js` (terminal da abertura, GitHub, livros da biblioteca, depoimentos).
- Livros da biblioteca: lista `books` em `js/config.js` (título, tipo, status, carga horária, certificado, cor da capa). São 6 livros, bem espaçados num arco no fundo da biblioteca.
- Zonas (nome, cor, posição, texto do cartão): lista `zones` em `js/zones.js`.
- Conteúdo dos painéis: objeto `panels` em `js/ui.js`.
- Velocidade do personagem: `SPEED` em `js/ui.js`.

Os textos dos painéis, os depoimentos e as imagens dos selos ainda são provisórios.
