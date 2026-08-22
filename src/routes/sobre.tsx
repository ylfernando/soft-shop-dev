import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import iconSobre from "@/assets/icon-sobre.jpeg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/sobre")({
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[#E3FDEF] py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-menu text-4xl md:text-5xl text-[#D1AFFA]">SOBRE</h1>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-40 h-40 rounded-full bg-[color:var(--pink-soft)] border-4 border-white shadow-md overflow-hidden">
              <img
                src={iconSobre}
                alt="Luiza Oltramari, fundadora da Soft"
                className="w-full h-full object-cover object-[50%_15%]"
              />
            </div>
            <a
              href="https://www.instagram.com/luizaoltramari"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-menu text-[#D1AFFA] hover:underline"
            >
              <Instagram className="w-4 h-4" />
              @luizaoltramari
            </a>
          </div>

          <div className="mt-8 space-y-5 text-left text-[#A9E8EB] leading-relaxed">
            <p>
              a Soft foi criada por mim em 2021 numa cidadezinha pequena do RS, inicialmente com o
              objetivo de trazer garimpos únicos e roupas estilosas para uma cidade interiorana…
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
              className="inline-block px-6 py-2.5 rounded-full bg-[#D1AFFA] text-white font-pixel text-base hover:opacity-90"
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
