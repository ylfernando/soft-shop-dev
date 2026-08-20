import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/sobre-a-sacolinha")({
  component: SobreASacolinha,
});

function SobreASacolinha() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-menu text-3xl md:text-4xl text-[color:var(--pink-deep)] text-center">
            SACOLINHA
          </h1>

          <div className="mt-8 space-y-6 text-foreground/80 leading-relaxed">
            <p>
              você quis comprar uma pecinha e o valor do frete pesou? sabia que pode acumular peças
              e recebê-las em um único pacote? assim, você economiza no frete!
            </p>

            <div>
              <h2 className="font-menu text-xl text-[color:var(--pink-deep)] mb-2">
                COMO FUNCIONA
              </h2>
              <p>
                quando for comprar algo selecione a opção de envio "sacolinha", nessa opção você
                pagará SOMENTE o valor da peça, sinalize na DM do Instagram (@softshopl) que você
                abriu sua sacolinha, para mantermos contato quando precisar!
              </p>
            </div>

            <div>
              <h2 className="font-menu text-xl text-[color:var(--pink-deep)] mb-2">PRAZO</h2>
              <p>
                guardamos suas pecinhas por até 60 dias, nesse período você pode garimpar pelo site
                ou pela DM à vontade, mas NÃO esqueça de solicitar o envio dentro do prazo, perto da
                data de validade da sua sacolinha entraremos em contato para combinar o envio, se
                não houver respostas as peças voltarão ao estoque e você não receberá reembolso.
              </p>
            </div>

            <p>
              (atenção: depois de pago, não realizamos reembolso em caso de desistência da
              sacolinha).
            </p>

            <p>
              ficou com dúvidas? pergunte no Insta{" "}
              <span aria-hidden="true" className="text-[color:var(--pink-deep)]">
                {"<3"}
              </span>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
