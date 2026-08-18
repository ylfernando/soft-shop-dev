import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { FRETE_GRATIS_A_PARTIR_DE_CENTAVOS } from "@/lib/frete";
import { cotarFrete } from "@/server/superfrete";
import { buscarCupomAtivo } from "@/server/cupons";
import { criarPreferenciaMercadoPago, buscarPagamentoMercadoPago } from "@/server/mercadopago";
import { criarSessaoStripe } from "@/server/stripe";
import { confirmarPagamentoPedido, cancelarPedidoELiberarPecas } from "@/server/pedidos-pagamento";
import { requireUser } from "./session";
import type { AuthUser } from "./auth";
import { PEDIDO_SELECT, type PedidoRow, type PedidoItemRow } from "./admin/pedidos";

export type { PedidoRow, PedidoItemRow };

type IniciarPagamentoResult =
  { ok: true; redirectUrl: string } | { ok: false; erro: string; emailNaoVerificado?: boolean };

interface ItemInput {
  produtoId: string;
  quantidade: number;
}

interface CheckoutInput {
  itens: ItemInput[];
  cepDestino: string;
  cupomCodigo?: string;
}

interface ProdutoRow extends RowDataPacket {
  id: string;
  nome: string;
  precoCentavos: number;
  vendidoEm: Date | null;
}

type ReservaResult =
  | { ok: true; pedidoId: number; totalCentavos: number; descricao: string }
  | { ok: false; erro: string };

/** Passo 1 do checkout: relê preço/cupom/frete/disponibilidade do banco
 * (nunca confia no que o cliente mandou), reserva as peças (peça única — o
 * pedido guarda a peça pra si assim que existe, ninguém mais consegue
 * comprá-la enquanto ele não for cancelado) e cria o pedido como 'pendente'.
 * Não cobra nada ainda: quem faz isso é o gateway escolhido no passo 2. Se o
 * passo 2 não conseguir criar a cobrança, a reserva é desfeita depois. */
async function reservarPedido(user: AuthUser, data: CheckoutInput): Promise<ReservaResult> {
  if (data.itens.length === 0) {
    return { ok: false, erro: "sua sacolinha está vazia." };
  }
  const cepDestino = data.cepDestino.replace(/\D/g, "");
  if (cepDestino.length !== 8) {
    return { ok: false, erro: "CEP de entrega inválido." };
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const ids = data.itens.map((item) => item.produtoId);
    const [produtos] = await conn.query<ProdutoRow[]>(
      "SELECT id, nome, preco_centavos AS precoCentavos, vendido_em AS vendidoEm FROM produtos WHERE id IN (?) FOR UPDATE",
      [ids],
    );
    const produtoPorId = new Map(produtos.map((p) => [p.id, p]));

    const encontrados = data.itens.flatMap((item) => {
      const produto = produtoPorId.get(item.produtoId);
      if (!produto) return [];
      const quantidade = Math.max(1, Math.floor(item.quantidade) || 1);
      return [{ produto, quantidade }];
    });
    if (encontrados.length === 0) {
      await conn.rollback();
      return { ok: false, erro: "os produtos da sua sacolinha não existem mais." };
    }

    // Peça única: se alguém fechou pedido primeiro, ela sai do catálogo pra
    // sempre — a compra inteira é recusada em vez de seguir sem a peça, pra
    // não cobrar a cliente por um carrinho que ela não revisou.
    const nomesVendidos = encontrados.flatMap((i) => (i.produto.vendidoEm ? [i.produto.nome] : []));
    if (nomesVendidos.length > 0) {
      await conn.rollback();
      const lista = nomesVendidos.join(", ");
      return {
        ok: false,
        erro: `${lista} ${nomesVendidos.length === 1 ? "acabou" : "acabaram"} de ser vendida${nomesVendidos.length === 1 ? "" : "s"} pra outra pessoa — tira da sua sacolinha e dá uma olhada no que sobrou ✿`,
      };
    }
    const itens = encontrados;

    const subtotalCentavos = itens.reduce(
      (sum, i) => sum + i.produto.precoCentavos * i.quantidade,
      0,
    );
    const quantidadeTotal = itens.reduce((sum, i) => sum + i.quantidade, 0);

    let cupomCodigo: string | null = null;
    let descontoCentavos = 0;
    if (data.cupomCodigo) {
      const percentualDesconto = await buscarCupomAtivo(data.cupomCodigo);
      if (percentualDesconto === null) {
        await conn.rollback();
        return { ok: false, erro: "cupom inválido ou expirado." };
      }
      cupomCodigo = data.cupomCodigo.trim().toUpperCase();
      descontoCentavos = Math.round((subtotalCentavos * percentualDesconto) / 100);
    }

    let freteCentavos = 0;
    if (subtotalCentavos < FRETE_GRATIS_A_PARTIR_DE_CENTAVOS) {
      try {
        const opcoes = await cotarFrete(cepDestino, quantidadeTotal);
        freteCentavos = opcoes[0].precoCentavos;
      } catch (e) {
        await conn.rollback();
        return {
          ok: false,
          erro: e instanceof Error ? e.message : "não deu pra calcular o frete pra esse CEP.",
        };
      }
    }
    const totalCentavos = subtotalCentavos - descontoCentavos + freteCentavos;

    const [pedidoResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO pedidos
        (usuario_id, nome_cliente_snapshot, email_cliente_snapshot, subtotal_centavos, cupom_codigo, desconto_centavos, frete_centavos, cep_destino, total_centavos, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [
        user.id,
        user.nome,
        user.email,
        subtotalCentavos,
        cupomCodigo,
        descontoCentavos,
        freteCentavos,
        cepDestino,
        totalCentavos,
      ],
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of itens) {
      await conn.query(
        `INSERT INTO pedido_itens (pedido_id, produto_id, nome_snapshot, preco_centavos_snapshot, quantidade)
         VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, item.produto.id, item.produto.nome, item.produto.precoCentavos, item.quantidade],
      );
    }

    await conn.query("UPDATE produtos SET vendido_em = NOW() WHERE id IN (?)", [
      itens.map((item) => item.produto.id),
    ]);

    await conn.commit();
    const descricao =
      itens.length === 1 ? itens[0].produto.nome : `${itens.length} peças da Soft Shop`;
    return { ok: true, pedidoId, totalCentavos, descricao };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function registrarGatewayEscolhido(
  pedidoId: number,
  gateway: "mercadopago" | "stripe",
  referenciaExterna: string,
) {
  const pool = getPool();
  await pool.query(
    "UPDATE pedidos SET pagamento_gateway = ?, pagamento_referencia_externa = ? WHERE id = ?",
    [gateway, referenciaExterna, pedidoId],
  );
}

function urlRetornoPedido(pedidoId: number): string {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:8080";
  return `${siteUrl.replace(/\/$/, "")}/pedido/${pedidoId}`;
}

export const iniciarPagamentoMercadoPago = createServerFn({ method: "POST" })
  .validator((data: CheckoutInput) => data)
  .handler(async ({ data }): Promise<IniciarPagamentoResult> => {
    const user = await requireUser();
    if (!user.emailVerificado) {
      return {
        ok: false,
        erro: "confirma seu e-mail antes de finalizar a compra.",
        emailNaoVerificado: true,
      };
    }
    const reserva = await reservarPedido(user, data);
    if (!reserva.ok) return reserva;

    try {
      const preferencia = await criarPreferenciaMercadoPago({
        pedidoId: reserva.pedidoId,
        totalCentavos: reserva.totalCentavos,
        descricao: reserva.descricao,
        compradorEmail: user.email,
        urlRetorno: urlRetornoPedido(reserva.pedidoId),
        urlWebhook: `${(process.env.SITE_URL ?? "http://localhost:8080").replace(/\/$/, "")}/webhooks/mercadopago`,
      });
      await registrarGatewayEscolhido(reserva.pedidoId, "mercadopago", preferencia.id);
      return { ok: true, redirectUrl: preferencia.initPoint };
    } catch (error) {
      await cancelarPedidoELiberarPecas(reserva.pedidoId);
      return {
        ok: false,
        erro: error instanceof Error ? error.message : "não deu pra iniciar o pagamento agora.",
      };
    }
  });

export const iniciarPagamentoStripe = createServerFn({ method: "POST" })
  .validator((data: CheckoutInput) => data)
  .handler(async ({ data }): Promise<IniciarPagamentoResult> => {
    const user = await requireUser();
    if (!user.emailVerificado) {
      return {
        ok: false,
        erro: "confirma seu e-mail antes de finalizar a compra.",
        emailNaoVerificado: true,
      };
    }
    const reserva = await reservarPedido(user, data);
    if (!reserva.ok) return reserva;

    try {
      const sessao = await criarSessaoStripe({
        pedidoId: reserva.pedidoId,
        totalCentavos: reserva.totalCentavos,
        descricao: reserva.descricao,
        compradorEmail: user.email,
        urlRetorno: urlRetornoPedido(reserva.pedidoId),
      });
      await registrarGatewayEscolhido(reserva.pedidoId, "stripe", sessao.id);
      return { ok: true, redirectUrl: sessao.url };
    } catch (error) {
      await cancelarPedidoELiberarPecas(reserva.pedidoId);
      return {
        ok: false,
        erro: error instanceof Error ? error.message : "não deu pra iniciar o pagamento agora.",
      };
    }
  });

interface PedidoStatusRow extends RowDataPacket {
  status: "pendente" | "pago" | "enviado" | "cancelado";
  usuarioId: number | null;
}

export type PedidoStatusResult =
  { ok: true; status: "pendente" | "pago" | "enviado" | "cancelado" } | { ok: false; erro: string };

/** Usada pela tela de retorno do checkout (`/pedido/$id`) pra saber se o
 * pagamento já foi confirmado — o webhook do gateway é quem manda de
 * verdade, essa função só lê o que ele já gravou. Só o dono do pedido pode
 * consultar. */
export const getPedidoStatus = createServerFn({ method: "GET" })
  .validator((data: { pedidoId: number }) => data)
  .handler(async ({ data }): Promise<PedidoStatusResult> => {
    const user = await requireUser();
    const pool = getPool();
    const [rows] = await pool.query<PedidoStatusRow[]>(
      "SELECT status, usuario_id AS usuarioId FROM pedidos WHERE id = ? LIMIT 1",
      [data.pedidoId],
    );
    const pedido = rows[0];
    if (!pedido || pedido.usuarioId !== user.id) {
      return { ok: false, erro: "pedido não encontrado." };
    }
    return { ok: true, status: pedido.status };
  });

/** Rede de segurança pro caso do webhook do Mercado Pago atrasar ou nunca
 * chegar (aconteceu em teste: pagamento aprovado, nenhuma notificação em
 * mais de 1 minuto). A URL de volta do Checkout Pro já traz `payment_id` na
 * query string — em vez de só esperar passivamente o webhook, a tela de
 * retorno usa esse id pra consultar o pagamento direto na API do Mercado
 * Pago, do mesmo jeito que o webhook faria. Nunca confia no `status` que
 * vem na query (é só um indício pro cliente); sempre rebusca na API deles.
 * Idempotente e seguro pra chamar mesmo se o webhook já tiver confirmado. */
export const reconciliarPagamentoMercadoPago = createServerFn({ method: "POST" })
  .validator((data: { pedidoId: number; paymentId: string }) => data)
  .handler(async ({ data }): Promise<PedidoStatusResult> => {
    const user = await requireUser();
    const pool = getPool();
    const [rows] = await pool.query<PedidoStatusRow[]>(
      "SELECT status, usuario_id AS usuarioId FROM pedidos WHERE id = ? LIMIT 1",
      [data.pedidoId],
    );
    const pedido = rows[0];
    if (!pedido || pedido.usuarioId !== user.id) {
      return { ok: false, erro: "pedido não encontrado." };
    }
    if (pedido.status !== "pendente") {
      return { ok: true, status: pedido.status };
    }

    try {
      const pagamento = await buscarPagamentoMercadoPago(data.paymentId);
      if (pagamento.externalReference !== String(data.pedidoId)) {
        return { ok: true, status: pedido.status };
      }
      if (pagamento.status === "approved") {
        await confirmarPagamentoPedido(data.pedidoId);
        return { ok: true, status: "pago" };
      }
      if (pagamento.status === "rejected" || pagamento.status === "cancelled") {
        await cancelarPedidoELiberarPecas(data.pedidoId);
        return { ok: true, status: "cancelado" };
      }
    } catch (error) {
      console.error("erro reconciliando retorno do Mercado Pago:", error);
    }
    return { ok: true, status: pedido.status };
  });

interface PedidoQueryRow extends RowDataPacket, PedidoRow {}
interface PedidoItemQueryRow extends RowDataPacket, PedidoItemRow {}

/** Usada pela tela "minhas compras" — lista só os pedidos da cliente logada. */
export const listMeusPedidos = createServerFn({ method: "GET" }).handler(
  async (): Promise<PedidoRow[]> => {
    const user = await requireUser();
    const pool = getPool();
    const [rows] = await pool.query<PedidoQueryRow[]>(
      `${PEDIDO_SELECT} WHERE usuario_id = ? ORDER BY criado_em DESC`,
      [user.id],
    );
    return rows;
  },
);

/** Itens de um pedido específico, só pro dono dele consultar. */
export const getMeuPedidoItens = createServerFn({ method: "GET" })
  .validator((data: { pedidoId: number }) => data)
  .handler(async ({ data }): Promise<PedidoItemRow[]> => {
    const user = await requireUser();
    const pool = getPool();
    const [pedidoRows] = await pool.query<RowDataPacket[]>(
      "SELECT usuario_id AS usuarioId FROM pedidos WHERE id = ? LIMIT 1",
      [data.pedidoId],
    );
    if (pedidoRows[0]?.usuarioId !== user.id) {
      throw new Error("pedido não encontrado.");
    }
    const [rows] = await pool.query<PedidoItemQueryRow[]>(
      `SELECT id,
              nome_snapshot AS nomeSnapshot,
              preco_centavos_snapshot AS precoCentavosSnapshot,
              quantidade
       FROM pedido_itens
       WHERE pedido_id = ?`,
      [data.pedidoId],
    );
    return rows;
  });
