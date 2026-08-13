import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import type { Produto } from "@/data/produtos";
import {
  getCart,
  addItem as addItemFn,
  removeItem as removeItemFn,
  clearCart as clearCartFn,
  type CartLineRow,
} from "@/server-fns/cart";

export {
  FRETE_GRATIS_A_PARTIR_DE_CENTAVOS,
  FRETE_PADRAO_CENTAVOS,
  calcularFrete,
} from "@/lib/frete";
import { calcularFrete } from "@/lib/frete";

export interface CartLine {
  produtoId: string;
  quantidade: number;
  produto: Produto;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  addItem: (produto: Produto) => void;
  removeItem: (produtoId: string) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const PENDING_ADD_KEY = "soft-shop-pending-add";

const CartContext = createContext<CartContextValue | null>(null);

/** Adds a product straight to a user's cart via the API, bypassing React state —
 * used right after sign-up/login, when the cart context for that user hasn't mounted yet. */
export async function addPendingItemForUser(usuarioId: number, produtoId: string) {
  await addItemFn({ data: { usuarioId, produtoId } });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLineRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const getCartCall = useServerFn(getCart);
  const addItemCall = useServerFn(addItemFn);
  const removeItemCall = useServerFn(removeItemFn);
  const clearCartCall = useServerFn(clearCartFn);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    getCartCall({ data: { usuarioId: user.id } })
      .then(setItems)
      .catch(() => toast.error("não deu pra carregar sua sacolinha ✿"));
  }, [user, getCartCall]);

  /** Cada peça é única, então adicionar um produto já presente na sacolinha não faz nada. */
  function addItem(produto: Produto) {
    if (!user) return;
    if (items.some((i) => i.produtoId === produto.id)) return;
    setItems([
      ...items,
      {
        produtoId: produto.id,
        quantidade: 1,
        nome: produto.nome,
        img: produto.img,
        precoCentavos: produto.precoCentavos,
        tipo: produto.tipo,
        categoria: produto.categoria,
        tamanho: produto.tamanho,
        medidas: produto.medidas,
      },
    ]);
    addItemCall({ data: { usuarioId: user.id, produtoId: produto.id, quantidade: 1 } }).catch(() =>
      toast.error("não deu pra salvar sua sacolinha ✿"),
    );
  }

  function removeItem(produtoId: string) {
    if (!user) return;
    setItems(items.filter((i) => i.produtoId !== produtoId));
    removeItemCall({ data: { usuarioId: user.id, produtoId } }).catch(() =>
      toast.error("não deu pra salvar sua sacolinha ✿"),
    );
  }

  function clear() {
    if (!user) return;
    setItems([]);
    clearCartCall({ data: { usuarioId: user.id } }).catch(() =>
      toast.error("não deu pra limpar sua sacolinha ✿"),
    );
  }

  const lines: CartLine[] = items.map((item) => ({
    produtoId: item.produtoId,
    quantidade: item.quantidade,
    produto: {
      id: item.produtoId,
      nome: item.nome,
      img: item.img,
      precoCentavos: item.precoCentavos,
      tipo: item.tipo,
      categoria: item.categoria,
      tamanho: item.tamanho,
      medidas: item.medidas,
    },
  }));

  const count = items.reduce((sum, i) => sum + i.quantidade, 0);
  const subtotalCentavos = lines.reduce(
    (sum, l) => sum + l.produto.precoCentavos * l.quantidade,
    0,
  );
  const freteCentavos = calcularFrete(subtotalCentavos);
  const totalCentavos = subtotalCentavos + freteCentavos;

  return (
    <CartContext.Provider
      value={{
        lines,
        count,
        subtotalCentavos,
        freteCentavos,
        totalCentavos,
        addItem,
        removeItem,
        clear,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
