"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeorefClientProject } from "@/hooks/use-georef-client-project";

type Props = {
  clientId: string;
  projectId: string;
  onClientIdChange: (id: string) => void;
  onProjectIdChange: (id: string) => void;
  disabled?: boolean;
};

export function GeorefClientProjectFields({
  clientId,
  projectId,
  onClientIdChange,
  onProjectIdChange,
  disabled,
}: Props) {
  const { clients, projects, loadingClients, loadingProjects, isRepresentative } =
    useGeorefClientProject(clientId, projectId);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label>Cliente</Label>
        {loadingClients ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={clientId || "__none__"}
            onValueChange={(v) => {
              const id = v === "__none__" ? "" : v;
              onClientIdChange(id);
              onProjectIdChange("");
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Nenhum —</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid gap-2">
        <Label>Empreendimento / projeto</Label>
        {loadingProjects ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={projectId || "__none__"}
            onValueChange={(v) => onProjectIdChange(v === "__none__" ? "" : v)}
            disabled={disabled || (isRepresentative && !clientId)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isRepresentative && !clientId
                    ? "Selecione o cliente primeiro"
                    : "Selecione o empreendimento"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Nenhum —</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.propertyName}
                  {p.municipio ? ` — ${p.municipio}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
