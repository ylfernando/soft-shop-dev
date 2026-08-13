import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";

const REDES_SOCIAIS = [
  { nome: "Instagram", Icon: Instagram, href: "#" },
  { nome: "Facebook", Icon: Facebook, href: "#" },
];

export function SiteFooter() {
  const { openCart } = useCart();

  return (
    <footer className="bg-[#ffb5b0] text-white py-8 sm:py-10 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-8 sm:gap-4 items-start">
        <div className="hidden sm:block" aria-hidden="true" />

        <nav className="flex flex-col gap-1.5 sm:gap-2 sm:mx-auto">
          <span className="font-menu text-sm sm:text-lg text-white/70">menu</span>
          <Link
            to="/"
            hash="sobre"
            className="font-menu text-base sm:text-xl hover:underline w-fit"
          >
            sobre a soft
          </Link>
          <button
            onClick={openCart}
            className="font-menu text-base sm:text-xl hover:underline text-left w-fit"
          >
            sacolinha
          </button>
          <button
            onClick={() => toast("contato ainda não está disponível — em breve! ✿")}
            className="font-menu text-base sm:text-xl hover:underline text-left w-fit"
          >
            contato
          </button>
        </nav>

        <div className="flex flex-wrap gap-8 sm:gap-16 sm:ml-auto">
          <nav className="flex flex-col gap-1.5 sm:gap-2">
            <span className="font-menu text-sm sm:text-lg text-white/70">redes sociais</span>
            {REDES_SOCIAIS.map(({ nome, Icon, href }) => (
              <a
                key={nome}
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

          <nav className="flex flex-col gap-1.5 sm:gap-2">
            <span className="font-menu text-sm sm:text-lg text-white/70">atendimento</span>
            <a
              href="mailto:contato@softshop.com"
              className="font-menu text-sm sm:text-lg hover:underline flex items-center gap-2 w-fit break-all"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              contato@softshop.com
            </a>
            <span className="font-menu text-sm sm:text-lg flex items-center gap-2 w-fit">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              seg a sex, 9h às 18h
            </span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
