-- Perfil completo do cliente: endereço, telefone e CPF (usados no
-- cadastro/edição de perfil e como opção de frete pré-preenchida no
-- checkout), além do fluxo de verificação de e-mail no cadastro.
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/014_usuario_perfil.sql).

ALTER TABLE usuarios
  ADD COLUMN telefone VARCHAR(20) NULL AFTER email,
  ADD COLUMN cpf CHAR(11) NULL AFTER telefone,
  ADD COLUMN cep CHAR(8) NULL AFTER cpf,
  ADD COLUMN logradouro VARCHAR(150) NULL AFTER cep,
  ADD COLUMN numero VARCHAR(10) NULL AFTER logradouro,
  ADD COLUMN complemento VARCHAR(100) NULL AFTER numero,
  ADD COLUMN bairro VARCHAR(100) NULL AFTER complemento,
  ADD COLUMN cidade VARCHAR(100) NULL AFTER bairro,
  ADD COLUMN uf CHAR(2) NULL AFTER cidade,
  ADD COLUMN email_verificado_em TIMESTAMP NULL AFTER senha_hash,
  ADD COLUMN email_verificacao_token CHAR(64) NULL AFTER email_verificado_em,
  ADD COLUMN email_verificacao_expira TIMESTAMP NULL AFTER email_verificacao_token,
  ADD UNIQUE KEY uq_usuarios_cpf (cpf),
  ADD UNIQUE KEY uq_usuarios_email_verificacao_token (email_verificacao_token);

-- Contas que já existiam antes desse fluxo existir nunca passaram por
-- verificação — considera elas verificadas pra não travar clientes antigas
-- no checkout do nada.
UPDATE usuarios SET email_verificado_em = criado_em WHERE email_verificado_em IS NULL;
