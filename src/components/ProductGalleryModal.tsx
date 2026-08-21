import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShoppingBasket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProdutoImagens, getProdutoDetalhe } from "@/server-fns/produtos";
import type { Produto } from "@/data/produtos";
import { useCart } from "@/lib/cart";

export function ProductGalleryModal({
  produto,
  open,
  onOpenChange,
}: {
  produto: Produto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imagens, setImagens] = useState<string[]>([produto.img]);
  const [idx, setIdx] = useState(0);
  // A lista de produtos da página pode estar desatualizada (ex: editado no
  // admin em outra aba) — busca os dados atuais direto do banco ao abrir.
  const [detalhe, setDetalhe] = useState<Produto>(produto);
  const getImagensCall = useServerFn(getProdutoImagens);
  const getDetalheCall = useServerFn(getProdutoDetalhe);
  const { lines, addItem, openCart } = useCart();

  const jaNaSacolinha = lines.some((l) => l.produtoId === produto.id);

  function handleAdd() {
    addItem(detalhe);
    onOpenChange(false);
    openCart();
  }

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    setDetalhe(produto);
    getImagensCall({ data: { produtoId: produto.id } }).then((res) => {
      setImagens(res.length > 0 ? res : [produto.img]);
    });
    getDetalheCall({ data: { produtoId: produto.id } }).then((res) => {
      if (res) setDetalhe(res);
    });
  }, [open, produto, getImagensCall, getDetalheCall]);

  // Avança sozinho a cada 3s — reinicia a contagem a cada troca (manual ou automática).
  useEffect(() => {
    if (!open || imagens.length <= 1) return;
    const timer = setTimeout(() => {
      setIdx((i) => (i + 1) % imagens.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [open, imagens.length, idx]);

  function go(n: number) {
    setIdx((n + imagens.length) % imagens.length);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] p-0 overflow-hidden flex flex-col
          bg-[color:var(--cream)] border-[color:var(--pink-deep)]/20
          [&>button]:top-3 [&>button]:right-3 [&>button]:bg-white/90 [&>button]:hover:bg-white
          [&>button]:rounded-full [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:shadow-md
          [&>button_svg]:h-5 [&>button_svg]:w-5 [&>button]:text-[color:var(--pink-deep)]"
      >
        <div className="relative shrink-0 h-[68vh] max-h-[620px] bg-[color:var(--pink-soft)]">
          {imagens.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={`${produto.nome} - foto ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}

          {imagens.length > 1 && (
            <>
              <button
                aria-label="foto anterior"
                onClick={() => go(idx - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[color:var(--pink-deep)] font-pixel text-xl flex items-center justify-center shadow-md"
              >
                ‹
              </button>
              <button
                aria-label="próxima foto"
                onClick={() => go(idx + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[color:var(--pink-deep)] font-pixel text-xl flex items-center justify-center shadow-md"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {imagens.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`ir para foto ${i + 1}`}
                    onClick={() => setIdx(i)}
                    className={`w-2.5 h-2.5 rounded-full transition ${
                      i === idx ? "bg-[color:var(--pink-deep)]" : "bg-[color:var(--pink-deep)]/30"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <DialogHeader className="sr-only">
          <DialogTitle>{produto.nome}</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 flex flex-col items-center px-6 py-6 border-t border-[color:var(--pink-deep)]/10">
          {detalhe.descricao && (
            <p className="mb-6 max-w-md text-center text-base text-[color:var(--pink-deep)] whitespace-pre-line">
              {detalhe.descricao}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={jaNaSacolinha}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[color:var(--pink-deep)] text-white font-pixel text-base shadow-md hover:opacity-90 hover:shadow-lg transition disabled:opacity-60"
          >
            <ShoppingBasket className="w-4 h-4" />
            {jaNaSacolinha ? "Já está na sacolinha ✿" : "comprar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
