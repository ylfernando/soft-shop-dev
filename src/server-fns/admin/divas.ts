import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export interface DivaRow {
  id: number;
  imgUrl: string;
  username: string;
  highlightUrl: string;
  ordem: number;
}

interface DivaQueryRow extends RowDataPacket, DivaRow {}

interface DivaInput {
  id: number;
  imgUrl: string;
  username: string;
  highlightUrl: string;
}

export const adminListDivas = createServerFn({ method: "GET" }).handler(
  async (): Promise<DivaRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<DivaQueryRow[]>(
      "SELECT id, img_url AS imgUrl, username, highlight_url AS highlightUrl, ordem FROM divas ORDER BY ordem ASC",
    );
    return rows;
  },
);

/** Os 3 cards de divas são fixos (sem criar/excluir) — só dá pra trocar
 * imagem, username e link do destaque de cada um já existente. */
export const adminUpdateDiva = createServerFn({ method: "POST" })
  .validator((data: DivaInput) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await pool.query(
      "UPDATE divas SET img_url = ?, username = ?, highlight_url = ? WHERE id = ?",
      [data.imgUrl, data.username, data.highlightUrl, data.id],
    );
  });
