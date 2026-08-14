import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export type PedidoStatus = "pendente" | "pago" | "enviado" | "cancelado";
export type FormaPagamento = "pix" | "cartao_credito" | "cartao_debito" | "boleto";

export interface PedidoRow {
  id: number;
  nomeCliente: string;
  emailCliente: string;
  subtotalCentavos: number;
  cupomCodigo: string | null;
  descontoCentavos: number;
  freteCentavos: number;
  cepDestino: string;
  totalCentavos: number;
  status: PedidoStatus;
  formaPagamento: FormaPagamento;
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

const PEDIDO_SELECT = `SELECT id,
              nome_cliente_snapshot AS nomeCliente,
              email_cliente_snapshot AS emailCliente,
              subtotal_centavos AS subtotalCentavos,
              cupom_codigo AS cupomCodigo,
              desconto_centavos AS descontoCentavos,
              frete_centavos AS freteCentavos,
              cep_destino AS cepDestino,
              total_centavos AS totalCentavos,
              status,
              forma_pagamento AS formaPagamento,
              criado_em AS criadoEm
       FROM pedidos`;

export const adminListPedidos = createServerFn({ method: "GET" }).handler(
  async (): Promise<PedidoRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<PedidoQueryRow[]>(`${PEDIDO_SELECT} ORDER BY criado_em DESC`);
    return rows;
  },
);

export const adminListPedidosDoCliente = createServerFn({ method: "GET" })
  .validator((data: { clienteId: number }) => data)
  .handler(async ({ data }): Promise<PedidoRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<PedidoQueryRow[]>(
      `${PEDIDO_SELECT} WHERE usuario_id = ? ORDER BY criado_em DESC`,
      [data.clienteId],
    );
    return rows;
  });

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
