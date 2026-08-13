import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
  adminListClientes,
  adminDeleteCliente,
  type ClienteRow,
} from "@/server-fns/admin/clientes";

export const Route = createFileRoute("/admin/_authed/clientes")({
  component: AdminClientes,
  loader: () => adminListClientes(),
});

function AdminClientes() {
  const clientesIniciais = Route.useLoaderData();
  const [clientes, setClientes] = useState<ClienteRow[]>(clientesIniciais);
  const [excluindo, setExcluindo] = useState<ClienteRow | null>(null);

  const listCall = useServerFn(adminListClientes);
  const deleteCall = useServerFn(adminDeleteCliente);

  async function refetch() {
    setClientes(await listCall());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{c.totalPedidos}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setExcluindo(c)}>
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {clientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  nenhum cliente cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!excluindo} onOpenChange={(open) => !open && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a conta de "{excluindo?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Os pedidos já feitos por essa pessoa continuam no
              histórico de vendas, mas a conta deixa de existir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!excluindo) return;
                await deleteCall({ data: { id: excluindo.id } });
                setExcluindo(null);
                toast.success("cliente excluído.");
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
