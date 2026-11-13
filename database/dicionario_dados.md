# Dicionário de dados — Mundo Swarttz

Modelo normalizado até a 3FN (veja `normalizacao.md`). Banco: MySQL (TiDB Cloud Starter).

> **Sobre os tipos no brModelo Web:** os tipos deste dicionário são os do MySQL, que é o banco usado no projeto. O brModelo Web não oferece `BIGINT` nem `TEXT`, então no modelo feito lá (`modelo_logico_3fn_brmodelo.pdf`) usamos `INT` no lugar de `BIGINT` e `VARCHAR` no lugar de `TEXT`. O brModelo também não tem a opção de marcar NOT NULL, por isso os campos obrigatórios foram listados numa nota dentro do modelo.

**Legenda:** PK = chave primária · FK = chave estrangeira · Obrigatório "sim" = `NOT NULL` · Regras: `UNIQUE` (valor não se repete), `DEFAULT` (valor automático quando nada é informado), `ON DELETE` (o que acontece com esta linha quando a linha "mãe" é apagada: `RESTRICT` impede apagar a mãe, `CASCADE` apaga junto, `SET NULL` deixa o campo vazio).

| Tabela | Coluna | Tipo | Chave | Obrigatório | Regras | Descrição |
|---|---|---|---|---|---|---|
| usuario | id | `INT` | PK | sim | `AUTO_INCREMENT` | Identificador do usuário |
| usuario | nome | `VARCHAR(80)` | — | sim | — | Nome mostrado no painel |
| usuario | email | `VARCHAR(120)` | — | sim | `UNIQUE` | E-mail de login |
| usuario | senha_hash | `VARCHAR(255)` | — | sim | — | Senha embaralhada com bcrypt (nunca em texto) |
| usuario | perfil | `ENUM('admin','editor')` | — | sim | `DEFAULT 'editor'` | O que a pessoa pode fazer no painel |
| usuario | ativo | `BOOLEAN` | — | sim | `DEFAULT TRUE` | Permite desativar sem apagar |
| usuario | criado_em | `DATETIME` | — | sim | `DEFAULT CURRENT_TIMESTAMP` | Quando a conta foi criada |
| projeto | id | `INT` | PK | sim | `AUTO_INCREMENT` | Identificador do projeto |
| projeto | usuario_id | `INT` | FK → usuario.id | sim | `ON DELETE RESTRICT` | Quem cadastrou |
| projeto | titulo | `VARCHAR(100)` | — | sim | — | Nome do projeto |
| projeto | slug | `VARCHAR(60)` | — | sim | `UNIQUE` | Endereço curto (ex.: pixelinha) |
| projeto | descricao | `TEXT` | — | não | — | Texto do cartaz |
| projeto | status | `ENUM('em cartaz','em produção','lançamento previsto')` | — | sim | `DEFAULT 'em produção'` | Etiqueta do filme |
| projeto | url | `VARCHAR(255)` | — | não | — | Site no ar |
| projeto | repo | `VARCHAR(255)` | — | não | — | Repositório no GitHub |
| projeto | ordem | `INT` | — | sim | `DEFAULT 0` | Posição na bilheteria |
| projeto | publicado | `BOOLEAN` | — | sim | `DEFAULT FALSE` | Aparece no site ou não |
| projeto | atualizado_em | `DATETIME` | — | sim | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Última alteração |
| tecnologia | id | `INT` | PK | sim | `AUTO_INCREMENT` | Identificador da tecnologia |
| tecnologia | nome | `VARCHAR(40)` | — | sim | `UNIQUE` | Nome (ex.: React, Python) |
| projeto_tecnologia | projeto_id | `INT` | PK, FK → projeto.id | sim | `ON DELETE CASCADE` | Projeto |
| projeto_tecnologia | tecnologia_id | `INT` | PK, FK → tecnologia.id | sim | `ON DELETE CASCADE` | Tecnologia usada no projeto |
| formacao | id | `INT` | PK | sim | `AUTO_INCREMENT` | Identificador da formação |
| formacao | usuario_id | `INT` | FK → usuario.id | sim | `ON DELETE RESTRICT` | Quem cadastrou |
| formacao | titulo | `VARCHAR(120)` | — | sim | — | Nome do curso |
| formacao | instituicao | `VARCHAR(100)` | — | sim | — | Escola, faculdade ou plataforma |
| formacao | tipo | `VARCHAR(40)` | — | não | — | Curso técnico, graduação, carreira… |
| formacao | situacao | `VARCHAR(40)` | — | não | — | Cursando, concluído, trancado… |
| formacao | ordem | `INT` | — | sim | `DEFAULT 0` | Posição na estante |
| formacao | publicado | `BOOLEAN` | — | sim | `DEFAULT FALSE` | Aparece no site ou não |
| autor | id | `INT` | PK | sim | `AUTO_INCREMENT` | Identificador do autor |
| autor | nome | `VARCHAR(80)` | — | sim | — | Nome de quem escreveu |
| autor | relacao | `VARCHAR(120)` | — | não | — | Ex.: "Colega de curso técnico" |
| autor | foto | `VARCHAR(255)` | — | não | — | Caminho da foto |
| depoimento | id | `INT` | PK | sim | `AUTO_INCREMENT` | Identificador do depoimento |
| depoimento | usuario_id | `INT` | FK → usuario.id | sim | `ON DELETE RESTRICT` | Quem cadastrou no painel |
| depoimento | autor_id | `INT` | FK → autor.id | sim | `ON DELETE RESTRICT` | Quem escreveu a carta |
| depoimento | texto | `TEXT` | — | sim | — | A carta |
| depoimento | ordem | `INT` | — | sim | `DEFAULT 0` | Posição no carrossel |
| depoimento | publicado | `BOOLEAN` | — | sim | `DEFAULT FALSE` | Aparece no site ou não |
| mensagem | id | `INT` | PK | sim | `AUTO_INCREMENT` | Identificador da mensagem |
| mensagem | respondida_por | `INT` | FK → usuario.id | não | `ON DELETE SET NULL` | Quem respondeu (vazio até alguém responder) |
| mensagem | nome | `VARCHAR(80)` | — | sim | — | Quem mandou |
| mensagem | email | `VARCHAR(120)` | — | sim | — | E-mail para resposta |
| mensagem | assunto | `VARCHAR(120)` | — | não | — | Assunto |
| mensagem | texto | `TEXT` | — | sim | — | A mensagem |
| mensagem | status | `ENUM('nova','lida','respondida')` | — | sim | `DEFAULT 'nova'` | Controle no painel |
| mensagem | criada_em | `DATETIME` | — | sim | `DEFAULT CURRENT_TIMESTAMP` | Quando chegou |
| comentario | id | `INT` | PK | sim | `AUTO_INCREMENT` | Identificador do comentário |
| comentario | moderado_por | `INT` | FK → usuario.id | não | `ON DELETE SET NULL` | Quem aprovou ou recusou (vazio enquanto pendente) |
| comentario | visitante | `CHAR(36)` | — | sim | — | Código aleatório do navegador, só para limitar envios |
| comentario | texto | `VARCHAR(500)` | — | sim | — | O feedback |
| comentario | status | `ENUM('pendente','aprovado','recusado')` | — | sim | `DEFAULT 'pendente'` | Moderação |
| comentario | criado_em | `DATETIME` | — | sim | `DEFAULT CURRENT_TIMESTAMP` | Quando chegou |
| visita | id | `BIGINT` | PK | sim | `AUTO_INCREMENT` | Identificador do registro |
| visita | projeto_id | `INT` | FK → projeto.id | não | `ON DELETE SET NULL` | Projeto aberto no cinema (vazio em outros lugares) |
| visita | visitante | `CHAR(36)` | — | sim | — | Código aleatório do navegador (não identifica a pessoa) |
| visita | lugar | `VARCHAR(20)` | — | sim | — | chegada, cinema, biblioteca, cartas… |
| visita | dispositivo | `ENUM('celular','computador','tablet')` | — | não | — | Tipo de tela |
| visita | criada_em | `DATETIME` | — | sim | `DEFAULT CURRENT_TIMESTAMP` | Quando |
| curtida_site | id | `BIGINT` | PK | sim | `AUTO_INCREMENT` | Identificador do voto |
| curtida_site | visitante | `CHAR(36)` | — | sim | `UNIQUE` | Código do navegador; um voto por visitante |
| curtida_site | tipo | `ENUM('curtir','descurtir')` | — | sim | — | O voto |
| curtida_site | atualizada_em | `DATETIME` | — | sim | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Quando votou ou trocou o voto |
| curtida_projeto | id | `BIGINT` | PK | sim | `AUTO_INCREMENT` | Identificador do voto |
| curtida_projeto | projeto_id | `INT` | FK → projeto.id | sim | `ON DELETE CASCADE; UNIQUE (visitante, projeto_id)` | Projeto votado |
| curtida_projeto | visitante | `CHAR(36)` | — | sim | `UNIQUE (visitante, projeto_id)` | Código do navegador; um voto por projeto |
| curtida_projeto | tipo | `ENUM('curtir','descurtir')` | — | sim | — | O voto |
| curtida_projeto | atualizada_em | `DATETIME` | — | sim | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Quando votou ou trocou o voto |

## O que cada tabela guarda

| Tabela | Descrição |
|---|---|
| usuario | Pessoas que entram no painel admin. |
| projeto | Projetos do portfólio (os filmes do cinema). |
| tecnologia | Tecnologias usadas nos projetos, cada uma cadastrada uma vez. |
| projeto_tecnologia | Tabela associativa do N:N projeto ↔ tecnologia. |
| formacao | Cursos e formações (os livros da biblioteca). |
| autor | Quem escreveu os depoimentos (nova na 3FN). |
| depoimento | Os depoimentos (as cartas). |
| mensagem | Mensagens do formulário de contato. |
| comentario | Comentários anônimos, que só aparecem depois de aprovados. |
| visita | Cada lugar aberto no mundo 3D (contador de visitas). |
| curtida_site | Voto de cada visitante no site todo (nova na 3FN). |
| curtida_projeto | Voto de cada visitante em cada projeto (antes: curtida). |
