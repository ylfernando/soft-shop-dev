import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CartContents } from "@/components/CartContents";
import { useCart } from "@/lib/cart";

export function CartModal() {
  const { isOpen, closeCart } = useCart();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <DialogContent className="bg-[color:var(--cream)] border-[color:var(--pink-deep)]/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-menu text-2xl text-[color:var(--pink-deep)]">
            sua sacolinha
          </DialogTitle>
        </DialogHeader>
        <CartContents />
      </DialogContent>
    </Dialog>
  );
}
