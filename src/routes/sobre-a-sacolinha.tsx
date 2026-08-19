import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, PackagePlus, CalendarClock, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/sobre-a-sacolinha")({
  component: SobreASacolinha,
});

const SECOES = [
  {
    Icon: PackagePlus,
    titulo: "como funciona",
    texto:
      'quando for comprar algo selecione a opção de envio "sacolinha", nessa opção você pagará SOMENTE o valor da peça, sinalize na DM do Instagram (@softshopl) que você abriu sua sacolinha, para mantermos contato quando precisar!',
  },
  {
    Icon: CalendarClock,
    titulo: "prazo",
    texto:
      "guardamos suas pecinhas por até 60 dias, nesse período você pode garimpar pelo site ou pela DM à vontade, mas NÃO esqueça de solicitar o envio dentro do prazo, perto da data de validade da sua sacolinha entraremos em contato para combinar o envio, se não houver respostas as peças voltarão ao estoque e você não receberá reembolso.",
  },
];

function SobreASacolinha() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)] text-center">
            SACOLINHA
          </h1>
          <p className="font-script text-2xl text-[color:var(--pink-deep)]/80 text-center mt-2 max-w-xl mx-auto">
            você quis comprar uma pecinha e o valor do frete pesou? sabia que pode acumular peças e
            recebê-las em um único pacote? assim, você economiza no frete!
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {SECOES.map(({ Icon, titulo, texto }) => (
              <div
                key={titulo}
                className="bg-white/80 rounded-2xl border border-[color:var(--pink-deep)]/10 p-5 text-center flex flex-col items-center"
              >
                <div className="w-11 h-11 rounded-full bg-[color:var(--pink-soft)] flex items-center justify-center text-[color:var(--pink-deep)] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-menu text-lg text-[color:var(--pink-deep)] mt-3 uppercase">
                  {titulo}
                </p>
                <p className="text-sm text-foreground/70 mt-1.5">{texto}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 max-w-xl mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              atenção: depois de pago, não realizamos reembolso em caso de desistência da sacolinha.
            </p>
          </div>

          <div className="mt-10 text-center space-y-4">
            <p className="text-foreground/70">
              ficou com dúvidas? pergunte no Insta{" "}
              <span aria-hidden="true" className="text-[color:var(--pink-deep)]">
                {"<3"}
              </span>
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://www.instagram.com/softshopl"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                <Instagram className="w-4 h-4" />
                @softshopl
              </a>
              <Link
                to="/produtos"
                className="inline-block px-6 py-2.5 rounded-full border border-[color:var(--pink-deep)] text-[color:var(--pink-deep)] font-pixel text-base hover:bg-[color:var(--pink-deep)]/10"
              >
                continuar garimpando
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
