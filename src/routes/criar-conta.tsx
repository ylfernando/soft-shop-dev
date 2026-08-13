import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { PENDING_ADD_KEY, addPendingItemToStorage } from "@/lib/cart";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/criar-conta")({
  component: CriarConta,
  validateSearch: searchSchema,
});

function CriarConta() {
  const { redirect } = Route.useSearch();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const res = signUp(nome, email, senha);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }

    const pending = localStorage.getItem(PENDING_ADD_KEY);
    if (pending) {
      addPendingItemToStorage(res.email, pending);
      localStorage.removeItem(PENDING_ADD_KEY);
      toast.success("Conta criada e peça adicionada à sacolinha ✿");
      navigate({ to: "/carrinho" });
      return;
    }

    toast.success("Conta criada, bem-vinda(o) à Soft ✿");
    if (redirect) navigate({ href: redirect });
    else navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-16 px-6">
        <div className="max-w-sm mx-auto bg-white/80 rounded-3xl p-8 shadow-md border border-[color:var(--pink-deep)]/10">
          <h1 className="font-menu text-3xl text-[color:var(--pink-deep)] text-center">
            criar conta
          </h1>
          <p className="text-sm text-center text-foreground/60 mt-2">é rapidinho, prometo ✿</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">e-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={4}
                required
              />
            </div>

            {erro && <p className="text-sm text-red-500">{erro}</p>}

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-lg hover:opacity-90"
            >
              criar conta
            </button>
          </form>

          <p className="text-sm text-center text-foreground/60 mt-6">
            já tem conta?{" "}
            <Link
              to="/entrar"
              search={{ redirect }}
              className="underline text-[color:var(--pink-deep)]"
            >
              entrar
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
