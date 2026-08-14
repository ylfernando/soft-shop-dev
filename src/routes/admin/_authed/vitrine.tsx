import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPreco, type Produto } from "@/data/produtos";
import { adminListProdutos } from "@/server-fns/admin/produtos";
import {
  adminListVitrines,
  adminAddVitrineItem,
  adminRemoveVitrineItem,
  adminMoverVitrineItem,
  type VitrineSecao,
  type VitrineItemRow,
} from "@/server-fns/admin/vitrines";

export const Route = createFileRoute("/admin/_authed/vitrine")({
  component: AdminVitrine,
  loader: async () => {
    const [vitrines, produtos] = await Promise.all([adminListVitrines(), adminListProdutos()]);
    return { vitrines, produtos };
  },
});

const SECOES: { value: VitrineSecao; titulo: string; descricao: string }[] = [
  {
    value: "garimpos",
    titulo: "Últimos garimpos",
    descricao: "produtos exibidos na seção \"Últimos garimpos\" da home.",
  },
  {
    value: "promos",
    titulo: "Promos da semana",
    descricao: "produtos exibidos na seção \"Promos da semana\" da home.",
  },
];

function AdminVitrine() {
  const { vitrines: vitrinesIniciais, produtos } = Route.useLoaderData();
  const [vitrines, setVitrines] = useState(vitrinesIniciais);

  const listCall = useServerFn(adminListVitrines);
  async function refetch() {
    setVitrines(await listCall());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Vitrine</h1>
      <p className="text-sm text-muted-foreground -mt-4">
        escolha quais produtos aparecem em cada seção de destaque da home, e em que ordem.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {SECOES.map((s) => (
          <VitrineSecaoCard
            key={s.value}
            secao={s.value}
            titulo={s.titulo}
            descricao={s.descricao}
            itens={vitrines[s.value]}
            produtos={produtos}
            onChanged={refetch}
          />
        ))}
      </div>
    </div>
  );
}

function VitrineSecaoCard({
  secao,
  titulo,
  descricao,
  itens,
  produtos,
  onChanged,
}: {
  secao: VitrineSecao;
  titulo: string;
  descricao: string;
  itens: VitrineItemRow[];
  produtos: Produto[];
  onChanged: () => Promise<void>;
}) {
  const [addKey, setAddKey] = useState(0);
  const addCall = useServerFn(adminAddVitrineItem);
  const removeCall = useServerFn(adminRemoveVitrineItem);
  const moverCall = useServerFn(adminMoverVitrineItem);

  const idsNaVitrine = new Set(itens.map((i) => i.produtoId));
  const disponiveis = produtos.filter((p) => !idsNaVitrine.has(p.id));

  async function adicionar(produtoId: string) {
    try {
      await addCall({ data: { produtoId, secao } });
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "não deu pra adicionar o produto.");
    } finally {
      setAddKey((k) => k + 1);
    }
  }

  async function remover(id: number) {
    await removeCall({ data: { id } });
    await onChanged();
  }

  async function mover(id: number, direcao: "up" | "down") {
    await moverCall({ data: { id, secao, direcao } });
    await onChanged();
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div>
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </div>

      <Select key={addKey} onValueChange={adicionar} disabled={disponiveis.length === 0}>
        <SelectTrigger>
          <SelectValue
            placeholder={
              disponiveis.length === 0
                ? "todos os produtos já estão nessa vitrine"
                : "adicionar produto..."
            }
          />
        </SelectTrigger>
        <SelectContent>
          {disponiveis.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {itens.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-6">
          nenhum produto nessa vitrine ainda.
        </div>
      )}

      {itens.length > 0 && (
        <>
          <div className="border rounded-lg hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, i) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img
                        src={item.img}
                        alt={item.nome}
                        className="w-12 h-14 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{formatPreco(item.precoCentavos)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={i === 0}
                        onClick={() => mover(item.id, "up")}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={i === itens.length - 1}
                        onClick={() => mover(item.id, "down")}
                      >
                        <ArrowDown />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remover(item.id)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {itens.map((item, i) => (
              <div key={item.id} className="border rounded-lg p-3 flex gap-3">
                <img
                  src={item.img}
                  alt={item.nome}
                  className="w-14 h-16 object-cover rounded shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-medium truncate">{item.nome}</div>
                  <div className="text-sm">{formatPreco(item.precoCentavos)}</div>
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === 0}
                      onClick={() => mover(item.id, "up")}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === itens.length - 1}
                      onClick={() => mover(item.id, "down")}
                    >
                      <ArrowDown />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remover(item.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
