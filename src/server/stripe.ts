import Stripe from "stripe";

let client: Stripe | undefined;

function getClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("pagamento via Stripe não está configurado.");
  }
  if (!client) {
    client = new Stripe(secretKey);
  }
  return client;
}

export interface CriarSessaoInput {
  pedidoId: number;
  totalCentavos: number;
  descricao: string;
  compradorEmail: string;
  urlRetorno: string;
}

/** Cria uma Checkout Session hospedada — o cliente é redirecionado pra
 * `url`, paga no domínio da Stripe, e volta pra `urlRetorno`. `metadata.pedidoId`
 * é como o webhook casa o evento de pagamento de volta com o nosso pedido. */
export async function criarSessaoStripe(input: CriarSessaoInput) {
  const stripe = getClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.compradorEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: input.totalCentavos,
          product_data: { name: input.descricao },
        },
      },
    ],
    metadata: { pedidoId: String(input.pedidoId) },
    success_url: input.urlRetorno,
    cancel_url: input.urlRetorno,
  });
  if (!session.url) {
    throw new Error("não deu pra iniciar o pagamento pelo Stripe agora, tenta de novo.");
  }
  return { id: session.id, url: session.url };
}

/** Verifica a assinatura HMAC do webhook (cabeçalho `stripe-signature`) contra
 * o corpo bruto da requisição — precisa ser o texto exato recebido, antes de
 * qualquer JSON.parse, senão a assinatura não bate. */
export function verificarAssinaturaStripe(corpoBruto: string, assinatura: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("webhook do Stripe não está configurado.");
  }
  return getClient().webhooks.constructEvent(corpoBruto, assinatura, webhookSecret);
}
