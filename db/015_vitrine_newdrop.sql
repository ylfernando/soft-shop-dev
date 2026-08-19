-- Adiciona "newdrop" como uma 3ª seção curada da vitrine, ao lado de
-- garimpos e promos: o admin escolhe manualmente quais produtos aparecem
-- na home em "newDROP".
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/015_vitrine_newdrop.sql).

ALTER TABLE vitrines
  MODIFY COLUMN secao ENUM('garimpos', 'promos', 'newdrop') NOT NULL;
