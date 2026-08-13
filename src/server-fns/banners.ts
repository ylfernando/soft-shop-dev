import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";

export interface BannerAtivo {
  id: number;
  imgUrl: string;
  titulo: string | null;
}

interface BannerRow extends RowDataPacket, BannerAtivo {}

export const getBannersAtivos = createServerFn({ method: "GET" }).handler(
  async (): Promise<BannerAtivo[]> => {
    const pool = getPool();
    const [rows] = await pool.query<BannerRow[]>(
      "SELECT id, img_url AS imgUrl, titulo FROM banners WHERE ativo = 1 ORDER BY ordem ASC",
    );
    return rows;
  },
);
