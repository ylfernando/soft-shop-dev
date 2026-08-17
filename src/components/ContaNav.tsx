import { Link, useLocation } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";

const ABAS = [
  { to: "/minhas-compras", label: "minhas compras" },
  { to: "/minha-conta", label: "configurações" },
] as const;

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/** Cabeçalho compartilhado das páginas da conta (minhas compras / configurações)
 * — dá a sensação de um único painel com seções, em vez de duas páginas soltas. */
export function ContaNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
          <AvatarFallback className="bg-[color:var(--pink-deep)] text-white font-menu text-sm">
            {iniciais(user.nome)}
          </AvatarFallback>
        </Avatar>
        <div className="leading-tight">
          <p className="font-menu text-lg text-[color:var(--pink-deep)]">oi, {user.nome} ✿</p>
          <p className="text-xs text-foreground/50">{user.email}</p>
        </div>
      </div>

      <nav className="flex items-center gap-2 shrink-0">
        {ABAS.map((aba) => {
          const ativo = pathname === aba.to;
          return (
            <Link
              key={aba.to}
              to={aba.to}
              className={`px-4 py-1.5 rounded-full font-menu text-sm border-2 transition ${
                ativo
                  ? "bg-[color:var(--pink-deep)] border-[color:var(--pink-deep)] text-white"
                  : "border-[color:var(--pink-deep)]/20 text-[color:var(--pink-deep)] hover:bg-[color:var(--pink-soft)]/50"
              }`}
            >
              {aba.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
