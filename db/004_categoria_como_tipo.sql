-- A categoria de produto deixa de ser upcycling/rework/autorais/garimpos e
-- passa a usar o mesmo domínio do tipo (parte de cima/baixo/calçados/vestido),
-- mais newdrop. Como os valores antigos não existem no novo ENUM, a coluna
-- precisa passar por VARCHAR antes de virar ENUM de novo — do contrário o
-- ALTER falha (ou zera os dados) com o sql_mode estrito padrão do MySQL 8.

ALTER TABLE produtos MODIFY COLUMN categoria VARCHAR(20) NOT NULL;

UPDATE produtos SET categoria = tipo;

ALTER TABLE produtos
  MODIFY COLUMN categoria ENUM('cima', 'baixo', 'calcados', 'vestido', 'newdrop') NOT NULL;
