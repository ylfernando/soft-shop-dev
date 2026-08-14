import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  adminListCupons,
  adminCreateCupom,
  adminUpdateCupom,
  adminDeleteCupom,
  type CupomRow,
} from "@/server-fns/admin/cupons";

export const Route = createFileRoute("/admin/_authed/cupons")({
  component: AdminCupons,
  loader: () => adminListCupons(),
});

const cupomFormSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, "mínimo 2 caracteres")
    .max(30, "máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9]+$/, "só letras e números, sem espaço"),
  percentualDesconto: z.coerce
    .number({ message: "obrigatório" })
    .int("precisa ser um número inteiro")
    .min(1, "mínimo 1%")
    .max(100, "máximo 100%"),
  ativo: z.boolean(),
});
type CupomFormValues = z.infer<typeof cupomFormSchema>;

function AdminCupons() {
  const cuponsIniciais = Route.useLoaderData();
  const [cupons, setCupons] = useState<CupomRow[]>(cuponsIniciais);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [editando, setEditando] = useState<CupomRow | null>(null);
  const [excluindo, setExcluindo] = useState<CupomRow | null>(null);

  const listCall = useServerFn(adminListCupons);
  const deleteCall = useServerFn(adminDeleteCupom);

  async function refetch() {
    setCupons(await listCall());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Cupons</h1>
        <Button
          onClick={() => {
            setEditando(null);
            setSheetAberto(true);
          }}
        >
          <Plus /> Novo cupom
        </Button>
      </div>

      {cupons.length === 0 && (
        <div className="border rounded-lg text-center text-muted-foreground py-8">
          nenhum cupom cadastrado ainda.
        </div>
      )}

      {cupons.length > 0 && (
        <>
          <div className="border rounded-lg hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.codigo}</TableCell>
                    <TableCell>{c.percentualDesconto}%</TableCell>
                    <TableCell>{c.ativo ? "sim" : "não"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditando(c);
                          setSheetAberto(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setExcluindo(c)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {cupons.map((c) => (
              <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.codigo}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.percentualDesconto}% de desconto · {c.ativo ? "ativo" : "inativo"}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditando(c);
                      setSheetAberto(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setExcluindo(c)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CupomFormSheet
        open={sheetAberto}
        onOpenChange={setSheetAberto}
        cupom={editando}
        onSaved={refetch}
      />

      <AlertDialog open={!!excluindo} onOpenChange={(open) => !open && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o cupom "{excluindo?.codigo}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O cupom deixa de funcionar no carrinho imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!excluindo) return;
                await deleteCall({ data: { id: excluindo.id } });
                setExcluindo(null);
                toast.success("cupom excluído.");
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

function CupomFormSheet({
  open,
  onOpenChange,
  cupom,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cupom: CupomRow | null;
  onSaved: () => Promise<void>;
}) {
  const createCall = useServerFn(adminCreateCupom);
  const updateCall = useServerFn(adminUpdateCupom);
  const [salvando, setSalvando] = useState(false);

  const form = useForm<CupomFormValues>({
    resolver: zodResolver(cupomFormSchema),
    values: {
      codigo: cupom?.codigo ?? "",
      percentualDesconto: cupom?.percentualDesconto ?? 10,
      ativo: cupom?.ativo ?? true,
    },
  });

  async function onSubmit(values: CupomFormValues) {
    setSalvando(true);
    try {
      if (cupom) {
        await updateCall({ data: { id: cupom.id, ...values } });
        toast.success("cupom atualizado.");
      } else {
        await createCall({ data: values });
        toast.success("cupom criado.");
      }
      onOpenChange(false);
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "não deu pra salvar o cupom, tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{cupom ? "Editar cupom" : "Novo cupom"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="FIRSTSOFT" {...field} className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="percentualDesconto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min="1" max="100" {...field} />
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
                  <FormLabel className="!mt-0">Ativo (funciona no carrinho)</FormLabel>
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

