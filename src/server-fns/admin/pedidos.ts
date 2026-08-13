import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export type PedidoStatus = "pendente" | "pago" | "enviado" | "cancelado";

export interface PedidoRow {
  id: number;
  nomeCliente: string;
  emailCliente: string;
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  status: PedidoStatus;
  criadoEm: string;
}

interface PedidoQueryRow extends RowDataPacket, PedidoRow {}

export interface PedidoItemRow {
  id: number;
  nomeSnapshot: string;
  precoCentavosSnapshot: number;
  quantidade: number;
}

interface PedidoItemQueryRow extends RowDataPacket, PedidoItemRow {}

export const adminListPedidos = createServerFn({ method: "GET" }).handler(
  async (): Promise<PedidoRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<PedidoQueryRow[]>(
      `SELECT id,
              nome_cliente_snapshot AS nomeCliente,
              email_cliente_snapshot AS emailCliente,
              subtotal_centavos AS subtotalCentavos,
              frete_centavos AS freteCentavos,
              total_centavos AS totalCentavos,
              status,
              criado_em AS criadoEm
       FROM pedidos
       ORDER BY criado_em DESC`,
    );
    return rows;
  },
);

export const adminGetPedidoItens = createServerFn({ method: "GET" })
  .validator((data: { pedidoId: number }) => data)
  .handler(async ({ data }): Promise<PedidoItemRow[]> => {
    await requireAdmin();
    const pool = getPool();
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

export const adminUpdatePedidoStatus = createServerFn({ method: "POST" })
  .validator((data: { id: number; status: PedidoStatus }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await pool.query("UPDATE pedidos SET status = ? WHERE id = ?", [data.status, data.id]);
  });
