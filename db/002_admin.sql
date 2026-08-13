-- Admin dashboard: papel de usuário, banners e pedidos (vendas).
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/002_admin.sql),
-- ou recrie o volume (docker-compose down -v && up) pra rodar junto com o init.sql num banco novo.

ALTER TABLE usuarios
  ADD COLUMN role ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente' AFTER senha_hash;

CREATE TABLE IF NOT EXISTS banners (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  img_url VARCHAR(255) NOT NULL,
  titulo VARCHAR(200) NULL,
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- usuario_id fica nulo (nunca é apagado em cascata) pra um pedido continuar
-- existindo no histórico de vendas mesmo se o admin excluir a conta do cliente.
CREATE TABLE IF NOT EXISTS pedidos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NULL,
  nome_cliente_snapshot VARCHAR(120) NOT NULL,
  email_cliente_snapshot VARCHAR(190) NOT NULL,
  subtotal_centavos INT UNSIGNED NOT NULL,
  frete_centavos INT UNSIGNED NOT NULL,
  total_centavos INT UNSIGNED NOT NULL,
  status ENUM('pendente', 'pago', 'enviado', 'cancelado') NOT NULL DEFAULT 'pago',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- nome/preço são um retrato do produto no momento da compra: se o admin editar
-- ou excluir o produto depois, o pedido antigo continua íntegro.
CREATE TABLE IF NOT EXISTS pedido_itens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id INT UNSIGNED NOT NULL,
  produto_id VARCHAR(50) NULL,
  nome_snapshot VARCHAR(200) NOT NULL,
  preco_centavos_snapshot INT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_pedido_itens_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  CONSTRAINT fk_pedido_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
