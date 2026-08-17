import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { Produto } from "@/data/produtos";
import { cotarFreteCarrinho } from "@/server-fns/frete";
import { getProdutosDisponiveis } from "@/server-fns/produtos";
import type { OpcaoFrete } from "@/server/superfrete";
import { aplicarCupom } from "@/server-fns/cupom";
import { FRETE_GRATIS_A_PARTIR_DE_CENTAVOS } from "@/lib/frete";

export { FRETE_GRATIS_A_PARTIR_DE_CENTAVOS };

export interface CartLine {
  produtoId: string;
  quantidade: number;
  produto: Produto;
}

interface CupomAplicado {
  codigo: string;
  percentualDesconto: number;
}

interface CartContextValue {
  hydrated: boolean;
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
  cupomInput: string;
  setCupomInput: (codigo: string) => void;
  cupomAplicado: CupomAplicado | null;
  aplicandoCupom: boolean;
  erroCupom: string | null;
  aplicarCupomAgora: () => Promise<void>;
  removerCupom: () => void;
  descontoCentavos: number;
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

  const [cupomInput, setCupomInput] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<CupomAplicado | null>(null);
  const [aplicandoCupom, setAplicandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState<string | null>(null);
  const aplicarCupomCall = useServerFn(aplicarCupom);
  const getProdutosDisponiveisCall = useServerFn(getProdutosDisponiveis);
  const linesRef = useRef<CartLine[]>(lines);

  useEffect(() => {
    setLines(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  /** Peça única: se ela foi vendida (por outra pessoa, ou em outra aba)
   * enquanto estava parada numa sacolinha aberta, ela precisa sumir de lá
   * sozinha — sem isso o cliente só descobre na hora de pagar. Roda ao
   * carregar a página e de novo toda vez que a sacolinha é aberta. */
  async function removerItensVendidos() {
    const atuais = linesRef.current;
    if (atuais.length === 0) return;
    try {
      const disponiveis = await getProdutosDisponiveisCall({
        data: { produtoIds: atuais.map((l) => l.produtoId) },
      });
      const disponiveisSet = new Set(disponiveis);
      const vendidos = atuais.filter((l) => !disponiveisSet.has(l.produtoId));
      if (vendidos.length === 0) return;

      setLines((prev) => prev.filter((l) => disponiveisSet.has(l.produtoId)));
      limparFreteCalculado();
      const nomes = vendidos.map((l) => l.produto.nome).join(", ");
      toast.error(
        `${nomes} ${vendidos.length === 1 ? "foi vendida" : "foram vendidas"} pra outra pessoa e ${
          vendidos.length === 1 ? "saiu" : "saíram"
        } da sua sacolinha ✿`,
      );
    } catch {
      // checagem de melhor esforço — se falhar, tenta de novo na próxima
      // vez que a sacolinha for aberta.
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    removerItensVendidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  /** Muda a composição da sacolinha muda o peso do pacote — o frete já
   * calculado deixa de valer e precisa ser recalculado. */
  function limparFreteCalculado() {
    setFreteEscolhido(null);
    setErroFrete(null);
  }

  function removerCupom() {
    setCupomAplicado(null);
    setErroCupom(null);
    setCupomInput("");
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
    removerCupom();
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

  /** Calcula o frete sozinho assim que o CEP completa 8 dígitos — o debounce
   * evita disparar no meio da digitação (ex: colar o CEP). */
  useEffect(() => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8 || freteGratis || freteEscolhido || calculandoFrete) return;

    const timer = setTimeout(() => {
      calcularFrete();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, count, freteGratis]);

  async function aplicarCupomAgora() {
    const codigo = cupomInput.trim();
    if (!codigo) return;
    setAplicandoCupom(true);
    setErroCupom(null);
    try {
      const res = await aplicarCupomCall({ data: { codigo } });
      if (!res.ok) {
        setErroCupom(res.erro);
        setCupomAplicado(null);
        return;
      }
      setCupomAplicado({ codigo: codigo.toUpperCase(), percentualDesconto: res.percentualDesconto });
    } catch {
      setErroCupom("não deu pra aplicar o cupom, tenta de novo.");
      setCupomAplicado(null);
    } finally {
      setAplicandoCupom(false);
    }
  }

  const freteDeterminado = freteGratis || !!freteEscolhido;
  const freteCentavos = freteGratis ? 0 : (freteEscolhido?.precoCentavos ?? 0);
  const descontoCentavos = cupomAplicado
    ? Math.round((subtotalCentavos * cupomAplicado.percentualDesconto) / 100)
    : 0;
  const totalCentavos = subtotalCentavos - descontoCentavos + freteCentavos;

  return (
    <CartContext.Provider
      value={{
        hydrated,
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
        cupomInput,
        setCupomInput,
        cupomAplicado,
        aplicandoCupom,
        erroCupom,
        aplicarCupomAgora,
        removerCupom,
        descontoCentavos,
        totalCentavos,
        addItem,
        removeItem,
        clear,
        isOpen,
        openCart: () => {
          setIsOpen(true);
          removerItensVendidos();
        },
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
