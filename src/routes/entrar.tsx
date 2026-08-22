import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/entrar")({
  component: Entrar,
  validateSearch: searchSchema,
});

function Entrar() {
  const { redirect } = Route.useSearch();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function aposLoginOk() {
    toast.success("Bem-vinda(o) de volta ✿");
    if (redirect) navigate({ href: redirect });
    else navigate({ to: "/" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await login(email, senha);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    aposLoginOk();
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[#FDDDEC] py-16 px-6">
        <div className="max-w-sm mx-auto bg-white/80 rounded-3xl p-8 shadow-md border border-[color:var(--pink-deep)]/10">
          <h1 className="font-menu text-3xl text-[#A882F4] text-center">entrar</h1>
          <p className="text-sm text-center text-[#D1AFFA] mt-2">que bom te ver de novo ✿</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">senha</Label>
                <Link to="/esqueci-senha" className="text-xs underline text-[#A882F4]">
                  esqueceu a senha?
                </Link>
              </div>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {erro && <p className="text-sm text-red-500">{erro}</p>}

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#A882F4] text-white font-pixel text-lg hover:opacity-90"
            >
              entrar
            </button>
          </form>

          <p className="text-lg text-center text-[#D1AFFA] mt-6">
            ainda não tem conta?{" "}
            <Link to="/criar-conta" search={{ redirect }} className="underline text-[#A882F4]">
              criar uma
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
