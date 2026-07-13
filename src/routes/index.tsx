import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/nani-hero.jpg";
import plaidBg from "@/assets/plaid-bg.jpg";
import tagImg from "@/assets/tag.png";
import lambImg from "@/assets/lamb.png";
import catUp from "@/assets/cat-upcycling.png";
import catRw from "@/assets/cat-rework.png";
import catAu from "@/assets/cat-autorais.png";
import catGa from "@/assets/cat-garimpos.png";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import { ShoppingBasket, User } from "lucide-react";

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
  { img: p5, nome: "casaquinho creme P", preco: "R$ 60,00" },
  { img: p6, nome: "saia midí de poá M/G", preco: "R$ 45,00" },
];

function Index() {
  return (
    <div className="min-h-screen text-foreground">
      {/* Ticker */}
      <div className="bg-[color:var(--sage)]/40 text-[color:var(--pink-deep)] font-pixel text-xl overflow-hidden py-2 border-b border-[color:var(--pink-deep)]/20">
        <div className="whitespace-nowrap animate-[marquee_30s_linear_infinite] flex gap-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3">
              ✦ use nosso cupom de primeira compra no site ✿ com carinho, naniiicas
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="bg-[color:var(--pink-soft)] sticky top-0 z-40 border-b border-[color:var(--pink-deep)]/10">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 py-3">
          <img src={lambImg} alt="Nani lamb mascote" className="w-14 h-14 object-contain" width={56} height={56} />
          <nav className="flex-1 flex flex-wrap items-center gap-2 text-[color:var(--pink-deep)] font-pixel text-xl">
            <NavBtn active>home 谷</NavBtn>
            <NavBtn>Loja (onde voce é feliz)</NavBtn>
            <NavBtn>Sobre a nani</NavBtn>
            <NavBtn>Todos os produtos</NavBtn>
            <NavBtn>Configurações ⌄</NavBtn>
          </nav>
          <div className="flex items-center gap-4 text-[color:var(--pink-deep)]">
            <button className="relative flex items-center gap-1 font-pixel text-2xl">
              <ShoppingBasket className="w-7 h-7" />
              <span>0</span>
            </button>
            <button className="flex items-center gap-1 font-pixel text-2xl">
              <User className="w-6 h-6" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative"
        style={{ backgroundImage: `url(${plaidBg})`, backgroundSize: "600px" }}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 px-6 py-16 items-center">
          <div className="relative">
            <h1 className="font-pixel text-6xl md:text-7xl text-[color:var(--pink-deep)] leading-tight">
              Bem vinda ao<br />seu novo
            </h1>
            <p className="font-script text-6xl md:text-8xl text-[color:var(--pink-deep)] mt-2">
              guarda-roupa!
            </p>
            <a
              href="https://www.instagram.com/anocamiau/"
              className="inline-block mt-6 font-pixel text-xl text-[color:var(--pink-deep)] underline decoration-wavy underline-offset-4"
            >
              meus desenhos sz →
            </a>

            <div className="mt-12 flex items-start gap-4">
              <img src={tagImg} alt="tag" className="w-24 -rotate-6" width={96} height={144} loading="lazy" />
              <div className="pt-4">
                <p className="font-pixel text-xl text-[color:var(--pink-deep)]">
                  SUPORTE: <a href="https://www.instagram.com/naniiicas" className="underline">@naniiicas</a>
                </p>
                <p className="text-sm max-w-xs text-[color:var(--foreground)]/80 mt-1">
                  Me mande uma mensagem por lá que eu te atendo em qualquer problema que tiver.
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 bg-white/40">
              <img src={heroImg} alt="Nani ilustração" className="w-full h-auto" width={900} height={900} />
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="bg-[color:var(--cream)] py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-pixel text-4xl md:text-5xl text-[color:var(--pink-deep)]">
            O que você encontra aqui:
          </h2>
          <p className="font-script text-3xl text-[color:var(--pink-deep)]/80 mt-2">Entenda a diferença!</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {categorias.map((c) => (
              <div key={c.title} className="group cursor-pointer">
                <div className="aspect-square rounded-3xl bg-[color:var(--pink-soft)] p-4 flex items-center justify-center overflow-hidden border-2 border-[color:var(--pink-deep)]/10 transition-transform group-hover:-translate-y-1">
                  <img src={c.img} alt={c.title} className="w-full h-full object-contain" loading="lazy" />
                </div>
                <h3 className="font-pixel text-2xl mt-4 text-[color:var(--pink-deep)]">{c.title}</h3>
                <p className="text-sm text-foreground/70 mt-2 max-w-[220px] mx-auto">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Queridinhas */}
      <section
        className="py-20 px-6"
        style={{ backgroundImage: `url(${plaidBg})`, backgroundSize: "600px" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-pixel text-5xl md:text-6xl text-[color:var(--pink-deep)]">queridinhas</h2>
            <p className="font-script text-3xl text-[color:var(--pink-deep)]/80 mt-1">sinta-se em casa... ♥</p>
            <a href="#" className="inline-block mt-3 font-pixel text-xl text-[color:var(--pink-deep)] underline">ver tudo! ☆</a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtos.map((p) => (
              <div key={p.nome} className="bg-white/80 backdrop-blur rounded-2xl overflow-hidden shadow-md border border-[color:var(--pink-deep)]/10 hover:-translate-y-1 transition">
                <div className="aspect-[4/5] overflow-hidden bg-[color:var(--pink-soft)]">
                  <img src={p.img} alt={p.nome} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4 text-center">
                  <p className="font-pixel text-lg text-[color:var(--pink-deep)] leading-tight">{p.nome}</p>
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
          <h2 className="font-pixel text-4xl text-[color:var(--pink-deep)]">hora das compras!</h2>
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
                <h3 className="font-pixel text-2xl text-[color:var(--pink-deep)] mt-4">{t}</h3>
              </div>
            ))}
          </div>

          <p className="max-w-2xl mx-auto mt-8 text-foreground/80 font-script text-2xl">
            Todo o trabalho é feito 100% por mim, Ana (ou Nani)! Desde a produção até os envios. (= ⩊ =)೨
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[color:var(--pink-deep)] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={lambImg} alt="lamb" className="w-12 h-12" width={48} height={48} loading="lazy" />
            <span className="font-pixel text-2xl">naniiicas</span>
          </div>
          <p className="text-sm opacity-90">com carinho, feito por Nani ♥ @naniiicas</p>
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
          ? "bg-[color:var(--pink-deep)]/20 border-[color:var(--pink-deep)]/40 underline"
          : "border-transparent hover:bg-[color:var(--pink-deep)]/10"
      }`}
    >
      {children}
    </button>
  );
}
