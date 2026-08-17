import type Stripe from "stripe";
import { verificarAssinaturaStripe } from "@/server/stripe";
import { confirmarPagamentoPedido, cancelarPedidoELiberarPecas } from "@/server/pedidos-pagamento";

function pedidoIdDoEvento(session: Stripe.Checkout.Session): number | null {
  const raw = session.metadata?.pedidoId;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isNaN(id) ? null : id;
}

/** Webhook do Stripe. A assinatura (`stripe-signature`) só bate se validada
 * contra o texto bruto exato do corpo — por isso lemos `request.text()` em
 * vez de `request.json()`, e só damos parse depois que a assinatura já foi
 * conferida pelo SDK. */
export async function handleStripeWebhook(request: Request): Promise<Response> {
  const assinatura = request.headers.get("stripe-signature");
  if (!assinatura) {
    return new Response("assinatura ausente", { status: 400 });
  }

  const corpoBruto = await request.text();
  let event: Stripe.Event;
  try {
    event = verificarAssinaturaStripe(corpoBruto, assinatura);
  } catch (error) {
    console.error("assinatura do webhook do Stripe não bateu:", error);
    return new Response("assinatura inválida", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // "paid" cobre Pix/boleto via Stripe também — só cartão confirma na hora.
        if (session.payment_status === "paid") {
          const pedidoId = pedidoIdDoEvento(session);
          if (pedidoId) await confirmarPagamentoPedido(pedidoId);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const pedidoId = pedidoIdDoEvento(session);
        if (pedidoId) await cancelarPedidoELiberarPecas(pedidoId);
        break;
      }
      default:
        break;
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("erro processando webhook do Stripe:", error);
    return new Response("erro interno", { status: 500 });
  }
}
