"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildEmpreendedorSelectOptions,
  buildProjectSelectOptions,
} from "@/lib/empreendedor-project-select";
import type { Empreendedor, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface EmpreendedorProjectFilterProps {
  empreendedores: readonly Empreendedor[] | null | undefined;
  allProjects: readonly Project[] | null | undefined;
  empreendedorId: string;
  projectId: string;
  onEmpreendedorIdChange: (id: string) => void;
  onProjectIdChange: (id: string) => void;
  showProject?: boolean;
  isLoading?: boolean;
  empreendedorLabel?: string;
  projectLabel?: string;
  className?: string;
  allowAllEmpreendedores?: boolean;
}

export function EmpreendedorProjectFilter({
  empreendedores,
  allProjects,
  empreendedorId,
  projectId,
  onEmpreendedorIdChange,
  onProjectIdChange,
  showProject = true,
  isLoading = false,
  empreendedorLabel = "Empreendedor",
  projectLabel = "Empreendimento",
  className,
  allowAllEmpreendedores = true,
}: EmpreendedorProjectFilterProps) {
  const empreendedoresForSelect = React.useMemo(
    () =>
      buildEmpreendedorSelectOptions({
        list: empreendedores,
        selectedId: empreendedorId,
      }),
    [empreendedores, empreendedorId],
  );

  const projectsForSelect = React.useMemo(
    () =>
      buildProjectSelectOptions({
        allProjects,
        empreendedorId,
        selectedProjectId: projectId,
      }),
    [allProjects, empreendedorId, projectId],
  );

  const handleEmpreendedorChange = (value: string) => {
    const next = value === "__all__" ? "" : value;
    onEmpreendedorIdChange(next);
    onProjectIdChange("");
  };

  return (
    <div
      className={cn(
        "grid gap-4",
        showProject ? "md:grid-cols-2" : "md:grid-cols-1",
        className,
      )}
    >
      <div className="space-y-2">
        <Label>{empreendedorLabel}</Label>
        <Select
          value={empreendedorId || (allowAllEmpreendedores ? "__all__" : "")}
          onValueChange={handleEmpreendedorChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoading ? "Carregando..." : "Selecione o empreendedor"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {allowAllEmpreendedores && (
              <SelectItem value="__all__">Todos os empreendedores</SelectItem>
            )}
            {empreendedoresForSelect.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showProject && (
        <div className="space-y-2">
          <Label>{projectLabel}</Label>
          <Select
            value={projectId || "__all__"}
            onValueChange={(value) =>
              onProjectIdChange(value === "__all__" ? "" : value)
            }
            disabled={!empreendedorId || isLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !empreendedorId
                    ? "Selecione um empreendedor primeiro"
                    : "Todos os empreendimentos"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os empreendimentos</SelectItem>
              {projectsForSelect.map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  {proj.propertyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
