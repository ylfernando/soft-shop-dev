import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export type VitrineSecao = "garimpos" | "promos";

export interface VitrineItemRow {
  id: number;
  produtoId: string;
  secao: VitrineSecao;
  ordem: number;
  nome: string;
  img: string;
  precoCentavos: number;
}

interface VitrineQueryRow extends RowDataPacket, VitrineItemRow {}

const SELECT_VITRINE_ITEM = `
  SELECT v.id, v.produto_id AS produtoId, v.secao, v.ordem,
         p.nome, p.img, p.preco_centavos AS precoCentavos
  FROM vitrines v
  JOIN produtos p ON p.id = v.produto_id
`;

export const adminListVitrines = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<VitrineSecao, VitrineItemRow[]>> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<VitrineQueryRow[]>(
      `${SELECT_VITRINE_ITEM} ORDER BY v.secao ASC, v.ordem ASC`,
    );
    return {
      garimpos: rows.filter((r) => r.secao === "garimpos"),
      promos: rows.filter((r) => r.secao === "promos"),
    };
  },
);

export const adminAddVitrineItem = createServerFn({ method: "POST" })
  .validator((data: { produtoId: string; secao: VitrineSecao }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    const [maxRows] = await pool.query<(RowDataPacket & { maxOrdem: number })[]>(
      "SELECT COALESCE(MAX(ordem), 0) AS maxOrdem FROM vitrines WHERE secao = ?",
      [data.secao],
    );
    const proximaOrdem = maxRows[0].maxOrdem + 1;
    try {
      await pool.query("INSERT INTO vitrines (produto_id, secao, ordem) VALUES (?, ?, ?)", [
        data.produtoId,
        data.secao,
        proximaOrdem,
      ]);
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code === "ER_DUP_ENTRY") {
        throw new Error("esse produto já está nessa vitrine.");
      }
      throw e;
    }
  });

export const adminRemoveVitrineItem = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await pool.query("DELETE FROM vitrines WHERE id = ?", [data.id]);
  });

export const adminMoverVitrineItem = createServerFn({ method: "POST" })
  .validator((data: { id: number; secao: VitrineSecao; direcao: "up" | "down" }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<(RowDataPacket & { id: number; ordem: number })[]>(
      "SELECT id, ordem FROM vitrines WHERE secao = ? ORDER BY ordem ASC",
      [data.secao],
    );
    const idx = rows.findIndex((r) => r.id === data.id);
    const swapIdx = data.direcao === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) return;

    const a = rows[idx];
    const b = rows[swapIdx];
    await pool.query("UPDATE vitrines SET ordem = ? WHERE id = ?", [b.ordem, a.id]);
    await pool.query("UPDATE vitrines SET ordem = ? WHERE id = ?", [a.ordem, b.id]);
  });
