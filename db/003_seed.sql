-- Aponta o catálogo seed pras imagens reais servidas em /uploads (ver public/uploads/)
-- e popula os banners da home, que até aqui eram só imports estáticos do Vite.

INSERT INTO produtos (id, img, nome, preco_centavos, tipo, categoria) VALUES
  ('p1', '/uploads/produtos/p1.jpg', 'cargo jacket preta M', 11000, 'cima', 'newdrop'),
  ('p2', '/uploads/produtos/p2.jpg', 'trench azul marinho M', 6000, 'cima', 'newdrop'),
  ('p3', '/uploads/produtos/p3.jpg', '[upcycling] sainha jeans M/G', 6000, 'baixo', 'upcycling'),
  ('p4', '/uploads/produtos/p4.jpg', 'sainha midi marrom P', 2500, 'baixo', 'rework'),
  ('p5', '/uploads/produtos/p5.jpg', 'cardigã tricot off white P/M', 4500, 'cima', 'garimpos'),
  ('p6', '/uploads/produtos/p6.jpg', '[garimpo] saia midi poá marinho M', 3500, 'baixo', 'garimpos')
ON DUPLICATE KEY UPDATE
  img = VALUES(img),
  nome = VALUES(nome),
  preco_centavos = VALUES(preco_centavos),
  tipo = VALUES(tipo),
  categoria = VALUES(categoria);

INSERT INTO banners (img_url, titulo, ordem, ativo) VALUES
  ('/uploads/banners/banner-1.jpg', NULL, 1, TRUE),
  ('/uploads/banners/banner-2.jpg', NULL, 2, TRUE),
  ('/uploads/banners/banner-3.jpg', NULL, 3, TRUE);
