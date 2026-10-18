import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  PageHeader,
  Select,
  Skeleton,
} from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { useClaim } from "../../app/authorization/use-claim";
import { PROJECT_CLAIMS, type Project, type ProjectUsage } from "./projects.types";
import { projectsService } from "./projects.service";

type ProjectsSearch = { q?: string; page?: number; status?: "" | "andamento" | "concluido" };

export function ProjectsPage() {
  const { q = "", page = 1, status = "" } = useSearch({ strict: false }) as ProjectsSearch;
  const navigate = useNavigate();
  const canCreate = useClaim(PROJECT_CLAIMS.create);
  const canEdit = useClaim(PROJECT_CLAIMS.edit);
  const canRemove = useClaim(PROJECT_CLAIMS.remove);
  const [search, setSearch] = useState(q);
  const [items, setItems] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [remove, setRemove] = useState<Project | null>(null);
  const [view, setView] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState<ProjectUsage | null>(null);

  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    projectsService
      .list(q, page, controller.signal, status)
      .then((result) => {
        if (!controller.signal.aborted) {
          setItems(result.items);
          setTotal(result.total);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Falha ao carregar empreendimentos.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [q, page, status, revision]);
  useEffect(() => {
    const controller = new AbortController();
    projectsService
      .usage(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setUsage(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setUsage(null);
      });
    return () => controller.abort();
  }, [revision]);

  const go = (nextPage: number, nextQuery = q, nextStatus = status) =>
    void navigate({
      to: "/app/projects",
      search: { q: nextQuery, page: nextPage, status: nextStatus },
    });

  async function confirmRemove() {
    if (!remove) return;
    setSaving(true);
    setError("");
    try {
      await projectsService.remove(remove.id, remove.version);
      setRemove(null);
      if (items.length === 1 && page > 1) go(page - 1);
      else setRevision((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao excluir.");
      setRemove(null);
    } finally {
      setSaving(false);
    }
  }

  const packageLabels: Record<string, string> = {
    gratuito: "Gratuito",
    basico: "Básico",
    intermediario: "Intermediário",
    avancado: "Avançado",
    completo: "Completo",
    sob_consulta: "Sob consulta",
  };

  return (
    <div>
      <PageHeader
        title="Empreendimentos"
        description="Cadastros de propriedades e atividades ambientais da sua empresa."
      />
      <main className="space-y-4 p-4 sm:p-8">
        {usage ? (
          <Card>
            <CardContent className="p-4 text-sm" role="status">
              Plano {packageLabels[usage.packageId] ?? usage.packageId}: {usage.used} de {usage.limit} empreendimento(s) ativo(s).
              {usage.remaining === 0 ? " Limite atingido." : ""}
            </CardContent>
          </Card>
        ) : null}
        <div className="flex flex-wrap items-end gap-3">
          <form
            className="flex flex-1 flex-wrap items-end gap-2"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              go(1, search.trim());
            }}
          >
            <Input
              name="project-search"
              label="Buscar empreendimento, município, atividade ou empreendedor"
              maxLength={200}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              name="project-status"
              label="Situação"
              value={status}
              onChange={(event) => go(1, q, event.target.value as ProjectsSearch["status"])}
            >
              <option value="">Todas</option>
              <option value="andamento">Em andamento</option>
              <option value="concluido">Concluídos</option>
            </Select>
            <Button type="submit">Buscar</Button>
          </form>
          {canCreate ? (
            <Button
              disabled={usage?.remaining === 0}
              onClick={() => void navigate({ to: "/app/projects/new" })}
            >
              Novo empreendimento
            </Button>
          ) : null}
        </div>
        {error ? (
          <Alert variant="error" title="Não foi possível concluir">
            {error}
            <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>
              Recarregar
            </Button>
          </Alert>
        ) : null}
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : !error ? (
          <>
            {items.length === 0 ? (
              <Card>
                <CardContent className="p-6">Nenhum empreendimento encontrado.</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="space-y-2 p-5">
                      <h2 className="font-semibold">{item.propertyName}</h2>
                      <p>{item.activity}</p>
                      <p className="text-sm text-slate-600">
                        {item.municipio || "Município não informado"}
                        {item.uf ? `/${item.uf}` : ""} · {item.status || "Em Andamento"}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setView(item)}>
                          Visualizar
                        </Button>
                        {canEdit ? (
                          <Button
                            variant="outline"
                            onClick={() =>
                              void navigate({ to: "/app/projects/$id/edit", params: { id: item.id } })
                            }
                          >
                            Editar
                          </Button>
                        ) : null}
                        {canRemove ? (
                          <Button variant="outline" onClick={() => setRemove(item)}>
                            Excluir
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => go(page - 1)}>
                Anterior
              </Button>
              <span aria-live="polite">
                {total} empreendimentos · página {page} de {Math.max(1, Math.ceil(total / 10))}
              </span>
              <Button
                variant="outline"
                disabled={page * 10 >= total}
                onClick={() => go(page + 1)}
              >
                Próxima
              </Button>
            </div>
          </>
        ) : null}
        <Dialog open={!!view} onOpenChange={(open) => { if (!open) setView(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{view?.propertyName}</DialogTitle>
              <DialogDescription>Detalhes do empreendimento.</DialogDescription>
            </DialogHeader>
            {view ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div><dt className="text-sm font-medium">Nome fantasia</dt><dd>{view.fantasyName || "Não informado"}</dd></div>
                <div><dt className="text-sm font-medium">Atividade</dt><dd>{view.activity}</dd></div>
                <div><dt className="text-sm font-medium">Matrícula</dt><dd>{view.matricula || "Não informado"}</dd></div>
                <div><dt className="text-sm font-medium">Comarca</dt><dd>{view.comarca || "Não informado"}</dd></div>
                <div><dt className="text-sm font-medium">Endereço</dt><dd>{[view.address, view.numero].filter(Boolean).join(", ") || "Não informado"}</dd></div>
                <div><dt className="text-sm font-medium">Município/UF</dt><dd>{[view.municipio, view.uf].filter(Boolean).join("/") || "Não informado"}</dd></div>
                <div><dt className="text-sm font-medium">Situação</dt><dd>{view.status || "Em Andamento"}</dd></div>
              </dl>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setView(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!remove} onOpenChange={(open) => { if (!open && !saving) setRemove(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir empreendimento</DialogTitle>
              <DialogDescription>
                Excluir {remove?.propertyName}? O registro será arquivado e deixará de aparecer na lista.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" disabled={saving} onClick={() => setRemove(null)}>Cancelar</Button>
              <Button isLoading={saving} onClick={() => void confirmRemove()}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
