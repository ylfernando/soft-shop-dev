import { createServerFn } from "@tanstack/react-start";
import { buscarCupomAtivo } from "@/server/cupons";

type AplicarCupomResult =
  | { ok: true; percentualDesconto: number }
  | { ok: false; erro: string };

export const aplicarCupom = createServerFn({ method: "POST" })
  .validator((data: { codigo: string }) => data)
  .handler(async ({ data }): Promise<AplicarCupomResult> => {
    const percentualDesconto = await buscarCupomAtivo(data.codigo);
    if (percentualDesconto === null) {
      return { ok: false, erro: "cupom inválido ou expirado." };
    }
    return { ok: true, percentualDesconto };
  });
