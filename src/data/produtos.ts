export type Tipo = "cima" | "baixo" | "calcados" | "vestido" | "newdrop";
export type Categoria = "newdrop" | "cima" | "baixo" | "calcados" | "vestido";

export const categoriaLabels: Record<Categoria, string> = {
  newdrop: "New Drop",
  cima: "Parte de cima",
  baixo: "Parte de baixo",
  calcados: "Calçados",
  vestido: "Vestidos",
};

export interface Produto {
  id: string;
  img: string;
  nome: string;
  precoCentavos: number;
  tipo: Tipo;
  categoria: Categoria;
  tamanho: string;
  medidas: string;
}

export const tipos: { value: Tipo; label: string }[] = [
  { value: "cima", label: "Parte de cima" },
  { value: "baixo", label: "Parte de baixo" },
  { value: "calcados", label: "Calçados" },
  { value: "vestido", label: "Vestido" },
  { value: "newdrop", label: "NewDrop" },
];

export function formatPreco(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
