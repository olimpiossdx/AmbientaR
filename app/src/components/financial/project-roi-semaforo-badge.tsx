'use client';

import { Badge } from '@/components/ui/badge';
import type { ProjectRoiSemaforo } from '@/lib/types';

const LABELS: Record<ProjectRoiSemaforo, string> = {
  ganhando: 'Ganhando',
  perdendo: 'Perdendo',
  empatando: 'Empatando',
  sem_movimento: 'Sem movimento',
};

const VARIANTS: Record<
  ProjectRoiSemaforo,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ganhando: 'default',
  empatando: 'secondary',
  perdendo: 'destructive',
  sem_movimento: 'outline',
};

export function ProjectRoiSemaforoBadge({
  semaforo,
}: {
  semaforo: ProjectRoiSemaforo;
}) {
  return (
    <Badge variant={VARIANTS[semaforo]} className="whitespace-nowrap">
      {LABELS[semaforo]}
    </Badge>
  );
}
