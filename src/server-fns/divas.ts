import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";

export interface DivaAtiva {
  id: number;
  imgUrl: string;
  username: string;
  highlightUrl: string;
}

interface DivaRow extends RowDataPacket, DivaAtiva {}

export const getDivas = createServerFn({ method: "GET" }).handler(
  async (): Promise<DivaAtiva[]> => {
    const pool = getPool();
    const [rows] = await pool.query<DivaRow[]>(
      "SELECT id, img_url AS imgUrl, username, highlight_url AS highlightUrl FROM divas ORDER BY ordem ASC",
    );
    return rows;
  },
);
