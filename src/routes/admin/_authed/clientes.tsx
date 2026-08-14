import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { formatPreco } from "@/data/produtos";
import { FORMA_PAGAMENTO_LABEL } from "@/lib/pagamento";
import {
  adminListClientes,
  adminDeleteCliente,
  type ClienteRow,
} from "@/server-fns/admin/clientes";
import {
  adminListPedidosDoCliente,
  adminGetPedidoItens,
  type PedidoRow,
  type PedidoItemRow,
  type PedidoStatus,
} from "@/server-fns/admin/pedidos";

const STATUS_LABEL: Record<PedidoStatus, string> = {
  pendente: "pendente",
  pago: "pago",
  enviado: "enviado",
  cancelado: "cancelado",
};

const STATUS_VARIANT: Record<PedidoStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "outline",
  pago: "default",
  enviado: "secondary",
  cancelado: "destructive",
};

export const Route = createFileRoute("/admin/_authed/clientes")({
  component: AdminClientes,
  loader: () => adminListClientes(),
});

function AdminClientes() {
  const clientesIniciais = Route.useLoaderData();
  const [clientes, setClientes] = useState<ClienteRow[]>(clientesIniciais);
  const [excluindo, setExcluindo] = useState<ClienteRow | null>(null);
  const [vendoPedidos, setVendoPedidos] = useState<ClienteRow | null>(null);

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
                  <Button variant="ghost" size="icon" onClick={() => setVendoPedidos(c)}>
                    <Eye />
                  </Button>
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

      <ClientePedidosDialog
        cliente={vendoPedidos}
        onOpenChange={(open) => !open && setVendoPedidos(null)}
      />
    </div>
  );
}

function ClientePedidosDialog({
  cliente,
  onOpenChange,
}: {
  cliente: ClienteRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [pedidos, setPedidos] = useState<PedidoRow[] | null>(null);
  const [itensPorPedido, setItensPorPedido] = useState<Record<number, PedidoItemRow[]>>({});

  const listCall = useServerFn(adminListPedidosDoCliente);
  const itensCall = useServerFn(adminGetPedidoItens);

  const clienteId = cliente?.id;
  useEffect(() => {
    if (!clienteId) {
      setPedidos(null);
      setItensPorPedido({});
      return;
    }
    setPedidos(null);
    setItensPorPedido({});
    listCall({ data: { clienteId } }).then(async (rows) => {
      setPedidos(rows);
      const entries = await Promise.all(
        rows.map(async (p) => [p.id, await itensCall({ data: { pedidoId: p.id } })] as const),
      );
      setItensPorPedido(Object.fromEntries(entries));
    });
  }, [clienteId, listCall, itensCall]);

  return (
    <Dialog
      open={!!cliente}
      onOpenChange={(open) => {
        if (!open) {
          setPedidos(null);
          setItensPorPedido({});
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedidos de {cliente?.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {pedidos === null && <p className="text-sm text-muted-foreground">carregando...</p>}
          {pedidos?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              essa pessoa ainda não fez nenhum pedido.
            </p>
          )}
          {pedidos?.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Pedido #{p.id}</span>
                <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(p.criadoEm).toLocaleString("pt-BR")} ·{" "}
                {FORMA_PAGAMENTO_LABEL[p.formaPagamento]}
              </div>
              <div className="space-y-1 text-sm">
                {(itensPorPedido[p.id] ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantidade}x {item.nomeSnapshot}
                    </span>
                    <span>{formatPreco(item.precoCentavosSnapshot * item.quantidade)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                <span>Total pago</span>
                <span>{formatPreco(p.totalCentavos)}</span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
