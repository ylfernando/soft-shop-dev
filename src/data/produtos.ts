import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

export type Tipo = "cima" | "baixo" | "calcados" | "vestido" | "newdrop";
export type Categoria = "upcycling" | "rework" | "autorais" | "garimpos" | "newdrop";

export const categoriaLabels: Record<Categoria, string> = {
  upcycling: "Upcycling",
  rework: "Rework",
  autorais: "Autorais",
  garimpos: "Garimpos",
  newdrop: "New Drop",
};

export interface Produto {
  id: string;
  img: string;
  nome: string;
  precoCentavos: number;
  tipo: Tipo;
  categoria: Categoria;
}

export const tipos: { value: Tipo; label: string }[] = [
  { value: "cima", label: "Parte de cima" },
  { value: "baixo", label: "Parte de baixo" },
  { value: "calcados", label: "Calçados" },
  { value: "vestido", label: "Vestido" },
  { value: "newdrop", label: "NewDrop" },
];

export const produtos: Produto[] = [
  {
    id: "p1",
    img: p1,
    nome: "cargo jacket preta M",
    precoCentavos: 11000,
    tipo: "cima",
    categoria: "newdrop",
  },
  {
    id: "p2",
    img: p2,
    nome: "trench azul marinho M",
    precoCentavos: 6000,
    tipo: "cima",
    categoria: "newdrop",
  },
  {
    id: "p3",
    img: p3,
    nome: "[upcycling] sainha jeans M/G",
    precoCentavos: 6000,
    tipo: "baixo",
    categoria: "upcycling",
  },
  {
    id: "p4",
    img: p4,
    nome: "sainha midi marrom P",
    precoCentavos: 2500,
    tipo: "baixo",
    categoria: "rework",
  },
  {
    id: "p5",
    img: p5,
    nome: "cardigã tricot off white P/M",
    precoCentavos: 4500,
    tipo: "cima",
    categoria: "garimpos",
  },
  {
    id: "p6",
    img: p6,
    nome: "[garimpo] saia midi poá marinho M",
    precoCentavos: 3500,
    tipo: "baixo",
    categoria: "garimpos",
  },
];

export function formatPreco(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
