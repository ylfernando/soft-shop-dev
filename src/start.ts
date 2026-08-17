import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { handleStripeWebhook } from "./server/webhooks/stripe";
import { handleMercadoPagoWebhook } from "./server/webhooks/mercadopago";

// Mercado Pago e Stripe batem direto nessas URLs com o corpo bruto deles —
// não dá pra passar por um server-fn (RPC same-origin, protegido por CSRF, e
// que não preserva o corpo bruto que a assinatura da Stripe exige). Isso
// intercepta a requisição antes do roteador de páginas/server-fns entrar em
// ação e responde direto.
const webhooksMiddleware = createMiddleware().server(async ({ request, next }) => {
  const { pathname } = new URL(request.url);
  if (request.method === "POST" && pathname === "/webhooks/stripe") {
    return handleStripeWebhook(request);
  }
  if (request.method === "POST" && pathname === "/webhooks/mercadopago") {
    return handleMercadoPagoWebhook(request);
  }
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [webhooksMiddleware, errorMiddleware],
}));
