import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCw, PackageCheck, Mail } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/trocas-e-devolucoes")({
  component: TrocasEDevolucoes,
});

const PONTOS = [
  {
    Icon: RefreshCw,
    titulo: "7 dias corridos",
    texto:
      "depois de receber sua peça, você tem até 7 dias corridos pra desistir da compra — é o direito de arrependimento garantido pelo Código de Defesa do Consumidor (art. 49).",
  },
  {
    Icon: PackageCheck,
    titulo: "peça em bom estado",
    texto: "pra devolução, a peça precisa voltar do jeito que chegou até você, sem sinais de uso.",
  },
  {
    Icon: Mail,
    titulo: "é só chamar a gente",
    texto: "manda um e-mail contando o que aconteceu que a gente te ajuda com os próximos passos.",
  },
];

function TrocasEDevolucoes() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)] text-center">
            TROCAS E DEVOLUÇÕES
          </h1>
          <p className="font-script text-2xl text-[color:var(--pink-deep)]/80 text-center mt-2">
            se não rolou, a gente resolve com você ✿
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {PONTOS.map(({ Icon, titulo, texto }) => (
              <div
                key={titulo}
                className="bg-white/80 rounded-2xl border border-[color:var(--pink-deep)]/10 p-5 text-center flex flex-col items-center"
              >
                <div className="w-11 h-11 rounded-full bg-[color:var(--pink-soft)] flex items-center justify-center text-[color:var(--pink-deep)] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-menu text-lg text-[color:var(--pink-deep)] mt-3">{titulo}</p>
                <p className="text-sm text-foreground/70 mt-1.5">{texto}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center space-y-4">
            <p className="text-foreground/70 max-w-xl mx-auto">
              trocas e devoluções em até 7 dias corridos após o recebimento, conforme o direito de
              arrependimento do Código de Defesa do Consumidor (art. 49).
            </p>
            <a
              href="mailto:contato@softshop.com"
              className="inline-block px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
            >
              falar com a gente
            </a>
          </div>

          <p className="text-center mt-8">
            <Link
              to="/produtos"
              className="text-sm text-[color:var(--pink-deep)] underline hover:opacity-80"
            >
              continuar garimpando
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
