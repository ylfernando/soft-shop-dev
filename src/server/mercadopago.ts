import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

let client: MercadoPagoConfig | undefined;

function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("pagamento via Mercado Pago não está configurado.");
  }
  if (!client) {
    client = new MercadoPagoConfig({ accessToken });
  }
  return client;
}

export interface CriarPreferenciaInput {
  pedidoId: number;
  totalCentavos: number;
  descricao: string;
  compradorEmail: string;
  urlRetorno: string;
  urlWebhook: string;
}

/** Cria uma preferência de pagamento (checkout hospedado) — o cliente é
 * redirecionado pro `initPoint` retornado, paga lá, e o Mercado Pago
 * notifica `urlWebhook` de forma assíncrona quando o status muda. O
 * `external_reference` é como o webhook casa o pagamento de volta com o
 * nosso pedido. */
export async function criarPreferenciaMercadoPago(input: CriarPreferenciaInput) {
  const preference = new Preference(getClient());
  const res = await preference.create({
    body: {
      items: [
        {
          id: String(input.pedidoId),
          title: input.descricao,
          quantity: 1,
          unit_price: input.totalCentavos / 100,
          currency_id: "BRL",
        },
      ],
      payer: { email: input.compradorEmail },
      external_reference: String(input.pedidoId),
      notification_url: input.urlWebhook,
      back_urls: {
        success: input.urlRetorno,
        failure: input.urlRetorno,
        pending: input.urlRetorno,
      },
      auto_return: "approved",
    },
  });
  if (!res.id || !res.init_point) {
    throw new Error("não deu pra iniciar o pagamento pelo Mercado Pago agora, tenta de novo.");
  }
  return { id: res.id, initPoint: res.init_point };
}

/** Busca o status real do pagamento direto na API do Mercado Pago em vez de
 * confiar no corpo da notificação do webhook — a notificação só avisa "algo
 * mudou no pagamento X", quem diz o que de fato mudou é essa consulta. */
export async function buscarPagamentoMercadoPago(paymentId: string) {
  const payment = new Payment(getClient());
  const res = await payment.get({ id: paymentId });
  return {
    id: String(res.id),
    status: res.status,
    externalReference: res.external_reference ?? null,
  };
}
