import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";
import { PEDIDO_SELECT, type PedidoRow } from "./pedidos";

export interface AdminStats {
  receitaTotalCentavos: number;
  totalPedidos: number;
  pedidosPendentes: number;
  totalClientes: number;
  totalProdutos: number;
  produtosVendidos: number;
}

interface StatsRow extends RowDataPacket {
  receitaTotalCentavos: number | null;
  totalPedidos: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export const adminGetStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminStats> => {
    await requireAdmin();
    const pool = getPool();

    const [statsRows] = await pool.query<StatsRow[]>(
      "SELECT COALESCE(SUM(total_centavos), 0) AS receitaTotalCentavos, COUNT(*) AS totalPedidos FROM pedidos WHERE status != 'cancelado'",
    );
    const [pendentesRows] = await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM pedidos WHERE status = 'pendente'",
    );
    const [clientesRows] = await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM usuarios WHERE role = 'cliente'",
    );
    const [produtosRows] = await pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM produtos");
    const [produtosVendidosRows] = await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM produtos WHERE vendido_em IS NOT NULL",
    );
    const pedidosStats = statsRows[0];
    const pendentesCount = pendentesRows[0];
    const clientesCount = clientesRows[0];
    const produtosCount = produtosRows[0];
    const produtosVendidosCount = produtosVendidosRows[0];

    return {
      receitaTotalCentavos: pedidosStats.receitaTotalCentavos ?? 0,
      totalPedidos: pedidosStats.totalPedidos,
      pedidosPendentes: pendentesCount.total,
      totalClientes: clientesCount.total,
      totalProdutos: produtosCount.total,
      produtosVendidos: produtosVendidosCount.total,
    };
  },
);

export const adminGetPedidosRecentes = createServerFn({ method: "GET" }).handler(
  async (): Promise<PedidoRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<(PedidoRow & RowDataPacket)[]>(
      `${PEDIDO_SELECT} ORDER BY criado_em DESC LIMIT 6`,
    );
    return rows;
  },
);

export interface ProdutoVendidoRow {
  id: string;
  nome: string;
  img: string;
  precoCentavos: number;
  vendidoEm: string;
}

interface ProdutoVendidoQueryRow extends RowDataPacket, ProdutoVendidoRow {}

export const adminGetProdutosVendidosRecentes = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProdutoVendidoRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<ProdutoVendidoQueryRow[]>(
      `SELECT id, nome, img, preco_centavos AS precoCentavos, vendido_em AS vendidoEm
       FROM produtos
       WHERE vendido_em IS NOT NULL
       ORDER BY vendido_em DESC
       LIMIT 6`,
    );
    return rows;
  },
);

export interface ReceitaDia {
  data: string;
  receitaCentavos: number;
}

interface ReceitaDiaRow extends RowDataPacket {
  data: string;
  receitaCentavos: number;
}

const DIAS_GRAFICO_RECEITA = 14;

/** Receita dos últimos 14 dias (incluindo hoje), com dias sem venda
 * preenchidos como zero pra manter o gráfico contínuo. */
export const adminGetReceitaPorDia = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReceitaDia[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<ReceitaDiaRow[]>(
      `SELECT DATE(criado_em) AS data, SUM(total_centavos) AS receitaCentavos
       FROM pedidos
       WHERE status != 'cancelado' AND criado_em >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(criado_em)`,
      [DIAS_GRAFICO_RECEITA - 1],
    );
    const porDia = new Map(
      rows.map((r) => [new Date(r.data).toISOString().slice(0, 10), r.receitaCentavos]),
    );

    const dias: ReceitaDia[] = [];
    for (let i = DIAS_GRAFICO_RECEITA - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const chave = d.toISOString().slice(0, 10);
      dias.push({ data: chave, receitaCentavos: porDia.get(chave) ?? 0 });
    }
    return dias;
  },
);
