import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Produto } from "@/data/produtos";
import { cotarFreteCarrinho } from "@/server-fns/frete";
import type { OpcaoFrete } from "@/server/superfrete";
import { FRETE_GRATIS_A_PARTIR_DE_CENTAVOS } from "@/lib/frete";

export { FRETE_GRATIS_A_PARTIR_DE_CENTAVOS };

export interface CartLine {
  produtoId: string;
  quantidade: number;
  produto: Produto;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalCentavos: number;
  cep: string;
  setCep: (cep: string) => void;
  freteEscolhido: OpcaoFrete | null;
  freteGratis: boolean;
  calculandoFrete: boolean;
  erroFrete: string | null;
  calcularFrete: () => Promise<void>;
  freteCentavos: number;
  freteDeterminado: boolean;
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

  const [cep, setCepState] = useState("");
  const [freteEscolhido, setFreteEscolhido] = useState<OpcaoFrete | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState<string | null>(null);
  const cotarFreteCall = useServerFn(cotarFreteCarrinho);

  useEffect(() => {
    setLines(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  /** Muda a composição da sacolinha muda o peso do pacote — o frete já
   * calculado deixa de valer e precisa ser recalculado. */
  function limparFreteCalculado() {
    setFreteEscolhido(null);
    setErroFrete(null);
  }

  /** Cada peça é única, então adicionar um produto já presente na sacolinha não faz nada. */
  function addItem(produto: Produto) {
    setLines((prev) =>
      prev.some((l) => l.produtoId === produto.id)
        ? prev
        : [...prev, { produtoId: produto.id, quantidade: 1, produto }],
    );
    limparFreteCalculado();
  }

  function removeItem(produtoId: string) {
    setLines((prev) => prev.filter((l) => l.produtoId !== produtoId));
    limparFreteCalculado();
  }

  function clear() {
    setLines([]);
    limparFreteCalculado();
    setCepState("");
  }

  function setCep(next: string) {
    setCepState(next);
    limparFreteCalculado();
  }

  const count = lines.reduce((sum, l) => sum + l.quantidade, 0);
  const subtotalCentavos = lines.reduce(
    (sum, l) => sum + l.produto.precoCentavos * l.quantidade,
    0,
  );
  const freteGratis = subtotalCentavos > 0 && subtotalCentavos >= FRETE_GRATIS_A_PARTIR_DE_CENTAVOS;

  async function calcularFrete() {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      setErroFrete("digita um CEP válido (8 dígitos).");
      return;
    }
    if (freteGratis) return;
    setCalculandoFrete(true);
    setErroFrete(null);
    try {
      const res = await cotarFreteCall({ data: { cep: cepLimpo, quantidadeItens: count } });
      if (!res.ok) {
        setErroFrete(res.erro);
        setFreteEscolhido(null);
        return;
      }
      setFreteEscolhido(res.opcoes[0]);
    } catch {
      setErroFrete("não deu pra calcular o frete, tenta de novo.");
      setFreteEscolhido(null);
    } finally {
      setCalculandoFrete(false);
    }
  }

  const freteDeterminado = freteGratis || !!freteEscolhido;
  const freteCentavos = freteGratis ? 0 : (freteEscolhido?.precoCentavos ?? 0);
  const totalCentavos = subtotalCentavos + freteCentavos;

  return (
    <CartContext.Provider
      value={{
        lines,
        count,
        subtotalCentavos,
        cep,
        setCep,
        freteEscolhido,
        freteGratis,
        calculandoFrete,
        erroFrete,
        calcularFrete,
        freteCentavos,
        freteDeterminado,
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
