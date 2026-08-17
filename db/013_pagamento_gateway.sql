-- Checkout passa a exigir pagamento de verdade via Mercado Pago ou Stripe
-- (checkout hospedado — o cliente é redirecionado pro gateway e volta depois
-- de pagar). O pedido nasce 'pendente' e só vira 'pago' quando o webhook do
-- gateway confirma; se o pagamento falhar/expirar, a peça volta pro catálogo.

ALTER TABLE pedidos
  MODIFY COLUMN status ENUM('pendente', 'pago', 'enviado', 'cancelado') NOT NULL DEFAULT 'pendente',
  ADD COLUMN pagamento_gateway ENUM('mercadopago', 'stripe') NULL AFTER forma_pagamento,
  ADD COLUMN pagamento_referencia_externa VARCHAR(255) NULL AFTER pagamento_gateway,
  ADD INDEX idx_pedidos_pagamento_referencia (pagamento_referencia_externa);
