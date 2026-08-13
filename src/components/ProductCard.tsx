import { useLocation, useNavigate } from "@tanstack/react-router";
import { formatPreco, type Produto } from "@/data/produtos";
import { useAuth } from "@/lib/auth";
import { useCart, PENDING_ADD_KEY } from "@/lib/cart";

export function ProductCard({ produto }: { produto: Produto }) {
  const { user } = useAuth();
  const { addItem, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  function handleAdd() {
    if (!user) {
      localStorage.setItem(PENDING_ADD_KEY, produto.id);
      navigate({ to: "/criar-conta", search: { redirect: location.href } });
      return;
    }
    addItem(produto.id);
    openCart();
  }

  return (
    <div className="bg-[#fffefe]/80 backdrop-blur rounded-2xl overflow-hidden shadow-md border border-[color:var(--pink-deep)]/10 hover:-translate-y-1 transition">
      <div className="aspect-[4/5] overflow-hidden bg-[color:var(--pink-soft)]">
        <img
          src={produto.img}
          alt={produto.nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4 text-center">
        <p className="font-menu text-lg text-[color:var(--pink-deep)] leading-tight">
          {produto.nome}
        </p>
        <div className="my-2 border-t border-dashed border-[color:var(--pink-deep)]/30" />
        <p className="text-sm">
          Preço<span className="font-semibold ml-1">{formatPreco(produto.precoCentavos)}</span>
        </p>
        <button
          onClick={handleAdd}
          className="mt-3 w-full py-2 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-lg hover:opacity-90"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}
