export interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/** Busca endereço por CEP direto no navegador (ViaCEP aceita CORS) — só
 * autocompleta o formulário, nunca é usado pra validar nada no servidor. */
export async function buscarEnderecoPorCep(cepLimpo: string): Promise<EnderecoViaCep | null> {
  if (cepLimpo.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as EnderecoViaCep;
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}
