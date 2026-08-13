import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { produtos, tipos, categoriaLabels, type Tipo } from "@/data/produtos";

const searchSchema = z.object({
  tipo: z.array(z.enum(["cima", "baixo", "calcados", "vestido", "newdrop"])).optional(),
  categoria: z.enum(["upcycling", "rework", "autorais", "garimpos", "newdrop"]).optional(),
});

function combinaComTipo(p: (typeof produtos)[number], tipo: Tipo) {
  if (tipo === "newdrop") return p.categoria === "newdrop";
  return p.tipo === tipo;
}

export const Route = createFileRoute("/produtos")({
  component: Produtos,
  validateSearch: searchSchema,
});

function Produtos() {
  const { tipo, categoria } = Route.useSearch();
  const navigate = Route.useNavigate();

  const tiposSelecionados = tipo ?? [];
  const temFiltros = tiposSelecionados.length > 0 || !!categoria;

  const produtosFiltrados = produtos.filter((p) => {
    const tipoOk =
      tiposSelecionados.length === 0 || tiposSelecionados.some((t) => combinaComTipo(p, t));
    const categoriaOk = !categoria || p.categoria === categoria;
    return tipoOk && categoriaOk;
  });

  function toggleTipo(value: Tipo) {
    const next = tiposSelecionados.includes(value)
      ? tiposSelecionados.filter((t) => t !== value)
      : [...tiposSelecionados, value];
    navigate({ search: (prev) => ({ ...prev, tipo: next.length ? next : undefined }) });
  }

  return (
    <div className="min-h-screen text-foreground">
      <SiteHeader />

      <section className="bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)]">
            TODOS OS PRODUTOS
          </h1>
          <p className="font-script text-2xl text-[color:var(--pink-deep)]/80 mt-2">
            garimpe até achar sua peça perfeita
          </p>
        </div>
      </section>

      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[220px_1fr] gap-8">
          <aside className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-menu text-xl text-[color:var(--pink-deep)]">Filtros</h2>
              {temFiltros && (
                <button
                  onClick={() => navigate({ search: {} })}
                  className="text-sm underline text-[color:var(--pink-deep)]/70 hover:text-[color:var(--pink-deep)]"
                >
                  limpar
                </button>
              )}
            </div>

            <div>
              <h3 className="font-menu text-lg text-[color:var(--pink-deep)] mb-3">Tipo</h3>
              <div className="space-y-2">
                {tipos.map((t) => (
                  <div key={t.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`tipo-${t.value}`}
                      checked={tiposSelecionados.includes(t.value)}
                      onCheckedChange={() => toggleTipo(t.value)}
                    />
                    <Label htmlFor={`tipo-${t.value}`} className="cursor-pointer font-normal">
                      {t.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {categoria && (
              <button
                onClick={() => navigate({ search: (prev) => ({ ...prev, categoria: undefined }) })}
                className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-[color:var(--pink-soft)] text-[color:var(--pink-deep)] text-sm font-menu"
              >
                {categoriaLabels[categoria]}
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <p className="text-sm text-foreground/60 mb-4">
              {produtosFiltrados.length}{" "}
              {produtosFiltrados.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
            {produtosFiltrados.length === 0 ? (
              <div className="text-center py-20 text-foreground/60">
                <p className="font-menu text-xl text-[color:var(--pink-deep)]">
                  nenhum produto por aqui ainda
                </p>
                <p className="mt-2">tenta outro filtro ou volta mais tarde ✿</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {produtosFiltrados.map((p) => (
                  <ProductCard key={p.id} produto={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
