'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { Datum } from '@/lib/types';
import { CoordinateInput } from '@/components/coordinates';

type PcaGeographicLocationSectionProps = {
  form: UseFormReturn<any>;
};

export function PcaGeographicLocationSection({ form }: PcaGeographicLocationSectionProps) {
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
      metadataVariant="listagem"
      title="5. Localização Geográfica"
      lockDatum={!isLegacyDatum}
      showLegacyDatums={isLegacyDatum}
    />
  );
}
