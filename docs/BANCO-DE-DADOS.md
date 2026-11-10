# Banco de dados do Mundo Swarttz (MySQL)

> **Status:** documentação (fase 1). Nenhum código do banco foi escrito ainda. Primeiro definimos **o que** o banco faz e **como** ele é desenhado; o código vem depois, seguindo este documento.

---

## 1. Visão

Hoje todo o conteúdo do site (projetos, formações, depoimentos, contatos) fica escrito à mão no arquivo `js/config.js`. Para mudar um projeto, é preciso editar código e publicar de novo.

Com o banco MySQL, o Mundo Swarttz passa a ter:

1. **Painel admin**: a Gabriella entra com e-mail e senha e cadastra, edita, publica ou esconde projetos, formações e depoimentos, sem mexer no código.
2. **Contador de visitas**: o site registra, sem identificar ninguém, quantas pessoas visitaram e quais lugares do mundo 3D foram mais abertos.
3. **Formulário de contato**: quem visita manda uma mensagem pelo site; ela fica guardada no banco e aparece no painel.
4. **Curtir e descurtir**: quem visita pode curtir ou descurtir o site inteiro e cada projeto. O número de curtidas aparece para todos; o de descurtidas, só no painel.
5. **Comentários anônimos**: quem visita deixa um feedback sem nome nem e-mail. O comentário só aparece no site depois que a Gabriella aprova no painel.

O mundo 3D continua funcionando mesmo se o servidor estiver fora do ar: nesse caso ele usa o `config.js` como reserva.

---

## 2. Requisitos

### Funcionais (o que o sistema faz)

| Código | Requisito |
|---|---|
| RF01 | A administradora entra no painel com e-mail e senha. |
| RF02 | No painel, é possível criar, editar, publicar/despublicar e reordenar **projetos**. |
| RF03 | No painel, é possível criar, editar, publicar/despublicar e reordenar **formações**. |
| RF04 | No painel, é possível criar, editar, publicar/despublicar e reordenar **depoimentos**. |
| RF05 | O mundo 3D e a versão simples mostram só o conteúdo **publicado** vindo do banco. |
| RF06 | Cada lugar aberto no mundo 3D (cinema, biblioteca, cartas…) gera um registro de visita. |
| RF07 | O painel mostra visitas por dia, visitantes únicos, lugares e projetos mais abertos, e celular × computador. |
| RF08 | O visitante envia uma mensagem pelo formulário de contato (nome, e-mail, assunto, mensagem). |
| RF09 | No painel, as mensagens aparecem como **nova**, **lida** ou **respondida**, com quem respondeu. |
| RF10 | A administradora pode cadastrar outras pessoas com perfil **editor**. |
| RF11 | O visitante curte ou descurte o **site todo** e **cada projeto**: um voto por alvo, que ele pode trocar ou desfazer. |
| RF12 | O site mostra o **número de curtidas**. O número de descurtidas aparece **só no painel**. |
| RF13 | O visitante envia um **comentário anônimo** (até 500 caracteres), mostrado como "Visitante anônimo". |
| RF14 | Todo comentário entra como **pendente** e só aparece no site depois que a administradora o **aprova** no painel (ou fica **recusado**). |

### Não funcionais (como o sistema deve ser)

| Código | Requisito |
|---|---|
| RNF01 | **Privacidade (LGPD):** o contador de visitas não guarda IP, nome nem e-mail. O visitante é um código aleatório criado no navegador. |
| RNF02 | Senhas são guardadas só como **hash** (bcrypt), nunca em texto. |
| RNF03 | O formulário de contato e os comentários têm proteção contra robôs (campo-armadilha e limite de envios por minuto). |
| RNF04 | O site continua abrindo mesmo com o servidor ou o banco fora do ar (usa o `config.js` como reserva). |
| RNF05 | A senha do banco nunca vai para o GitHub: fica em variáveis de ambiente do servidor. |
| RNF06 | Hospedagem com custo zero: API no **Render** (plano grátis) e banco no **TiDB Cloud Starter** (grátis, compatível com MySQL). |
| RNF07 | Comentários são anônimos de verdade: a tabela não tem nome, e-mail nem IP, só o código aleatório do navegador (para limitar envios). |

---

## 3. Arquitetura

```
 Navegador ──► GitHub Pages (site: index.html, simples.html, admin.html)
     │
     └──► API (Node.js + Express, no Render) ──► TiDB Cloud Starter (MySQL)
          rotas /api/...                         (tabelas da seção 4)
```

- **Site:** continua no GitHub Pages. Ganha uma página nova, `admin.html` (o painel).
- **API:** um servidor pequeno que é o **único** que conversa com o banco. O navegador nunca acessa o MySQL direto, porque isso exporia a senha do banco.
- **Banco:** TiDB Cloud Starter, que fala a mesma língua do MySQL (mesmos comandos SQL, mesmo MySQL Workbench). Guarda as 8 tabelas abaixo.

**O servidor "dorme" (plano grátis do Render).** Depois de 15 minutos sem ninguém usar, ele desliga e leva cerca de 1 minuto para acordar. Na prática:

- O mundo 3D abre na hora, com o conteúdo do `config.js`, e troca pelo conteúdo do banco assim que o servidor responde.
- O contador de visitas, as curtidas e os comentários do primeiro visitante depois de uma pausa são enviados quando o servidor acordar (o site tenta de novo sozinho).
- Até o servidor acordar, os números de curtidas podem aparecer com atraso.
- O painel admin mostra "acordando o servidor…" enquanto espera.

---

## 4. Tabelas

O diagrama mostra as tabelas e as ligações. `PK` é a **chave primária** (o `id` que identifica cada linha). `FK` é a **chave estrangeira** (uma coluna que guarda o `id` de outra tabela e cria a ligação).

```mermaid
erDiagram
    usuario ||--o{ projeto : "cadastra"
    usuario ||--o{ formacao : "cadastra"
    usuario ||--o{ depoimento : "cadastra"
    usuario |o--o{ mensagem : "responde"
    projeto |o--o{ visita : "é aberto em"
    projeto |o--o{ curtida : "recebe"
    usuario |o--o{ comentario : "modera"

    usuario {
        int id PK
        varchar nome
        varchar email
        varchar senha_hash
        enum perfil
    }
    projeto {
        int id PK
        int usuario_id FK
        varchar titulo
        enum status
        boolean publicado
    }
    formacao {
        int id PK
        int usuario_id FK
        varchar titulo
        varchar instituicao
    }
    depoimento {
        int id PK
        int usuario_id FK
        varchar autor
        text texto
    }
    mensagem {
        int id PK
        int respondida_por FK
        varchar email
        enum status
    }
    visita {
        bigint id PK
        int projeto_id FK
        char visitante
        varchar lugar
    }
    curtida {
        bigint id PK
        int projeto_id FK
        char visitante
        enum tipo
    }
    comentario {
        int id PK
        int moderado_por FK
        varchar texto
        enum status
    }
```

### 4.1 `usuario` — quem entra no painel

| Coluna | Tipo | Regra | Para que serve |
|---|---|---|---|
| id | INT | PK, auto incremento | identifica a pessoa |
| nome | VARCHAR(80) | obrigatório | nome mostrado no painel |
| email | VARCHAR(120) | obrigatório, único | login |
| senha_hash | VARCHAR(255) | obrigatório | senha embaralhada (bcrypt) |
| perfil | ENUM('admin','editor') | padrão 'editor' | o que a pessoa pode fazer (seção 5) |
| ativo | BOOLEAN | padrão TRUE | desativar sem apagar |
| criado_em | DATETIME | padrão agora | auditoria |

### 4.2 `projeto` — os filmes do cinema

| Coluna | Tipo | Regra | Para que serve |
|---|---|---|---|
| id | INT | PK | identifica o projeto |
| usuario_id | INT | **FK → usuario.id** | quem cadastrou |
| titulo | VARCHAR(100) | obrigatório | nome do projeto |
| slug | VARCHAR(60) | único | endereço curto (ex.: `pixelinha`) |
| descricao | TEXT | | texto do cartaz |
| status | ENUM('em cartaz','em produção','lançamento previsto') | obrigatório | etiqueta do filme |
| tecnologias | VARCHAR(255) | | lista separada por vírgula |
| url | VARCHAR(255) | | site no ar |
| repo | VARCHAR(255) | | repositório no GitHub |
| ordem | INT | padrão 0 | posição na bilheteria |
| publicado | BOOLEAN | padrão FALSE | aparece no site ou não |
| atualizado_em | DATETIME | atualiza sozinho | auditoria |

### 4.3 `formacao` — os livros da biblioteca

| Coluna | Tipo | Regra | Para que serve |
|---|---|---|---|
| id | INT | PK | identifica a formação |
| usuario_id | INT | **FK → usuario.id** | quem cadastrou |
| titulo | VARCHAR(120) | obrigatório | nome do curso |
| instituicao | VARCHAR(100) | obrigatório | escola, faculdade, plataforma |
| tipo | VARCHAR(40) | | curso técnico, graduação, carreira… |
| situacao | VARCHAR(40) | | cursando, concluído, trancado… |
| ordem | INT | padrão 0 | posição na estante |
| publicado | BOOLEAN | padrão FALSE | aparece no site ou não |

### 4.4 `depoimento` — as cartas

| Coluna | Tipo | Regra | Para que serve |
|---|---|---|---|
| id | INT | PK | identifica o depoimento |
| usuario_id | INT | **FK → usuario.id** | quem cadastrou no painel |
| autor | VARCHAR(80) | obrigatório | quem escreveu a carta |
| relacao | VARCHAR(120) | | ex.: "Colega de curso técnico" |
| texto | TEXT | obrigatório | a carta |
| foto | VARCHAR(255) | | caminho da foto |
| ordem | INT | padrão 0 | posição no carrossel |
| publicado | BOOLEAN | padrão FALSE | aparece no site ou não |

### 4.5 `mensagem` — formulário de contato

| Coluna | Tipo | Regra | Para que serve |
|---|---|---|---|
| id | INT | PK | identifica a mensagem |
| nome | VARCHAR(80) | obrigatório | quem mandou |
| email | VARCHAR(120) | obrigatório | para responder |
| assunto | VARCHAR(120) | | |
| texto | TEXT | obrigatório | a mensagem |
| status | ENUM('nova','lida','respondida') | padrão 'nova' | controle no painel |
| respondida_por | INT | **FK → usuario.id**, pode ficar vazio | quem respondeu |
| criada_em | DATETIME | padrão agora | quando chegou |

### 4.6 `visita` — contador de visitas

Cada linha é **um lugar aberto** por um visitante. "Visitantes únicos" = quantos `visitante` diferentes existem.

| Coluna | Tipo | Regra | Para que serve |
|---|---|---|---|
| id | BIGINT | PK | identifica o registro |
| visitante | CHAR(36) | obrigatório | código aleatório do navegador (não identifica a pessoa) |
| lugar | VARCHAR(20) | obrigatório | `chegada`, `cinema`, `biblioteca`, `cartas`, `telefone`, `sobre`… |
| projeto_id | INT | **FK → projeto.id**, pode ficar vazio | qual filme foi aberto no cinema |
| dispositivo | ENUM('celular','computador','tablet') | | tipo de tela |
| criada_em | DATETIME | padrão agora | quando |

### 4.7 `curtida` — curtir e descurtir

Cada linha é **o voto de um visitante** em um alvo. Se `projeto_id` está vazio, o voto é para o **site todo**; se tem um número, é para aquele projeto. Cada visitante tem no máximo um voto por alvo: se ele troca de ideia, a linha é atualizada; se desfaz, a linha é apagada.

| Coluna | Tipo | Regra | Para que serve |
|---|---|---|---|
| id | BIGINT | PK | identifica o voto |
| visitante | CHAR(36) | obrigatório | código aleatório do navegador |
| projeto_id | INT | **FK → projeto.id**, vazio = site todo | o que foi curtido |
| alvo | INT | calculada: `projeto_id` ou 0 | ajuda a regra abaixo (no MySQL, duas linhas com campo vazio não contam como repetidas) |
| tipo | ENUM('curtir','descurtir') | obrigatório | o voto |
| atualizada_em | DATETIME | atualiza sozinho | quando votou ou trocou |

Regra: **(visitante, alvo) é único**. Isso impede o mesmo navegador de votar duas vezes no mesmo alvo.

### 4.8 `comentario` — comentários anônimos

| Coluna | Tipo | Regra | Para que serve |
|---|---|---|---|
| id | INT | PK | identifica o comentário |
| visitante | CHAR(36) | obrigatório | código aleatório do navegador, só para limitar envios; nunca aparece no site |
| texto | VARCHAR(500) | obrigatório | o feedback |
| status | ENUM('pendente','aprovado','recusado') | padrão 'pendente' | moderação |
| moderado_por | INT | **FK → usuario.id**, pode ficar vazio | quem aprovou ou recusou |
| criado_em | DATETIME | padrão agora | quando chegou |

---

## 5. Perfis de acesso

| Perfil | O que vê | O que pode fazer | O que é restrito |
|---|---|---|---|
| **admin** (Gabriella) | Tudo: conteúdo publicado e rascunhos, mensagens com e-mail, contador de visitas, curtidas **e descurtidas**, comentários pendentes, usuários | Criar, editar, publicar e apagar projetos, formações e depoimentos; marcar e responder mensagens; **aprovar ou recusar comentários**; cadastrar e desativar editores | Nada no sistema; a senha das pessoas nunca aparece, nem para ela |
| **editor** (alguém que ajuda) | Projetos, formações e depoimentos (publicados e rascunhos), o contador de visitas e o número de curtidas | Criar e editar conteúdo e salvar como rascunho | Publicar ou apagar; ver mensagens de contato (têm dados pessoais); moderar comentários; ver descurtidas; gerenciar usuários |
| **visitante** (público, sem login) | Só o conteúdo publicado, o número de curtidas e os comentários aprovados | Enviar mensagem pelo formulário; curtir, descurtir ou desfazer; enviar comentário anônimo; gerar registros de visita sem perceber | Painel, rascunhos, mensagens, descurtidas, comentários pendentes, contador, qualquer edição |

---

## 6. Modelo para a atividade do Excel

A atividade pede de 3 a 4 entidades. Use **4 das tabelas acima**, uma por aba, com os mesmos nomes de coluna, mais a aba **Perfis** (seção 5). Assim o Excel é exatamente o desenho do banco real.

**Aba `usuario`**

| id | nome | email | perfil |
|---|---|---|---|
| 1 | Gabriella Swarttz | gabriellaswarttz@gmail.com | admin |
| 2 | Ana Lima | ana@exemplo.com | editor |
| 3 | Bruno Reis | bruno@exemplo.com | editor |

**Aba `projeto`** (`usuario_id` → usuario)

| id | usuario_id | titulo | status | publicado |
|---|---|---|---|---|
| 1 | 1 | Mundo Swarttz | em cartaz | sim |
| 2 | 1 | PixeLinha | em cartaz | sim |
| 3 | 2 | JC Resolve | em produção | não |

**Aba `mensagem`** (`respondida_por` → usuario)

| id | nome | email | status | respondida_por |
|---|---|---|---|---|
| 1 | Carla Dias | carla@exemplo.com | respondida | 1 |
| 2 | Diego Melo | diego@exemplo.com | lida | |
| 3 | Elisa Rocha | elisa@exemplo.com | nova | |

**Aba `visita`** (`projeto_id` → projeto)

| id | visitante | lugar | projeto_id | dispositivo |
|---|---|---|---|---|
| 1 | a1b2c3 | chegada | | celular |
| 2 | a1b2c3 | cinema | 2 | celular |
| 3 | f9e8d7 | cinema | 1 | computador |

Os e-mails `@exemplo.com` são inventados de propósito, para não expor o contato real de ninguém.

---

## 7. Decisões tomadas

| Decisão | Escolha | Por quê |
|---|---|---|
| Onde roda o banco | **TiDB Cloud Starter** | Grátis, sem cartão, compatível com MySQL. O plano grátis de MySQL puro da Aiven foi encerrado para novos bancos. |
| Onde roda a API | **Render** (grátis) | O painel admin é de uso da própria Gabriella, e o visitante passa um tempo andando antes de usar o formulário. O atraso de "acordar" afeta só o contador e as curtidas, o que é aceitável. |
| Curtidas | **Site todo e cada projeto** | Mostra o que agrada no geral e em cada filme. |
| Comentários | **Só aparecem depois de aprovados** | Sem nome, a moderação protege contra ofensa e spam. |

---

## 8. Próximas fases

1. **Fase 1 (este documento):** visão, requisitos, tabelas e perfis.
2. **Fase 2:** criar as contas de hospedagem, as tabelas (`schema.sql`) e a API com as rotas.
3. **Fase 3:** painel admin (`admin.html`), formulário de contato, curtidas e comentários.
4. **Fase 4:** o mundo 3D e a versão simples passam a ler o conteúdo da API, e o contador começa a registrar.
