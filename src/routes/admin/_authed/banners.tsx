import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  adminListBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
  adminReordenarBanners,
  type BannerRow,
} from "@/server-fns/admin/banners";
import { uploadImagem } from "@/server-fns/admin/upload";

export const Route = createFileRoute("/admin/_authed/banners")({
  component: AdminBanners,
  loader: () => adminListBanners(),
});

const bannerFormSchema = z.object({
  titulo: z.string().trim(),
  ativo: z.boolean(),
});
type BannerFormValues = z.infer<typeof bannerFormSchema>;

function AdminBanners() {
  const bannersIniciais = Route.useLoaderData();
  const [banners, setBanners] = useState<BannerRow[]>(bannersIniciais);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [editando, setEditando] = useState<BannerRow | null>(null);
  const [excluindo, setExcluindo] = useState<BannerRow | null>(null);

  const [ordemLocal, setOrdemLocal] = useState(bannersIniciais);
  const [pendingMoves, setPendingMoves] = useState<{ id: number; direcao: "up" | "down" }[]>([]);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);

  const listCall = useServerFn(adminListBanners);
  const deleteCall = useServerFn(adminDeleteBanner);
  const reordenarCall = useServerFn(adminReordenarBanners);

  // Só resincroniza com os dados do servidor quando não há reordenação
  // pendente — senão um refetch no meio da reordenação (ex: banner criado
  // ou excluído) apagaria a ordem que a pessoa ainda não salvou.
  const pendingMovesRef = useRef(pendingMoves);
  pendingMovesRef.current = pendingMoves;
  useEffect(() => {
    if (pendingMovesRef.current.length === 0) setOrdemLocal(banners);
  }, [banners]);

  const ordemAlterada = pendingMoves.length > 0;

  async function refetch() {
    setBanners(await listCall());
  }

  function moverLocal(id: number, direcao: "up" | "down") {
    setOrdemLocal((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const swapIdx = direcao === "up" ? idx - 1 : idx + 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
    setPendingMoves((prev) => [...prev, { id, direcao }]);
  }

  async function salvarOrdem() {
    setSalvandoOrdem(true);
    try {
      await reordenarCall({ data: { ids: ordemLocal.map((b) => b.id) } });
      setPendingMoves([]);
      toast.success("ordem salva.");
      await refetch();
    } catch {
      toast.error("não deu pra salvar a ordem, tenta de novo.");
    } finally {
      setSalvandoOrdem(false);
    }
  }

  function cancelarOrdem() {
    setOrdemLocal(banners);
    setPendingMoves([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Banners</h1>
        <Button
          disabled={ordemAlterada}
          onClick={() => {
            setEditando(null);
            setSheetAberto(true);
          }}
        >
          <Plus /> Novo banner
        </Button>
      </div>

      {banners.length === 0 && (
        <div className="border rounded-lg text-center text-muted-foreground py-8">
          nenhum banner cadastrado ainda.
        </div>
      )}

      {ordemAlterada && (
        <div className="flex items-center justify-between gap-2 bg-muted rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">ordem alterada, ainda não salva.</span>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={cancelarOrdem} disabled={salvandoOrdem}>
              cancelar
            </Button>
            <Button size="sm" onClick={salvarOrdem} disabled={salvandoOrdem}>
              {salvandoOrdem ? "salvando..." : "salvar ordem"}
            </Button>
          </div>
        </div>
      )}

      {banners.length > 0 && (
        <>
          <div className="border rounded-lg hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordemLocal.map((b, i) => (
                  <TableRow key={b.id}>
                    <TableCell className="space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={i === 0}
                        onClick={() => moverLocal(b.id, "up")}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={i === ordemLocal.length - 1}
                        onClick={() => moverLocal(b.id, "down")}
                      >
                        <ArrowDown />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <img
                        src={b.imgUrl}
                        alt={b.titulo ?? "banner"}
                        className="w-24 h-14 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      {b.titulo ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{b.ativo ? "sim" : "não"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={ordemAlterada}
                        onClick={() => {
                          setEditando(b);
                          setSheetAberto(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={ordemAlterada}
                        onClick={() => setExcluindo(b)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {ordemLocal.map((b, i) => (
              <div key={b.id} className="border rounded-lg p-3 flex gap-3">
                <img
                  src={b.imgUrl}
                  alt={b.titulo ?? "banner"}
                  className="w-24 h-16 object-cover rounded shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-medium truncate">
                    {b.titulo ?? <span className="text-muted-foreground">sem título</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {b.ativo ? "ativo" : "inativo"}
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === 0}
                      onClick={() => moverLocal(b.id, "up")}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === ordemLocal.length - 1}
                      onClick={() => moverLocal(b.id, "down")}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={ordemAlterada}
                      onClick={() => {
                        setEditando(b);
                        setSheetAberto(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={ordemAlterada}
                      onClick={() => setExcluindo(b)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <BannerFormSheet
        open={sheetAberto}
        onOpenChange={setSheetAberto}
        banner={editando}
        onSaved={refetch}
      />

      <AlertDialog open={!!excluindo} onOpenChange={(open) => !open && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esse banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O banner some da home imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!excluindo) return;
                await deleteCall({ data: { id: excluindo.id } });
                setExcluindo(null);
                toast.success("banner excluído.");
                await refetch();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BannerFormSheet({
  open,
  onOpenChange,
  banner,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: BannerRow | null;
  onSaved: () => Promise<void>;
}) {
  const uploadCall = useServerFn(uploadImagem);
  const createCall = useServerFn(adminCreateBanner);
  const updateCall = useServerFn(adminUpdateBanner);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    values: {
      titulo: banner?.titulo ?? "",
      ativo: banner?.ativo ?? true,
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

  async function onSubmit(values: BannerFormValues) {
    if (!banner && !arquivo) {
      toast.error("escolhe uma imagem pro banner.");
      return;
    }
    setSalvando(true);
    try {
      let imgUrl = banner?.imgUrl ?? "";
      if (arquivo) {
        const formData = new FormData();
        formData.set("arquivo", arquivo);
        formData.set("pasta", "banners");
        const res = await uploadCall({ data: formData });
        imgUrl = res.url;
      }

      const titulo = values.titulo.trim() || null;
      if (banner) {
        await updateCall({ data: { id: banner.id, imgUrl, titulo, ativo: values.ativo } });
        toast.success("banner atualizado.");
      } else {
        await createCall({ data: { imgUrl, titulo, ativo: values.ativo } });
        toast.success("banner criado.");
      }
      handleOpenChange(false);
      await onSaved();
    } catch {
      toast.error("não deu pra salvar o banner, tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{banner ? "Editar banner" : "Novo banner"}</SheetTitle>
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
              {(preview ?? banner?.imgUrl) && (
                <img
                  src={preview ?? banner!.imgUrl}
                  alt="preview"
                  className="w-full h-28 object-cover rounded mt-2"
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Ativo (aparece na home)</FormLabel>
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
