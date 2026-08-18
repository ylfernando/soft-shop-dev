import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import type { Tipo, Categoria } from "@/data/produtos";
import { requireAdmin } from "./session";

export const MAX_IMAGENS_POR_PRODUTO = 5;

export interface ProdutoRow {
  id: string;
  img: string;
  nome: string;
  precoCentavos: number;
  tipo: Tipo;
  categoria: Categoria;
  tamanho: string;
  medidas: string;
  vendidoEm: string | null;
}

interface ProdutoQueryRow extends RowDataPacket, ProdutoRow {}

interface ProdutoCreateInput {
  img: string;
  nome: string;
  precoCentavos: number;
  tipo: Tipo;
  categoria: Categoria;
  tamanho: string;
  medidas: string;
}

interface ProdutoUpdateInput {
  id: string;
  nome: string;
  precoCentavos: number;
  tipo: Tipo;
  categoria: Categoria;
  tamanho: string;
  medidas: string;
}

export interface ProdutoImagemRow {
  id: number;
  url: string;
  ordem: number;
}

interface ProdutoImagemQueryRow extends RowDataPacket, ProdutoImagemRow {}

const DIACRITICS = new RegExp("[̀-ͯ]", "g");

function gerarId(nome: string): string {
  const slug = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${slug || "produto"}-${randomBytes(3).toString("hex")}`;
}

/** Mantém produtos.img (usada nos cards/carrinho/pedidos) igual à imagem de
 * menor ordem em produto_imagens — chamada sempre que a galeria muda. */
async function resyncCapa(pool: ReturnType<typeof getPool>, produtoId: string) {
  const [rows] = await pool.query<ProdutoImagemQueryRow[]>(
    "SELECT url FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC LIMIT 1",
    [produtoId],
  );
  if (rows[0]) {
    await pool.query("UPDATE produtos SET img = ? WHERE id = ?", [rows[0].url, produtoId]);
  }
}

export const adminListProdutos = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProdutoRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<ProdutoQueryRow[]>(
      "SELECT id, img, nome, preco_centavos AS precoCentavos, tipo, categoria, tamanho, medidas, vendido_em AS vendidoEm FROM produtos ORDER BY criado_em DESC",
    );
    return rows;
  },
);

export const adminCreateProduto = createServerFn({ method: "POST" })
  .validator((data: ProdutoCreateInput) => data)
  .handler(async ({ data }): Promise<ProdutoRow> => {
    await requireAdmin();
    const id = gerarId(data.nome);
    const pool = getPool();
    await pool.query(
      "INSERT INTO produtos (id, img, nome, preco_centavos, tipo, categoria, tamanho, medidas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        data.img,
        data.nome,
        data.precoCentavos,
        data.tipo,
        data.categoria,
        data.tamanho,
        data.medidas,
      ],
    );
    await pool.query("INSERT INTO produto_imagens (produto_id, url, ordem) VALUES (?, ?, 0)", [
      id,
      data.img,
    ]);
    return { id, ...data, vendidoEm: null };
  });

export const adminUpdateProduto = createServerFn({ method: "POST" })
  .validator((data: ProdutoUpdateInput) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await pool.query(
      "UPDATE produtos SET nome = ?, preco_centavos = ?, tipo = ?, categoria = ?, tamanho = ?, medidas = ? WHERE id = ?",
      [
        data.nome,
        data.precoCentavos,
        data.tipo,
        data.categoria,
        data.tamanho,
        data.medidas,
        data.id,
      ],
    );
  });

export const adminDeleteProduto = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await pool.query("DELETE FROM produtos WHERE id = ?", [data.id]);
  });

export const adminListProdutoImagens = createServerFn({ method: "GET" })
  .validator((data: { produtoId: string }) => data)
  .handler(async ({ data }): Promise<ProdutoImagemRow[]> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<ProdutoImagemQueryRow[]>(
      "SELECT id, url, ordem FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC",
      [data.produtoId],
    );
    return rows;
  });

export const adminAddProdutoImagem = createServerFn({ method: "POST" })
  .validator((data: { produtoId: string; url: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    const [rows] = await pool.query<ProdutoImagemQueryRow[]>(
      "SELECT id, ordem FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC",
      [data.produtoId],
    );
    if (rows.length >= MAX_IMAGENS_POR_PRODUTO) {
      throw new Error(`cada produto pode ter no máximo ${MAX_IMAGENS_POR_PRODUTO} imagens.`);
    }
    const proximaOrdem = rows.length === 0 ? 0 : rows[rows.length - 1].ordem + 1;
    await pool.query("INSERT INTO produto_imagens (produto_id, url, ordem) VALUES (?, ?, ?)", [
      data.produtoId,
      data.url,
      proximaOrdem,
    ]);
    await resyncCapa(pool, data.produtoId);
  });

export const adminRemoveProdutoImagem = createServerFn({ method: "POST" })
  .validator((data: { id: number; produtoId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      "SELECT COUNT(*) AS total FROM produto_imagens WHERE produto_id = ?",
      [data.produtoId],
    );
    if (countRows[0].total <= 1) {
      throw new Error("o produto precisa de pelo menos 1 imagem.");
    }
    await pool.query("DELETE FROM produto_imagens WHERE id = ? AND produto_id = ?", [
      data.id,
      data.produtoId,
    ]);
    await resyncCapa(pool, data.produtoId);
  });

/** Persiste a nova ordem de uma vez só — ids é a lista completa das imagens
 * do produto na ordem final desejada, aplicada junto com o resto do
 * formulário quando o admin clica em "salvar". */
export const adminReordenarProdutoImagens = createServerFn({ method: "POST" })
  .validator((data: { produtoId: string; ids: number[] }) => data)
  .handler(async ({ data }): Promise<void> => {
    await requireAdmin();
    const pool = getPool();
    await Promise.all(
      data.ids.map((id, i) =>
        pool.query("UPDATE produto_imagens SET ordem = ? WHERE id = ? AND produto_id = ?", [
          i,
          id,
          data.produtoId,
        ]),
      ),
    );
    await resyncCapa(pool, data.produtoId);
  });
