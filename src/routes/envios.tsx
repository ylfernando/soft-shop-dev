import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/envios")({
  component: Envios,
});

function Envios() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-menu text-3xl md:text-4xl text-[color:var(--pink-deep)] text-center">
            ENVIOS
          </h1>

          <div className="mt-8 space-y-6 text-foreground/80 leading-relaxed">
            <p>
              os prazos estabelecidos por cada transportadora começam a contar a partir do momento
              que despacho os pacotes no ponto de coleta, costumo fazer envios dia sim/dia não,
              então são sempre feitos no máximo 3 dias úteis após sua compra, peço compreensão, pois
              todo serviço é feito por uma pessoa (eu hehe)
            </p>

            <div>
              <h2 className="font-menu text-xl text-[color:var(--pink-deep)] mb-2">
                ENTREGA EM FLORIPA
              </h2>
              <p>
                você mora na cidade e quer receber em mãos ou por moto uber? selecione a opção de
                entrega "sacolinha" e me chame na DM para combinarmos a entrega!
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
