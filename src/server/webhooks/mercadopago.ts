import { createHmac, timingSafeEqual } from "node:crypto";
import { buscarPagamentoMercadoPago } from "@/server/mercadopago";
import { confirmarPagamentoPedido, cancelarPedidoELiberarPecas } from "@/server/pedidos-pagamento";

/** Confere a assinatura HMAC do webhook contra o segredo configurado no
 * painel do Mercado Pago (Webhooks → "Assinatura secreta" — diferente do
 * access token). Sem `MERCADOPAGO_WEBHOOK_SECRET` configurado, a checagem é
 * pulada — funciona, mas qualquer um que descubra a URL pode fingir um
 * pagamento aprovado, então configure isso antes de ir pra produção. */
function assinaturaValida(request: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const partes = Object.fromEntries(
    signatureHeader.split(",").map((par) => {
      const [chave, valor] = par.split("=");
      return [chave.trim(), (valor ?? "").trim()];
    }),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hashEsperado = createHmac("sha256", secret).update(manifest).digest("hex");

  const bufEsperado = Buffer.from(hashEsperado, "hex");
  const bufRecebido = Buffer.from(v1, "hex");
  return bufEsperado.length === bufRecebido.length && timingSafeEqual(bufEsperado, bufRecebido);
}

/** Notificação assíncrona do Mercado Pago. O corpo só diz "o pagamento X
 * mudou" — nunca confiamos no que ele diz sobre o status, sempre buscamos o
 * pagamento de novo direto na API deles antes de decidir algo. Sempre
 * responde 200 rápido pra evitar retentativas desnecessárias, mesmo quando o
 * evento não é relevante pra gente. */
export async function handleMercadoPagoWebhook(request: Request): Promise<Response> {
  let body: { type?: string; data?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }

  const dataId = body.data?.id;
  if (body.type !== "payment" || !dataId) {
    return new Response("ok", { status: 200 });
  }

  if (!assinaturaValida(request, dataId)) {
    return new Response("assinatura inválida", { status: 401 });
  }

  try {
    const pagamento = await buscarPagamentoMercadoPago(dataId);
    const pedidoId = pagamento.externalReference ? Number(pagamento.externalReference) : null;
    if (!pedidoId || Number.isNaN(pedidoId)) {
      return new Response("ok", { status: 200 });
    }

    if (pagamento.status === "approved") {
      await confirmarPagamentoPedido(pedidoId);
    } else if (pagamento.status === "rejected" || pagamento.status === "cancelled") {
      await cancelarPedidoELiberarPecas(pedidoId);
    }
    // "pending"/"in_process" (comum em boleto/Pix aguardando confirmação):
    // não muda nada ainda, esperamos a próxima notificação.

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("erro processando webhook do Mercado Pago:", error);
    // 500 faz o Mercado Pago tentar de novo mais tarde.
    return new Response("erro interno", { status: 500 });
  }
}
