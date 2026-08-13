import lambImg from "@/assets/lamb.png";

export function SiteFooter() {
  return (
    <footer className="bg-[#ffb5b0] text-white py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={lambImg}
            alt="lamb"
            className="w-12 h-12"
            width={48}
            height={48}
            loading="lazy"
          />
          <span className="font-pixel text-2xl">Soft Shop</span>
        </div>
        <p className="text-sm opacity-90">Suporte - Menu de compras - Redes Sociais&nbsp;</p>
      </div>
    </footer>
  );
}
