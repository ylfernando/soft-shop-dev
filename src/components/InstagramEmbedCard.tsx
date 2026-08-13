import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadInstagramEmbedScript() {
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve) => {
      if (window.instgrm) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }
  return scriptLoadPromise;
}

interface InstagramEmbedCardProps {
  username: string;
  postUrl: string;
}

export function InstagramEmbedCard({ username, postUrl }: InstagramEmbedCardProps) {
  useEffect(() => {
    loadInstagramEmbedScript().then(() => window.instgrm?.Embeds.process());
  }, [postUrl]);

  return (
    <div className="rounded-3xl bg-white/70 p-6 border border-[color:var(--pink-deep)]/10">
      <h3 className="font-menu text-2xl text-[color:var(--pink-deep)] mb-4">@{username}</h3>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={postUrl}
        data-instgrm-version="14"
        style={{ margin: "0 auto", maxWidth: "100%", minWidth: "260px" }}
      />
    </div>
  );
}
