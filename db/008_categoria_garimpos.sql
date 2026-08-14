-- Reintroduz "garimpos" no domínio de tipo/categoria: dessa vez como uma
-- categoria a mais (igual newdrop), pra dar pro admin marcar produtos que
-- devem aparecer na seção "Últimos garimpos" da home.
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/008_categoria_garimpos.sql).

ALTER TABLE produtos
  MODIFY COLUMN tipo ENUM('cima', 'baixo', 'calcados', 'vestido', 'newdrop', 'garimpos') NOT NULL,
  MODIFY COLUMN categoria ENUM('cima', 'baixo', 'calcados', 'vestido', 'newdrop', 'garimpos') NOT NULL;
