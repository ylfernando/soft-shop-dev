import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBasket, Sparkles, Clock3 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/sobre-a-sacolinha")({
  component: SobreASacolinha,
});

const PONTOS = [
  {
    Icon: ShoppingBasket,
    titulo: "guarda suas escolhas",
    texto:
      "vai clicando em \"adicionar ao carrinho\" nas peças que curtir — a sacolinha guarda tudo no seu navegador, sem precisar criar conta só pra isso.",
  },
  {
    Icon: Sparkles,
    titulo: "peça única de verdade",
    texto:
      "cada peça da Soft é uma unidade só. colocar na sacolinha não reserva o item — se outra pessoa fechar o pedido primeiro, ele sai do catálogo pra sempre.",
  },
  {
    Icon: Clock3,
    titulo: "conta só entra na hora de fechar",
    texto:
      "dá pra montar sua sacolinha inteira sem login. login e endereço só são pedidos quando você for revisar e confirmar o pedido de verdade.",
  },
];

function SobreASacolinha() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)] text-center">
            SOBRE A SACOLINHA
          </h1>
          <p className="font-script text-2xl text-[color:var(--pink-deep)]/80 text-center mt-2">
            a sacolinha é onde suas peças favoritas esperam por você ✿
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
              achou uma peça que combinou com você? não deixa pra depois — como é tudo garimpo
              único, quem finaliza primeiro leva pra casa ✿
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/carrinho"
                className="inline-block px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
              >
                ver minha sacolinha
              </Link>
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
