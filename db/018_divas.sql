-- Cards das "divas" (clientes destaque) exibidos na home, com foto e link
-- pro destaque do Instagram. São sempre 3 cards fixos, editáveis pelo admin
-- (sem criar/excluir, só trocar imagem/username/link de cada um).
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/018_divas.sql).

CREATE TABLE IF NOT EXISTS divas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  img_url VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL DEFAULT 'softshopl',
  highlight_url VARCHAR(500) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO divas (img_url, username, highlight_url, ordem) VALUES
  ('/uploads/divas/diva-1.jpg', 'softshopl', 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MDgwMTY1ODMzMzAyNTk3?story_media_id=3955176068107035355&igsi=MWF2bnN5c2ZzYTJsdw==', 1),
  ('/uploads/divas/diva-2.jpg', 'softshopl', 'https://www.instagram.com/s/SEU_DESTAQUE_AQUI/', 2),
  ('/uploads/divas/diva-3.jpg', 'softshopl', 'https://www.instagram.com/s/SEU_DESTAQUE_AQUI/', 3);
