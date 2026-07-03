'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import type { Opportunity, OpportunityStage } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const pipelineStages: OpportunityStage[] = [
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechado Ganho',
  'Fechado Perdido',
];

export const stageColors: Record<OpportunityStage, string> = {
  'Qualificação': 'border-blue-500',
  'Proposta': 'border-purple-500',
  'Negociação': 'border-yellow-500',
  'Fechado Ganho': 'border-green-500',
  'Fechado Perdido': 'border-red-500',
};

const activeStages = pipelineStages.filter((s) => s !== 'Fechado Ganho' && s !== 'Fechado Perdido');

export type CrmPipelineKanbanProps = {
  opportunities: Opportunity[];
  clientsMap: Map<string, string>;
  isLoading?: boolean;
  canWrite?: boolean;
  onEdit: (opp: Opportunity) => void;
  onMoveStage: (opportunityId: string, newStage: OpportunityStage) => void;
  onDelete: (opportunityId: string) => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
};

export function CrmPipelineKanban({
  opportunities,
  clientsMap,
  isLoading,
  canWrite,
  onEdit,
  onMoveStage,
  onDelete,
  formatCurrency,
  formatDate,
}: CrmPipelineKanbanProps) {
  const activeOpportunities = React.useMemo(
    () => opportunities.filter((o) => o.stage !== 'Fechado Ganho' && o.stage !== 'Fechado Perdido'),
    [opportunities]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
      {activeStages.map((stage) => (
        <div key={stage} className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg px-1">{stage}</h2>
          <div className="bg-muted/50 rounded-lg p-2 space-y-4 min-h-[200px]">
            {isLoading && <OpportunityCardSkeleton />}
            {activeOpportunities
              .filter((opp) => opp.stage === stage)
              .map((opp) => (
                <Card key={opp.id} className={cn('bg-card border-l-4', stageColors[stage])}>
                  <CardHeader className="p-4 flex-row items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{opp.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {clientsMap.get(opp.clientId) || 'Cliente desconhecido'}
                      </p>
                    </div>
                    {canWrite && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(opp)}>Editar</DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {pipelineStages.filter((s) => s !== stage).map((s) => (
                                  <DropdownMenuItem key={s} onClick={() => onMoveStage(opp.id, s)}>
                                    {s}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(opp.id)}>
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCurrency(opp.value ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDate(opp.closeDate)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {!isLoading && activeOpportunities.filter((opp) => opp.stage === stage).length === 0 && (
              <div className="flex items-center justify-center h-full p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma oportunidade nesta fase.</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OpportunityCardSkeleton() {
  return (
    <Card className="bg-card">
      <CardHeader className="p-4 flex-row items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}
