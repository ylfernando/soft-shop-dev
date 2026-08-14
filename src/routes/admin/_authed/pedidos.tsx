import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPreco } from "@/data/produtos";
import { FORMA_PAGAMENTO_LABEL } from "@/lib/pagamento";
import {
  adminListPedidos,
  adminGetPedidoItens,
  adminUpdatePedidoStatus,
  type PedidoRow,
  type PedidoItemRow,
  type PedidoStatus,
} from "@/server-fns/admin/pedidos";

export const Route = createFileRoute("/admin/_authed/pedidos")({
  component: AdminPedidos,
  loader: () => adminListPedidos(),
});

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

function AdminPedidos() {
  const pedidosIniciais = Route.useLoaderData();
  const [pedidos, setPedidos] = useState<PedidoRow[]>(pedidosIniciais);
  const [detalhe, setDetalhe] = useState<PedidoRow | null>(null);

  const listCall = useServerFn(adminListPedidos);
  const statusCall = useServerFn(adminUpdatePedidoStatus);

  async function refetch() {
    setPedidos(await listCall());
  }

  async function mudarStatus(pedido: PedidoRow, status: PedidoStatus) {
    await statusCall({ data: { id: pedido.id, status } });
    toast.success("status atualizado.");
    await refetch();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pedidos</h1>

      {pedidos.length === 0 && (
        <div className="border rounded-lg text-center text-muted-foreground py-8">
          nenhum pedido ainda.
        </div>
      )}

      {pedidos.length > 0 && (
        <>
          <div className="border rounded-lg hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>#{p.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{p.nomeCliente}</div>
                      <div className="text-xs text-muted-foreground">{p.emailCliente}</div>
                    </TableCell>
                    <TableCell>{formatPreco(p.totalCentavos)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                        <Select
                          value={p.status}
                          onValueChange={(v) => mudarStatus(p, v as PedidoStatus)}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUS_LABEL) as PedidoStatus[]).map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDetalhe(p)}>
                        <Eye />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {pedidos.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">
                      #{p.id} · {p.nomeCliente}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.emailCliente}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setDetalhe(p)}
                  >
                    <Eye />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatPreco(p.totalCentavos)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  <Select value={p.status} onValueChange={(v) => mudarStatus(p, v as PedidoStatus)}>
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABEL) as PedidoStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <PedidoDetalheDialog pedido={detalhe} onOpenChange={(open) => !open && setDetalhe(null)} />
    </div>
  );
}

function PedidoDetalheDialog({
  pedido,
  onOpenChange,
}: {
  pedido: PedidoRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [itens, setItens] = useState<PedidoItemRow[] | null>(null);
  const itensCall = useServerFn(adminGetPedidoItens);

  const pedidoId = pedido?.id;
  useEffect(() => {
    if (!pedidoId) {
      setItens(null);
      return;
    }
    setItens(null);
    itensCall({ data: { pedidoId } }).then(setItens);
  }, [pedidoId, itensCall]);

  return (
    <Dialog
      open={!!pedido}
      onOpenChange={(open) => {
        if (!open) setItens(null);
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pedido #{pedido?.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {itens?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                {item.quantidade}x {item.nomeSnapshot}
              </span>
              <span>{formatPreco(item.precoCentavosSnapshot * item.quantidade)}</span>
            </div>
          ))}
          {itens === null && <p className="text-sm text-muted-foreground">carregando...</p>}
          {pedido && (
            <div className="pt-3 mt-3 border-t space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forma de pagamento</span>
                <span>{FORMA_PAGAMENTO_LABEL[pedido.formaPagamento]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPreco(pedido.subtotalCentavos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatPreco(pedido.freteCentavos)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPreco(pedido.totalCentavos)}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
