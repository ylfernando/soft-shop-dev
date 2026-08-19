import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redefinirSenha } from "@/server-fns/auth";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/redefinir-senha")({
  component: RedefinirSenha,
  validateSearch: searchSchema,
});

function RedefinirSenha() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const redefinirCall = useServerFn(redefinirSenha);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErro(null);
    if (novaSenha !== confirmarSenha) {
      setErro("as senhas não são iguais.");
      return;
    }

    setSalvando(true);
    const res = await redefinirCall({ data: { token, novaSenha } });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }

    toast.success("senha redefinida ✿ já pode entrar com a nova senha.");
    navigate({ to: "/entrar" });
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-16 px-6">
        <div className="max-w-sm mx-auto bg-white/80 rounded-3xl p-8 shadow-md border border-[color:var(--pink-deep)]/10">
          {!token ? (
            <div className="text-center">
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">ops</h1>
              <p className="text-sm text-red-500 mt-2">link de redefinição inválido.</p>
              <Link
                to="/esqueci-senha"
                className="inline-block mt-6 underline text-sm text-[color:var(--pink-deep)]"
              >
                pedir um novo link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-menu text-3xl text-[color:var(--pink-deep)] text-center">
                nova senha
              </h1>
              <p className="text-sm text-center text-foreground/60 mt-2">
                escolhe uma nova senha pra sua conta ✿
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="novaSenha">nova senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmarSenha">confirmar nova senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                  />
                </div>

                {erro && <p className="text-sm text-red-500">{erro}</p>}

                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-lg hover:opacity-90 disabled:opacity-60"
                >
                  {salvando ? "salvando..." : "redefinir senha"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
