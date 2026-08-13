export const FRETE_GRATIS_A_PARTIR_DE_CENTAVOS = 15000;
export const FRETE_PADRAO_CENTAVOS = 1500;

export function calcularFrete(subtotalCentavos: number) {
  if (subtotalCentavos === 0) return 0;
  return subtotalCentavos >= FRETE_GRATIS_A_PARTIR_DE_CENTAVOS ? 0 : FRETE_PADRAO_CENTAVOS;
}
