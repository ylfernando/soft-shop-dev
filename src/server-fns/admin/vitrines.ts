import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export type VitrineSecao = "garimpos" | "promos" | "newdrop";

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
      newdrop: rows.filter((r) => r.secao === "newdrop"),
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

/** Persiste a nova ordem de uma vez só — ids é a lista completa dos itens
 * da seção na ordem final desejada, definida no admin depois de reordenar
 * localmente e confirmar com "salvar ordem". */
export const adminReordenarVitrineItens = createServerFn({ method: "POST" })
  .validator((data: { secao: VitrineSecao; ids: number[] }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await Promise.all(
      data.ids.map((id, i) =>
        pool.query("UPDATE vitrines SET ordem = ? WHERE id = ? AND secao = ?", [i, id, data.secao]),
      ),
    );
  });
