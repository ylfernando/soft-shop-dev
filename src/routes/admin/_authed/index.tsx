import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, DollarSign, Package, Receipt, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPreco } from "@/data/produtos";
import {
  adminGetStats,
  adminGetPedidosRecentes,
  adminGetProdutosVendidosRecentes,
  adminGetReceitaPorDia,
} from "@/server-fns/admin/dashboard";
import type { PedidoStatus } from "@/server-fns/admin/pedidos";

export const Route = createFileRoute("/admin/_authed/")({
  component: AdminOverview,
  loader: async () => {
    const [stats, pedidosRecentes, produtosVendidos, receitaPorDia] = await Promise.all([
      adminGetStats(),
      adminGetPedidosRecentes(),
      adminGetProdutosVendidosRecentes(),
      adminGetReceitaPorDia(),
    ]);
    return { stats, pedidosRecentes, produtosVendidos, receitaPorDia };
  },
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

const chartConfig = {
  receitaCentavos: {
    label: "receita",
    color: "var(--pink-deep)",
  },
} satisfies ChartConfig;

function AdminOverview() {
  const { stats, pedidosRecentes, produtosVendidos, receitaPorDia } = Route.useLoaderData();

  const tiles = [
    { label: "Receita total", value: formatPreco(stats.receitaTotalCentavos), Icon: DollarSign },
    { label: "Pedidos", value: stats.totalPedidos, Icon: Receipt },
    { label: "Clientes", value: stats.totalClientes, Icon: Users },
    {
      label: "Produtos",
      value: `${stats.totalProdutos - stats.produtosVendidos} disponíveis · ${stats.produtosVendidos} vendidos`,
      Icon: Package,
    },
  ];

  const chartData = receitaPorDia.map((d) => ({
    ...d,
    label: new Date(`${d.data}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Visão geral</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map(({ label, value, Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.pedidosPendentes > 0 && (
        <Link
          to="/admin/pedidos"
          className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {stats.pedidosPendentes}{" "}
            {stats.pedidosPendentes === 1
              ? "pedido pendente precisa"
              : "pedidos pendentes precisam"}{" "}
            de atenção.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receita nos últimos 14 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="receitaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-receitaCentavos)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-receitaCentavos)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value) => (
                        <div className="flex flex-1 items-center justify-between gap-4">
                          <span className="text-muted-foreground">receita</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatPreco(value as number)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="receitaCentavos"
                  type="monotone"
                  fill="url(#receitaFill)"
                  stroke="var(--color-receitaCentavos)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Vendidos recentemente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {produtosVendidos.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                nenhum produto vendido ainda.
              </p>
            )}
            {produtosVendidos.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.img} alt={p.nome} className="w-10 h-12 object-cover rounded shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.vendidoEm).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="text-sm shrink-0">{formatPreco(p.precoCentavos)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Pedidos recentes</CardTitle>
          <Link to="/admin/pedidos" className="text-xs text-muted-foreground hover:underline">
            ver todos
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {pedidosRecentes.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">nenhum pedido ainda.</p>
          )}
          {pedidosRecentes.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  #{p.id} · {p.nomeCliente}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span>{formatPreco(p.totalCentavos)}</span>
                <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
