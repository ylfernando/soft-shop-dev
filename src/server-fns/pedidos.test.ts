import { describe, expect, it, vi, beforeEach } from "vitest";

// createServerFn's real implementation dispatches over HTTP/SSR machinery that
// isn't wired up under Vitest. We only care about testing the handler's own
// business logic here, so replace it with a minimal builder that runs the
// validator then the handler in-process, exactly like the real server side does.
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (d: unknown) => d;
    const builder = {
      validator(fn: (d: unknown) => unknown) {
        validate = fn;
        return builder;
      },
      handler(fn: (ctx: { data: unknown }) => unknown) {
        return (ctx: { data: unknown }) => fn({ data: validate(ctx.data) });
      },
    };
    return builder;
  },
}));

const mockConn = {
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
  query: vi.fn(),
};
const mockPool = {
  getConnection: vi.fn().mockResolvedValue(mockConn),
  query: vi.fn(),
};
vi.mock("@/server/db", () => ({ getPool: () => mockPool }));

const requireUser = vi.fn();
vi.mock("./session", () => ({ requireUser: (...a: unknown[]) => requireUser(...a) }));

const buscarCupomAtivo = vi.fn();
vi.mock("@/server/cupons", () => ({
  buscarCupomAtivo: (...a: unknown[]) => buscarCupomAtivo(...a),
}));

const cotarFrete = vi.fn();
vi.mock("@/server/superfrete", () => ({ cotarFrete: (...a: unknown[]) => cotarFrete(...a) }));

const criarPreferenciaMercadoPago = vi.fn();
const buscarPagamentoMercadoPago = vi.fn();
vi.mock("@/server/mercadopago", () => ({
  criarPreferenciaMercadoPago: (...a: unknown[]) => criarPreferenciaMercadoPago(...a),
  buscarPagamentoMercadoPago: (...a: unknown[]) => buscarPagamentoMercadoPago(...a),
}));

const criarSessaoStripe = vi.fn();
vi.mock("@/server/stripe", () => ({
  criarSessaoStripe: (...a: unknown[]) => criarSessaoStripe(...a),
}));

const cancelarPedidoELiberarPecas = vi.fn();
const confirmarPagamentoPedido = vi.fn();
vi.mock("@/server/pedidos-pagamento", () => ({
  cancelarPedidoELiberarPecas: (...a: unknown[]) => cancelarPedidoELiberarPecas(...a),
  confirmarPagamentoPedido: (...a: unknown[]) => confirmarPagamentoPedido(...a),
}));

const USER = {
  id: 1,
  nome: "Cliente Teste",
  email: "cliente@example.com",
  role: "cliente" as const,
  cep: "01001000",
  cpf: "12345678901",
  emailVerificado: true,
};

function insertPedidoArgs() {
  const call = mockConn.query.mock.calls.find((c) => String(c[0]).includes("INSERT INTO pedidos"));
  if (!call) throw new Error("INSERT INTO pedidos was not called");
  return call[1] as unknown[];
}

beforeEach(() => {
  vi.resetModules();
  mockConn.beginTransaction.mockReset();
  mockConn.commit.mockReset();
  mockConn.rollback.mockReset();
  mockConn.release.mockReset();
  mockConn.query.mockReset();
  mockPool.query.mockReset().mockResolvedValue([{}]);
  requireUser.mockReset().mockResolvedValue(USER);
  buscarCupomAtivo.mockReset();
  cotarFrete.mockReset();
  criarPreferenciaMercadoPago
    .mockReset()
    .mockResolvedValue({ id: "mp-pref-1", initPoint: "https://mp.example/checkout/1" });
  criarSessaoStripe
    .mockReset()
    .mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.example/1" });
  cancelarPedidoELiberarPecas.mockReset();
  confirmarPagamentoPedido.mockReset();
  buscarPagamentoMercadoPago.mockReset();
  // Default: paid-shipping tests that don't care about the shipping value
  // itself just need a valid quote so they don't fail on an unrelated path.
  cotarFrete.mockResolvedValue([
    { id: 1, nome: "PAC", precoCentavos: 1500, prazoDias: 5, transportadora: "Correios" },
  ]);
});

async function loadServerFns() {
  const mod = await import("./pedidos");
  return mod;
}

describe("iniciarPagamentoMercadoPago / iniciarPagamentoStripe — reserva e pricing", () => {
  it("requires an authenticated user before touching the database", async () => {
    requireUser.mockRejectedValue(new Error("não autorizado: faça login."));
    const { iniciarPagamentoMercadoPago } = await loadServerFns();

    await expect(
      iniciarPagamentoMercadoPago({
        data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "01310100" },
      }),
    ).rejects.toThrow(/não autorizado/);
    expect(mockPool.getConnection).not.toHaveBeenCalled();
  });

  it("rejects an empty cart", async () => {
    const { iniciarPagamentoMercadoPago } = await loadServerFns();
    const res = await iniciarPagamentoMercadoPago({ data: { itens: [], cepDestino: "01310100" } });
    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/vazia/i) });
  });

  it("rejects a malformed CEP without ever opening a transaction", async () => {
    const { iniciarPagamentoMercadoPago } = await loadServerFns();
    const res = await iniciarPagamentoMercadoPago({
      data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "123" },
    });
    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/CEP/i) });
    expect(mockPool.getConnection).not.toHaveBeenCalled();
  });

  it("blocks checkout when the account's e-mail isn't verified yet", async () => {
    requireUser.mockResolvedValue({ ...USER, emailVerificado: false });
    const { iniciarPagamentoMercadoPago } = await loadServerFns();
    const res = await iniciarPagamentoMercadoPago({
      data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "01310100" },
    });
    expect(res).toEqual({
      ok: false,
      erro: expect.stringMatching(/e-mail/i),
      emailNaoVerificado: true,
    });
    expect(mockPool.getConnection).not.toHaveBeenCalled();
  });

  it("blocks checkout when the account has no CPF on file", async () => {
    requireUser.mockResolvedValue({ ...USER, cpf: "" });
    const { iniciarPagamentoMercadoPago } = await loadServerFns();
    const res = await iniciarPagamentoMercadoPago({
      data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "01310100" },
    });
    expect(res).toEqual({
      ok: false,
      erro: expect.stringMatching(/CPF/i),
      cpfNaoPreenchido: true,
    });
    expect(mockPool.getConnection).not.toHaveBeenCalled();
  });

  it("ignores a client-supplied price and re-prices every item from the database", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) {
        return [[{ id: "p1", nome: "Camiseta", precoCentavos: 5000, vendidoEm: null }]];
      }
      if (sql.includes("INSERT INTO pedidos")) return [{ insertId: 42 }];
      return [{}];
    });

    const { iniciarPagamentoMercadoPago } = await loadServerFns();
    const res = await iniciarPagamentoMercadoPago({
      data: {
        // A real client can never send extra fields through the typed API, but
        // nothing stops a raw HTTP request from doing so — the handler must
        // ignore this and price strictly from what it reads back from the DB.
        itens: [
          { produtoId: "p1", quantidade: 1, precoCentavos: 1 } as unknown as {
            produtoId: string;
            quantidade: number;
          },
        ],
        cepDestino: "01310100",
      },
    });

    expect(res).toEqual({ ok: true, redirectUrl: "https://mp.example/checkout/1" });
    const [, , , subtotalCentavos] = insertPedidoArgs();
    expect(subtotalCentavos).toBe(5000);
    // subtotal (5000, relido do banco) + frete pago (1500, mockado) já que
    // não bate o piso de frete grátis.
    expect(criarPreferenciaMercadoPago).toHaveBeenCalledWith(
      expect.objectContaining({ totalCentavos: 6500 }),
    );
  });

  it("drops line items whose product no longer exists instead of trusting the cart", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) return [[]];
      return [{}];
    });
    const { iniciarPagamentoMercadoPago } = await loadServerFns();

    const res = await iniciarPagamentoMercadoPago({
      data: { itens: [{ produtoId: "deleted", quantidade: 1 }], cepDestino: "01310100" },
    });

    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/não existem mais/i) });
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(criarPreferenciaMercadoPago).not.toHaveBeenCalled();
  });

  it("refuses to sell a piece that another order already bought (peça única)", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) {
        return [[{ id: "p1", nome: "Camiseta", precoCentavos: 5000, vendidoEm: new Date() }]];
      }
      return [{}];
    });
    const { iniciarPagamentoMercadoPago } = await loadServerFns();

    const res = await iniciarPagamentoMercadoPago({
      data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "01310100" },
    });

    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/Camiseta.*vendida/i) });
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(criarPreferenciaMercadoPago).not.toHaveBeenCalled();
  });

  it("marks the purchased pieces as sold in the same transaction as the order", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) {
        return [[{ id: "p1", nome: "Camiseta", precoCentavos: 5000, vendidoEm: null }]];
      }
      if (sql.includes("INSERT INTO pedidos")) return [{ insertId: 55 }];
      return [{}];
    });
    const { iniciarPagamentoStripe } = await loadServerFns();

    const res = await iniciarPagamentoStripe({
      data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "01310100" },
    });

    expect(res).toEqual({ ok: true, redirectUrl: "https://checkout.stripe.example/1" });
    const vendidoCallIndex = mockConn.query.mock.calls.findIndex((c) =>
      String(c[0]).includes("UPDATE produtos SET vendido_em"),
    );
    expect(vendidoCallIndex).toBeGreaterThanOrEqual(0);
    expect(mockConn.query.mock.calls[vendidoCallIndex][1]).toEqual([["p1"]]);

    // a marcação precisa acontecer antes do commit, senão uma segunda compra
    // concorrente pode ler a linha como ainda disponível.
    const vendidoCallOrder = mockConn.query.mock.invocationCallOrder[vendidoCallIndex];
    expect(mockConn.commit.mock.invocationCallOrder[0]).toBeGreaterThan(vendidoCallOrder);
  });

  it("computes the discount from the server-verified coupon percentage, not a client value", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) {
        return [[{ id: "p1", nome: "Camiseta", precoCentavos: 10000, vendidoEm: null }]];
      }
      if (sql.includes("INSERT INTO pedidos")) return [{ insertId: 7 }];
      return [{}];
    });
    buscarCupomAtivo.mockResolvedValue(20);
    const { iniciarPagamentoMercadoPago } = await loadServerFns();

    await iniciarPagamentoMercadoPago({
      data: {
        itens: [{ produtoId: "p1", quantidade: 1 }],
        cepDestino: "01310100",
        cupomCodigo: "promo20",
      },
    });

    expect(buscarCupomAtivo).toHaveBeenCalledWith("promo20");
    const [, , , , , descontoCentavos] = insertPedidoArgs();
    expect(descontoCentavos).toBe(2000); // 20% of 10000, never a client-supplied amount
  });

  it("rejects checkout when the submitted coupon code doesn't validate server-side", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) {
        return [[{ id: "p1", nome: "Camiseta", precoCentavos: 10000, vendidoEm: null }]];
      }
      return [{}];
    });
    buscarCupomAtivo.mockResolvedValue(null);
    const { iniciarPagamentoMercadoPago } = await loadServerFns();

    const res = await iniciarPagamentoMercadoPago({
      data: {
        itens: [{ produtoId: "p1", quantidade: 1 }],
        cepDestino: "01310100",
        cupomCodigo: "NAOEXISTE",
      },
    });

    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/cupom inválido/i) });
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("skips the paid shipping API entirely once the free-shipping threshold is met", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) {
        return [[{ id: "p1", nome: "Vestido", precoCentavos: 20000, vendidoEm: null }]];
      }
      if (sql.includes("INSERT INTO pedidos")) return [{ insertId: 3 }];
      return [{}];
    });
    const { iniciarPagamentoMercadoPago } = await loadServerFns();

    await iniciarPagamentoMercadoPago({
      data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "01310100" },
    });

    expect(cotarFrete).not.toHaveBeenCalled();
    const args = insertPedidoArgs();
    const freteCentavos = args[6];
    expect(freteCentavos).toBe(0);
  });

  it("rolls back and reports an error instead of charging when shipping can't be quoted", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) {
        return [[{ id: "p1", nome: "Camiseta", precoCentavos: 1000, vendidoEm: null }]];
      }
      return [{}];
    });
    cotarFrete.mockRejectedValue(new Error("não encontramos opções de frete pra esse CEP."));
    const { iniciarPagamentoMercadoPago } = await loadServerFns();

    const res = await iniciarPagamentoMercadoPago({
      data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "01310100" },
    });

    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/frete/i) });
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(criarPreferenciaMercadoPago).not.toHaveBeenCalled();
  });

  it("releases the reservation when the gateway fails to create the checkout session", async () => {
    mockConn.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, nome, preco_centavos")) {
        return [[{ id: "p1", nome: "Camiseta", precoCentavos: 5000, vendidoEm: null }]];
      }
      if (sql.includes("INSERT INTO pedidos")) return [{ insertId: 99 }];
      return [{}];
    });
    criarSessaoStripe.mockRejectedValue(new Error("Stripe está fora do ar."));
    const { iniciarPagamentoStripe } = await loadServerFns();

    const res = await iniciarPagamentoStripe({
      data: { itens: [{ produtoId: "p1", quantidade: 1 }], cepDestino: "01310100" },
    });

    expect(res).toEqual({ ok: false, erro: "Stripe está fora do ar." });
    expect(cancelarPedidoELiberarPecas).toHaveBeenCalledWith(99);
  });
});

describe("getPedidoStatus", () => {
  it("refuses to reveal a pedido that doesn't belong to the caller", async () => {
    mockPool.query.mockResolvedValue([[{ status: "pago", usuarioId: 999 }]]);
    const { getPedidoStatus } = await loadServerFns();

    const res = await getPedidoStatus({ data: { pedidoId: 1 } });

    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/não encontrado/i) });
  });

  it("returns the status for the owner's own pedido", async () => {
    mockPool.query.mockResolvedValue([[{ status: "pago", usuarioId: USER.id }]]);
    const { getPedidoStatus } = await loadServerFns();

    const res = await getPedidoStatus({ data: { pedidoId: 1 } });

    expect(res).toEqual({ ok: true, status: "pago" });
  });
});

describe("reconciliarPagamentoMercadoPago", () => {
  it("refuses to touch a pedido that doesn't belong to the caller", async () => {
    mockPool.query.mockResolvedValue([[{ status: "pendente", usuarioId: 999 }]]);
    const { reconciliarPagamentoMercadoPago } = await loadServerFns();

    const res = await reconciliarPagamentoMercadoPago({ data: { pedidoId: 1, paymentId: "pay1" } });

    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/não encontrado/i) });
    expect(buscarPagamentoMercadoPago).not.toHaveBeenCalled();
  });

  it("skips the gateway lookup when the pedido was already resolved (idempotent, cheap on retries)", async () => {
    mockPool.query.mockResolvedValue([[{ status: "pago", usuarioId: USER.id }]]);
    const { reconciliarPagamentoMercadoPago } = await loadServerFns();

    const res = await reconciliarPagamentoMercadoPago({ data: { pedidoId: 1, paymentId: "pay1" } });

    expect(res).toEqual({ ok: true, status: "pago" });
    expect(buscarPagamentoMercadoPago).not.toHaveBeenCalled();
  });

  it("confirms the pedido when the gateway confirms an approved payment for it", async () => {
    mockPool.query.mockResolvedValue([[{ status: "pendente", usuarioId: USER.id }]]);
    buscarPagamentoMercadoPago.mockResolvedValue({
      id: "pay1",
      status: "approved",
      externalReference: "1",
    });
    const { reconciliarPagamentoMercadoPago } = await loadServerFns();

    const res = await reconciliarPagamentoMercadoPago({ data: { pedidoId: 1, paymentId: "pay1" } });

    expect(res).toEqual({ ok: true, status: "pago" });
    expect(confirmarPagamentoPedido).toHaveBeenCalledWith(1);
  });

  it("cancels the pedido and releases the piece when the gateway reports the payment as rejected", async () => {
    mockPool.query.mockResolvedValue([[{ status: "pendente", usuarioId: USER.id }]]);
    buscarPagamentoMercadoPago.mockResolvedValue({
      id: "pay1",
      status: "rejected",
      externalReference: "1",
    });
    const { reconciliarPagamentoMercadoPago } = await loadServerFns();

    const res = await reconciliarPagamentoMercadoPago({ data: { pedidoId: 1, paymentId: "pay1" } });

    expect(res).toEqual({ ok: true, status: "cancelado" });
    expect(cancelarPedidoELiberarPecas).toHaveBeenCalledWith(1);
  });

  it("never confirms a pedido from a payment that belongs to a different order", async () => {
    mockPool.query.mockResolvedValue([[{ status: "pendente", usuarioId: USER.id }]]);
    buscarPagamentoMercadoPago.mockResolvedValue({
      id: "pay1",
      status: "approved",
      externalReference: "999", // some other pedido
    });
    const { reconciliarPagamentoMercadoPago } = await loadServerFns();

    const res = await reconciliarPagamentoMercadoPago({ data: { pedidoId: 1, paymentId: "pay1" } });

    expect(res).toEqual({ ok: true, status: "pendente" });
    expect(confirmarPagamentoPedido).not.toHaveBeenCalled();
  });

  it("stays pendente instead of throwing when the gateway lookup itself fails", async () => {
    mockPool.query.mockResolvedValue([[{ status: "pendente", usuarioId: USER.id }]]);
    buscarPagamentoMercadoPago.mockRejectedValue(new Error("Mercado Pago está fora do ar"));
    const { reconciliarPagamentoMercadoPago } = await loadServerFns();

    const res = await reconciliarPagamentoMercadoPago({ data: { pedidoId: 1, paymentId: "pay1" } });

    expect(res).toEqual({ ok: true, status: "pendente" });
    expect(confirmarPagamentoPedido).not.toHaveBeenCalled();
  });
});
