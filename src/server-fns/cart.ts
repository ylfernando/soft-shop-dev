import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import type { Tipo, Categoria } from "@/data/produtos";
import { requireUser } from "./session";

export interface CartItem {
  produtoId: string;
  quantidade: number;
}

/** Linha da sacolinha já com os dados do produto (join com a tabela produtos),
 * pra não depender de nenhum catálogo estático no cliente. */
export interface CartLineRow extends CartItem {
  nome: string;
  img: string;
  precoCentavos: number;
  tipo: Tipo;
  categoria: Categoria;
  tamanho: string;
  medidas: string;
}

interface CartQueryRow extends RowDataPacket, CartLineRow {}

export const getCart = createServerFn({ method: "GET" }).handler(
  async (): Promise<CartLineRow[]> => {
    const user = await requireUser();
    const pool = getPool();
    const [rows] = await pool.query<CartQueryRow[]>(
      `SELECT ci.produto_id AS produtoId,
              ci.quantidade,
              p.nome,
              p.img,
              p.preco_centavos AS precoCentavos,
              p.tipo,
              p.categoria,
              p.tamanho,
              p.medidas
       FROM carrinho_itens ci
       JOIN produtos p ON p.id = ci.produto_id
       WHERE ci.usuario_id = ?`,
      [user.id],
    );
    return rows;
  },
);

/** Cada produto é uma peça única: adicionar um item que já está na sacolinha
 * não acumula quantidade, só garante que ele exista com quantidade 1. */
export const addItem = createServerFn({ method: "POST" })
  .validator((data: { produtoId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const pool = getPool();
    await pool.query(
      `INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE quantidade = 1`,
      [user.id, data.produtoId],
    );
  });

export const removeItem = createServerFn({ method: "POST" })
  .validator((data: { produtoId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const pool = getPool();
    await pool.query("DELETE FROM carrinho_itens WHERE usuario_id = ? AND produto_id = ?", [
      user.id,
      data.produtoId,
    ]);
  });

export const clearCart = createServerFn({ method: "POST" }).handler(async (): Promise<void> => {
  const user = await requireUser();
  const pool = getPool();
  await pool.query("DELETE FROM carrinho_itens WHERE usuario_id = ?", [user.id]);
});
