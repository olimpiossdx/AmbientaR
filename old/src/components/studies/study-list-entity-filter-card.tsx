'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  StudyListEntityFilter,
  type StudyListEntityFilterProps,
} from '@/components/studies/study-list-entity-filter';

type StudyListEntityFilterCardProps = StudyListEntityFilterProps;

export function StudyListEntityFilterCard(props: StudyListEntityFilterCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtrar por titular</CardTitle>
        <CardDescription>
          Restrinja a lista ao empreendedor e, se quiser, ao empreendimento.
        </CardDescription>
        <StudyListEntityFilter {...props} className="pt-2" />
      </CardHeader>
    </Card>
  );
}
