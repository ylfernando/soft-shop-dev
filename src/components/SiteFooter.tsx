import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Phone, CreditCard, QrCode, Barcode } from "lucide-react";
import { useAuth } from "@/lib/auth";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82c-1.36-1.15-2.16-2.86-2.16-4.82h-3.1v14.4a2.6 2.6 0 1 1-1.83-2.48V9.66a5.7 5.7 0 1 0 4.93 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-2.14-1.48z" />
    </svg>
  );
}

const REDES_SOCIAIS = [
  { nome: "@softshopl", Icon: Instagram, href: "https://www.instagram.com/softshopl" },
  { nome: "@softshopl", Icon: TikTokIcon, href: "https://www.tiktok.com/@softshopl" },
];

const FORMAS_PAGAMENTO = [
  { nome: "crédito e débito", Icon: CreditCard },
  { nome: "Pix", Icon: QrCode },
  { nome: "boleto", Icon: Barcode },
];

export function SiteFooter() {
  const { user } = useAuth();

  return (
    <footer className="bg-white text-[color:var(--pink-deep)] py-8 sm:py-10 px-6 border-t border-[color:var(--pink-deep)]/10">
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8 sm:gap-x-8">
        <nav className="flex flex-col gap-1.5 sm:gap-2">
          <span className="font-menu text-[18px] text-[color:var(--pink-deep)]/60">mais infos</span>
          <Link
            to={user ? "/minhas-compras" : "/minha-conta"}
            className="font-menu text-[18px] hover:underline w-fit"
          >
            {user ? "minhas compras" : "minha conta"}
          </Link>
          <Link to="/envios" className="font-menu text-[18px] hover:underline w-fit">
            envios
          </Link>
          <Link to="/trocas-e-devolucoes" className="font-menu text-[18px] hover:underline w-fit">
            trocas e devoluções
          </Link>
        </nav>

        <nav className="flex flex-col gap-1.5 sm:gap-2">
          <span className="font-menu text-sm sm:text-lg text-[color:var(--pink-deep)]/60">
            redes sociais
          </span>
          {REDES_SOCIAIS.map(({ nome, Icon, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-menu text-base sm:text-xl hover:underline flex items-center gap-2 w-fit"
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              {nome}
            </a>
          ))}
        </nav>

        <nav className="col-span-2 sm:col-span-1 flex flex-col gap-1.5 sm:gap-2">
          <span className="font-menu text-sm sm:text-lg text-[color:var(--pink-deep)]/60">
            atendimento
          </span>
          <a
            href="mailto:softshopatendimento@hotmail.com"
            className="font-menu font-semibold text-sm sm:text-lg hover:underline flex items-center gap-2 w-fit break-all"
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            softshopatendimento@hotmail.com
          </a>
          <a
            href="tel:+5551982489638"
            className="font-menu font-semibold text-sm sm:text-lg hover:underline flex items-center gap-2 w-fit"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            (51) 98248-9638
          </a>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[color:var(--pink-deep)]/10 flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
        <span className="font-menu text-sm sm:text-base text-[color:var(--pink-deep)]/60">
          formas de pagamento
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {FORMAS_PAGAMENTO.map(({ nome, Icon }) => (
            <span key={nome} className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Icon className="w-4 h-4 shrink-0" />
              {nome}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
