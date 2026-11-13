-- =============================================================
-- Mundo Swarttz: teste de integridade referencial (Aula 04, passo 5)
-- Rodar DEPOIS de criar_banco.sql, na aba "SQL" do banco mundo_swarttz.
-- =============================================================

USE mundo_swarttz;

-- O banco acabou de ser criado, então a tabela usuario está vazia:
-- não existe nenhum usuário com id = 999.
SELECT COUNT(*) AS usuarios_com_id_999 FROM usuario WHERE id = 999;  -- resultado: 0

-- Tentativa: cadastrar um projeto "de um usuário que não existe".
-- O MySQL DEVE RECUSAR, por causa da chave estrangeira fk_projeto_usuario.
INSERT INTO projeto (usuario_id, titulo, slug)
VALUES (999, 'Projeto sem dono', 'projeto-sem-dono');

-- Erro esperado (anotado em database/aula04_banco_mysql.md):
-- #1452 - Cannot add or update a child row: a foreign key constraint fails
-- (`mundo_swarttz`.`projeto`, CONSTRAINT `fk_projeto_usuario`
--  FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`))
