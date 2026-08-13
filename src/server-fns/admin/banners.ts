import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { requireAdmin } from "./session";

export interface BannerRow {
  id: number;
  imgUrl: string;
  titulo: string | null;
  ordem: number;
  ativo: boolean;
}

interface BannerQueryRow extends RowDataPacket, BannerRow {}

interface BannerInput {
  imgUrl: string;
  titulo: string | null;
  ativo: boolean;
}

export const adminListBanners = createServerFn({ method: "GET" }).handler(
  async (): Promise<BannerRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<BannerQueryRow[]>(
      "SELECT id, img_url AS imgUrl, titulo, ordem, ativo FROM banners ORDER BY ordem ASC",
    );
    return rows.map((r) => ({ ...r, ativo: !!r.ativo }));
  },
);

export const adminCreateBanner = createServerFn({ method: "POST" })
  .validator((data: BannerInput) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    const [maxRows] = await pool.query<(RowDataPacket & { maxOrdem: number })[]>(
      "SELECT COALESCE(MAX(ordem), 0) AS maxOrdem FROM banners",
    );
    const proximaOrdem = maxRows[0].maxOrdem + 1;
    await pool.query("INSERT INTO banners (img_url, titulo, ordem, ativo) VALUES (?, ?, ?, ?)", [
      data.imgUrl,
      data.titulo,
      proximaOrdem,
      data.ativo,
    ]);
  });

export const adminUpdateBanner = createServerFn({ method: "POST" })
  .validator((data: BannerInput & { id: number }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await pool.query("UPDATE banners SET img_url = ?, titulo = ?, ativo = ? WHERE id = ?", [
      data.imgUrl,
      data.titulo,
      data.ativo,
      data.id,
    ]);
  });

export const adminDeleteBanner = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await pool.query("DELETE FROM banners WHERE id = ?", [data.id]);
  });

export const adminMoverBanner = createServerFn({ method: "POST" })
  .validator((data: { id: number; direcao: "up" | "down" }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<BannerQueryRow[]>(
      "SELECT id, ordem FROM banners ORDER BY ordem ASC",
    );
    const idx = rows.findIndex((r) => r.id === data.id);
    const swapIdx = data.direcao === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) return;

    const a = rows[idx];
    const b = rows[swapIdx];
    await pool.query<ResultSetHeader>("UPDATE banners SET ordem = ? WHERE id = ?", [b.ordem, a.id]);
    await pool.query<ResultSetHeader>("UPDATE banners SET ordem = ? WHERE id = ?", [a.ordem, b.id]);
  });
