# Aula 04: primeiro contato com o MySQL (XAMPP e phpMyAdmin)

Banco: **`mundo_swarttz`**, criado no phpMyAdmin a partir do modelo lógico normalizado da Aula 03 (`modelo_logico_3fn_brmodelo.pdf` e `dicionario_dados.md`).

## Arquivos desta entrega
| Arquivo | O que é |
|---|---|
| `criar_banco.sql` | Script que cria o banco e as 12 tabelas (tipos, PK com `AUTO_INCREMENT`, `NOT NULL`, `UNIQUE`, `DEFAULT` e chaves estrangeiras), executado na aba **SQL** do phpMyAdmin |
| `teste_integridade.sql` | Teste do passo 5: inserir um registro com chave estrangeira inexistente |
| `schema.sql` | O banco **exportado do phpMyAdmin** (passo 6) |
| `aula04_relacoes.png` | Print da visão de relações (Designer) do banco no phpMyAdmin |

## Passos da atividade
1. **Apache e MySQL iniciados** no painel do XAMPP.
2. **Banco criado** com o nome do projeto, em minúsculas e sem espaço: `mundo_swarttz` (`utf8mb4_unicode_ci`, para aceitar acentos como em `'em produção'`).
3. **Tabelas criadas** conforme o dicionário de dados, todas com `ENGINE=InnoDB`:
   `usuario`, `autor`, `tecnologia`, `curtida_site`, `projeto`, `projeto_tecnologia`, `formacao`, `depoimento`, `mensagem`, `comentario`, `visita` e `curtida_projeto`.
   As tabelas sem chave estrangeira são criadas primeiro, porque uma FK só pode apontar para uma tabela que já existe.
4. **10 chaves estrangeiras** criadas, cada uma com a regra de exclusão do dicionário:

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

5. **Teste de integridade** (`teste_integridade.sql`): com a tabela `usuario` vazia, tentamos cadastrar um projeto do usuário `999`, que não existe.

   ```sql
   INSERT INTO projeto (usuario_id, titulo, slug)
   VALUES (999, 'Projeto sem dono', 'projeto-sem-dono');
   ```

   **O MySQL recusou.** Erro anotado:

   ```
   #1452 - Cannot add or update a child row: a foreign key constraint fails
   (`mundo_swarttz`.`projeto`, CONSTRAINT `fk_projeto_usuario`
   FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`))
   ```

   **O que o erro quer dizer:** "não dá para adicionar a linha filha (o projeto), porque a chave estrangeira `fk_projeto_usuario` não encontrou a linha mãe (o usuário 999)". É a integridade referencial funcionando: o banco não deixa existir projeto sem dono. Isso só acontece porque as tabelas são **InnoDB**; no motor MyISAM a FK seria ignorada e o registro entraria.

6. **Banco exportado** no formato SQL como `schema.sql`.
