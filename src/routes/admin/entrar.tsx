import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin } from "@/server-fns/admin/auth";

export const Route = createFileRoute("/admin/entrar")({
  component: AdminEntrar,
});

function AdminEntrar() {
  const navigate = useNavigate();
  const adminLoginCall = useServerFn(adminLogin);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    try {
      const res = await adminLoginCall({ data: { email, senha } });
      if (!res.ok) {
        setErro(res.erro);
        return;
      }
      navigate({ to: "/admin" });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border rounded-xl p-8 shadow">
        <h1 className="text-xl font-semibold text-center text-foreground">painel admin</h1>
        <p className="text-sm text-center text-muted-foreground mt-1">
          acesso restrito à equipe Soft
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              e-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="senha" className="text-sm font-medium text-foreground">
              senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full h-9 rounded-md bg-[color:var(--pink-deep)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {carregando ? "entrando..." : "entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
