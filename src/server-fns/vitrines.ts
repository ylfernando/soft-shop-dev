import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import type { Produto } from "@/data/produtos";

interface VitrineProdutoRow extends RowDataPacket, Produto {}

async function listarVitrine(secao: "garimpos" | "promos" | "newdrop"): Promise<Produto[]> {
  const pool = getPool();
  const [rows] = await pool.query<VitrineProdutoRow[]>(
    `SELECT p.id, p.img, p.nome, p.preco_centavos AS precoCentavos, p.tipo, p.categoria,
            p.tamanho, p.medidas
     FROM vitrines v
     JOIN produtos p ON p.id = v.produto_id
     WHERE v.secao = ?
     ORDER BY v.ordem ASC`,
    [secao],
  );
  return rows;
}

/** Produtos escolhidos manualmente pelo admin pra aparecer em "Últimos
 * garimpos" e "Promos da semana" na home, na ordem definida no painel. */
export const getVitrines = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ garimpos: Produto[]; promos: Produto[]; newdrop: Produto[] }> => {
    const [garimpos, promos, newdrop] = await Promise.all([
      listarVitrine("garimpos"),
      listarVitrine("promos"),
      listarVitrine("newdrop"),
    ]);
    return { garimpos, promos, newdrop };
  },
);
