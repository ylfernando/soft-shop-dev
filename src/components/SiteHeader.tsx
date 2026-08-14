import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import softLogo from "@/assets/soft-logo.png.asset.json";
import { ShoppingBasket, User, Menu, X, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { tipos } from "@/data/produtos";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function SiteHeader({ current }: { current?: "inicio" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openCart } = useCart();
  return (
    <>
      {/* Ticker */}
      <div className="bg-[#a882f4] text-white font-menu text-[16px] overflow-hidden py-2 border-b border-[color:var(--pink-deep)]/20">
        <div className="whitespace-nowrap animate-[marquee_30s_linear_infinite] flex gap-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3">
              ✦ use nosso cupom de primeira compra: #FIRSTSHOFT ✿
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#fffffe] sticky top-0 z-40 border-b border-[color:var(--pink-deep)]/10">
        {/* Mobile bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 text-[color:var(--pink-deep)]">
          <button aria-label="menu" onClick={() => setMenuOpen((v) => !v)} className="p-1">
            {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
          <Link to="/">
            <img
              src={softLogo.url}
              alt="Soft Shop logo"
              className="h-16 w-auto object-contain"
              height={64}
            />
          </Link>
          <div className="flex items-center gap-3">
            <CartButton size="sm" />
            <AccountMenu size="sm" />
          </div>
        </div>
        {menuOpen && (
          <nav className="md:hidden flex flex-col items-center gap-1 px-4 pb-4 text-[#ffb5e3] font-menu text-lg">
            <NavBtn to="/" active={current === "inicio"}>
              ínicio
            </NavBtn>
            <NavBtn>sobre a Soft!</NavBtn>
            <NavBtn to="/produtos" search={{ categoria: "newdrop" }}>
              new DROP
            </NavBtn>
            <NavBtn onClick={openCart}>sacolinha</NavBtn>
            <ProdutosDropdown />
          </nav>
        )}

        {/* Desktop bar */}
        <div className="hidden md:grid max-w-7xl mx-auto grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-2 text-[#ffb5e3] font-menu text-xl justify-start min-w-0">
            <NavBtn to="/" active={current === "inicio"}>
              ínicio
            </NavBtn>
            <NavBtn>sobre a Soft!</NavBtn>
            <NavBtn onClick={openCart}>sacolinha</NavBtn>
          </nav>
          <Link to="/">
            <img
              src={softLogo.url}
              alt="Soft Shop logo"
              className="h-14 w-auto object-contain justify-self-center shrink-0"
              height={56}
            />
          </Link>
          <div className="flex items-center gap-2 justify-end text-[#ffb5e3] font-menu text-xl min-w-0">
            <NavBtn to="/produtos" search={{ categoria: "newdrop" }}>
              NewDrop
            </NavBtn>
            <ProdutosDropdown />
            <CartButton size="lg" />
            <AccountMenu size="lg" />
          </div>
        </div>
      </header>
    </>
  );
}

function NavBtn({
  children,
  active,
  to,
  search,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  to?: string;
  search?: Record<string, unknown>;
  onClick?: () => void;
}) {
  const className = `px-4 py-1.5 rounded-full border-2 transition ${
    active ? "bg-[#ebffde] border-[#ebffde] underline" : "border-transparent hover:bg-[#ebffde]"
  }`;
  if (to) {
    return (
      <Link to={to} search={search} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function CartButton({ size }: { size: "sm" | "lg" }) {
  const { count, openCart } = useCart();
  return (
    <button
      onClick={openCart}
      aria-label="carrinho"
      className={
        size === "lg"
          ? "relative flex items-center gap-1 font-pixel text-2xl ml-2 shrink-0"
          : "relative flex items-center gap-1 font-pixel text-xl"
      }
    >
      <ShoppingBasket className={size === "lg" ? "w-7 h-7" : "w-6 h-6"} />
      <span>{count}</span>
    </button>
  );
}

function AccountMenu({ size }: { size: "sm" | "lg" }) {
  const { user, logout } = useAuth();
  const { openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Link
        to="/entrar"
        search={{ redirect: location.href }}
        aria-label="login"
        className={
          size === "lg"
            ? "flex items-center gap-1 font-menu text-2xl shrink-0"
            : "flex items-center font-menu text-xl"
        }
      >
        <User className="w-6 h-6" />
        {size === "lg" && <span>login</span>}
      </Link>
    );
  }

  const primeiroNome = user.nome.split(" ")[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          size === "lg"
            ? "flex items-center gap-1 font-menu text-2xl shrink-0 outline-none"
            : "flex items-center font-menu text-xl outline-none"
        }
      >
        <User className="w-6 h-6" />
        {size === "lg" && <span>{primeiroNome}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-menu min-w-[10rem]">
        <DropdownMenuItem disabled>oi, {primeiroNome} ✿</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openCart}>minha sacolinha</DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link to="/admin">painel admin</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => {
            logout();
            navigate({ to: "/" });
          }}
        >
          sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProdutosDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-4 py-1.5 rounded-full border-2 border-transparent hover:bg-[#ebffde] transition inline-flex items-center gap-1 outline-none">
        produtos <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="font-menu min-w-[10rem]">
        {tipos.map((t) => (
          <DropdownMenuItem key={t.value} asChild>
            <Link to="/produtos" search={{ tipo: [t.value] }}>
              {t.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/produtos">Ver todos os produtos</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
