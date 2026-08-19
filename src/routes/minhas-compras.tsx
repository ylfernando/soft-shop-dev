import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Receipt, Wallet, Clock, ShoppingBag, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ContaNav } from "@/components/ContaNav";
import { Skeleton } from "@/components/ui/skeleton";
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
  pendente: "aguardando pagamento",
  pago: "pago",
  enviado: "enviado",
  cancelado: "cancelado",
};

const STATUS_DOT: Record<PedidoStatus, string> = {
  pendente: "bg-amber-500",
  pago: "bg-emerald-500",
  enviado: "bg-sky-500",
  cancelado: "bg-rose-400",
};

const STATUS_CLASS: Record<PedidoStatus, string> = {
  pendente: "bg-amber-100 text-amber-700",
  pago: "bg-emerald-100 text-emerald-700",
  enviado: "bg-sky-100 text-sky-700",
  cancelado: "bg-rose-100 text-rose-600",
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

  const stats = useMemo(() => {
    if (!pedidos) return null;
    const investidoCentavos = pedidos
      .filter((p) => p.status === "pago" || p.status === "enviado")
      .reduce((sum, p) => sum + p.totalCentavos, 0);
    const aguardando = pedidos.filter((p) => p.status === "pendente").length;
    return { total: pedidos.length, investidoCentavos, aguardando };
  }, [pedidos]);

  if (!user) return null;

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-menu text-3xl text-[color:var(--pink-deep)]">minhas compras</h1>
          <p className="text-sm text-foreground/60 mt-1">
            todos os seus pedidos na Soft, num lugar só ✿
          </p>

          <div className="mt-6">
            <ContaNav />
          </div>

          {pedidos === null && <ResumoESkeleton />}

          {pedidos && pedidos.length === 0 && (
            <div className="text-center mt-10 py-12 bg-white/70 rounded-3xl border border-[color:var(--pink-deep)]/10 space-y-4">
              <ShoppingBag className="w-10 h-10 mx-auto text-[color:var(--pink-deep)]/40" />
              <p className="text-sm text-foreground/60">
                você ainda não fez nenhuma compra ✿
              </p>
              <Link
                to="/produtos"
                className="inline-block px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                ver produtos
              </Link>
            </div>
          )}

          {pedidos && pedidos.length > 0 && stats && (
            <>
              <Resumo stats={stats} />
              <div className="mt-4 space-y-3">
                {pedidos.map((p) => (
                  <PedidoCard
                    key={p.id}
                    pedido={p}
                    aberto={abertoId === p.id}
                    onToggle={() => setAbertoId((id) => (id === p.id ? null : p.id))}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ResumoESkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      <Skeleton className="h-[72px] rounded-2xl" />
      <Skeleton className="h-[72px] rounded-2xl" />
      <Skeleton className="h-[72px] rounded-2xl" />
    </div>
  );
}

function Resumo({
  stats,
}: {
  stats: { total: number; investidoCentavos: number; aguardando: number };
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white/70 rounded-2xl border border-[color:var(--pink-deep)]/10 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-1.5 text-[color:var(--pink-deep)]/70">
          <Receipt className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] sm:text-xs">pedidos</span>
        </div>
        <p className="font-pixel text-xl sm:text-2xl text-[color:var(--pink-deep)] mt-0.5">
          {stats.total}
        </p>
      </div>

      <div className="bg-white/70 rounded-2xl border border-[color:var(--pink-deep)]/10 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-1.5 text-[color:var(--pink-deep)]/70">
          <Wallet className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] sm:text-xs">investido</span>
        </div>
        <p className="font-pixel text-xl sm:text-2xl text-[color:var(--pink-deep)] mt-0.5 truncate">
          {formatPreco(stats.investidoCentavos)}
        </p>
      </div>

      <div
        className={`rounded-2xl border px-3 py-3 sm:px-4 ${
          stats.aguardando > 0
            ? "bg-amber-50 border-amber-200"
            : "bg-white/70 border-[color:var(--pink-deep)]/10"
        }`}
      >
        <div
          className={`flex items-center gap-1.5 ${
            stats.aguardando > 0 ? "text-amber-700" : "text-[color:var(--pink-deep)]/70"
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] sm:text-xs">em aberto</span>
        </div>
        <p
          className={`font-pixel text-xl sm:text-2xl mt-0.5 ${
            stats.aguardando > 0 ? "text-amber-700" : "text-[color:var(--pink-deep)]"
          }`}
        >
          {stats.aguardando}
        </p>
      </div>
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
        aria-expanded={aberto}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[color:var(--pink-soft)]/15 transition"
      >
        <div className="min-w-0">
          <div className="font-menu text-lg text-[color:var(--pink-deep)]">
            pedido #{pedido.id}
          </div>
          <div className="text-xs text-foreground/50">
            {new Date(pedido.criadoEm).toLocaleDateString("pt-BR")}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${STATUS_CLASS[pedido.status]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[pedido.status]}`} />
            {STATUS_LABEL[pedido.status]}
          </span>
          <span className="font-semibold">{formatPreco(pedido.totalCentavos)}</span>
          <ChevronDown
            className={`w-4 h-4 text-[color:var(--pink-deep)]/60 transition-transform ${aberto ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <div className="sm:hidden mx-5 mb-3 -mt-2 flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium w-fit ${STATUS_CLASS[pedido.status]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[pedido.status]}`} />
          {STATUS_LABEL[pedido.status]}
        </span>
        {pedido.status === "pendente" && (
          <Link
            to="/pedido/$pedidoId"
            params={{ pedidoId: String(pedido.id) }}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--pink-deep)] hover:underline"
          >
            finalizar pagamento
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {pedido.status === "pendente" && (
        <div className="hidden sm:block px-5 pb-3 -mt-1">
          <Link
            to="/pedido/$pedidoId"
            params={{ pedidoId: String(pedido.id) }}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--pink-deep)] hover:underline"
          >
            finalizar pagamento
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {aberto && (
        <div className="px-5 pb-5 pt-1 border-t border-[color:var(--pink-deep)]/10 space-y-2 text-sm">
          {itens === null && (
            <div className="space-y-2 py-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
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
            <div className="flex justify-between font-semibold text-foreground pt-1">
              <span>Total</span>
              <span>{formatPreco(pedido.totalCentavos)}</span>
            </div>
          </div>
          <Link
            to="/pedido/$pedidoId"
            params={{ pedidoId: String(pedido.id) }}
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[color:var(--pink-deep)] hover:underline"
          >
            ver status do pedido
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
