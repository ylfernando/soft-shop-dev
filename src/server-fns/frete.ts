import { createServerFn } from "@tanstack/react-start";
import { cotarFrete, type OpcaoFrete } from "@/server/superfrete";

type CotarFreteResult = { ok: true; opcoes: OpcaoFrete[] } | { ok: false; erro: string };

export const cotarFreteCarrinho = createServerFn({ method: "POST" })
  .validator((data: { cep: string; quantidadeItens: number }) => data)
  .handler(async ({ data }): Promise<CotarFreteResult> => {
    try {
      const opcoes = await cotarFrete(data.cep, data.quantidadeItens);
      return { ok: true, opcoes };
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : "não deu pra calcular o frete." };
    }
  });
