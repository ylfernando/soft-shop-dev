import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, type ChangeEvent } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { adminListDivas, adminUpdateDiva, type DivaRow } from "@/server-fns/admin/divas";
import { uploadImagem } from "@/server-fns/admin/upload";

export const Route = createFileRoute("/admin/_authed/divas")({
  component: AdminDivas,
  loader: () => adminListDivas(),
});

const divaFormSchema = z.object({
  username: z.string().trim().min(1, "informe o username."),
  highlightUrl: z.string().trim().url("informe um link válido."),
});
type DivaFormValues = z.infer<typeof divaFormSchema>;

function AdminDivas() {
  const divasIniciais = Route.useLoaderData();
  const [divas, setDivas] = useState<DivaRow[]>(divasIniciais);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [editando, setEditando] = useState<DivaRow | null>(null);

  const listCall = useServerFn(adminListDivas);

  async function refetch() {
    setDivas(await listCall());
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Divas</h1>
        <p className="text-sm text-muted-foreground">
          os 3 cards de clientes em destaque na home — troque a foto e o link do destaque de cada
          um.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {divas.map((diva) => (
          <div key={diva.id} className="border rounded-lg p-3 space-y-3">
            <img
              src={diva.imgUrl}
              alt={`@${diva.username}`}
              className="w-full aspect-[9/16] object-cover rounded"
            />
            <div className="space-y-1">
              <div className="font-medium truncate">@{diva.username}</div>
              <a
                href={diva.highlightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground truncate block hover:underline"
              >
                {diva.highlightUrl}
              </a>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setEditando(diva);
                setSheetAberto(true);
              }}
            >
              <Pencil /> editar
            </Button>
          </div>
        ))}
      </div>

      <DivaFormSheet
        open={sheetAberto}
        onOpenChange={setSheetAberto}
        diva={editando}
        onSaved={refetch}
      />
    </div>
  );
}

function DivaFormSheet({
  open,
  onOpenChange,
  diva,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diva: DivaRow | null;
  onSaved: () => Promise<void>;
}) {
  const uploadCall = useServerFn(uploadImagem);
  const updateCall = useServerFn(adminUpdateDiva);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const form = useForm<DivaFormValues>({
    resolver: zodResolver(divaFormSchema),
    values: {
      username: diva?.username ?? "",
      highlightUrl: diva?.highlightUrl ?? "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setArquivo(null);
      setPreview(null);
    }
    onOpenChange(next);
  }

  function handleArquivoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setArquivo(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(values: DivaFormValues) {
    if (!diva) return;
    setSalvando(true);
    try {
      let imgUrl = diva.imgUrl;
      if (arquivo) {
        const formData = new FormData();
        formData.set("arquivo", arquivo);
        formData.set("pasta", "divas");
        const res = await uploadCall({ data: formData });
        imgUrl = res.url;
      }

      await updateCall({
        data: { id: diva.id, imgUrl, username: values.username, highlightUrl: values.highlightUrl },
      });
      toast.success("diva atualizada.");
      handleOpenChange(false);
      await onSaved();
    } catch {
      toast.error("não deu pra salvar, tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar diva</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Imagem</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleArquivoChange}
              />
              {(preview ?? diva?.imgUrl) && (
                <img
                  src={preview ?? diva!.imgUrl}
                  alt="preview"
                  className="w-full aspect-[9/16] object-cover rounded mt-2"
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username do Instagram</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="highlightUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do destaque</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://www.instagram.com/s/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button type="submit" disabled={salvando}>
                {salvando ? "salvando..." : "salvar"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
