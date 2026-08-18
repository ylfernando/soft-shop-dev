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
import {
  atualizarConta,
  alterarSenha,
  getMeuPerfil,
  reenviarVerificacaoEmail,
  type PerfilCompleto,
} from "@/server-fns/auth";
import { formatarCpf } from "@/lib/cpf";
import { formatarTelefone } from "@/lib/telefone";
import { buscarEnderecoPorCep } from "@/lib/viacep";

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

          <VerificacaoBanner user={user} />

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

function VerificacaoBanner({ user }: { user: AuthUser }) {
  const [reenviando, setReenviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const reenviarCall = useServerFn(reenviarVerificacaoEmail);

  if (user.emailVerificado) return null;

  async function reenviar() {
    setReenviando(true);
    const res = await reenviarCall();
    setReenviando(false);
    if (!res.ok) {
      toast.error(res.erro);
      return;
    }
    setEnviado(true);
    toast.success("e-mail de verificação reenviado ✿");
  }

  return (
    <div className="mt-4 bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
      <p className="text-sm text-amber-800">
        seu e-mail ainda não foi confirmado — você precisa confirmar antes de finalizar uma compra.
      </p>
      <button
        onClick={reenviar}
        disabled={reenviando || enviado}
        className="shrink-0 text-sm font-menu text-amber-800 underline disabled:opacity-60"
      >
        {enviado ? "e-mail reenviado" : reenviando ? "enviando..." : "reenviar e-mail"}
      </button>
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

function formatarCep(value: string) {
  const digitos = value.replace(/\D/g, "").slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

function DadosForm({ user, updateUser }: { user: AuthUser; updateUser: (user: AuthUser) => void }) {
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const atualizarContaCall = useServerFn(atualizarConta);
  const getMeuPerfilCall = useServerFn(getMeuPerfil);

  useEffect(() => {
    getMeuPerfilCall().then((perfil: PerfilCompleto) => {
      setTelefone(formatarTelefone(perfil.telefone));
      setCpf(formatarCpf(perfil.cpf));
      setCep(formatarCep(perfil.cep));
      setLogradouro(perfil.logradouro);
      setNumero(perfil.numero);
      setComplemento(perfil.complemento);
      setBairro(perfil.bairro);
      setCidade(perfil.cidade);
      setUf(perfil.uf);
      setCarregandoPerfil(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCepBlur() {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    setBuscandoCep(true);
    const endereco = await buscarEnderecoPorCep(cepLimpo);
    setBuscandoCep(false);
    if (!endereco) return;
    setLogradouro(endereco.logradouro);
    setBairro(endereco.bairro);
    setCidade(endereco.localidade);
    setUf(endereco.uf);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const res = await atualizarContaCall({
      data: {
        nome,
        email,
        telefone,
        cpf,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
      },
    });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    updateUser(res.user);
    toast.success("dados atualizados ✿");
  }

  return (
    <CardConta
      titulo="meus dados"
      descricao="nome, contato, CPF e endereço usados no seu cadastro e nos pedidos."
    >
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
          {email !== user.email && (
            <p className="text-xs text-amber-700">
              trocar o e-mail vai exigir uma nova confirmação por e-mail.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telefone">telefone</Label>
          <Input
            id="telefone"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            placeholder="(00) 00000-0000"
            disabled={carregandoPerfil}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={cpf}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
            placeholder="000.000.000-00"
            disabled={carregandoPerfil}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={cep}
            onChange={(e) => setCep(formatarCep(e.target.value))}
            onBlur={handleCepBlur}
            placeholder="00000-000"
            disabled={carregandoPerfil}
          />
          {buscandoCep && <p className="text-xs text-foreground/50">buscando endereço...</p>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="logradouro">rua</Label>
            <Input
              id="logradouro"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              disabled={carregandoPerfil}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="numero">número</Label>
            <Input
              id="numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              disabled={carregandoPerfil}
            />
          </div>
          <div className="col-span-3 space-y-1.5">
            <Label htmlFor="complemento">complemento</Label>
            <Input
              id="complemento"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              disabled={carregandoPerfil}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="bairro">bairro</Label>
            <Input
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              disabled={carregandoPerfil}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf">UF</Label>
            <Input
              id="uf"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              disabled={carregandoPerfil}
            />
          </div>
          <div className="col-span-3 space-y-1.5">
            <Label htmlFor="cidade">cidade</Label>
            <Input
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              disabled={carregandoPerfil}
            />
          </div>
        </div>

        {erro && <p className="text-sm text-red-500">{erro}</p>}

        <button
          type="submit"
          disabled={salvando || carregandoPerfil}
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
