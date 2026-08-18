export function limparCpf(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 11);
}

export function formatarCpf(valor: string) {
  const d = limparCpf(valor);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Valida CPF pelo algoritmo padrão dos dois dígitos verificadores — não
 * consulta a Receita, só confere se o número é matematicamente válido. */
export function validarCpf(valor: string): boolean {
  const cpf = limparCpf(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  function calcularDigito(base: string, pesoInicial: number) {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  const digito1 = calcularDigito(cpf.slice(0, 9), 10);
  const digito2 = calcularDigito(cpf.slice(0, 9) + digito1, 11);
  return cpf.endsWith(`${digito1}${digito2}`);
}
