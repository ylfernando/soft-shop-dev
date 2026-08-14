import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Clock, CreditCard, QrCode, Barcode } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";

const REDES_SOCIAIS = [
  { nome: "Instagram", Icon: Instagram, href: "#" },
  { nome: "Facebook", Icon: Facebook, href: "#" },
];

const FORMAS_PAGAMENTO = [
  { nome: "crédito e débito", Icon: CreditCard },
  { nome: "Pix", Icon: QrCode },
  { nome: "boleto", Icon: Barcode },
];

export function SiteFooter() {
  const { openCart } = useCart();

  return (
    <footer className="bg-[#ffb5b0] text-white py-8 sm:py-10 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8 sm:gap-x-8">
        <nav className="flex flex-col gap-1.5 sm:gap-2">
          <span className="font-menu text-sm sm:text-lg text-white/70">menu</span>
          <Link
            to="/"
            hash="sobre"
            className="font-menu text-base sm:text-xl hover:underline w-fit"
          >
            sobre a soft
          </Link>
          <Link
            to="/produtos"
            search={{ categoria: "newdrop" }}
            className="font-menu text-base sm:text-xl hover:underline w-fit"
          >
            últimos produtos
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

        <nav className="col-span-2 sm:col-span-1 flex flex-col gap-1.5 sm:gap-2">
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

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <span className="font-menu text-sm sm:text-base text-white/70">formas de pagamento</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {FORMAS_PAGAMENTO.map(({ nome, Icon }) => (
              <span key={nome} className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Icon className="w-4 h-4 shrink-0" />
                {nome}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-white/70 max-w-sm">
          Trocas e devoluções em até 7 dias corridos após o recebimento, conforme o direito de
          arrependimento do Código de Defesa do Consumidor (art. 49).
        </p>
      </div>
    </footer>
  );
}
