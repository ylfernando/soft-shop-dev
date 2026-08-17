import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ContaNav } from "@/components/ContaNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type AuthUser } from "@/lib/auth";
import { atualizarConta, alterarSenha } from "@/server-fns/auth";

export const Route = createFileRoute("/minha-conta")({
  component: MinhaConta,
});

function MinhaConta() {
  const { hydrated, user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      navigate({ to: "/entrar", search: { redirect: "/minha-conta" } });
    }
  }, [hydrated, user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-menu text-3xl text-[color:var(--pink-deep)]">
            configurações da conta
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            seus dados de cadastro e sua senha, tudo aqui ✿
          </p>

          <div className="mt-6">
            <ContaNav />
          </div>

          <div className="grid md:grid-cols-2 gap-4 items-start">
            <DadosForm user={user} updateUser={updateUser} />
            <SenhaForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function CardConta({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white/80 rounded-3xl p-6 sm:p-8 shadow-sm border border-[color:var(--pink-deep)]/10">
      <h2 className="font-menu text-xl text-[color:var(--pink-deep)]">{titulo}</h2>
      <p className="text-xs text-foreground/50 mt-1">{descricao}</p>
      {children}
    </div>
  );
}

function DadosForm({
  user,
  updateUser,
}: {
  user: AuthUser;
  updateUser: (user: AuthUser) => void;
}) {
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const atualizarContaCall = useServerFn(atualizarConta);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const res = await atualizarContaCall({ data: { nome, email } });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    updateUser(res.user);
    toast.success("dados atualizados ✿");
  }

  return (
    <CardConta titulo="meus dados" descricao="nome e e-mail usados no seu cadastro e nos pedidos.">
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

        {erro && <p className="text-sm text-red-500">{erro}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="w-full py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-lg hover:opacity-90 disabled:opacity-60 transition"
        >
          {salvando ? "salvando..." : "salvar dados"}
        </button>
      </form>
    </CardConta>
  );
}

function SenhaForm() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const alterarSenhaCall = useServerFn(alterarSenha);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const res = await alterarSenhaCall({ data: { senhaAtual, novaSenha } });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    setSenhaAtual("");
    setNovaSenha("");
    toast.success("senha alterada ✿");
  }

  return (
    <CardConta titulo="alterar senha" descricao="use pelo menos 4 caracteres pra sua nova senha.">
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="senha-atual">senha atual</Label>
          <Input
            id="senha-atual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nova-senha">nova senha</Label>
          <Input
            id="nova-senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            minLength={4}
            required
          />
        </div>

        {erro && <p className="text-sm text-red-500">{erro}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="w-full py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-lg hover:opacity-90 disabled:opacity-60 transition"
        >
          {salvando ? "salvando..." : "alterar senha"}
        </button>
      </form>
    </CardConta>
  );
}
