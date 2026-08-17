import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPreco } from "@/data/produtos";
import { FORMA_PAGAMENTO_LABEL } from "@/lib/pagamento";
import { useAuth } from "@/lib/auth";
import {
  listMeusPedidos,
  getMeuPedidoItens,
  type PedidoRow,
  type PedidoItemRow,
} from "@/server-fns/pedidos";
import type { PedidoStatus } from "@/server-fns/admin/pedidos";

export const Route = createFileRoute("/minhas-compras")({
  component: MinhasCompras,
});

const STATUS_LABEL: Record<PedidoStatus, string> = {
  pendente: "pendente",
  pago: "pago",
  enviado: "enviado",
  cancelado: "cancelado",
};

const STATUS_CLASS: Record<PedidoStatus, string> = {
  pendente: "bg-amber-100 text-amber-700",
  pago: "bg-emerald-100 text-emerald-700",
  enviado: "bg-sky-100 text-sky-700",
  cancelado: "bg-red-100 text-red-700",
};

function MinhasCompras() {
  const { hydrated, user } = useAuth();
  const navigate = useNavigate();
  const listCall = useServerFn(listMeusPedidos);

  const [pedidos, setPedidos] = useState<PedidoRow[] | null>(null);
  const [abertoId, setAbertoId] = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      navigate({ to: "/entrar", search: { redirect: "/minhas-compras" } });
      return;
    }
    listCall().then(setPedidos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user]);

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-menu text-3xl text-[color:var(--pink-deep)] text-center">
            minhas compras
          </h1>

          {pedidos === null && (
            <p className="text-center text-sm text-foreground/60 mt-8">carregando...</p>
          )}

          {pedidos && pedidos.length === 0 && (
            <div className="text-center mt-10 space-y-4">
              <p className="text-sm text-foreground/60">você ainda não fez nenhuma compra ✿</p>
              <Link
                to="/produtos"
                className="inline-block px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                ver produtos
              </Link>
            </div>
          )}

          {pedidos && pedidos.length > 0 && (
            <div className="mt-8 space-y-3">
              {pedidos.map((p) => (
                <PedidoCard
                  key={p.id}
                  pedido={p}
                  aberto={abertoId === p.id}
                  onToggle={() => setAbertoId((id) => (id === p.id ? null : p.id))}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function PedidoCard({
  pedido,
  aberto,
  onToggle,
}: {
  pedido: PedidoRow;
  aberto: boolean;
  onToggle: () => void;
}) {
  const [itens, setItens] = useState<PedidoItemRow[] | null>(null);
  const itensCall = useServerFn(getMeuPedidoItens);

  useEffect(() => {
    if (!aberto || itens) return;
    itensCall({ data: { pedidoId: pedido.id } }).then(setItens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  return (
    <div className="bg-white/80 rounded-2xl border border-[color:var(--pink-deep)]/10 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <div className="font-menu text-lg text-[color:var(--pink-deep)]">
            pedido #{pedido.id}
          </div>
          <div className="text-xs text-foreground/50">
            {new Date(pedido.criadoEm).toLocaleDateString("pt-BR")}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_CLASS[pedido.status]}`}
          >
            {STATUS_LABEL[pedido.status]}
          </span>
          <span className="font-medium">{formatPreco(pedido.totalCentavos)}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${aberto ? "rotate-180" : ""}`} />
        </div>
      </button>

      {aberto && (
        <div className="px-5 pb-5 pt-1 border-t border-[color:var(--pink-deep)]/10 space-y-2 text-sm">
          {itens === null && <p className="text-foreground/50">carregando itens...</p>}
          {itens?.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span>
                {item.quantidade}x {item.nomeSnapshot}
              </span>
              <span>{formatPreco(item.precoCentavosSnapshot * item.quantidade)}</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-[color:var(--pink-deep)]/10 space-y-1">
            <div className="flex justify-between text-foreground/60">
              <span>CEP de entrega</span>
              <span>{pedido.cepDestino}</span>
            </div>
            <div className="flex justify-between text-foreground/60">
              <span>Forma de pagamento</span>
              <span>{FORMA_PAGAMENTO_LABEL[pedido.formaPagamento]}</span>
            </div>
            {pedido.cupomCodigo && (
              <div className="flex justify-between text-foreground/60">
                <span>Cupom ({pedido.cupomCodigo})</span>
                <span>-{formatPreco(pedido.descontoCentavos)}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground/60">
              <span>Frete</span>
              <span>{pedido.freteCentavos === 0 ? "grátis" : formatPreco(pedido.freteCentavos)}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground">
              <span>Total</span>
              <span>{formatPreco(pedido.totalCentavos)}</span>
            </div>
          </div>
          <Link
            to="/pedido/$pedidoId"
            params={{ pedidoId: String(pedido.id) }}
            className="inline-block mt-2 text-xs underline text-[color:var(--pink-deep)]"
          >
            ver status do pedido
          </Link>
        </div>
      )}
    </div>
  );
}
