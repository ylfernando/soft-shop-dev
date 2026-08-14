import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartContents } from "@/components/CartContents";

export const Route = createFileRoute("/carrinho")({
  component: Carrinho,
});

function Carrinho() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-menu text-4xl md:text-5xl text-[color:var(--pink-deep)] text-center mb-10">
            SUA SACOLINHA
          </h1>
          <CartContents />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
