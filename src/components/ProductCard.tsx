import { useState } from "react";
import { formatPreco, type Produto } from "@/data/produtos";
import { useCart } from "@/lib/cart";
import { ProductGalleryModal } from "@/components/ProductGalleryModal";

export function ProductCard({
  produto,
  titleColorClass = "text-[color:var(--pink-deep)]",
  buttonColorClass = "bg-[color:var(--pink-deep)]",
}: {
  produto: Produto;
  titleColorClass?: string;
  buttonColorClass?: string;
}) {
  const { lines, addItem, openCart } = useCart();
  const [galeriaAberta, setGaleriaAberta] = useState(false);

  const jaNaSacolinha = lines.some((l) => l.produtoId === produto.id);

  function handleAdd() {
    addItem(produto);
    openCart();
  }

  return (
    <div className="h-full flex flex-col bg-[#fffefe]/80 backdrop-blur rounded-2xl overflow-hidden shadow-md border border-[color:var(--pink-deep)]/10 hover:-translate-y-1 transition">
      <button
        type="button"
        onClick={() => setGaleriaAberta(true)}
        aria-label={`ver fotos de ${produto.nome}`}
        className="aspect-[4/4.5] sm:aspect-[4/5] overflow-hidden bg-[color:var(--pink-soft)] block w-full"
      >
        <img
          src={produto.img}
          alt={produto.nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>

      <ProductGalleryModal produto={produto} open={galeriaAberta} onOpenChange={setGaleriaAberta} />
      <div className="flex-1 flex flex-col p-3 text-center">
        <p
          className={`font-menu text-base ${titleColorClass} leading-tight line-clamp-2 min-h-[2lh]`}
        >
          {produto.nome}
        </p>
        <div className="my-1.5 border-t border-dashed border-[color:var(--pink-deep)]/30" />
        <p className="text-xs font-semibold">{formatPreco(produto.precoCentavos)} | P/M</p>
        <button
          onClick={handleAdd}
          className={`mt-2 w-full py-1.5 rounded-full ${buttonColorClass} text-white font-pixel text-base hover:opacity-90 disabled:opacity-60`}
          disabled={jaNaSacolinha}
        >
          {jaNaSacolinha ? "Já está na sacolinha ✿" : "comprar"}
        </button>
      </div>
    </div>
  );
}
