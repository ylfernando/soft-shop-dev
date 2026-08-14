-- Cupons de desconto configuráveis pelo admin (código + % de desconto sobre
-- o subtotal). O pedido guarda qual cupom foi usado e quanto foi descontado,
-- pra ficar registrado no histórico mesmo se o cupom for editado/desativado depois.

CREATE TABLE IF NOT EXISTS cupons (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  percentual_desconto TINYINT UNSIGNED NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cupons_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE pedidos
  ADD COLUMN cupom_codigo VARCHAR(30) NULL AFTER subtotal_centavos,
  ADD COLUMN desconto_centavos INT UNSIGNED NOT NULL DEFAULT 0 AFTER cupom_codigo;
