import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { produtos as catalogo, type Produto } from "@/data/produtos";

export interface CartItem {
  produtoId: string;
  quantidade: number;
}

export interface CartLine extends CartItem {
  produto: Produto;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  addItem: (produtoId: string, quantidade?: number) => void;
  removeItem: (produtoId: string) => void;
  setQuantidade: (produtoId: string, quantidade: number) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const PENDING_ADD_KEY = "soft-shop-pending-add";

export const FRETE_GRATIS_A_PARTIR_DE_CENTAVOS = 15000;
export const FRETE_PADRAO_CENTAVOS = 1500;

function calcularFrete(subtotalCentavos: number) {
  if (subtotalCentavos === 0) return 0;
  return subtotalCentavos >= FRETE_GRATIS_A_PARTIR_DE_CENTAVOS ? 0 : FRETE_PADRAO_CENTAVOS;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartKey(email: string) {
  return `soft-shop-cart:${email}`;
}

function readCart(email: string): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(cartKey(email)) ?? "[]") as CartItem[];
  } catch {
    return [];
  }
}

function writeCart(email: string, items: CartItem[]) {
  localStorage.setItem(cartKey(email), JSON.stringify(items));
}

/** Adds a product straight to a user's stored cart, bypassing React state — used
 * right after sign-up/login, when the cart context for that user hasn't mounted yet. */
export function addPendingItemToStorage(email: string, produtoId: string) {
  const items = readCart(email);
  const existing = items.find((i) => i.produtoId === produtoId);
  const next = existing
    ? items.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i))
    : [...items, { produtoId, quantidade: 1 }];
  writeCart(email, next);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(user ? readCart(user.email) : []);
  }, [user]);

  function persist(next: CartItem[]) {
    setItems(next);
    if (user) writeCart(user.email, next);
  }

  function addItem(produtoId: string, quantidade = 1) {
    if (!user) return;
    const existing = items.find((i) => i.produtoId === produtoId);
    const next = existing
      ? items.map((i) =>
          i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + quantidade } : i,
        )
      : [...items, { produtoId, quantidade }];
    persist(next);
  }

  function removeItem(produtoId: string) {
    persist(items.filter((i) => i.produtoId !== produtoId));
  }

  function setQuantidade(produtoId: string, quantidade: number) {
    if (quantidade <= 0) {
      removeItem(produtoId);
      return;
    }
    persist(items.map((i) => (i.produtoId === produtoId ? { ...i, quantidade } : i)));
  }

  function clear() {
    persist([]);
  }

  const lines: CartLine[] = items.flatMap((item) => {
    const produto = catalogo.find((p) => p.id === item.produtoId);
    return produto ? [{ ...item, produto }] : [];
  });

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
        setQuantidade,
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
