-- Troca os campos "tamanho" e "medidas" (que exigiam preencher dois campos
-- curtos e nem sempre cabiam o que a peça precisava explicar) por uma
-- "descricao" única, de texto livre.
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/017_produto_descricao.sql).

ALTER TABLE produtos
  ADD COLUMN descricao TEXT NOT NULL AFTER medidas;

UPDATE produtos
SET descricao = TRIM(BOTH ' - ' FROM CONCAT_WS(' - ', NULLIF(tamanho, ''), NULLIF(medidas, '')));

ALTER TABLE produtos
  DROP COLUMN tamanho,
  DROP COLUMN medidas;
