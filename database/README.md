# Banco de dados MySQL

Banco **`mundo_swarttz`**, criado a partir do modelo lógico normalizado até a 3FN (`modelo_logico_3fn_brmodelo.pdf`). O detalhe de cada coluna está em `dicionario_dados.md`.

## Arquivos
| Arquivo | O que é |
|---|---|
| `visao_geral.md` | Visão geral do modelo: entidades, relacionamentos e perfis |
| `modelo_conceitual.png` / `modelo_conceitual_brmodelo.pdf` | Modelo conceitual (entidades, atributos e cardinalidades) |
| `modelo_logico.png` | Primeiro modelo lógico (tabelas, PK e FK) |
| `normalizacao.md` | Normalização até a 3FN, com o antes e o depois de cada mudança |
| `modelo_logico_3fn.png` / `modelo_logico_3fn_brmodelo.pdf` | Modelo lógico normalizado, usado para criar o banco |
| `dicionario_dados.md` | Dicionário de dados: cada coluna com tipo e regras |
| `criar_banco.sql` | Cria o banco e as 12 tabelas (tipos, PK com `AUTO_INCREMENT`, `NOT NULL`, `UNIQUE`, `DEFAULT` e chaves estrangeiras) |
| `teste_integridade.sql` | Confere se o banco recusa um registro com chave estrangeira inexistente |
| `schema.sql` | Estrutura do banco exportada do phpMyAdmin |
| `relacoes_phpmyadmin.png` | Visão de relações (Designer) do banco no phpMyAdmin |

## Como criar o banco localmente (XAMPP)
1. No painel do XAMPP, inicie o **Apache** e o **MySQL**.
2. Abra `localhost/phpmyadmin`, vá na aba **Importar**, escolha `criar_banco.sql` e clique em **Importar**.
3. O banco `mundo_swarttz` aparece na lateral, com 12 tabelas.

O banco usa `utf8mb4_unicode_ci` para aceitar acentos (como em `'em produção'`). Todas as tabelas usam `ENGINE=InnoDB`, o motor que respeita chaves estrangeiras. No MyISAM elas seriam ignoradas.

## Tabelas
`usuario`, `autor`, `tecnologia`, `curtida_site`, `projeto`, `projeto_tecnologia`, `formacao`, `depoimento`, `mensagem`, `comentario`, `visita` e `curtida_projeto`.

As tabelas sem chave estrangeira são criadas primeiro, porque uma FK só pode apontar para uma tabela que já existe.

## Chaves estrangeiras
| Chave estrangeira | Aponta para | `ON DELETE` |
|---|---|---|
| `projeto.usuario_id` | `usuario.id` | `RESTRICT` |
| `formacao.usuario_id` | `usuario.id` | `RESTRICT` |
| `depoimento.usuario_id` | `usuario.id` | `RESTRICT` |
| `depoimento.autor_id` | `autor.id` | `RESTRICT` |
| `projeto_tecnologia.projeto_id` | `projeto.id` | `CASCADE` |
| `projeto_tecnologia.tecnologia_id` | `tecnologia.id` | `CASCADE` |
| `curtida_projeto.projeto_id` | `projeto.id` | `CASCADE` |
| `mensagem.respondida_por` | `usuario.id` | `SET NULL` |
| `comentario.moderado_por` | `usuario.id` | `SET NULL` |
| `visita.projeto_id` | `projeto.id` | `SET NULL` |

## Teste de integridade referencial
Com a tabela `usuario` vazia, `teste_integridade.sql` tenta cadastrar um projeto do usuário `999`, que não existe:

```sql
INSERT INTO projeto (usuario_id, titulo, slug)
VALUES (999, 'Projeto sem dono', 'projeto-sem-dono');
```

**Resultado esperado: o MySQL recusa.** O erro abaixo é o sinal de que a chave estrangeira está funcionando:

```
#1452 - Cannot add or update a child row: a foreign key constraint fails
(`mundo_swarttz`.`projeto`, CONSTRAINT `fk_projeto_usuario`
FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`))
```

O erro quer dizer: não dá para adicionar a linha filha (o projeto), porque a chave estrangeira `fk_projeto_usuario` não encontrou a linha mãe (o usuário 999). Assim o banco nunca guarda um projeto sem dono.

Se esse `INSERT` for **aceito**, há um problema: a tabela não está em InnoDB ou a chave estrangeira não foi criada.
