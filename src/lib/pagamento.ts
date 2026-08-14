import type { FormaPagamento } from "@/server-fns/admin/pedidos";

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  boleto: "Boleto",
};
