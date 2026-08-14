-- Forma de pagamento escolhida no checkout. Fictício por enquanto (não existe
-- gateway de pagamento real ainda) — o cliente só seleciona a opção, sem
-- nenhuma cobrança de verdade acontecer.

ALTER TABLE pedidos
  ADD COLUMN forma_pagamento ENUM('pix', 'cartao_credito', 'cartao_debito', 'boleto')
    NOT NULL DEFAULT 'pix' AFTER status;
