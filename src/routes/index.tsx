import { createFileRoute, Link } from "@tanstack/react-router";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";
import strawberryBg from "@/assets/strawberry-bg.jpg";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { produtos } from "@/data/produtos";

export const Route = createFileRoute("/")({
  component: Index,
});

const garimpos = produtos.filter((p) => p.categoria === "garimpos");
const promos = produtos.slice(0, 4);

function Index() {
  return (
    <div className="min-h-screen text-foreground">
      <SiteHeader current="inicio" />

      {/* Hero Carousel */}
      <section className="relative" style={{ backgroundColor: "#eef9fd" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16">
          <HeroCarousel slides={[banner1, banner2, banner3]} />
        </div>
      </section>

      {/* Últimos garimpos */}
      <section className="bg-[color:var(--cream)] py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)]">
            ÚLTIMOS GARIMPOS:
          </h2>
          <p className="font-script text-3xl text-[color:var(--pink-deep)]/80 mt-2"></p>

          <div className="grid grid-cols-2 gap-6 mt-12 max-w-2xl mx-auto">
            {garimpos.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Queridinhas */}
      <section
        className="py-20 px-6"
        style={{ backgroundImage: `url(${strawberryBg})`, backgroundSize: "600px" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-menu text-5xl md:text-6xl text-[#fffefe]">PROMOS DA SEMANA</h2>
            <p className="font-unrulyness text-[60px] text-[#fffefe] mt-1">
              aproveite enquanto está dispo hihi
            </p>
            <Link
              to="/produtos"
              className="inline-block mt-3 font-menu text-[20px] text-[#fffefe] underline"
            >
              tudo
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {promos.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section className="bg-[color:var(--pink-soft)] py-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h2 className="font-menu text-4xl text-[color:var(--pink-deep)]">
            divas que estão usando Soft
          </h2>
          <p className="max-w-2xl mx-auto text-foreground/80">
            não esqueça de nos marcar nas suas fotinhos usando peças da Soft Shop {"<"}3
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {["Blooming Pieces", "One Woman Show", "Estilo joguinho"].map((t, i) => (
              <div
                key={t}
                className="rounded-3xl bg-white/70 p-6 border border-[color:var(--pink-deep)]/10"
              >
                <div className="aspect-square rounded-2xl bg-[color:var(--sage)]/40 flex items-center justify-center text-6xl">
                  {["🌸", "✂️", "🎮"][i]}
                </div>
                <h3 className="font-menu text-2xl text-[color:var(--pink-deep)] mt-4">{t}</h3>
              </div>
            ))}
          </div>

          <p className="max-w-2xl mx-auto mt-8 text-foreground/80 font-script text-2xl">{"\n"}</p>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function HeroCarousel({ slides }: { slides: string[] }) {
  const [idx, setIdx] = useState(0);
  const go = (n: number) => setIdx((n + slides.length) % slides.length);
  return (
    <div className="relative">
      <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 bg-white/40 aspect-[16/9]">
        {slides.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`slide ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === idx ? "opacity-100" : "opacity-0"}`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>
      <button
        aria-label="anterior"
        onClick={() => go(idx - 1)}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[color:var(--pink-deep)] font-pixel text-xl flex items-center justify-center shadow-md"
      >
        ‹
      </button>
      <button
        aria-label="próximo"
        onClick={() => go(idx + 1)}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[color:var(--pink-deep)] font-pixel text-xl flex items-center justify-center shadow-md"
      >
        ›
      </button>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`ir para slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`w-2.5 h-2.5 rounded-full transition ${i === idx ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
