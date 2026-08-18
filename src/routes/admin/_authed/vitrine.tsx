import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPreco, type Produto } from "@/data/produtos";
import { adminListProdutos } from "@/server-fns/admin/produtos";
import {
  adminListVitrines,
  adminAddVitrineItem,
  adminRemoveVitrineItem,
  adminReordenarVitrineItens,
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
    descricao: 'produtos exibidos na seção "Últimos garimpos" da home.',
  },
  {
    value: "promos",
    titulo: "Promos da semana",
    descricao: 'produtos exibidos na seção "Promos da semana" da home.',
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
  const [selecionado, setSelecionado] = useState<string | undefined>(undefined);
  const [adicionando, setAdicionando] = useState(false);
  const [ordemLocal, setOrdemLocal] = useState(itens);
  const [pendingMoves, setPendingMoves] = useState<{ id: number; direcao: "up" | "down" }[]>([]);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);

  const addCall = useServerFn(adminAddVitrineItem);
  const removeCall = useServerFn(adminRemoveVitrineItem);
  const reordenarCall = useServerFn(adminReordenarVitrineItens);

  // Só resincroniza com os dados do servidor quando não há reordenação
  // pendente — senão um refetch no meio da reordenação (ex: outro item
  // sendo adicionado) apagaria a ordem que a pessoa ainda não salvou.
  const pendingMovesRef = useRef(pendingMoves);
  pendingMovesRef.current = pendingMoves;
  useEffect(() => {
    if (pendingMovesRef.current.length === 0) setOrdemLocal(itens);
  }, [itens]);

  const idsNaVitrine = new Set(itens.map((i) => i.produtoId));
  const disponiveis = produtos.filter((p) => !idsNaVitrine.has(p.id));
  const ordemAlterada = pendingMoves.length > 0;

  async function adicionar() {
    if (!selecionado) return;
    setAdicionando(true);
    try {
      await addCall({ data: { produtoId: selecionado, secao } });
      await onChanged();
      setSelecionado(undefined);
      setAddKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "não deu pra adicionar o produto.");
    } finally {
      setAdicionando(false);
    }
  }

  async function remover(id: number) {
    await removeCall({ data: { id } });
    await onChanged();
  }

  function moverLocal(id: number, direcao: "up" | "down") {
    setOrdemLocal((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
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
      await reordenarCall({ data: { secao, ids: ordemLocal.map((i) => i.id) } });
      setPendingMoves([]);
      toast.success("ordem salva.");
      await onChanged();
    } catch {
      toast.error("não deu pra salvar a ordem, tenta de novo.");
    } finally {
      setSalvandoOrdem(false);
    }
  }

  function cancelarOrdem() {
    setOrdemLocal(itens);
    setPendingMoves([]);
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div>
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </div>

      <div className="flex gap-2">
        <Select
          key={addKey}
          value={selecionado}
          onValueChange={setSelecionado}
          disabled={disponiveis.length === 0 || ordemAlterada}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                disponiveis.length === 0
                  ? "todos os produtos já estão nessa vitrine"
                  : "escolher produto..."
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
        <Button
          className="shrink-0"
          onClick={adicionar}
          disabled={!selecionado || adicionando || ordemAlterada}
        >
          {adicionando ? "adicionando..." : "adicionar"}
        </Button>
      </div>

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

      {ordemLocal.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-6">
          nenhum produto nessa vitrine ainda.
        </div>
      )}

      {ordemLocal.length > 0 && (
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
                {ordemLocal.map((item, i) => (
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
                        onClick={() => moverLocal(item.id, "up")}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={i === ordemLocal.length - 1}
                        onClick={() => moverLocal(item.id, "down")}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={ordemAlterada}
                        onClick={() => remover(item.id)}
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
            {ordemLocal.map((item, i) => (
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
                      onClick={() => moverLocal(item.id, "up")}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === ordemLocal.length - 1}
                      onClick={() => moverLocal(item.id, "down")}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={ordemAlterada}
                      onClick={() => remover(item.id)}
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
    </div>
  );
}
