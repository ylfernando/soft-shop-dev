import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Produto } from "@/data/produtos";

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

const STORAGE_KEY = "soft-shop-cart";

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

/** A sacolinha vive no navegador (não precisa de login pra usar) — só o
 * fechamento do pedido exige uma conta. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLines(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  /** Cada peça é única, então adicionar um produto já presente na sacolinha não faz nada. */
  function addItem(produto: Produto) {
    setLines((prev) =>
      prev.some((l) => l.produtoId === produto.id)
        ? prev
        : [...prev, { produtoId: produto.id, quantidade: 1, produto }],
    );
  }

  function removeItem(produtoId: string) {
    setLines((prev) => prev.filter((l) => l.produtoId !== produtoId));
  }

  function clear() {
    setLines([]);
  }

  const count = lines.reduce((sum, l) => sum + l.quantidade, 0);
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
