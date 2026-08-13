import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CartContents } from "@/components/CartContents";
import { useCart } from "@/lib/cart";

export function CartModal() {
  const { isOpen, closeCart } = useCart();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <DialogContent className="bg-[color:var(--cream)] border-[color:var(--pink-deep)]/20 w-[calc(100%-2rem)] max-w-[360px] p-4 gap-2.5 max-h-[85vh] overflow-hidden flex flex-col rounded-2xl sm:rounded-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-menu text-xl text-[color:var(--pink-deep)]">
            sua sacolinha
          </DialogTitle>
        </DialogHeader>
        <CartContents />
      </DialogContent>
    </Dialog>
  );
}
