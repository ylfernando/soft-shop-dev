import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export interface AdminStats {
  receitaTotalCentavos: number;
  totalPedidos: number;
  totalClientes: number;
  totalProdutos: number;
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
    const [clientesRows] = await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM usuarios WHERE role = 'cliente'",
    );
    const [produtosRows] = await pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM produtos");
    const pedidosStats = statsRows[0];
    const clientesCount = clientesRows[0];
    const produtosCount = produtosRows[0];

    return {
      receitaTotalCentavos: pedidosStats.receitaTotalCentavos ?? 0,
      totalPedidos: pedidosStats.totalPedidos,
      totalClientes: clientesCount.total,
      totalProdutos: produtosCount.total,
    };
  },
);
