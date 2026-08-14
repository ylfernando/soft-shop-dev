export interface OpcaoFrete {
  id: number;
  nome: string;
  precoCentavos: number;
  prazoDias: number;
  transportadora: string;
}

interface SuperFreteOpcaoResponse {
  id: number;
  name: string;
  price: number;
  delivery_time: number;
  has_error: boolean;
  company: { name: string };
}

/** Peso/dimensões de um pacote genérico de roupas dobradas, escalando com a
 * quantidade de peças — o catálogo não guarda peso/dimensões por produto
 * ainda, então isso é uma estimativa até existir esse dado. */
function estimarPacote(quantidadeItens: number) {
  const pesoKg = 0.2 + quantidadeItens * 0.25;
  return { height: 10, width: 20, length: 30, weight: Number(pesoKg.toFixed(2)) };
}

/** Cotação real de frete via SuperFrete, usada tanto pra mostrar o valor no
 * carrinho quanto (de novo, no servidor) na hora de fechar o pedido — nunca
 * confiamos num valor de frete calculado no cliente. */
export async function cotarFrete(
  cepDestino: string,
  quantidadeItens: number,
): Promise<OpcaoFrete[]> {
  const token = process.env.SUPERFRETE_TOKEN;
  const cepOrigem = process.env.SUPERFRETE_CEP_ORIGEM;
  const baseUrl = process.env.SUPERFRETE_BASE_URL ?? "https://sandbox.superfrete.com";
  if (!token || !cepOrigem) {
    throw new Error("cálculo de frete não configurado.");
  }

  const cepLimpo = cepDestino.replace(/\D/g, "");
  if (cepLimpo.length !== 8) {
    throw new Error("CEP inválido.");
  }

  const res = await fetch(`${baseUrl}/api/v0/calculator`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Soft Shop (contato@softshop.com)",
    },
    body: JSON.stringify({
      from: { postal_code: cepOrigem.replace(/\D/g, "") },
      to: { postal_code: cepLimpo },
      services: "1,2",
      package: estimarPacote(quantidadeItens),
    }),
  });

  if (!res.ok) {
    throw new Error("não deu pra calcular o frete agora, tenta de novo.");
  }

  const data = (await res.json()) as SuperFreteOpcaoResponse[];
  const validas = data.filter((o) => !o.has_error);
  if (validas.length === 0) {
    throw new Error("não encontramos opções de frete pra esse CEP.");
  }

  return validas
    .map((o) => ({
      id: o.id,
      nome: o.name,
      precoCentavos: Math.round(o.price * 100),
      prazoDias: o.delivery_time,
      transportadora: o.company.name,
    }))
    .sort((a, b) => a.precoCentavos - b.precoCentavos);
}
