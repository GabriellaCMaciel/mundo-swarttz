-- =============================================================
-- Mundo Swarttz: criação do banco MySQL
-- Segue database/dicionario_dados.md (modelo normalizado até a 3FN).
-- Como rodar: veja database/README.md.
-- Atenção: este script APAGA e recria o banco mundo_swarttz.
-- =============================================================

DROP DATABASE IF EXISTS mundo_swarttz;
CREATE DATABASE mundo_swarttz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE mundo_swarttz;

-- -------------------------------------------------------------
-- Tabelas sem chave estrangeira (as "mães") vêm primeiro
-- -------------------------------------------------------------

CREATE TABLE usuario (
  id          INT          NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(80)  NOT NULL,
  email       VARCHAR(120) NOT NULL,
  senha_hash  VARCHAR(255) NOT NULL,
  perfil      ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario PRIMARY KEY (id),
  CONSTRAINT uq_usuario_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE autor (
  id       INT          NOT NULL AUTO_INCREMENT,
  nome     VARCHAR(80)  NOT NULL,
  relacao  VARCHAR(120) NULL,
  foto     VARCHAR(255) NULL,
  CONSTRAINT pk_autor PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE tecnologia (
  id    INT         NOT NULL AUTO_INCREMENT,
  nome  VARCHAR(40) NOT NULL,
  CONSTRAINT pk_tecnologia PRIMARY KEY (id),
  CONSTRAINT uq_tecnologia_nome UNIQUE (nome)
) ENGINE=InnoDB;

CREATE TABLE curtida_site (
  id             BIGINT   NOT NULL AUTO_INCREMENT,
  visitante      CHAR(36) NOT NULL,
  tipo           ENUM('curtir','descurtir') NOT NULL,
  atualizada_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_curtida_site PRIMARY KEY (id),
  CONSTRAINT uq_curtida_site_visitante UNIQUE (visitante)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabelas com chave estrangeira (as "filhas")
-- -------------------------------------------------------------

CREATE TABLE projeto (
  id             INT          NOT NULL AUTO_INCREMENT,
  usuario_id     INT          NOT NULL,
  titulo         VARCHAR(100) NOT NULL,
  slug           VARCHAR(60)  NOT NULL,
  descricao      TEXT         NULL,
  status         ENUM('em cartaz','em produção','lançamento previsto') NOT NULL DEFAULT 'em produção',
  url            VARCHAR(255) NULL,
  repo           VARCHAR(255) NULL,
  ordem          INT          NOT NULL DEFAULT 0,
  publicado      BOOLEAN      NOT NULL DEFAULT FALSE,
  atualizado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_projeto PRIMARY KEY (id),
  CONSTRAINT uq_projeto_slug UNIQUE (slug),
  CONSTRAINT fk_projeto_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE projeto_tecnologia (
  projeto_id     INT NOT NULL,
  tecnologia_id  INT NOT NULL,
  CONSTRAINT pk_projeto_tecnologia PRIMARY KEY (projeto_id, tecnologia_id),
  CONSTRAINT fk_pt_projeto FOREIGN KEY (projeto_id)
    REFERENCES projeto (id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_tecnologia FOREIGN KEY (tecnologia_id)
    REFERENCES tecnologia (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE formacao (
  id           INT          NOT NULL AUTO_INCREMENT,
  usuario_id   INT          NOT NULL,
  titulo       VARCHAR(120) NOT NULL,
  instituicao  VARCHAR(100) NOT NULL,
  tipo         VARCHAR(40)  NULL,
  situacao     VARCHAR(40)  NULL,
  ordem        INT          NOT NULL DEFAULT 0,
  publicado    BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT pk_formacao PRIMARY KEY (id),
  CONSTRAINT fk_formacao_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE depoimento (
  id          INT     NOT NULL AUTO_INCREMENT,
  usuario_id  INT     NOT NULL,
  autor_id    INT     NOT NULL,
  texto       TEXT    NOT NULL,
  ordem       INT     NOT NULL DEFAULT 0,
  publicado   BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT pk_depoimento PRIMARY KEY (id),
  CONSTRAINT fk_depoimento_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE RESTRICT,
  CONSTRAINT fk_depoimento_autor FOREIGN KEY (autor_id)
    REFERENCES autor (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE mensagem (
  id              INT          NOT NULL AUTO_INCREMENT,
  respondida_por  INT          NULL,
  nome            VARCHAR(80)  NOT NULL,
  email           VARCHAR(120) NOT NULL,
  assunto         VARCHAR(120) NULL,
  texto           TEXT         NOT NULL,
  status          ENUM('nova','lida','respondida') NOT NULL DEFAULT 'nova',
  criada_em       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_mensagem PRIMARY KEY (id),
  CONSTRAINT fk_mensagem_usuario FOREIGN KEY (respondida_por)
    REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE comentario (
  id            INT          NOT NULL AUTO_INCREMENT,
  moderado_por  INT          NULL,
  visitante     CHAR(36)     NOT NULL,
  texto         VARCHAR(500) NOT NULL,
  status        ENUM('pendente','aprovado','recusado') NOT NULL DEFAULT 'pendente',
  criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_comentario PRIMARY KEY (id),
  CONSTRAINT fk_comentario_usuario FOREIGN KEY (moderado_por)
    REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE visita (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  projeto_id   INT         NULL,
  visitante    CHAR(36)    NOT NULL,
  lugar        VARCHAR(20) NOT NULL,
  dispositivo  ENUM('celular','computador','tablet') NULL,
  criada_em    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_visita PRIMARY KEY (id),
  CONSTRAINT fk_visita_projeto FOREIGN KEY (projeto_id)
    REFERENCES projeto (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE curtida_projeto (
  id             BIGINT   NOT NULL AUTO_INCREMENT,
  projeto_id     INT      NOT NULL,
  visitante      CHAR(36) NOT NULL,
  tipo           ENUM('curtir','descurtir') NOT NULL,
  atualizada_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_curtida_projeto PRIMARY KEY (id),
  CONSTRAINT uq_curtida_projeto_visitante UNIQUE (visitante, projeto_id),
  CONSTRAINT fk_curtida_projeto_projeto FOREIGN KEY (projeto_id)
    REFERENCES projeto (id) ON DELETE CASCADE
) ENGINE=InnoDB;
