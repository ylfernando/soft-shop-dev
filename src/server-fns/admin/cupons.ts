import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export interface CupomRow {
  id: number;
  codigo: string;
  percentualDesconto: number;
  ativo: boolean;
}

interface CupomQueryRow extends RowDataPacket, CupomRow {}

interface CupomInput {
  codigo: string;
  percentualDesconto: number;
  ativo: boolean;
}

export const adminListCupons = createServerFn({ method: "GET" }).handler(
  async (): Promise<CupomRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<CupomQueryRow[]>(
      "SELECT id, codigo, percentual_desconto AS percentualDesconto, ativo FROM cupons ORDER BY criado_em DESC",
    );
    return rows.map((r) => ({ ...r, ativo: !!r.ativo }));
  },
);

export const adminCreateCupom = createServerFn({ method: "POST" })
  .validator((data: CupomInput) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    try {
      await pool.query(
        "INSERT INTO cupons (codigo, percentual_desconto, ativo) VALUES (?, ?, ?)",
        [data.codigo.trim().toUpperCase(), data.percentualDesconto, data.ativo],
      );
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code === "ER_DUP_ENTRY") {
        throw new Error("já existe um cupom com esse código.");
      }
      throw e;
    }
  });

export const adminUpdateCupom = createServerFn({ method: "POST" })
  .validator((data: CupomInput & { id: number }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    try {
      await pool.query(
        "UPDATE cupons SET codigo = ?, percentual_desconto = ?, ativo = ? WHERE id = ?",
        [data.codigo.trim().toUpperCase(), data.percentualDesconto, data.ativo, data.id],
      );
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code === "ER_DUP_ENTRY") {
        throw new Error("já existe um cupom com esse código.");
      }
      throw e;
    }
  });

export const adminDeleteCupom = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await pool.query("DELETE FROM cupons WHERE id = ?", [data.id]);
  });
