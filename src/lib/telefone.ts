export function limparTelefone(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 11);
}

/** Máscara progressiva: (00) 0000-0000 pra fixo, (00) 00000-0000 pra celular
 * — o formato muda sozinho assim que o 9º dígito depois do DDD aparece. */
export function formatarTelefone(valor: string) {
  const d = limparTelefone(valor);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}
