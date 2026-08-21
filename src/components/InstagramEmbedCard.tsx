import { Instagram } from "lucide-react";

interface InstagramEmbedCardProps {
  username: string;
  highlightUrl: string;
}

export function InstagramEmbedCard({ username, highlightUrl }: InstagramEmbedCardProps) {
  return (
    <a
      href={highlightUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-3xl bg-white/70 p-6 border border-[color:var(--pink-deep)]/10 hover:bg-white transition"
    >
      <span className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] flex items-center justify-center">
        <Instagram className="w-6 h-6 text-white" />
      </span>
      <span className="flex flex-col text-left">
        <span className="font-menu text-2xl text-[color:var(--pink-deep)]">@{username}</span>
        <span className="text-sm text-[color:var(--pink-deep)]/70">ver destaque no Instagram</span>
      </span>
    </a>
  );
}
