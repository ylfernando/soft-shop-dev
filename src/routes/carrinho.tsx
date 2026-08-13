import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartContents } from "@/components/CartContents";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/carrinho")({
  component: Carrinho,
});

function Carrinho() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !user) {
      navigate({ to: "/entrar", search: { redirect: "/carrinho" } });
    }
  }, [hydrated, user, navigate]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen text-foreground flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center text-foreground/60 py-24">
          carregando sua sacolinha...
        </div>
        <SiteFooter />
      </div>
    );
  }

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
