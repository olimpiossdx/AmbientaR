'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { Datum } from '@/lib/types';
import { CoordinateInput } from '@/components/coordinates';

type RcaGeographicLocationSectionProps = {
  form: UseFormReturn<any>;
  metadataVariant?: 'project' | 'listagem';
};

export function RcaGeographicLocationSection({
  form,
  metadataVariant = 'listagem',
}: RcaGeographicLocationSectionProps) {
  const geoDatum = form.watch('geographicLocation.datum') as Datum | undefined;
  const isLegacyDatum =
    geoDatum != null &&
    String(geoDatum).trim() !== '' &&
    geoDatum !== 'SIRGAS2000';

  return (
    <CoordinateInput
      form={form}
      basePath="geographicLocation"
      variant="full"
      metadataVariant={metadataVariant}
      title="5. LOCALIZAÇÃO GEOGRÁFICA"
      lockDatum={!isLegacyDatum}
      showLegacyDatums={isLegacyDatum}
    />
  );
}
