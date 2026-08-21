import { Instagram } from "lucide-react";

interface InstagramEmbedCardProps {
  username: string;
  highlightUrl: string;
  imgUrl: string;
}

export function InstagramEmbedCard({ username, highlightUrl, imgUrl }: InstagramEmbedCardProps) {
  return (
    <a
      href={highlightUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full aspect-[9/16] rounded-3xl overflow-hidden border border-[color:var(--pink-deep)]/10 shadow-lg"
    >
      <img
        src={imgUrl}
        alt={`@${username}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-5">
        <span className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] flex items-center justify-center">
          <Instagram className="w-5 h-5 text-white" />
        </span>
        <span className="flex flex-col text-left">
          <span className="font-menu text-2xl text-white">@{username}</span>
          <span className="text-sm text-white/80">ver destaque no Instagram</span>
        </span>
      </div>
    </a>
  );
}
