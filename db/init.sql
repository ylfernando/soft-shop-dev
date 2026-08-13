-- Schema inicial: produtos, usuarios e carrinho.
-- Espelha os tipos de src/data/produtos.ts, src/lib/auth.tsx e src/lib/cart.tsx.

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS produtos (
  id VARCHAR(50) NOT NULL,
  img VARCHAR(255) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  preco_centavos INT UNSIGNED NOT NULL,
  tipo ENUM('cima', 'baixo', 'calcados', 'vestido', 'newdrop') NOT NULL,
  categoria ENUM('upcycling', 'rework', 'autorais', 'garimpos', 'newdrop') NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS carrinho_itens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  produto_id VARCHAR(50) NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carrinho_usuario_produto (usuario_id, produto_id),
  CONSTRAINT fk_carrinho_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_carrinho_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed com o catálogo atual (src/data/produtos.ts). Os caminhos de imagem aqui
-- são ilustrativos: hoje o front importa os arquivos direto do Vite, então ao
-- consumir a API essa coluna deve passar a apontar pra uma URL real de asset.
INSERT INTO produtos (id, img, nome, preco_centavos, tipo, categoria) VALUES
  ('p1', '/assets/p1.jpg', 'cargo jacket preta M', 11000, 'cima', 'newdrop'),
  ('p2', '/assets/p2.jpg', 'trench azul marinho M', 6000, 'cima', 'newdrop'),
  ('p3', '/assets/p3.jpg', '[upcycling] sainha jeans M/G', 6000, 'baixo', 'upcycling'),
  ('p4', '/assets/p4.jpg', 'sainha midi marrom P', 2500, 'baixo', 'rework'),
  ('p5', '/assets/p5.jpg', 'cardigã tricot off white P/M', 4500, 'cima', 'garimpos'),
  ('p6', '/assets/p6.jpg', '[garimpo] saia midi poá marinho M', 3500, 'baixo', 'garimpos')
ON DUPLICATE KEY UPDATE
  img = VALUES(img),
  nome = VALUES(nome),
  preco_centavos = VALUES(preco_centavos),
  tipo = VALUES(tipo),
  categoria = VALUES(categoria);

-- Usuário de teste (mesmas credenciais do botão "entrar com conta de teste"
-- em src/routes/entrar.tsx). Hash bcrypt de "teste1234".
INSERT INTO usuarios (nome, email, senha_hash) VALUES
  ('Conta Teste', 'teste@soft.com', '$2b$10$YSp7fi1SLNsCL2b2lH6lweU6d4l9wvJft.DheGebaNlbTFYGvebaq')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
