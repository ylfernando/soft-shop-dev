-- Cada produto passa a ter até 5 imagens (galeria), em vez de uma só.
-- produtos.img continua existindo como "capa" (usada nos cards, carrinho e
-- pedidos) mas agora é só um espelho da imagem de menor ordem aqui — sempre
-- mantida em sincronia pelos server-fns de admin (nunca editada direto).

CREATE TABLE IF NOT EXISTS produto_imagens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  produto_id VARCHAR(50) NOT NULL,
  url VARCHAR(255) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_produto_imagens_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migra a imagem única já cadastrada de cada produto pra virar a 1ª foto da galeria.
INSERT INTO produto_imagens (produto_id, url, ordem)
SELECT id, img, 0 FROM produtos
WHERE NOT EXISTS (
  SELECT 1 FROM produto_imagens pi WHERE pi.produto_id = produtos.id
);
