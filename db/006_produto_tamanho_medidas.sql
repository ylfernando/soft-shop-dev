-- Cada produto passa a ter tamanho (P/M/G/38/único...) e medidas (texto livre,
-- já que cada tipo de peça tem medidas diferentes: comprimento, busto, etc).

ALTER TABLE produtos
  ADD COLUMN tamanho VARCHAR(20) NOT NULL DEFAULT '' AFTER categoria,
  ADD COLUMN medidas VARCHAR(255) NOT NULL DEFAULT '' AFTER tamanho;
