import { createFileRoute } from "@tanstack/react-router";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";
import strawberryBg from "@/assets/strawberry-bg.jpg";

import lambImg from "@/assets/lamb.png";
import softLogo from "@/assets/soft-logo.png.asset.json";
import catUp from "@/assets/cat-upcycling.png";
import catRw from "@/assets/cat-rework.png";
import catAu from "@/assets/cat-autorais.png";
import catGa from "@/assets/cat-garimpos.png";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import { ShoppingBasket, User, Menu, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

const categorias = [
  { img: catUp, title: "Upcycling", desc: "Peças reformadas criativamente a partir de uma peça já existente." },
  { img: catRw, title: "Rework", desc: "Peças alteradas de forma que as deixam mais interessantes, com poucas mudanças, mas diferença notável." },
  { img: catAu, title: "Autorais", desc: "Criações originais feitas do zero." },
  { img: catGa, title: "Garimpos", desc: "Peças prontas garimpadas previamente, exclusivas e únicas." },
];

const produtos = [
  { img: p1, nome: "cargo jacket preta M", preco: "R$ 110,00" },
  { img: p2, nome: "trench azul marinho M", preco: "R$ 60,00" },
  { img: p3, nome: "[upcycling] sainha jeans M/G", preco: "R$ 60,00" },
  { img: p4, nome: "sainha midi marrom P", preco: "R$ 25,00" },
];

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen text-foreground">
      {/* Ticker */}
      <div className="bg-[#a882f4] text-white font-menu text-[16px] overflow-hidden py-2 border-b border-[color:var(--pink-deep)]/20">
        <div className="whitespace-nowrap animate-[marquee_30s_linear_infinite] flex gap-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3">
              ✦ use nosso cupom de primeira compra: #FIRSTSHOFT ✿
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#fffffe] sticky top-0 z-40 border-b border-[color:var(--pink-deep)]/10">
        {/* Mobile bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 text-[color:var(--pink-deep)]">
          <button aria-label="menu" onClick={() => setMenuOpen(v => !v)} className="p-1">
            {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
          <img src={softLogo.url} alt="Soft Shop logo" className="h-16 w-auto object-contain" height={64} />
          <div className="flex items-center gap-3">
            <button aria-label="carrinho" className="relative flex items-center gap-1 font-pixel text-xl">
              <ShoppingBasket className="w-6 h-6" />
              <span>0</span>
            </button>
            <button aria-label="login" className="flex items-center font-menu text-xl">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="md:hidden flex flex-col items-stretch gap-1 px-4 pb-4 text-[#ffb5e3] font-menu text-lg">
            <NavBtn active>ínicio</NavBtn>
            <NavBtn>sobre a Soft!</NavBtn>
            <NavBtn>new DROP</NavBtn>
            <NavBtn>sacolinha</NavBtn>
            <NavBtn>produtos ⌄</NavBtn>
          </nav>
        )}

        {/* Desktop bar */}
        <div className="hidden md:grid max-w-7xl mx-auto grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-2 text-[#ffb5e3] font-menu text-xl justify-start min-w-0">
            <NavBtn active>ínicio</NavBtn>
            <NavBtn>sobre a Soft!</NavBtn>
            <NavBtn>new DROP</NavBtn>
          </nav>
          <img src={softLogo.url} alt="Soft Shop logo" className="h-14 w-auto object-contain justify-self-center shrink-0" height={56} />
          <div className="flex items-center gap-2 justify-end text-[#ffb5e3] font-menu text-xl min-w-0">
            <NavBtn>sacolinha</NavBtn>
            <NavBtn>produtos ⌄</NavBtn>
            <button className="relative flex items-center gap-1 font-pixel text-2xl ml-2 shrink-0">
              <ShoppingBasket className="w-7 h-7" />
              <span>0</span>
            </button>
            <button className="flex items-center gap-1 font-menu text-2xl shrink-0">
              <User className="w-6 h-6" />
              <span>login</span>
            </button>
          </div>
        </div>
      </header>


      {/* Hero Carousel */}
      <section
        className="relative"
        style={{ backgroundColor: "#eef9fd" }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16">
          <HeroCarousel slides={[banner1.url, banner2.url, banner3.url]} />
        </div>
      </section>

      {/* Categorias */}
      <section className="bg-[color:var(--cream)] py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)]">
            ÚLTIMOS GARIMPOS:
          </h2>
          <p className="font-script text-3xl text-[color:var(--pink-deep)]/80 mt-2">
</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {categorias.map((c) => (
              <div key={c.title} className="group cursor-pointer">
                <div className="aspect-square rounded-3xl bg-[color:var(--pink-soft)] p-4 flex items-center justify-center overflow-hidden border-2 border-[color:var(--pink-deep)]/10 transition-transform group-hover:-translate-y-1">
                  <img src={c.img} alt={c.title} className="w-full h-full object-contain" loading="lazy" />
                </div>
                <h3 className="font-menu text-2xl mt-4 text-[color:var(--pink-deep)]">{c.title}</h3>
                <p className="text-sm text-foreground/70 mt-2 max-w-[220px] mx-auto">{c.desc}</p>
              </div>
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
            <p className="font-unrulyness text-[60px] text-[#fffefe] mt-1">aproveite enquanto está dispo hihi</p>
            <a href="#" className="inline-block mt-3 font-menu text-[20px] text-[#fffefe] underline">tudo
</a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtos.map((p) => (
              <div key={p.nome} className="bg-[#fffefe]/80 backdrop-blur rounded-2xl overflow-hidden shadow-md border border-[color:var(--pink-deep)]/10 hover:-translate-y-1 transition">
                <div className="aspect-[4/5] overflow-hidden bg-[color:var(--pink-soft)]">
                  <img src={p.img} alt={p.nome} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4 text-center">
                  <p className="font-menu text-lg text-[color:var(--pink-deep)] leading-tight">{p.nome}</p>
                  <div className="my-2 border-t border-dashed border-[color:var(--pink-deep)]/30" />
                  <p className="text-sm">Preço<span className="font-semibold ml-1">{p.preco}</span></p>
                  <button className="mt-3 w-full py-2 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-lg hover:opacity-90">
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section className="bg-[color:var(--pink-soft)] py-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h2 className="font-menu text-4xl text-[color:var(--pink-deep)]">divas que estão usando Soft</h2>
          <p className="max-w-2xl mx-auto text-foreground/80">
            Aqui temos <b>DROPS diferentes a cada 15 dias</b>, com estilos, paletas e modelos de peças
            diferentes. Nossas "queridinhas" são exclusivas e únicas, com curadoria bem pensada por uma
            designer indie ^^
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {["Blooming Pieces", "One Woman Show", "Estilo joguinho"].map((t, i) => (
              <div key={t} className="rounded-3xl bg-white/70 p-6 border border-[color:var(--pink-deep)]/10">
                <div className="aspect-square rounded-2xl bg-[color:var(--sage)]/40 flex items-center justify-center text-6xl">
                  {["🌸", "✂️", "🎮"][i]}
                </div>
                <h3 className="font-menu text-2xl text-[color:var(--pink-deep)] mt-4">{t}</h3>
              </div>
            ))}
          </div>

          <p className="max-w-2xl mx-auto mt-8 text-foreground/80 font-script text-2xl">
            Todo o trabalho é feito 100% por mim, Ana (ou Nani)! Desde a produção até os envios. (= ⩊ =)೨
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#ffb5b0] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={lambImg} alt="lamb" className="w-12 h-12" width={48} height={48} loading="lazy" />
            <span className="font-pixel text-2xl">Soft Shop</span>
          </div>
          <p className="text-sm opacity-90">Suporte - Menu de compras - Redes Sociais&nbsp;</p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function NavBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-4 py-1.5 rounded-full border-2 transition ${
        active
          ? "bg-[#ebffde] border-[#ebffde] underline"
          : "border-transparent hover:bg-[#ebffde]"
      }`}
    >
      {children}
    </button>
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
