import { Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { formatPreco } from "@/data/produtos";
import { useCart, FRETE_GRATIS_A_PARTIR_DE_CENTAVOS } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

function formatarCep(value: string) {
  const digitos = value.replace(/\D/g, "").slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

export function CartContents() {
  const {
    lines,
    subtotalCentavos,
    cep,
    setCep,
    freteEscolhido,
    freteGratis,
    calculandoFrete,
    erroFrete,
    calcularFrete,
    freteCentavos,
    freteDeterminado,
    cupomInput,
    setCupomInput,
    cupomAplicado,
    aplicandoCupom,
    erroCupom,
    aplicarCupomAgora,
    removerCupom,
    descontoCentavos,
    totalCentavos,
    removeItem,
    closeCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const cepLimpo = cep.replace(/\D/g, "");
  const podeFinalizar = cepLimpo.length === 8 && freteDeterminado;

  function irParaFinalizarCompra() {
    if (!podeFinalizar) return;
    closeCart();
    if (!user) {
      navigate({ to: "/entrar", search: { redirect: "/finalizar-compra" } });
      return;
    }
    navigate({ to: "/finalizar-compra" });
  }

  function continuarComprando() {
    closeCart();
    navigate({ to: "/produtos" });
  }

  if (lines.length === 0) {
    return (
      <div className="text-center py-10 text-foreground/60">
        <p className="font-menu text-xl text-[color:var(--pink-deep)]">sua sacolinha está vazia</p>
        <Link
          to="/produtos"
          onClick={closeCart}
          className="inline-block mt-4 underline text-[color:var(--pink-deep)]"
        >
          ir pros produtos
        </Link>
      </div>
    );
  }

  const faltaParaFreteGratis = FRETE_GRATIS_A_PARTIR_DE_CENTAVOS - subtotalCentavos;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {lines.map((line) => (
          <div
            key={line.produtoId}
            className="flex items-center gap-2.5 bg-white/80 rounded-xl p-2.5 border border-[color:var(--pink-deep)]/10"
          >
            <div className="w-14 h-[4.5rem] rounded-lg overflow-hidden bg-[color:var(--pink-soft)] shrink-0">
              <img
                src={line.produto.img}
                alt={line.produto.nome}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-menu text-sm text-[color:var(--pink-deep)] truncate">
                {line.produto.nome}
              </p>
              <p className="mt-0.5 text-[11px] text-foreground/50">peça única</p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className="font-semibold text-xs">
                {formatPreco(line.produto.precoCentavos)}
              </span>
              <button
                aria-label="remover item"
                onClick={() => removeItem(line.produtoId)}
                className="text-foreground/40 hover:text-[color:var(--pink-deep)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 space-y-1.5 text-xs">
        <p className="text-[11px] font-medium text-foreground/60">endereço de entrega</p>
        <div className="flex gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            placeholder="CEP (00000-000)"
            value={cep}
            onChange={(e) => setCep(formatarCep(e.target.value))}
            maxLength={9}
            className="flex-1 h-8 px-2.5 rounded-full border border-[color:var(--pink-deep)]/30 bg-white/70 text-xs focus:outline-none focus:ring-1 focus:ring-[color:var(--pink-deep)]"
          />
          {calculandoFrete && (
            <span className="flex items-center px-3 text-[11px] text-foreground/50 shrink-0">
              calculando...
            </span>
          )}
        </div>
        {erroFrete && !freteGratis && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-destructive">{erroFrete}</p>
            {cepLimpo.length === 8 && (
              <button
                type="button"
                onClick={calcularFrete}
                className="text-[11px] underline text-[color:var(--pink-deep)] shrink-0"
              >
                tentar de novo
              </button>
            )}
          </div>
        )}
        {freteEscolhido && !freteGratis && (
          <p className="text-[11px] text-foreground/50">
            {freteEscolhido.transportadora} · {freteEscolhido.nome} · até {freteEscolhido.prazoDias}{" "}
            dia{freteEscolhido.prazoDias === 1 ? "" : "s"} útei{freteEscolhido.prazoDias === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="shrink-0 space-y-1.5 text-xs">
        <p className="text-[11px] font-medium text-foreground/60">cupom de desconto</p>
        {cupomAplicado ? (
          <div className="flex items-center justify-between gap-2 bg-white/70 rounded-full px-3 h-8 border border-[color:var(--pink-deep)]/30">
            <span className="text-[color:var(--pink-deep)] font-menu">
              {cupomAplicado.codigo} · -{cupomAplicado.percentualDesconto}%
            </span>
            <button
              type="button"
              onClick={removerCupom}
              aria-label="remover cupom"
              className="text-foreground/40 hover:text-[color:var(--pink-deep)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="código do cupom"
              value={cupomInput}
              onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
              className="flex-1 h-8 px-2.5 rounded-full border border-[color:var(--pink-deep)]/30 bg-white/70 text-xs focus:outline-none focus:ring-1 focus:ring-[color:var(--pink-deep)]"
            />
            <button
              type="button"
              onClick={aplicarCupomAgora}
              disabled={aplicandoCupom || !cupomInput.trim()}
              className="px-3 rounded-full border border-[color:var(--pink-deep)] text-[color:var(--pink-deep)] text-xs font-menu hover:bg-[color:var(--pink-deep)]/10 disabled:opacity-60 shrink-0"
            >
              {aplicandoCupom ? "aplicando..." : "aplicar"}
            </button>
          </div>
        )}
        {erroCupom && <p className="text-[11px] text-destructive">{erroCupom}</p>}
      </div>

      <div className="shrink-0 space-y-1 pt-2.5 border-t border-[color:var(--pink-deep)]/20 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Subtotal</span>
          <span>{formatPreco(subtotalCentavos)}</span>
        </div>
        {cupomAplicado && (
          <div className="flex items-center justify-between text-[color:var(--pink-deep)]">
            <span>Desconto ({cupomAplicado.percentualDesconto}%)</span>
            <span>-{formatPreco(descontoCentavos)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Frete</span>
          <span>
            {freteGratis
              ? "grátis ✿"
              : freteEscolhido
                ? formatPreco(freteCentavos)
                : "informe o CEP"}
          </span>
        </div>
        {!freteGratis && (
          <p className="text-[11px] text-foreground/50">
            faltam {formatPreco(faltaParaFreteGratis)} pro frete grátis
          </p>
        )}
        <div className="flex items-center justify-between font-menu text-base text-[color:var(--pink-deep)] pt-1">
          <span>Total</span>
          <span>{formatPreco(totalCentavos)}</span>
        </div>
      </div>

      <div className="shrink-0 space-y-1.5">
        <button
          onClick={irParaFinalizarCompra}
          disabled={!podeFinalizar}
          className="w-full py-2.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base hover:opacity-90 disabled:opacity-60"
        >
          Finalizar compra
        </button>
        {!podeFinalizar && (
          <p className="text-[11px] text-center text-foreground/50">
            informe o CEP e calcule o frete pra continuar
          </p>
        )}
        <button
          onClick={continuarComprando}
          className="w-full py-2 rounded-full border border-[color:var(--pink-deep)] text-[color:var(--pink-deep)] font-pixel text-sm hover:bg-[color:var(--pink-deep)]/10"
        >
          Continuar comprando
        </button>
      </div>
    </div>
  );
}
