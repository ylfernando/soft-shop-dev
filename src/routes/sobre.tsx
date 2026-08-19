import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, Heart } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/sobre")({
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)]">SOBRE</h1>

          {/* imagem redonda: troque este placeholder por uma foto real assim que tiver uma */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-40 h-40 rounded-full bg-[color:var(--pink-soft)] border-4 border-white shadow-md flex items-center justify-center text-[color:var(--pink-deep)]">
              <Heart className="w-14 h-14" />
            </div>
            <a
              href="https://www.instagram.com/luizaoltramari"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-menu text-[color:var(--pink-deep)] hover:underline"
            >
              <Instagram className="w-4 h-4" />
              @luizaoltramari
            </a>
          </div>

          <div className="mt-8 space-y-5 text-left text-foreground/80 leading-relaxed">
            <p>
              a Soft foi criada por mim (@luizaoltramari) em 2021 numa cidadezinha pequena do RS,
              inicialmente com o objetivo de trazer garimpos únicos e roupas estilosas para uma
              cidade interiorana…
            </p>
            <p>
              com o aumento das vendas online e a vinda para Floripa, a Soft voltou em 2024 com uma
              ideia que foi se aperfeiçoando, agora com foco maior no consumo consciente e moda
              circular, ainda trazendo peças únicas e estilosas para o seu guarda-roupa!
            </p>
          </div>

          <div className="mt-10">
            <Link
              to="/produtos"
              className="inline-block px-6 py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90"
            >
              ver produtos
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
