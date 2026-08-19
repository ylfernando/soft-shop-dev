import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import type { Produto } from "@/data/produtos";

interface ProdutoQueryRow extends RowDataPacket, Produto {}

/** Lê o catálogo direto do MySQL — usada pela loja (home, /produtos) e pelo
 * painel de administração pra montar a lista de produtos exibida no site. */
export const getProdutos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Produto[]> => {
    const pool = getPool();
    const [rows] = await pool.query<ProdutoQueryRow[]>(
      "SELECT id, img, nome, preco_centavos AS precoCentavos, tipo, categoria, descricao FROM produtos WHERE vendido_em IS NULL ORDER BY criado_em DESC",
    );
    return rows;
  },
);

/** Um produto específico direto do banco — usada pelo modal de galeria pra
 * garantir que a descrição esteja sempre atualizada, mesmo que a lista
 * carregada na página já esteja desatualizada (ex: editado no admin numa
 * aba diferente). */
export const getProdutoDetalhe = createServerFn({ method: "GET" })
  .validator((data: { produtoId: string }) => data)
  .handler(async ({ data }): Promise<Produto | null> => {
    const pool = getPool();
    const [rows] = await pool.query<ProdutoQueryRow[]>(
      "SELECT id, img, nome, preco_centavos AS precoCentavos, tipo, categoria, descricao FROM produtos WHERE id = ? LIMIT 1",
      [data.produtoId],
    );
    return rows[0] ?? null;
  });

interface ProdutoIdRow extends RowDataPacket {
  id: string;
}

/** Recebe uma lista de ids (tipicamente os produtos da sacolinha do cliente,
 * guardada no navegador) e devolve só os que ainda estão à venda — usada pra
 * limpar peças já vendidas de sacolinhas antigas/abertas em outra aba, já que
 * cada peça é única e só a primeira compra fica com ela. */
export const getProdutosDisponiveis = createServerFn({ method: "GET" })
  .validator((data: { produtoIds: string[] }) => data)
  .handler(async ({ data }): Promise<string[]> => {
    if (data.produtoIds.length === 0) return [];
    const pool = getPool();
    const [rows] = await pool.query<ProdutoIdRow[]>(
      "SELECT id FROM produtos WHERE id IN (?) AND vendido_em IS NULL",
      [data.produtoIds],
    );
    return rows.map((r) => r.id);
  });

interface ImagemUrlRow extends RowDataPacket {
  url: string;
}

/** Todas as fotos de um produto (até 5), na ordem escolhida no admin —
 * usada pela galeria que abre ao clicar num produto na loja. */
export const getProdutoImagens = createServerFn({ method: "GET" })
  .validator((data: { produtoId: string }) => data)
  .handler(async ({ data }): Promise<string[]> => {
    const pool = getPool();
    const [rows] = await pool.query<ImagemUrlRow[]>(
      "SELECT url FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC",
      [data.produtoId],
    );
    return rows.map((r) => r.url);
  });
