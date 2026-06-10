"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFirebase } from "@/firebase";
import { useMcpRagHubOverview } from "@/components/mcp-rag/use-mcp-rag-hub-overview";
import { Check, Minus, Wrench } from "lucide-react";
import type { McpToolDefinition } from "@/lib/mcp-rag/types";

function toolStatusBadge(tool: McpToolDefinition) {
  if (tool.status === "available") {
    return <Badge variant="default">Disponível</Badge>;
  }
  if (tool.status === "disabled") {
    return <Badge variant="destructive">Desligado</Badge>;
  }
  return <Badge variant="secondary">Planeado</Badge>;
}

export function McpToolsPanel({ className }: { className?: string }) {
  const { auth } = useFirebase();
  const { loading, overview, error } = useMcpRagHubOverview(auth);

  if (loading) {
    return <Skeleton className={`h-64 w-full rounded-lg ${className ?? ""}`} />;
  }

  const tools = overview?.mcpTools ?? [];
  const permissions = overview?.permissions ?? [];

  return (
    <div className={className}>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Catálogo de tools MCP
          </CardTitle>
          <CardDescription>
            Ferramentas expostas ao agente / Cursor MCP. Servidor dedicado
            enterprise fica para rollout com pipeline legislativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-sm font-medium">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tool.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Backend: {tool.backend}
                  </p>
                </div>
                {toolStatusBadge(tool)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões na busca RAG</CardTitle>
          <CardDescription>
            Matriz resumida por perfil — gestão completa do hub só para admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead>Base Jurídica</TableHead>
                <TableHead>Cloud OneDrive</TableHead>
                <TableHead>Hub admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((row) => (
                <TableRow key={row.role}>
                  <TableCell className="font-medium">{row.role}</TableCell>
                  <TableCell>
                    {row.canSearchJuridica ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {row.canSearchCloud ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {row.canManageHub ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
