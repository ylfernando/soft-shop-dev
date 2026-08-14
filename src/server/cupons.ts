import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";

interface CupomRow extends RowDataPacket {
  percentualDesconto: number;
}

/** Busca um cupom ativo pelo código — usada tanto pra mostrar o desconto no
 * carrinho quanto (de novo, no servidor) na hora de fechar o pedido — nunca
 * confiamos num percentual de desconto calculado no cliente. */
export async function buscarCupomAtivo(codigo: string): Promise<number | null> {
  const pool = getPool();
  const [rows] = await pool.query<CupomRow[]>(
    "SELECT percentual_desconto AS percentualDesconto FROM cupons WHERE codigo = ? AND ativo = 1 LIMIT 1",
    [codigo.trim().toUpperCase()],
  );
  return rows[0]?.percentualDesconto ?? null;
}
