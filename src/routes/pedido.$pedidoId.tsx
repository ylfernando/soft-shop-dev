import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import {
  getPedidoStatus,
  reconciliarPagamentoMercadoPago,
  type PedidoStatusResult,
} from "@/server-fns/pedidos";

const searchSchema = z.object({
  // Mandado pelo Checkout Pro do Mercado Pago na URL de volta. É só dígitos,
  // então o parser de query string do router lê como number — coagimos de
  // volta pra string (é assim que a API do Mercado Pago espera o id).
  payment_id: z.coerce.string().optional(),
});

export const Route = createFileRoute("/pedido/$pedidoId")({
  component: PedidoRetorno,
  validateSearch: searchSchema,
});

const INTERVALO_MS = 3000;
const TENTATIVAS_MAX = 40; // ~2 minutos

function PedidoRetorno() {
  const { pedidoId } = Route.useParams();
  const { payment_id: paymentId } = Route.useSearch();
  const getPedidoStatusCall = useServerFn(getPedidoStatus);
  const reconciliarCall = useServerFn(reconciliarPagamentoMercadoPago);
  const { clear } = useCart();
  const clearedRef = useRef(false);

  const [resultado, setResultado] = useState<PedidoStatusResult | null>(null);
  const [expirou, setExpirou] = useState(false);

  useEffect(() => {
    let tentativas = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelado = false;

    // O webhook do gateway é quem confirma o pagamento normalmente, mas ele
    // é assíncrono e pode atrasar (ou não chegar — já aconteceu em teste).
    // Quando a volta é do Mercado Pago, a URL já traz o `payment_id`: usamos
    // ele pra reconsultar o pagamento direto na API deles, sem depender só
    // do webhook. Na primeira tentativa e, se ainda não confirmou, de novo
    // no timeout final — o resto do polling continua leve (só lê o banco).
    async function consultar(tentarReconciliar: boolean) {
      const res =
        tentarReconciliar && paymentId
          ? await reconciliarCall({ data: { pedidoId: Number(pedidoId), paymentId } })
          : await getPedidoStatusCall({ data: { pedidoId: Number(pedidoId) } });
      if (cancelado) return;
      setResultado(res);

      const aindaPendente = res.ok && res.status === "pendente";
      if (!aindaPendente) return;

      tentativas += 1;
      if (tentativas >= TENTATIVAS_MAX) {
        if (paymentId) {
          const finalRes = await reconciliarCall({ data: { pedidoId: Number(pedidoId), paymentId } });
          if (cancelado) return;
          setResultado(finalRes);
          if (!(finalRes.ok && finalRes.status === "pendente")) return;
        }
        setExpirou(true);
        return;
      }
      timer = setTimeout(() => consultar(false), INTERVALO_MS);
    }

    consultar(true);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId, paymentId]);

  const status = resultado?.ok ? resultado.status : null;

  useEffect(() => {
    if (status === "pago" && !clearedRef.current) {
      clearedRef.current = true;
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-16 px-6">
        <div className="max-w-md mx-auto bg-white/80 rounded-3xl p-8 shadow-md border border-[color:var(--pink-deep)]/10 text-center space-y-4">
          {resultado === null && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                confirmando seu pagamento...
              </h1>
              <p className="text-sm text-foreground/60">só um instante ✿</p>
            </>
          )}

          {resultado && !resultado.ok && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                não achamos esse pedido
              </h1>
              <p className="text-sm text-foreground/60">{resultado.erro}</p>
              <Link
                to="/"
                className="inline-block mt-2 px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                voltar pro início
              </Link>
            </>
          )}

          {status === "pendente" && !expirou && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                confirmando seu pagamento...
              </h1>
              <p className="text-sm text-foreground/60">
                isso pode levar alguns segundos, principalmente com Pix ou boleto ✿
              </p>
            </>
          )}

          {status === "pendente" && expirou && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                ainda processando
              </h1>
              <p className="text-sm text-foreground/60">
                seu pagamento está demorando mais que o normal pra confirmar. assim que cair você
                recebe a confirmação por e-mail — não precisa tentar de novo.
              </p>
              <Link
                to="/"
                className="inline-block mt-2 px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                voltar pro início
              </Link>
            </>
          )}

          {status === "pago" && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                pedido confirmado! ✿
              </h1>
              <p className="text-sm text-foreground/60">
                seu pagamento foi aprovado e a peça já é sua. bora acompanhar o envio por e-mail.
              </p>
              <Link
                to="/"
                className="inline-block mt-2 px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                voltar pro início
              </Link>
            </>
          )}

          {status === "cancelado" && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                esse pagamento não foi confirmado
              </h1>
              <p className="text-sm text-foreground/60">
                a peça foi liberada de volta pro catálogo. se ainda quiser ela, corre lá de novo ✿
              </p>
              <Link
                to="/produtos"
                className="inline-block mt-2 px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                ver produtos
              </Link>
            </>
          )}

          {status === "enviado" && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                esse pedido já foi enviado ✿
              </h1>
              <Link
                to="/"
                className="inline-block mt-2 px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                voltar pro início
              </Link>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
