import { getPool } from "@/server/db";

/** Confirma o pagamento de um pedido — chamada pelos webhooks dos gateways
 * quando o pagamento é aprovado. A peça já foi reservada (produtos.vendido_em)
 * no momento em que o pedido foi criado; só falta o pedido virar 'pago'.
 * Idempotente: se o webhook chegar duplicado, o segundo UPDATE não acha mais
 * nenhuma linha 'pendente' e não faz nada. */
export async function confirmarPagamentoPedido(pedidoId: number): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE pedidos SET status = 'pago' WHERE id = ? AND status = 'pendente'", [
    pedidoId,
  ]);
}

/** Cancela um pedido e libera as peças reservadas de volta pro catálogo —
 * chamada quando o pagamento falha/expira (webhook) ou é cancelado à mão
 * pelo admin. Idempotente: cancelar de novo um pedido já cancelado não
 * libera nada (já foi liberado da primeira vez). */
export async function cancelarPedidoELiberarPecas(pedidoId: number): Promise<void> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "UPDATE pedidos SET status = 'cancelado' WHERE id = ? AND status <> 'cancelado'",
      [pedidoId],
    );
    if ((result as { affectedRows: number }).affectedRows > 0) {
      await conn.query(
        `UPDATE produtos SET vendido_em = NULL
         WHERE id IN (SELECT produto_id FROM pedido_itens WHERE pedido_id = ? AND produto_id IS NOT NULL)`,
        [pedidoId],
      );
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
