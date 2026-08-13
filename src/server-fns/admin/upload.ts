import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "./session";

const PASTAS = ["produtos", "banners"] as const;
type Pasta = (typeof PASTAS)[number];

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024;

export const uploadImagem = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(async ({ data }): Promise<{ url: string }> => {
    await requireAdmin();

    const arquivo = data.get("arquivo");
    const pasta = data.get("pasta");

    if (!(arquivo instanceof File)) {
      throw new Error("nenhum arquivo enviado.");
    }
    if (typeof pasta !== "string" || !PASTAS.includes(pasta as Pasta)) {
      throw new Error("pasta de destino inválida.");
    }
    const ext = MIME_EXT[arquivo.type];
    if (!ext) {
      throw new Error("formato de imagem não suportado. use JPG, PNG ou WEBP.");
    }
    if (arquivo.size > MAX_BYTES) {
      throw new Error("imagem maior que 5MB.");
    }

    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", pasta);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), Buffer.from(await arquivo.arrayBuffer()));

    return { url: `/uploads/${pasta}/${filename}` };
  });
