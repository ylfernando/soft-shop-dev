import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { QrCode, CreditCard, Wallet, Barcode, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPreco } from "@/data/produtos";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { iniciarPagamentoMercadoPago, iniciarPagamentoStripe } from "@/server-fns/pedidos";

type Gateway = "mercadopago" | "stripe";

export const Route = createFileRoute("/finalizar-compra")({
  component: FinalizarCompra,
});

function formatarCepExibicao(cepLimpo: string) {
  return cepLimpo.length === 8 ? `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}` : cepLimpo;
}

function FinalizarCompra() {
  const {
    hydrated: cartHydrated,
    lines,
    removeItem,
    subtotalCentavos,
    cep,
    freteEscolhido,
    freteGratis,
    freteCentavos,
    freteDeterminado,
    cupomAplicado,
    descontoCentavos,
    totalCentavos,
  } = useCart();
  const { hydrated: authHydrated, user } = useAuth();
  const navigate = useNavigate();
  const iniciarMercadoPagoCall = useServerFn(iniciarPagamentoMercadoPago);
  const iniciarStripeCall = useServerFn(iniciarPagamentoStripe);
  const [gatewayEmAndamento, setGatewayEmAndamento] = useState<Gateway | null>(null);

  const cepLimpo = cep.replace(/\D/g, "");
  const podeConfirmar = lines.length > 0 && cepLimpo.length === 8 && freteDeterminado;

  useEffect(() => {
    if (!cartHydrated || !authHydrated) return;
    if (!user) {
      navigate({ to: "/entrar", search: { redirect: "/finalizar-compra" } });
      return;
    }
    if (!podeConfirmar) {
      navigate({ to: "/carrinho" });
    }
  }, [cartHydrated, authHydrated, user, podeConfirmar, navigate]);

  // O carrinho só é limpo depois que o pagamento é confirmado de verdade,
  // na tela de retorno (/pedido/$id) — aqui a gente só reserva a peça e
  // manda o cliente pro checkout hospedado do gateway escolhido.
  async function pagarCom(gateway: Gateway) {
    if (gatewayEmAndamento || !podeConfirmar) return;
    setGatewayEmAndamento(gateway);
    try {
      const chamada = gateway === "mercadopago" ? iniciarMercadoPagoCall : iniciarStripeCall;
      const res = await chamada({
        data: {
          itens: lines.map((l) => ({ produtoId: l.produtoId, quantidade: l.quantidade })),
          cepDestino: cepLimpo,
          cupomCodigo: cupomAplicado?.codigo,
        },
      });
      if (!res.ok) {
        toast.error(res.erro);
        setGatewayEmAndamento(null);
        return;
      }
      window.location.href = res.redirectUrl;
    } catch {
      toast.error("não deu pra iniciar o pagamento, tenta de novo ✿");
      setGatewayEmAndamento(null);
    }
  }

  if (!cartHydrated || !authHydrated || !podeConfirmar) {
    return null;
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-xl mx-auto">
          <h1 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)] text-center mb-2">
            REVISE SEU PEDIDO
          </h1>
          <p className="text-center text-sm text-foreground/60 mb-10">
            confere se está tudo certo antes de confirmar
          </p>

          <div className="bg-white/80 rounded-2xl border border-[color:var(--pink-deep)]/10 p-5 space-y-4">
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.produtoId} className="flex items-center gap-3">
                  <div className="w-14 h-[4.5rem] rounded-lg overflow-hidden bg-[color:var(--pink-soft)] shrink-0">
                    <img
                      src={line.produto.img}
                      alt={line.produto.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="flex-1 min-w-0 font-menu text-sm text-[color:var(--pink-deep)] truncate">
                    {line.produto.nome}
                  </p>
                  <span className="text-sm font-semibold shrink-0">
                    {formatPreco(line.produto.precoCentavos)}
                  </span>
                  <button
                    aria-label="remover item"
                    onClick={() => removeItem(line.produtoId)}
                    className="text-foreground/40 hover:text-[color:var(--pink-deep)] shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[color:var(--pink-deep)]/15 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Entregar em</span>
                <span>{formatarCepExibicao(cepLimpo)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Frete</span>
                <span>
                  {freteGratis
                    ? "grátis ✿"
                    : `${freteEscolhido?.transportadora} · ${freteEscolhido?.nome}`}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[color:var(--pink-deep)]/15 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Subtotal</span>
                <span>{formatPreco(subtotalCentavos)}</span>
              </div>
              {cupomAplicado && (
                <div className="flex items-center justify-between text-[color:var(--pink-deep)]">
                  <span>
                    Cupom {cupomAplicado.codigo} (-{cupomAplicado.percentualDesconto}%)
                  </span>
                  <span>-{formatPreco(descontoCentavos)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Frete</span>
                <span>{freteGratis ? "grátis" : formatPreco(freteCentavos)}</span>
              </div>
              <div className="flex items-center justify-between font-menu text-lg text-[color:var(--pink-deep)] pt-1">
                <span>Total</span>
                <span>{formatPreco(totalCentavos)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[color:var(--pink-deep)]/15">
              <p className="text-xs text-foreground/50 mb-2">formas de pagamento aceitas</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { Icon: QrCode, label: "Pix" },
                  { Icon: CreditCard, label: "Crédito" },
                  { Icon: Wallet, label: "Débito" },
                  { Icon: Barcode, label: "Boleto" },
                ].map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-[color:var(--pink-deep)]/30 bg-white/70 text-xs text-[color:var(--pink-deep)]"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => pagarCom("mercadopago")}
                disabled={gatewayEmAndamento !== null}
                className="w-full py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90 disabled:opacity-60"
              >
                {gatewayEmAndamento === "mercadopago"
                  ? "redirecionando..."
                  : "Pagar com Mercado Pago"}
              </button>
              <button
                onClick={() => pagarCom("stripe")}
                disabled={gatewayEmAndamento !== null}
                className="w-full py-2.5 rounded-full border border-[color:var(--pink-deep)] text-[color:var(--pink-deep)] font-pixel text-base hover:bg-[color:var(--pink-deep)]/10 disabled:opacity-60"
              >
                {gatewayEmAndamento === "stripe"
                  ? "redirecionando..."
                  : "Pagar com cartão internacional"}
              </button>
              <Link
                to="/carrinho"
                className="block text-center w-full py-2 text-sm text-foreground/60 underline hover:text-[color:var(--pink-deep)]"
              >
                voltar pra sacolinha
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
