# Squad Mundo Swarttz

## Integrantes
- Gabriella Cunha Maciel

## Descrição do projeto
O Mundo Swarttz é o portfólio tech interativo de Gabriella Swarttz, com um mundo 3D e uma versão simples em texto.
O visitante conhece os projetos, as formações e os depoimentos, e pode curtir, comentar e mandar mensagens.
Um painel admin, ligado a um banco MySQL, permite cadastrar o conteúdo, moderar comentários e ver o contador de visitas.

## Arquivos desta pasta
- `modelo_conceitual.png`: modelo conceitual (entidades, atributos, relacionamentos e cardinalidades)
- `modelo_logico.png`: modelo lógico (tabelas, chaves primárias e chaves estrangeiras)
- `projeto_squad.md`: este arquivo

O detalhe de cada coluna está em [`docs/BANCO-DE-DADOS.md`](../docs/BANCO-DE-DADOS.md).

## Entidades
| Entidade | O que guarda |
|---|---|
| **usuario** | Quem entra no painel (perfil `admin` ou `editor`) |
| **projeto** | Os projetos do portfólio (os "filmes" do cinema) |
| **tecnologia** | As tecnologias usadas nos projetos (HTML, CSS, React…) |
| **projeto_tecnologia** | Tabela associativa que liga projetos e tecnologias |
| **formacao** | Cursos e formações (os "livros" da biblioteca) |
| **depoimento** | Os depoimentos (as "cartas") |
| **mensagem** | As mensagens do formulário de contato |
| **visita** | Cada lugar aberto no mundo 3D, para o contador de visitas |
| **curtida** | As curtidas e descurtidas do site todo ou de cada projeto |
| **comentario** | Os comentários anônimos, que só aparecem depois de aprovados |

## Relacionamentos
| Relacionamento | Tipo | Chave estrangeira (no lado N) |
|---|---|---|
| usuario **cadastra** projeto | 1:N | `projeto.usuario_id` |
| usuario **cadastra** formacao | 1:N | `formacao.usuario_id` |
| usuario **cadastra** depoimento | 1:N | `depoimento.usuario_id` |
| usuario **responde** mensagem | 1:N | `mensagem.respondida_por` (vazio enquanto ninguém respondeu) |
| usuario **modera** comentario | 1:N | `comentario.moderado_por` (vazio enquanto está pendente) |
| projeto **é aberto em** visita | 1:N | `visita.projeto_id` (vazio quando o lugar aberto não é um projeto) |
| projeto **recebe** curtida | 1:N | `curtida.projeto_id` (vazio quando a curtida é no site todo) |
| projeto **utiliza** tecnologia | N:N | tabela associativa `projeto_tecnologia` (`projeto_id` + `tecnologia_id`) |

### Sobre o relacionamento N:N
O desenho original do banco (em `docs/BANCO-DE-DADOS.md`) não tinha nenhum N:N: as tecnologias de cada projeto ficavam numa única coluna de texto, separadas por vírgula (`"HTML, CSS, JavaScript"`).

Isso cria dois problemas. Primeiro, não dá para filtrar com segurança "todos os projetos que usam React". Segundo, o mesmo nome pode ser escrito de jeitos diferentes ("JS" e "JavaScript").

Na prática, a relação é muitos-para-muitos: **um projeto usa várias tecnologias**, e **uma tecnologia aparece em vários projetos**. Como uma coluna guarda um valor só, nenhuma das duas tabelas consegue guardar essa ligação sozinha. Por isso foram criadas:
- a tabela `tecnologia`, com cada tecnologia cadastrada uma única vez;
- a tabela associativa `projeto_tecnologia`, em que cada linha é um par (projeto, tecnologia). As duas colunas são chaves estrangeiras e, juntas, formam a chave primária, para que o mesmo par não se repita.

## Perfis de usuário
| Perfil | O que vê e faz | O que é restrito |
|---|---|---|
| **admin** (Gabriella) | Vê tudo: conteúdo publicado e rascunhos, mensagens com e-mail, contador de visitas, curtidas e descurtidas, comentários pendentes e usuários. Cria, edita, publica e apaga conteúdo, responde mensagens, aprova ou recusa comentários e cadastra editores | Nada no sistema. A senha das pessoas nunca aparece, nem para ela |
| **editor** (alguém que ajuda) | Vê projetos, formações e depoimentos (publicados e rascunhos), o contador de visitas e o número de curtidas. Cria e edita conteúdo e salva como rascunho | Publicar ou apagar, ver as mensagens de contato (têm dados pessoais), moderar comentários, ver as descurtidas e gerenciar usuários |
| **visitante** (público, sem login) | Vê só o conteúdo publicado, o número de curtidas e os comentários aprovados. Envia mensagens, curte ou descurte e deixa comentários anônimos | Painel, rascunhos, mensagens, descurtidas, comentários pendentes, contador de visitas e qualquer edição |
