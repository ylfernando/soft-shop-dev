-- Fluxo de "esqueci minha senha": token de uso único e validade curta,
-- separado do token de verificação de e-mail (fluxos diferentes, validades
-- diferentes).
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/016_recuperacao_senha.sql).

ALTER TABLE usuarios
  ADD COLUMN senha_reset_token CHAR(64) NULL AFTER email_verificacao_expira,
  ADD COLUMN senha_reset_expira TIMESTAMP NULL AFTER senha_reset_token,
  ADD UNIQUE KEY uq_usuarios_senha_reset_token (senha_reset_token);
