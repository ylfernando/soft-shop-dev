import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { tipos, categoriaLabels, formatPreco, type Produto } from "@/data/produtos";
import {
  MAX_IMAGENS_POR_PRODUTO,
  adminListProdutos,
  adminCreateProduto,
  adminUpdateProduto,
  adminDeleteProduto,
  adminListProdutoImagens,
  adminAddProdutoImagem,
  adminRemoveProdutoImagem,
  adminMoverProdutoImagem,
  type ProdutoImagemRow,
} from "@/server-fns/admin/produtos";
import { uploadImagem } from "@/server-fns/admin/upload";

export const Route = createFileRoute("/admin/_authed/produtos")({
  component: AdminProdutos,
  loader: () => adminListProdutos(),
});

const produtoFormSchema = z.object({
  nome: z.string().trim().min(1, "obrigatório"),
  precoReais: z.coerce.number({ message: "obrigatório" }).positive("precisa ser maior que zero"),
  categoria: z.enum(["cima", "baixo", "calcados", "vestido", "newdrop"]),
  tamanho: z.string().trim().min(1, "obrigatório"),
  medidas: z.string().trim().min(1, "obrigatório"),
});
type ProdutoFormValues = z.infer<typeof produtoFormSchema>;

function AdminProdutos() {
  const produtosIniciais = Route.useLoaderData();
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState<Produto | null>(null);

  const listCall = useServerFn(adminListProdutos);
  const deleteCall = useServerFn(adminDeleteProduto);
  async function refetch() {
    setProdutos(await listCall());
  }

  function abrirNovo() {
    setEditando(null);
    setSheetAberto(true);
  }

  function abrirEdicao(produto: Produto) {
    setEditando(produto);
    setSheetAberto(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Button onClick={abrirNovo}>
          <Plus /> Novo produto
        </Button>
      </div>

      {produtos.length === 0 && (
        <div className="border rounded-lg text-center text-muted-foreground py-8">
          nenhum produto cadastrado ainda.
        </div>
      )}

      {produtos.length > 0 && (
        <>
          <div className="border rounded-lg hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <img src={p.img} alt={p.nome} className="w-12 h-14 object-cover rounded" />
                    </TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{tipos.find((t) => t.value === p.tipo)?.label ?? p.tipo}</TableCell>
                    <TableCell>{categoriaLabels[p.categoria]}</TableCell>
                    <TableCell>
                      {p.tamanho || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{formatPreco(p.precoCentavos)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEdicao(p)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setExcluindo(p)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {produtos.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 flex gap-3">
                <img
                  src={p.img}
                  alt={p.nome}
                  className="w-16 h-20 object-cover rounded shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-medium truncate">{p.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {tipos.find((t) => t.value === p.tipo)?.label ?? p.tipo} ·{" "}
                    {categoriaLabels[p.categoria]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tamanho: {p.tamanho || "—"}
                  </div>
                  <div className="font-medium">{formatPreco(p.precoCentavos)}</div>
                  <div className="flex gap-1 pt-1">
                    <Button variant="ghost" size="icon" onClick={() => abrirEdicao(p)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setExcluindo(p)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ProdutoFormSheet
        open={sheetAberto}
        onOpenChange={setSheetAberto}
        produto={editando}
        onSaved={refetch}
      />

      <AlertDialog open={!!excluindo} onOpenChange={(open) => !open && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{excluindo?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O produto some da loja imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!excluindo) return;
                await deleteCall({ data: { id: excluindo.id } });
                setExcluindo(null);
                toast.success("produto excluído.");
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

interface ArquivoPendente {
  file: File;
  url: string;
}

function ProdutoFormSheet({
  open,
  onOpenChange,
  produto,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: Produto | null;
  onSaved: () => Promise<void>;
}) {
  const uploadCall = useServerFn(uploadImagem);
  const createCall = useServerFn(adminCreateProduto);
  const updateCall = useServerFn(adminUpdateProduto);
  const listImagensCall = useServerFn(adminListProdutoImagens);
  const addImagemCall = useServerFn(adminAddProdutoImagem);
  const removeImagemCall = useServerFn(adminRemoveProdutoImagem);
  const moverImagemCall = useServerFn(adminMoverProdutoImagem);

  const [imagensExistentes, setImagensExistentes] = useState<ProdutoImagemRow[]>([]);
  const [novosArquivos, setNovosArquivos] = useState<ArquivoPendente[]>([]);
  const [salvando, setSalvando] = useState(false);

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoFormSchema),
    values: {
      nome: produto?.nome ?? "",
      precoReais: produto ? produto.precoCentavos / 100 : 0,
      categoria: produto?.categoria ?? "cima",
      tamanho: produto?.tamanho ?? "",
      medidas: produto?.medidas ?? "",
    },
  });

  useEffect(() => {
    if (!open || !produto) {
      setImagensExistentes([]);
      return;
    }
    listImagensCall({ data: { produtoId: produto.id } }).then(setImagensExistentes);
  }, [open, produto, listImagensCall]);

  const totalImagens = imagensExistentes.length + novosArquivos.length;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setNovosArquivos([]);
    }
    onOpenChange(next);
  }

  function handleArquivosChange(e: ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(e.target.files ?? []);
    e.target.value = "";
    const espaco = MAX_IMAGENS_POR_PRODUTO - totalImagens;
    if (espaco <= 0) {
      toast.error(`cada produto pode ter no máximo ${MAX_IMAGENS_POR_PRODUTO} imagens.`);
      return;
    }
    if (selecionados.length > espaco) {
      toast.error(
        `só cabe${espaco === 1 ? "" : "m"} mais ${espaco} imagem${espaco === 1 ? "" : "ns"} nesse produto.`,
      );
    }
    const aceitos = selecionados
      .slice(0, espaco)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setNovosArquivos((prev) => [...prev, ...aceitos]);
  }

  function removerNovo(i: number) {
    setNovosArquivos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function removerExistente(img: ProdutoImagemRow) {
    if (!produto) return;
    try {
      await removeImagemCall({ data: { id: img.id, produtoId: produto.id } });
      setImagensExistentes((prev) => prev.filter((i) => i.id !== img.id));
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "não deu pra remover a imagem.");
    }
  }

  async function moverExistente(img: ProdutoImagemRow, direcao: "up" | "down") {
    if (!produto) return;
    await moverImagemCall({ data: { id: img.id, produtoId: produto.id, direcao } });
    setImagensExistentes(await listImagensCall({ data: { produtoId: produto.id } }));
    await onSaved();
  }

  async function enviarNovosArquivos(produtoId: string) {
    for (const { file } of novosArquivos) {
      const formData = new FormData();
      formData.set("arquivo", file);
      formData.set("pasta", "produtos");
      const res = await uploadCall({ data: formData });
      await addImagemCall({ data: { produtoId, url: res.url } });
    }
  }

  async function onSubmit(values: ProdutoFormValues) {
    if (totalImagens === 0) {
      toast.error("escolhe pelo menos 1 imagem pro produto.");
      return;
    }
    setSalvando(true);
    try {
      const precoCentavos = Math.round(values.precoReais * 100);
      // tipo não tem mais campo próprio no formulário: espelha categoria, já
      // que os dois passaram a ter exatamente o mesmo domínio de valores.
      if (produto) {
        await updateCall({
          data: {
            id: produto.id,
            nome: values.nome,
            precoCentavos,
            tipo: values.categoria,
            categoria: values.categoria,
            tamanho: values.tamanho,
            medidas: values.medidas,
          },
        });
        await enviarNovosArquivos(produto.id);
        toast.success("produto atualizado.");
      } else {
        const formDataPrimeira = new FormData();
        formDataPrimeira.set("arquivo", novosArquivos[0].file);
        formDataPrimeira.set("pasta", "produtos");
        const primeira = await uploadCall({ data: formDataPrimeira });

        const criado = await createCall({
          data: {
            img: primeira.url,
            nome: values.nome,
            precoCentavos,
            tipo: values.categoria,
            categoria: values.categoria,
            tamanho: values.tamanho,
            medidas: values.medidas,
          },
        });

        for (const { file } of novosArquivos.slice(1)) {
          const formData = new FormData();
          formData.set("arquivo", file);
          formData.set("pasta", "produtos");
          const res = await uploadCall({ data: formData });
          await addImagemCall({ data: { produtoId: criado.id, url: res.url } });
        }
        toast.success("produto criado.");
      }
      handleOpenChange(false);
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "não deu pra salvar o produto, tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{produto ? "Editar produto" : "Novo produto"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>
                Fotos ({totalImagens}/{MAX_IMAGENS_POR_PRODUTO})
              </Label>

              <div className="flex flex-wrap gap-2">
                {imagensExistentes.map((img, i) => (
                  <div
                    key={img.id}
                    className="group relative w-20 h-24 rounded overflow-hidden border"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-0.5 left-0.5 bg-[color:var(--pink-deep)] text-white text-[10px] px-1 rounded">
                        capa
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 py-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        aria-label="mover pra cima"
                        onClick={() => moverExistente(img, "up")}
                        disabled={i === 0}
                        className="text-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="mover pra baixo"
                        onClick={() => moverExistente(img, "down")}
                        disabled={i === imagensExistentes.length - 1}
                        className="text-white disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="remover imagem"
                        onClick={() => removerExistente(img)}
                        className="text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {novosArquivos.map((arquivo, i) => (
                  <div
                    key={arquivo.url}
                    className="relative w-20 h-24 rounded overflow-hidden border border-dashed"
                  >
                    <img
                      src={arquivo.url}
                      alt=""
                      className="w-full h-full object-cover opacity-80"
                    />
                    <button
                      type="button"
                      aria-label="remover imagem"
                      onClick={() => removerNovo(i)}
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {totalImagens < MAX_IMAGENS_POR_PRODUTO && (
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleArquivosChange}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="precoReais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tamanho"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho</FormLabel>
                  <FormControl>
                    <Input placeholder="M, G, 38, único..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medidas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medidas</FormLabel>
                  <FormControl>
                    <Input placeholder="Comprimento 70cm, Busto 90cm..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(categoriaLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
