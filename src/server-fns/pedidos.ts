import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { calcularFrete } from "@/lib/frete";

type CriarPedidoResult = { ok: true; pedidoId: number } | { ok: false; erro: string };

interface UsuarioRow extends RowDataPacket {
  nome: string;
  email: string;
}

interface CarrinhoJoinRow extends RowDataPacket {
  produtoId: string;
  quantidade: number;
  nome: string;
  precoCentavos: number;
}

/** Cria um pedido de verdade a partir da sacolinha do usuário: relê preços e
 * dados do produto no servidor (nunca confia em valores vindos do cliente),
 * grava um retrato dos itens em pedido_itens e só então esvazia o carrinho. */
export const criarPedido = createServerFn({ method: "POST" })
  .validator((data: { usuarioId: number }) => data)
  .handler(async ({ data }): Promise<CriarPedidoResult> => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [usuarioRows] = await conn.query<UsuarioRow[]>(
        "SELECT nome, email FROM usuarios WHERE id = ? LIMIT 1",
        [data.usuarioId],
      );
      const usuario = usuarioRows[0];
      if (!usuario) {
        await conn.rollback();
        return { ok: false, erro: "usuário não encontrado." };
      }

      const [itens] = await conn.query<CarrinhoJoinRow[]>(
        `SELECT ci.produto_id AS produtoId, ci.quantidade, p.nome, p.preco_centavos AS precoCentavos
         FROM carrinho_itens ci
         JOIN produtos p ON p.id = ci.produto_id
         WHERE ci.usuario_id = ?
         FOR UPDATE`,
        [data.usuarioId],
      );
      if (itens.length === 0) {
        await conn.rollback();
        return { ok: false, erro: "sua sacolinha está vazia." };
      }

      const subtotalCentavos = itens.reduce((sum, i) => sum + i.precoCentavos * i.quantidade, 0);
      const freteCentavos = calcularFrete(subtotalCentavos);
      const totalCentavos = subtotalCentavos + freteCentavos;

      const [pedidoResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO pedidos
          (usuario_id, nome_cliente_snapshot, email_cliente_snapshot, subtotal_centavos, frete_centavos, total_centavos, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pago')`,
        [
          data.usuarioId,
          usuario.nome,
          usuario.email,
          subtotalCentavos,
          freteCentavos,
          totalCentavos,
        ],
      );
      const pedidoId = pedidoResult.insertId;

      for (const item of itens) {
        await conn.query(
          `INSERT INTO pedido_itens (pedido_id, produto_id, nome_snapshot, preco_centavos_snapshot, quantidade)
           VALUES (?, ?, ?, ?, ?)`,
          [pedidoId, item.produtoId, item.nome, item.precoCentavos, item.quantidade],
        );
      }

      await conn.query("DELETE FROM carrinho_itens WHERE usuario_id = ?", [data.usuarioId]);

      await conn.commit();
      return { ok: true, pedidoId };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  });
