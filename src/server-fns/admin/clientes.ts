import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export interface ClienteRow {
  id: number;
  nome: string;
  email: string;
  criadoEm: string;
  totalPedidos: number;
}

interface ClienteQueryRow extends RowDataPacket, ClienteRow {}

export const adminListClientes = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClienteRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<ClienteQueryRow[]>(
      `SELECT u.id,
              u.nome,
              u.email,
              u.criado_em AS criadoEm,
              COUNT(p.id) AS totalPedidos
       FROM usuarios u
       LEFT JOIN pedidos p ON p.usuario_id = u.id AND p.status != 'cancelado'
       WHERE u.role = 'cliente'
       GROUP BY u.id
       ORDER BY u.criado_em DESC`,
    );
    return rows;
  },
);

export const adminDeleteCliente = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    // O filtro role='cliente' é uma proteção extra: essa rota nunca apaga uma conta admin.
    await pool.query("DELETE FROM usuarios WHERE id = ? AND role = 'cliente'", [data.id]);
  });
