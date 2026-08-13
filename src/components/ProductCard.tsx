import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { formatPreco, type Produto } from "@/data/produtos";
import { useAuth } from "@/lib/auth";
import { useCart, PENDING_ADD_KEY } from "@/lib/cart";
import { ProductGalleryModal } from "@/components/ProductGalleryModal";

export function ProductCard({ produto }: { produto: Produto }) {
  const { user } = useAuth();
  const { lines, addItem, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [galeriaAberta, setGaleriaAberta] = useState(false);

  const jaNaSacolinha = lines.some((l) => l.produtoId === produto.id);

  function handleAdd() {
    if (!user) {
      localStorage.setItem(PENDING_ADD_KEY, produto.id);
      navigate({ to: "/criar-conta", search: { redirect: location.href } });
      return;
    }
    addItem(produto);
    openCart();
  }

  return (
    <div className="h-full flex flex-col bg-[#fffefe]/80 backdrop-blur rounded-2xl overflow-hidden shadow-md border border-[color:var(--pink-deep)]/10 hover:-translate-y-1 transition">
      <button
        type="button"
        onClick={() => setGaleriaAberta(true)}
        aria-label={`ver fotos de ${produto.nome}`}
        className="aspect-[4/5] overflow-hidden bg-[color:var(--pink-soft)] block w-full"
      >
        <img
          src={produto.img}
          alt={produto.nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>

      <ProductGalleryModal produto={produto} open={galeriaAberta} onOpenChange={setGaleriaAberta} />
      <div className="flex-1 flex flex-col p-4 text-center">
        <p className="font-menu text-lg text-[color:var(--pink-deep)] leading-tight line-clamp-2 min-h-[2lh]">
          {produto.nome}
        </p>
        <div className="my-2 border-t border-dashed border-[color:var(--pink-deep)]/30" />
        <p className="text-sm">
          Preço<span className="font-semibold ml-1">{formatPreco(produto.precoCentavos)}</span>
        </p>
        <button
          onClick={handleAdd}
          className="mt-3 w-full py-2 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-lg hover:opacity-90 disabled:opacity-60"
          disabled={jaNaSacolinha}
        >
          {jaNaSacolinha ? "Já está na sacolinha ✿" : "Adicionar ao carrinho"}
        </button>
      </div>
    </div>
  );
}
