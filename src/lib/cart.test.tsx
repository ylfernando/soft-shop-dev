import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { Produto } from "@/data/produtos";
import { CartProvider, useCart, FRETE_GRATIS_A_PARTIR_DE_CENTAVOS } from "@/lib/cart";

vi.mock("@tanstack/react-start", () => ({
  useServerFn:
    <T,>(fn: T) =>
    (...args: unknown[]) =>
      (fn as (...a: unknown[]) => unknown)(...args),
}));

const cotarFreteCarrinho = vi.fn();
vi.mock("@/server-fns/frete", () => ({
  cotarFreteCarrinho: (...args: unknown[]) => cotarFreteCarrinho(...args),
}));

const aplicarCupom = vi.fn();
vi.mock("@/server-fns/cupom", () => ({
  aplicarCupom: (...args: unknown[]) => aplicarCupom(...args),
}));

const getProdutosDisponiveis = vi.fn();
vi.mock("@/server-fns/produtos", () => ({
  getProdutosDisponiveis: (...args: unknown[]) => getProdutosDisponiveis(...args),
}));

function produto(overrides: Partial<Produto> = {}): Produto {
  return {
    id: "p1",
    img: "/p1.jpg",
    nome: "Camiseta",
    precoCentavos: 5000,
    tipo: "cima",
    categoria: "cima",
    tamanho: "M",
    medidas: "",
    ...overrides,
  };
}

function setup() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

beforeEach(() => {
  localStorage.clear();
  cotarFreteCarrinho.mockReset();
  aplicarCupom.mockReset();
  getProdutosDisponiveis.mockReset();
  // por padrão, tudo que a sacolinha pergunta continua disponível — os
  // testes que exercitam peça vendida sobrescrevem isso explicitamente.
  getProdutosDisponiveis.mockImplementation(
    async ({ data }: { data: { produtoIds: string[] } }) => data.produtoIds,
  );
});

describe("CartProvider", () => {
  it("adds an item once and ignores duplicate adds of the same product", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto()));
    act(() => result.current.addItem(produto()));

    expect(result.current.lines).toHaveLength(1);
    expect(result.current.count).toBe(1);
  });

  it("computes subtotal from product price times quantity", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto({ id: "p1", precoCentavos: 5000 })));
    act(() => result.current.addItem(produto({ id: "p2", precoCentavos: 3000 })));

    expect(result.current.subtotalCentavos).toBe(8000);
  });

  it("flags free shipping once subtotal reaches the threshold, and never below it", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() =>
      result.current.addItem(
        produto({ id: "p1", precoCentavos: FRETE_GRATIS_A_PARTIR_DE_CENTAVOS - 100 }),
      ),
    );
    expect(result.current.freteGratis).toBe(false);

    act(() => result.current.addItem(produto({ id: "p2", precoCentavos: 100 })));
    expect(result.current.freteGratis).toBe(true);
  });

  it("rejects calculating shipping for an invalid CEP without calling the server", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.setCep("123"));
    await act(async () => {
      await result.current.calcularFrete();
    });

    expect(result.current.erroFrete).toMatch(/CEP/i);
    expect(cotarFreteCarrinho).not.toHaveBeenCalled();
  });

  it("applies the shipping quote returned by the server", async () => {
    cotarFreteCarrinho.mockResolvedValue({
      ok: true,
      opcoes: [{ id: 1, nome: "PAC", precoCentavos: 1500, prazoDias: 5, transportadora: "Correios" }],
    });
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto({ precoCentavos: 1000 })));
    act(() => result.current.setCep("01310-100"));
    await act(async () => {
      await result.current.calcularFrete();
    });

    expect(result.current.freteCentavos).toBe(1500);
    expect(result.current.totalCentavos).toBe(2500);
  });

  it("surfaces a server-reported shipping error instead of silently zeroing it", async () => {
    cotarFreteCarrinho.mockResolvedValue({ ok: false, erro: "CEP não atendido." });
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto({ precoCentavos: 1000 })));
    act(() => result.current.setCep("01310100"));
    await act(async () => {
      await result.current.calcularFrete();
    });

    expect(result.current.erroFrete).toBe("CEP não atendido.");
    expect(result.current.freteEscolhido).toBeNull();
  });

  it("computes the discount from the server-returned percentage, not from client input", async () => {
    aplicarCupom.mockResolvedValue({ ok: true, percentualDesconto: 10 });
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto({ precoCentavos: 10000 })));
    act(() => result.current.setCupomInput("promo10"));
    await act(async () => {
      await result.current.aplicarCupomAgora();
    });

    expect(aplicarCupom).toHaveBeenCalledWith({ data: { codigo: "promo10" } });
    expect(result.current.cupomAplicado?.percentualDesconto).toBe(10);
    expect(result.current.descontoCentavos).toBe(1000);
  });

  it("rejects an invalid coupon and keeps the discount at zero", async () => {
    aplicarCupom.mockResolvedValue({ ok: false, erro: "cupom inválido ou expirado." });
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto({ precoCentavos: 10000 })));
    act(() => result.current.setCupomInput("INVALIDO"));
    await act(async () => {
      await result.current.aplicarCupomAgora();
    });

    expect(result.current.erroCupom).toBe("cupom inválido ou expirado.");
    expect(result.current.cupomAplicado).toBeNull();
    expect(result.current.descontoCentavos).toBe(0);
  });

  it("resets shipping quote when the cart contents change after a quote was fetched", async () => {
    cotarFreteCarrinho.mockResolvedValue({
      ok: true,
      opcoes: [{ id: 1, nome: "PAC", precoCentavos: 1500, prazoDias: 5, transportadora: "Correios" }],
    });
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto({ id: "p1", precoCentavos: 1000 })));
    act(() => result.current.setCep("01310100"));
    await act(async () => {
      await result.current.calcularFrete();
    });
    expect(result.current.freteEscolhido).not.toBeNull();

    act(() => result.current.addItem(produto({ id: "p2", precoCentavos: 1000 })));
    expect(result.current.freteEscolhido).toBeNull();
  });

  it("clear() empties the cart, CEP, shipping quote and coupon together", async () => {
    aplicarCupom.mockResolvedValue({ ok: true, percentualDesconto: 10 });
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto()));
    act(() => result.current.setCupomInput("promo10"));
    await act(async () => {
      await result.current.aplicarCupomAgora();
    });
    act(() => result.current.setCep("01310100"));

    act(() => result.current.clear());

    expect(result.current.lines).toHaveLength(0);
    expect(result.current.cep).toBe("");
    expect(result.current.cupomAplicado).toBeNull();
    expect(result.current.freteEscolhido).toBeNull();
  });

  it("removes an item that was sold elsewhere when the cart is opened", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.addItem(produto({ id: "p1" })));
    act(() => result.current.addItem(produto({ id: "p2", nome: "Saia" })));
    getProdutosDisponiveis.mockResolvedValue(["p1"]);

    await act(async () => {
      result.current.openCart();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.lines.map((l) => l.produtoId)).toEqual(["p1"]));
  });

  it("persists the cart to localStorage and rehydrates it in a new provider instance", async () => {
    const first = setup();
    await waitFor(() => expect(first.result.current.hydrated).toBe(true));
    act(() => first.result.current.addItem(produto({ id: "persisted" })));

    await waitFor(() => {
      const raw = localStorage.getItem("soft-shop-cart");
      expect(raw).toContain("persisted");
    });

    const second = setup();
    await waitFor(() => expect(second.result.current.hydrated).toBe(true));
    expect(second.result.current.lines.map((l) => l.produtoId)).toEqual(["persisted"]);
  });
});
