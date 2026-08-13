import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import type { Tipo, Categoria } from "@/data/produtos";

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

export const getCart = createServerFn({ method: "GET" })
  .validator((data: { usuarioId: number }) => data)
  .handler(async ({ data }): Promise<CartLineRow[]> => {
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
      [data.usuarioId],
    );
    return rows;
  });

/** Cada produto é uma peça única: adicionar um item que já está na sacolinha
 * não acumula quantidade, só garante que ele exista com quantidade 1. */
export const addItem = createServerFn({ method: "POST" })
  .validator((data: { usuarioId: number; produtoId: string; quantidade?: number }) => data)
  .handler(async ({ data }): Promise<void> => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE quantidade = 1`,
      [data.usuarioId, data.produtoId],
    );
  });

export const removeItem = createServerFn({ method: "POST" })
  .validator((data: { usuarioId: number; produtoId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const pool = getPool();
    await pool.query("DELETE FROM carrinho_itens WHERE usuario_id = ? AND produto_id = ?", [
      data.usuarioId,
      data.produtoId,
    ]);
  });

export const clearCart = createServerFn({ method: "POST" })
  .validator((data: { usuarioId: number }) => data)
  .handler(async ({ data }): Promise<void> => {
    const pool = getPool();
    await pool.query("DELETE FROM carrinho_itens WHERE usuario_id = ?", [data.usuarioId]);
  });
