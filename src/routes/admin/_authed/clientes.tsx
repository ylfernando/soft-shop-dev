import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
  const [busca, setBusca] = useState("");
  const [excluindo, setExcluindo] = useState<ClienteRow | null>(null);
  const [vendoPedidos, setVendoPedidos] = useState<ClienteRow | null>(null);

  const listCall = useServerFn(adminListClientes);
  const deleteCall = useServerFn(adminDeleteCliente);

  async function refetch() {
    setClientes(await listCall());
  }

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo),
    );
  }, [clientes, busca]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>

      {clientes.length === 0 && (
        <div className="border rounded-lg text-center text-muted-foreground py-8">
          nenhum cliente cadastrado ainda.
        </div>
      )}

      {clientes.length > 0 && (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="buscar por nome ou e-mail..."
              className="pl-8"
            />
          </div>

          {clientesFiltrados.length === 0 && (
            <div className="border rounded-lg text-center text-muted-foreground py-8">
              nenhum cliente encontrado para "{busca}".
            </div>
          )}

          {clientesFiltrados.length > 0 && (
            <>
              <div className="border rounded-lg hidden md:block">
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
                    {clientesFiltrados.map((c) => (
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
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {clientesFiltrados.map((c) => (
                  <div key={c.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.nome}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {c.totalPedidos} pedido{c.totalPedidos === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        desde {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setVendoPedidos(c)}>
                          <Eye />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setExcluindo(c)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

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
