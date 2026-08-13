import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, Package, Receipt, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPreco } from "@/data/produtos";
import { adminGetStats } from "@/server-fns/admin/dashboard";

export const Route = createFileRoute("/admin/_authed/")({
  component: AdminOverview,
  loader: () => adminGetStats(),
});

function AdminOverview() {
  const stats = Route.useLoaderData();

  const tiles = [
    { label: "Receita total", value: formatPreco(stats.receitaTotalCentavos), Icon: DollarSign },
    { label: "Pedidos", value: stats.totalPedidos, Icon: Receipt },
    { label: "Clientes", value: stats.totalClientes, Icon: Users },
    { label: "Produtos", value: stats.totalProdutos, Icon: Package },
  ];

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
    </div>
  );
}
