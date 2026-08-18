import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { formatarCpf } from "@/lib/cpf";
import { formatarTelefone } from "@/lib/telefone";
import { buscarEnderecoPorCep } from "@/lib/viacep";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/criar-conta")({
  component: CriarConta,
  validateSearch: searchSchema,
});

function formatarCep(value: string) {
  const digitos = value.replace(/\D/g, "").slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

function CriarConta() {
  const { redirect } = Route.useSearch();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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
  const [erro, setErro] = useState<string | null>(null);

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
    const res = await signUp(nome, email, senha, {
      telefone,
      cpf,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
    });
    if (!res.ok) {
      setErro(res.erro);
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

            <div className="pt-2 border-t border-[color:var(--pink-deep)]/10">
              <p className="text-xs text-foreground/50 mt-3">
                os campos abaixo são opcionais — dá pra completar depois em "minha conta"
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone">telefone (opcional)</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF (opcional)</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(formatarCpf(e.target.value))}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cep">CEP (opcional)</Label>
              <Input
                id="cep"
                value={cep}
                onChange={(e) => setCep(formatarCep(e.target.value))}
                onBlur={handleCepBlur}
                placeholder="00000-000"
              />
              {buscandoCep && <p className="text-xs text-foreground/50">buscando endereço...</p>}
            </div>
            {cep.replace(/\D/g, "").length === 8 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="logradouro">rua</Label>
                  <Input
                    id="logradouro"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="numero">número</Label>
                  <Input id="numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>
                <div className="col-span-3 space-y-1.5">
                  <Label htmlFor="complemento">complemento</Label>
                  <Input
                    id="complemento"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="bairro">bairro</Label>
                  <Input id="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                    maxLength={2}
                  />
                </div>
                <div className="col-span-3 space-y-1.5">
                  <Label htmlFor="cidade">cidade</Label>
                  <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </div>
              </div>
            )}

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
