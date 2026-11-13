# Normalização do banco do Mundo Swarttz (até a 3FN)

Ponto de partida: o primeiro modelo lógico (`modelo_conceitual.png` e `modelo_logico.png`, que seguem `docs/BANCO-DE-DADOS.md`).
Resultado: `modelo_logico_3fn.png`, com o detalhe de cada coluna em `dicionario_dados.md`.

## As três formas normais, em uma linha cada
- **1FN:** cada célula guarda **um valor só** (nada de listas separadas por vírgula) e toda tabela tem chave primária.
- **2FN:** está na 1FN e, se a chave primária for **composta**, cada coluna depende da chave **inteira**, e não só de um pedaço dela.
- **3FN:** está na 2FN e nenhuma coluna depende de **outra coluna que não é chave** (a chamada dependência transitiva: A → B → C).

---

## Problema 1: tecnologias numa coluna de texto (viola a 1FN)

No desenho original do banco, as tecnologias de cada projeto ficavam numa coluna só, separadas por vírgula. Isso foi encontrado ao montar o primeiro DER, que já saiu com a correção. O antes e o depois ficam registrados aqui.

**Antes:**

| id | titulo | tecnologias |
|---|---|---|
| 1 | Mundo Swarttz | HTML, CSS, JavaScript, three.js |
| 2 | PixeLinha | React, Python |

**Por que é um problema:** a célula guarda vários valores, o que quebra a 1FN. Fica difícil buscar "todos os projetos com React", e o mesmo nome pode ser escrito de jeitos diferentes ("JS" e "JavaScript").

**Depois:** a relação é N:N (um projeto usa várias tecnologias, e uma tecnologia aparece em vários projetos). Por isso ela foi resolvida com a tabela `tecnologia` e a tabela associativa `projeto_tecnologia`.

`projeto`

| id | titulo |
|---|---|
| 1 | Mundo Swarttz |
| 2 | PixeLinha |

`tecnologia`

| id | nome |
|---|---|
| 1 | HTML |
| 2 | React |
| 3 | Python |

`projeto_tecnologia`

| projeto_id | tecnologia_id |
|---|---|
| 1 | 1 |
| 2 | 2 |
| 2 | 3 |

---

## Problema 2: dados do autor repetidos em cada depoimento (viola a 3FN)

No primeiro modelo, a tabela `depoimento` guardava o nome, a relação e a foto de quem escreveu.

**Antes:** `depoimento`

| id | autor | relacao | foto | texto |
|---|---|---|---|---|
| 1 | Ana Lima | Colega de curso técnico | ana.jpg | "A Gabi sempre…" |
| 2 | Ana Lima | Colega de curso técnico | ana.jpg | "No projeto da…" |
| 3 | Bruno Reis | Professor | bruno.jpg | "Aluna dedicada…" |

**Por que é um problema:** `relacao` e `foto` dependem de **quem é o autor**, não do depoimento. A dependência é `id → autor → relacao, foto`, ou seja, transitiva, o que quebra a 3FN. Se a Ana trocar de foto, é preciso alterar todas as linhas dela, e se esquecer uma, o banco fica com duas fotos diferentes para a mesma pessoa.

**Depois:** os dados do autor foram para a tabela nova `autor`. O depoimento só aponta para ela com `autor_id`.

`autor`

| id | nome | relacao | foto |
|---|---|---|---|
| 1 | Ana Lima | Colega de curso técnico | ana.jpg |
| 2 | Bruno Reis | Professor | bruno.jpg |

`depoimento`

| id | autor_id | texto |
|---|---|---|
| 1 | 1 | "A Gabi sempre…" |
| 2 | 1 | "No projeto da…" |
| 3 | 2 | "Aluna dedicada…" |

---

## Problema 3: coluna calculada e dois tipos de voto na mesma tabela de curtidas (viola a 3FN)

No primeiro modelo, a tabela `curtida` guardava os votos do site todo (com `projeto_id` vazio) e os votos de cada projeto. Ela também tinha a coluna `alvo`, calculada a partir de `projeto_id`, só para conseguir impedir votos repetidos.

**Antes:** `curtida`

| id | visitante | projeto_id | alvo | tipo |
|---|---|---|---|---|
| 1 | a1b2c3 | *(vazio)* | 0 | curtir |
| 2 | a1b2c3 | 2 | 2 | curtir |
| 3 | f9e8d7 | 2 | 2 | descurtir |

**Por que é um problema:** `alvo` depende de `projeto_id`, que não é chave. A dependência é `id → projeto_id → alvo`, ou seja, transitiva, o que quebra a 3FN. É um dado repetido que pode ficar diferente do original. Além disso, a mesma coluna `projeto_id` significa duas coisas diferentes ("site todo" quando está vazia, "projeto" quando tem número).

**Depois:** a tabela foi separada em duas, uma para cada tipo de voto. Assim, `alvo` deixa de ser necessária e `projeto_id` passa a ser obrigatória.

`curtida_site` (um voto por visitante: `visitante` é UNIQUE)

| id | visitante | tipo |
|---|---|---|
| 1 | a1b2c3 | curtir |

`curtida_projeto` (um voto por visitante em cada projeto: `UNIQUE (visitante, projeto_id)`)

| id | visitante | projeto_id | tipo |
|---|---|---|---|
| 1 | a1b2c3 | 2 | curtir |
| 2 | f9e8d7 | 2 | descurtir |

---

## Verificação da 2FN

A 2FN só pode ser violada em tabelas com **chave primária composta**. No modelo, a única é `projeto_tecnologia` (`projeto_id` + `tecnologia_id`). Ela não tem nenhuma coluna além da chave, então nenhuma coluna pode depender só de um pedaço dela. Todas as outras tabelas usam um `id` simples como chave, então já estão na 2FN.

## Resumo das mudanças

| Mudança | Forma normal |
|---|---|
| `projeto.tecnologias` → tabelas `tecnologia` + `projeto_tecnologia` | 1FN (corrigida já no primeiro DER) |
| `depoimento.autor`, `relacao`, `foto` → tabela `autor` + `depoimento.autor_id` | 3FN |
| `curtida` (com `alvo`) → tabelas `curtida_site` + `curtida_projeto` | 3FN |
