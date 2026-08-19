import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { solicitarRedefinicaoSenha } from "@/server-fns/auth";

export const Route = createFileRoute("/esqueci-senha")({
  component: EsqueciSenha,
});

function EsqueciSenha() {
  const solicitarCall = useServerFn(solicitarRedefinicaoSenha);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    await solicitarCall({ data: { email } });
    setEnviando(false);
    setEnviado(true);
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-16 px-6">
        <div className="max-w-sm mx-auto bg-white/80 rounded-3xl p-8 shadow-md border border-[color:var(--pink-deep)]/10">
          {!enviado ? (
            <>
              <h1 className="font-menu text-3xl text-[color:var(--pink-deep)] text-center">
                esqueci minha senha
              </h1>
              <p className="text-sm text-center text-foreground/60 mt-2">
                digita seu e-mail e a gente manda um link pra você escolher uma nova senha ✿
              </p>

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

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-lg hover:opacity-90 disabled:opacity-60"
                >
                  {enviando ? "enviando..." : "enviar link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                confere seu e-mail ✿
              </h1>
              <p className="text-sm text-foreground/60 mt-2">
                se tiver uma conta com esse e-mail, a gente acabou de mandar um link pra redefinir a
                senha. o link expira em 1 hora.
              </p>
            </div>
          )}

          <p className="text-lg text-center text-foreground/60 mt-6">
            lembrou a senha?{" "}
            <Link to="/entrar" className="underline text-[color:var(--pink-deep)]">
              entrar
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
