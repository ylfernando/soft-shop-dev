import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { toast } from "sonner";
import { formatPreco } from "@/data/produtos";
import { useCart, FRETE_GRATIS_A_PARTIR_DE_CENTAVOS } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { criarPedido } from "@/server-fns/pedidos";

export function CartContents() {
  const { lines, subtotalCentavos, freteCentavos, totalCentavos, removeItem, clear, closeCart } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const criarPedidoCall = useServerFn(criarPedido);
  const [finalizando, setFinalizando] = useState(false);

  async function finalizarCompra() {
    if (!user || finalizando) return;
    setFinalizando(true);
    try {
      const res = await criarPedidoCall({ data: { usuarioId: user.id } });
      if (!res.ok) {
        toast.error(res.erro);
        return;
      }
      clear();
      closeCart();
      toast.success("Pedido realizado com sucesso! ✿");
      navigate({ to: "/" });
    } catch {
      toast.error("não deu pra fechar o pedido, tenta de novo ✿");
    } finally {
      setFinalizando(false);
    }
  }

  function continuarComprando() {
    closeCart();
    navigate({ to: "/produtos" });
  }

  if (lines.length === 0) {
    return (
      <div className="text-center py-10 text-foreground/60">
        <p className="font-menu text-xl text-[color:var(--pink-deep)]">sua sacolinha está vazia</p>
        <Link
          to="/produtos"
          onClick={closeCart}
          className="inline-block mt-4 underline text-[color:var(--pink-deep)]"
        >
          ir pros produtos
        </Link>
      </div>
    );
  }

  const faltaParaFreteGratis = FRETE_GRATIS_A_PARTIR_DE_CENTAVOS - subtotalCentavos;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {lines.map((line) => (
          <div
            key={line.produtoId}
            className="flex items-center gap-2.5 bg-white/80 rounded-xl p-2.5 border border-[color:var(--pink-deep)]/10"
          >
            <div className="w-14 h-[4.5rem] rounded-lg overflow-hidden bg-[color:var(--pink-soft)] shrink-0">
              <img
                src={line.produto.img}
                alt={line.produto.nome}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-menu text-sm text-[color:var(--pink-deep)] truncate">
                {line.produto.nome}
              </p>
              <p className="mt-0.5 text-[11px] text-foreground/50">peça única</p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className="font-semibold text-xs">
                {formatPreco(line.produto.precoCentavos)}
              </span>
              <button
                aria-label="remover item"
                onClick={() => removeItem(line.produtoId)}
                className="text-foreground/40 hover:text-[color:var(--pink-deep)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 space-y-1 pt-2.5 border-t border-[color:var(--pink-deep)]/20 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Subtotal</span>
          <span>{formatPreco(subtotalCentavos)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Frete</span>
          <span>{freteCentavos === 0 ? "grátis ✿" : formatPreco(freteCentavos)}</span>
        </div>
        {freteCentavos > 0 && (
          <p className="text-[11px] text-foreground/50">
            faltam {formatPreco(faltaParaFreteGratis)} pro frete grátis
          </p>
        )}
        <div className="flex items-center justify-between font-menu text-base text-[color:var(--pink-deep)] pt-1">
          <span>Total</span>
          <span>{formatPreco(totalCentavos)}</span>
        </div>
      </div>

      <div className="shrink-0 space-y-1.5">
        <button
          onClick={finalizarCompra}
          disabled={finalizando}
          className="w-full py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90 disabled:opacity-60"
        >
          {finalizando ? "finalizando..." : "Finalizar compra"}
        </button>
        <button
          onClick={continuarComprando}
          className="w-full py-2 rounded-full border border-[color:var(--pink-deep)] text-[color:var(--pink-deep)] font-pixel text-sm hover:bg-[color:var(--pink-deep)]/10"
        >
          Continuar comprando
        </button>
      </div>
    </div>
  );
}
