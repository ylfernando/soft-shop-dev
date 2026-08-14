-- O checkout agora cotação o frete de verdade via SuperFrete a partir do CEP
-- do cliente — precisa gravar esse CEP no pedido, tanto pra reconferir o
-- frete no fechamento quanto pra saber pra onde enviar o pacote depois.
-- Rode manualmente contra um banco já existente (docker exec ... mysql < db/010_pedido_cep_destino.sql).

ALTER TABLE pedidos
  ADD COLUMN cep_destino CHAR(8) NOT NULL DEFAULT '' AFTER frete_centavos;
