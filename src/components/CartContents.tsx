import { Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { formatPreco } from "@/data/produtos";
import { useCart, FRETE_GRATIS_A_PARTIR_DE_CENTAVOS } from "@/lib/cart";

export function CartContents() {
  const {
    lines,
    subtotalCentavos,
    freteCentavos,
    totalCentavos,
    setQuantidade,
    removeItem,
    clear,
    closeCart,
  } = useCart();
  const navigate = useNavigate();

  function finalizarCompra() {
    clear();
    closeCart();
    toast.success("Pedido simulado enviado! (essa loja ainda não tem checkout de verdade)");
    navigate({ to: "/" });
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
    <div className="space-y-4">
      <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
        {lines.map((line) => (
          <div
            key={line.produtoId}
            className="flex items-center gap-3 bg-white/80 rounded-2xl p-3 border border-[color:var(--pink-deep)]/10"
          >
            <div className="w-16 h-20 rounded-lg overflow-hidden bg-[color:var(--pink-soft)] shrink-0">
              <img
                src={line.produto.img}
                alt={line.produto.nome}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-menu text-base text-[color:var(--pink-deep)] truncate">
                {line.produto.nome}
              </p>
              <p className="text-sm text-foreground/70">
                {formatPreco(line.produto.precoCentavos)}
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                <button
                  aria-label="diminuir quantidade"
                  onClick={() => setQuantidade(line.produtoId, line.quantidade - 1)}
                  className="w-6 h-6 rounded-full border border-[color:var(--pink-deep)]/30 flex items-center justify-center hover:bg-[color:var(--pink-soft)]"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-pixel text-base">{line.quantidade}</span>
                <button
                  aria-label="aumentar quantidade"
                  onClick={() => setQuantidade(line.produtoId, line.quantidade + 1)}
                  className="w-6 h-6 rounded-full border border-[color:var(--pink-deep)]/30 flex items-center justify-center hover:bg-[color:var(--pink-soft)]"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="font-semibold text-sm">
                {formatPreco(line.produto.precoCentavos * line.quantidade)}
              </span>
              <button
                aria-label="remover item"
                onClick={() => removeItem(line.produtoId)}
                className="text-foreground/40 hover:text-[color:var(--pink-deep)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 pt-3 border-t border-[color:var(--pink-deep)]/20 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Subtotal</span>
          <span>{formatPreco(subtotalCentavos)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Frete</span>
          <span>{freteCentavos === 0 ? "grátis ✿" : formatPreco(freteCentavos)}</span>
        </div>
        {freteCentavos > 0 && (
          <p className="text-xs text-foreground/50">
            faltam {formatPreco(faltaParaFreteGratis)} pro frete grátis
          </p>
        )}
        <div className="flex items-center justify-between font-menu text-lg text-[color:var(--pink-deep)] pt-1">
          <span>Total</span>
          <span>{formatPreco(totalCentavos)}</span>
        </div>
      </div>

      <button
        onClick={finalizarCompra}
        className="w-full py-3 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-xl hover:opacity-90"
      >
        Finalizar compra
      </button>
    </div>
  );
}
