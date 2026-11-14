-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 14/11/2026 às 02:17
-- Versão do servidor: 10.11.16-MariaDB
-- Versão do PHP: 8.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `mundo_swarttz`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `autor`
--

CREATE TABLE `autor` (
  `id` int(11) NOT NULL,
  `nome` varchar(80) NOT NULL,
  `relacao` varchar(120) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `comentario`
--

CREATE TABLE `comentario` (
  `id` int(11) NOT NULL,
  `moderado_por` int(11) DEFAULT NULL,
  `visitante` char(36) NOT NULL,
  `texto` varchar(500) NOT NULL,
  `status` enum('pendente','aprovado','recusado') NOT NULL DEFAULT 'pendente',
  `criado_em` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curtida_projeto`
--

CREATE TABLE `curtida_projeto` (
  `id` bigint(20) NOT NULL,
  `projeto_id` int(11) NOT NULL,
  `visitante` char(36) NOT NULL,
  `tipo` enum('curtir','descurtir') NOT NULL,
  `atualizada_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curtida_site`
--

CREATE TABLE `curtida_site` (
  `id` bigint(20) NOT NULL,
  `visitante` char(36) NOT NULL,
  `tipo` enum('curtir','descurtir') NOT NULL,
  `atualizada_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `depoimento`
--

CREATE TABLE `depoimento` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `autor_id` int(11) NOT NULL,
  `texto` text NOT NULL,
  `ordem` int(11) NOT NULL DEFAULT 0,
  `publicado` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `formacao`
--

CREATE TABLE `formacao` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `instituicao` varchar(100) NOT NULL,
  `tipo` varchar(40) DEFAULT NULL,
  `situacao` varchar(40) DEFAULT NULL,
  `ordem` int(11) NOT NULL DEFAULT 0,
  `publicado` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `mensagem`
--

CREATE TABLE `mensagem` (
  `id` int(11) NOT NULL,
  `respondida_por` int(11) DEFAULT NULL,
  `nome` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `assunto` varchar(120) DEFAULT NULL,
  `texto` text NOT NULL,
  `status` enum('nova','lida','respondida') NOT NULL DEFAULT 'nova',
  `criada_em` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `projeto`
--

CREATE TABLE `projeto` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `slug` varchar(60) NOT NULL,
  `descricao` text DEFAULT NULL,
  `status` enum('em cartaz','em produção','lançamento previsto') NOT NULL DEFAULT 'em produção',
  `url` varchar(255) DEFAULT NULL,
  `repo` varchar(255) DEFAULT NULL,
  `ordem` int(11) NOT NULL DEFAULT 0,
  `publicado` tinyint(1) NOT NULL DEFAULT 0,
  `atualizado_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `projeto_tecnologia`
--

CREATE TABLE `projeto_tecnologia` (
  `projeto_id` int(11) NOT NULL,
  `tecnologia_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tecnologia`
--

CREATE TABLE `tecnologia` (
  `id` int(11) NOT NULL,
  `nome` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `nome` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `perfil` enum('admin','editor') NOT NULL DEFAULT 'editor',
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `visita`
--

CREATE TABLE `visita` (
  `id` bigint(20) NOT NULL,
  `projeto_id` int(11) DEFAULT NULL,
  `visitante` char(36) NOT NULL,
  `lugar` varchar(20) NOT NULL,
  `dispositivo` enum('celular','computador','tablet') DEFAULT NULL,
  `criada_em` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `autor`
--
ALTER TABLE `autor`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `comentario`
--
ALTER TABLE `comentario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_comentario_usuario` (`moderado_por`);

--
-- Índices de tabela `curtida_projeto`
--
ALTER TABLE `curtida_projeto`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_curtida_projeto_visitante` (`visitante`,`projeto_id`),
  ADD KEY `fk_curtida_projeto_projeto` (`projeto_id`);

--
-- Índices de tabela `curtida_site`
--
ALTER TABLE `curtida_site`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_curtida_site_visitante` (`visitante`);

--
-- Índices de tabela `depoimento`
--
ALTER TABLE `depoimento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_depoimento_usuario` (`usuario_id`),
  ADD KEY `fk_depoimento_autor` (`autor_id`);

--
-- Índices de tabela `formacao`
--
ALTER TABLE `formacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_formacao_usuario` (`usuario_id`);

--
-- Índices de tabela `mensagem`
--
ALTER TABLE `mensagem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_mensagem_usuario` (`respondida_por`);

--
-- Índices de tabela `projeto`
--
ALTER TABLE `projeto`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_projeto_slug` (`slug`),
  ADD KEY `fk_projeto_usuario` (`usuario_id`);

--
-- Índices de tabela `projeto_tecnologia`
--
ALTER TABLE `projeto_tecnologia`
  ADD PRIMARY KEY (`projeto_id`,`tecnologia_id`),
  ADD KEY `fk_pt_tecnologia` (`tecnologia_id`);

--
-- Índices de tabela `tecnologia`
--
ALTER TABLE `tecnologia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tecnologia_nome` (`nome`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_email` (`email`);

--
-- Índices de tabela `visita`
--
ALTER TABLE `visita`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_visita_projeto` (`projeto_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `autor`
--
ALTER TABLE `autor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `comentario`
--
ALTER TABLE `comentario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curtida_projeto`
--
ALTER TABLE `curtida_projeto`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curtida_site`
--
ALTER TABLE `curtida_site`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `depoimento`
--
ALTER TABLE `depoimento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `formacao`
--
ALTER TABLE `formacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `mensagem`
--
ALTER TABLE `mensagem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `projeto`
--
ALTER TABLE `projeto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `tecnologia`
--
ALTER TABLE `tecnologia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `visita`
--
ALTER TABLE `visita`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `comentario`
--
ALTER TABLE `comentario`
  ADD CONSTRAINT `fk_comentario_usuario` FOREIGN KEY (`moderado_por`) REFERENCES `usuario` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `curtida_projeto`
--
ALTER TABLE `curtida_projeto`
  ADD CONSTRAINT `fk_curtida_projeto_projeto` FOREIGN KEY (`projeto_id`) REFERENCES `projeto` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `depoimento`
--
ALTER TABLE `depoimento`
  ADD CONSTRAINT `fk_depoimento_autor` FOREIGN KEY (`autor_id`) REFERENCES `autor` (`id`),
  ADD CONSTRAINT `fk_depoimento_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `formacao`
--
ALTER TABLE `formacao`
  ADD CONSTRAINT `fk_formacao_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `mensagem`
--
ALTER TABLE `mensagem`
  ADD CONSTRAINT `fk_mensagem_usuario` FOREIGN KEY (`respondida_por`) REFERENCES `usuario` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `projeto`
--
ALTER TABLE `projeto`
  ADD CONSTRAINT `fk_projeto_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `projeto_tecnologia`
--
ALTER TABLE `projeto_tecnologia`
  ADD CONSTRAINT `fk_pt_projeto` FOREIGN KEY (`projeto_id`) REFERENCES `projeto` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pt_tecnologia` FOREIGN KEY (`tecnologia_id`) REFERENCES `tecnologia` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `visita`
--
ALTER TABLE `visita`
  ADD CONSTRAINT `fk_visita_projeto` FOREIGN KEY (`projeto_id`) REFERENCES `projeto` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
