-- Trava definitiva contra vender a mesma peça única duas vezes. Antes desta
-- migration, criarPedido travava a linha do produto com SELECT ... FOR UPDATE
-- mas nunca gravava que ela tinha sido vendida — então duas compras
-- concorrentes da mesma peça podiam as duas ser aceitas.

ALTER TABLE produtos
  ADD COLUMN vendido_em TIMESTAMP NULL DEFAULT NULL AFTER preco_centavos;
