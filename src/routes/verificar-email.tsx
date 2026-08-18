import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { confirmarVerificacaoEmail } from "@/server-fns/auth";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/verificar-email")({
  component: VerificarEmail,
  validateSearch: searchSchema,
});

type Estado = "verificando" | "sucesso" | "erro";

function VerificarEmail() {
  const { token } = Route.useSearch();
  const confirmarCall = useServerFn(confirmarVerificacaoEmail);
  const [estado, setEstado] = useState<Estado>("verificando");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setEstado("erro");
      setErro("link de verificação inválido.");
      return;
    }
    confirmarCall({ data: { token } }).then((res) => {
      if (res.ok) {
        setEstado("sucesso");
      } else {
        setEstado("erro");
        setErro(res.erro);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-16 px-6">
        <div className="max-w-sm mx-auto bg-white/80 rounded-3xl p-8 shadow-md border border-[color:var(--pink-deep)]/10 text-center">
          {estado === "verificando" && (
            <p className="text-sm text-foreground/60">confirmando seu e-mail...</p>
          )}
          {estado === "sucesso" && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">
                e-mail confirmado ✿
              </h1>
              <p className="text-sm text-foreground/60 mt-2">
                agora você já pode finalizar suas compras.
              </p>
            </>
          )}
          {estado === "erro" && (
            <>
              <h1 className="font-menu text-2xl text-[color:var(--pink-deep)]">ops</h1>
              <p className="text-sm text-red-500 mt-2">{erro}</p>
            </>
          )}
          <Link
            to="/minha-conta"
            className="inline-block mt-6 underline text-sm text-[color:var(--pink-deep)]"
          >
            ir pra minha conta
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
