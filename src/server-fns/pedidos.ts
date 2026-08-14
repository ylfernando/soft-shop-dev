import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { FRETE_GRATIS_A_PARTIR_DE_CENTAVOS } from "@/lib/frete";
import { cotarFrete } from "@/server/superfrete";
import { buscarCupomAtivo } from "@/server/cupons";
import { requireUser } from "./session";

type CriarPedidoResult = { ok: true; pedidoId: number } | { ok: false; erro: string };

export type FormaPagamento = "pix" | "cartao_credito" | "cartao_debito" | "boleto";

interface ItemInput {
  produtoId: string;
  quantidade: number;
}

interface ProdutoRow extends RowDataPacket {
  id: string;
  nome: string;
  precoCentavos: number;
}

/** Cria um pedido de verdade a partir da sacolinha enviada pelo cliente
 * (que vive no navegador, sem precisar de login). O usuário vem da sessão —
 * login é exigido só nesse passo, nunca antes. Preço e nome de cada item são
 * relidos do banco (nunca confiados no que o cliente mandou), então mesmo
 * que a sacolinha local esteja desatualizada, o pedido reflete o real. */
const FORMAS_PAGAMENTO: FormaPagamento[] = ["pix", "cartao_credito", "cartao_debito", "boleto"];

export const criarPedido = createServerFn({ method: "POST" })
  .validator(
    (data: {
      itens: ItemInput[];
      cepDestino: string;
      cupomCodigo?: string;
      formaPagamento?: FormaPagamento;
    }) => data,
  )
  .handler(async ({ data }): Promise<CriarPedidoResult> => {
    const user = await requireUser();
    if (data.itens.length === 0) {
      return { ok: false, erro: "sua sacolinha está vazia." };
    }
    const cepDestino = data.cepDestino.replace(/\D/g, "");
    if (cepDestino.length !== 8) {
      return { ok: false, erro: "CEP de entrega inválido." };
    }
    const formaPagamento =
      data.formaPagamento && FORMAS_PAGAMENTO.includes(data.formaPagamento)
        ? data.formaPagamento
        : "pix";

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const ids = data.itens.map((item) => item.produtoId);
      const [produtos] = await conn.query<ProdutoRow[]>(
        "SELECT id, nome, preco_centavos AS precoCentavos FROM produtos WHERE id IN (?) FOR UPDATE",
        [ids],
      );
      const produtoPorId = new Map(produtos.map((p) => [p.id, p]));

      const itens = data.itens.flatMap((item) => {
        const produto = produtoPorId.get(item.produtoId);
        if (!produto) return [];
        const quantidade = Math.max(1, Math.floor(item.quantidade) || 1);
        return [{ produto, quantidade }];
      });
      if (itens.length === 0) {
        await conn.rollback();
        return { ok: false, erro: "os produtos da sua sacolinha não existem mais." };
      }

      const subtotalCentavos = itens.reduce(
        (sum, i) => sum + i.produto.precoCentavos * i.quantidade,
        0,
      );
      const quantidadeTotal = itens.reduce((sum, i) => sum + i.quantidade, 0);

      let cupomCodigo: string | null = null;
      let descontoCentavos = 0;
      if (data.cupomCodigo) {
        const percentualDesconto = await buscarCupomAtivo(data.cupomCodigo);
        if (percentualDesconto === null) {
          await conn.rollback();
          return { ok: false, erro: "cupom inválido ou expirado." };
        }
        cupomCodigo = data.cupomCodigo.trim().toUpperCase();
        descontoCentavos = Math.round((subtotalCentavos * percentualDesconto) / 100);
      }

      let freteCentavos = 0;
      if (subtotalCentavos < FRETE_GRATIS_A_PARTIR_DE_CENTAVOS) {
        try {
          const opcoes = await cotarFrete(cepDestino, quantidadeTotal);
          freteCentavos = opcoes[0].precoCentavos;
        } catch (e) {
          await conn.rollback();
          return {
            ok: false,
            erro: e instanceof Error ? e.message : "não deu pra calcular o frete pra esse CEP.",
          };
        }
      }
      const totalCentavos = subtotalCentavos - descontoCentavos + freteCentavos;

      const [pedidoResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO pedidos
          (usuario_id, nome_cliente_snapshot, email_cliente_snapshot, subtotal_centavos, cupom_codigo, desconto_centavos, frete_centavos, cep_destino, total_centavos, status, forma_pagamento)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pago', ?)`,
        [
          user.id,
          user.nome,
          user.email,
          subtotalCentavos,
          cupomCodigo,
          descontoCentavos,
          freteCentavos,
          cepDestino,
          totalCentavos,
          formaPagamento,
        ],
      );
      const pedidoId = pedidoResult.insertId;

      for (const item of itens) {
        await conn.query(
          `INSERT INTO pedido_itens (pedido_id, produto_id, nome_snapshot, preco_centavos_snapshot, quantidade)
           VALUES (?, ?, ?, ?, ?)`,
          [
            pedidoId,
            item.produto.id,
            item.produto.nome,
            item.produto.precoCentavos,
            item.quantidade,
          ],
        );
      }

      await conn.commit();
      return { ok: true, pedidoId };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  });
