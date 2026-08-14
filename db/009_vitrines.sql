-- "Últimos garimpos" deixa de ser uma categoria de produto: agora, junto com
-- "promos da semana", é uma vitrine curada manualmente pelo admin (escolhe
-- quais produtos existentes aparecem em cada seção da home, com ordem própria).
-- A coluna tipo/categoria não precisa mais do valor 'garimpos'.
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/009_vitrines.sql).

UPDATE produtos SET categoria = 'newdrop' WHERE categoria = 'garimpos';
UPDATE produtos SET tipo = 'newdrop' WHERE tipo = 'garimpos';

ALTER TABLE produtos
  MODIFY COLUMN tipo ENUM('cima', 'baixo', 'calcados', 'vestido', 'newdrop') NOT NULL,
  MODIFY COLUMN categoria ENUM('cima', 'baixo', 'calcados', 'vestido', 'newdrop') NOT NULL;

CREATE TABLE IF NOT EXISTS vitrines (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  produto_id VARCHAR(50) NOT NULL,
  secao ENUM('garimpos', 'promos') NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vitrines_produto_secao (produto_id, secao),
  CONSTRAINT fk_vitrines_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
