import { createFileRoute, Link } from "@tanstack/react-router";
import promosBg from "@/assets/promos-bg-bala.png";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { InstagramEmbedCard } from "@/components/InstagramEmbedCard";
import { getVitrines } from "@/server-fns/vitrines";
import { getBannersAtivos } from "@/server-fns/banners";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async () => {
    const [vitrines, banners] = await Promise.all([getVitrines(), getBannersAtivos()]);
    return { vitrines, banners };
  },
});

// TODO: trocar pelos posts/reels reais das divas que a Soft quer destacar
const divasDaSoft = [
  { username: "usuaria1", postUrl: "https://www.instagram.com/p/SEU_POST_AQUI/" },
  { username: "usuaria2", postUrl: "https://www.instagram.com/p/SEU_POST_AQUI/" },
  { username: "usuaria3", postUrl: "https://www.instagram.com/p/SEU_POST_AQUI/" },
];

const contentGradient = `linear-gradient(to bottom,
  #eef9fd 0%, #eef9fd 22%,
  #fffade 26%, #fffade 33%,
  var(--pink-soft) 37%, var(--pink-soft) 82%,
  #d1affa 90%, #d1affa 100%)`;

function Index() {
  const { vitrines, banners } = Route.useLoaderData();
  const { garimpos, promos, newdrop } = vitrines;

  return (
    <div className="min-h-screen text-foreground">
      <SiteHeader current="inicio" />

      <div style={{ backgroundImage: contentGradient }}>
        {/* Hero Carousel */}
        <section className="relative">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16">
            <HeroCarousel slides={banners.map((b) => b.imgUrl)} />
          </div>
        </section>

        {/* newDROP */}
        {newdrop.length > 0 && (
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)]">
                  newDROP
                </h2>
                <p className="font-script text-3xl text-[color:var(--pink-deep)]/80 mt-2">
                  acabou de chegar
                </p>
                <Link
                  to="/produtos"
                  search={{ categoria: "newdrop" }}
                  className="inline-block mt-3 font-menu text-base sm:text-[20px] text-[color:var(--pink-deep)] underline"
                >
                  tudo
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {newdrop.map((p) => (
                  <div key={p.id} className="w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)]">
                    <ProductCard produto={p} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Últimos garimpos */}
        {garimpos.length > 0 && (
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="font-menu text-3xl sm:text-4xl md:text-6xl text-[#a9e8eb]">
                ÚLTIMOS GARIMPOS
              </h2>
              <p className="font-script text-3xl text-[#a9e8eb]/80 mt-2"></p>

              <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-12">
                {garimpos.map((p) => (
                  <div key={p.id} className="w-[calc(50%-0.375rem)] sm:w-[calc(25%-1.125rem)]">
                    <ProductCard
                      produto={p}
                      titleColorClass="text-[#a9e8eb]"
                      buttonColorClass="bg-[#a9e8eb]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Queridinhas */}
        {promos.length > 0 && (
          <section
            className="py-20 px-6 min-h-[1000px] flex items-center"
            style={{
              backgroundImage: `url(${promosBg})`,
              backgroundSize: "contain",
              backgroundPosition: "center 60%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="w-full max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-menu text-3xl sm:text-4xl md:text-6xl text-[#fffefe]">
                  PROMOS DA SEMANA
                </h2>
                <p className="font-unrulyness text-3xl sm:text-4xl md:text-[60px] text-[#fffefe] mt-1 leading-[0.95]">
                  aproveite enquanto está disponível,
                  <br />
                  toda semana temos promos diferentes!
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                {promos.map((p) => (
                  <div key={p.id} className="w-[calc(50%-0.375rem)] sm:w-[calc(25%-1.125rem)]">
                    <ProductCard
                      produto={p}
                      titleColorClass="text-[#ffb5e3]"
                      buttonColorClass="bg-[#ffb5e3]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Sobre */}
        <section id="sobre" className="py-20 px-6">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <h2 className="font-menu text-[30px] sm:text-[60px] text-[#fffefe]">DIVAS QUE ESTÃO USANDO SOFT</h2>
            <p className="font-unrulyness max-w-2xl mx-auto text-3xl sm:text-4xl md:text-[60px] text-[#fffefe]/80 leading-[0.95]">
              comprou algo na Soft? poste sua fotinho e nos marque!
            </p>

            {/* Desktop: os 3 usuários empilhados */}
            <div className="hidden sm:flex flex-col gap-6 max-w-md mx-auto mt-10">
              {divasDaSoft.map((diva) => (
                <InstagramEmbedCard key={diva.username} {...diva} />
              ))}
            </div>

            {/* Responsivo: um usuário por vez, em slide */}
            <div className="sm:hidden max-w-md mx-auto mt-10">
              <DivasCarousel divas={divasDaSoft} />
            </div>

            <p className="max-w-2xl mx-auto mt-8 text-[#fffefe]/80 font-script text-2xl">{"\n"}</p>
          </div>
        </section>
      </div>

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

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative">
      <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 bg-white/40 aspect-[16/8.5]">
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
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-[#ffb5e3] flex items-center justify-center shadow-md"
      >
        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>
      <button
        aria-label="próximo"
        onClick={() => go(idx + 1)}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-[#ffb5e3] flex items-center justify-center shadow-md"
      >
        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
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

function DivasCarousel({ divas }: { divas: { username: string; postUrl: string }[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (divas.length < 2) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % divas.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [divas.length]);

  return (
    <div className="relative">
      <InstagramEmbedCard {...divas[idx]} />
    </div>
  );
}
