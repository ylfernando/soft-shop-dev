import { createFileRoute } from "@tanstack/react-router";
import sacolinhaBg from "@/assets/sacolinha.jpeg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/sobre-a-sacolinha")({
  component: SobreASacolinha,
});

function SobreASacolinha() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-4 flex justify-center">
        <div
          className="w-full max-w-2xl"
          style={{
            borderStyle: "solid",
            borderWidth: "34px 40px",
            borderImageSource: `url(${sacolinhaBg})`,
            borderImageSlice: "128 144 128 144",
            borderImageRepeat: "round",
          }}
        >
          <div className="bg-white/70 rounded-2xl px-6 py-8 sm:px-10 sm:py-10">
            <h1 className="font-menu text-3xl md:text-4xl text-[#D1AFFA] text-center">SACOLINHA</h1>

            <div className="mt-8 space-y-6 text-[#FEC4C0] leading-relaxed">
              <p>
                você quis comprar uma pecinha e o valor do frete pesou? sabia que pode acumular
                peças e recebê-las em um único pacote? assim, você economiza no frete!
              </p>

              <div>
                <h2 className="font-menu text-xl text-[#D1AFFA] mb-2">COMO FUNCIONA</h2>
                <p>
                  quando for comprar algo selecione a opção de envio "sacolinha", nessa opção você
                  pagará SOMENTE o valor da peça, sinalize na DM do Instagram (
                  <a
                    href="https://www.instagram.com/softshopl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D1AFFA] underline"
                  >
                    @softshopl
                  </a>
                  ) que você abriu sua sacolinha, para mantermos contato quando precisar!
                </p>
              </div>

              <div>
                <h2 className="font-menu text-xl text-[#D1AFFA] mb-2">PRAZO</h2>
                <p>
                  guardamos suas pecinhas por até 60 dias, nesse período você pode garimpar pelo
                  site ou pela DM à vontade, mas NÃO esqueça de solicitar o envio dentro do prazo,
                  perto da data de validade da sua sacolinha entraremos em contato para combinar o
                  envio, se não houver respostas as peças voltarão ao estoque e você não receberá
                  reembolso.
                </p>
              </div>

              <p>
                (atenção: depois de pago, não realizamos reembolso em caso de desistência da
                sacolinha).
              </p>

              <p>
                ficou com dúvidas? pergunte no Insta{" "}
                <span aria-hidden="true" className="text-[#D1AFFA]">
                  {"<3"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
