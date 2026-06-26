import { PCA_LISTAGEM_A_ACTIVITY, PCA_LISTAGEM_A_SUBACTIVITIES } from '@/lib/pca/pca-listagem-a-catalog';
import { PCA_LISTAGEM_B_ACTIVITY, PCA_LISTAGEM_B_SUBACTIVITIES } from '@/lib/pca/pca-listagem-b-catalog';
import { PCA_LISTAGEM_C_ACTIVITY, PCA_LISTAGEM_C_SUBACTIVITIES } from '@/lib/pca/pca-listagem-c-catalog';
import { PCA_LISTAGEM_D_ACTIVITY, PCA_LISTAGEM_D_SUBACTIVITIES } from '@/lib/pca/pca-listagem-d-catalog';
import { PCA_LISTAGEM_E_ACTIVITY, PCA_LISTAGEM_E_SUBACTIVITIES } from '@/lib/pca/pca-listagem-e-catalog';
import { PCA_LISTAGEM_F_ACTIVITY, PCA_LISTAGEM_F_SUBACTIVITIES } from '@/lib/pca/pca-listagem-f-catalog';
import { PCA_LISTAGEM_G_ACTIVITY, PCA_LISTAGEM_G_SUBACTIVITIES } from '@/lib/pca/pca-listagem-g-catalog';
import { PCA_LISTAGEM_H_ACTIVITY, PCA_LISTAGEM_H_SUBACTIVITIES } from '@/lib/pca/pca-listagem-h-catalog';

export const PCA_LISTAGEM_ACTIVITIES = [
  PCA_LISTAGEM_A_ACTIVITY,
  PCA_LISTAGEM_B_ACTIVITY,
  PCA_LISTAGEM_C_ACTIVITY,
  PCA_LISTAGEM_D_ACTIVITY,
  PCA_LISTAGEM_E_ACTIVITY,
  PCA_LISTAGEM_F_ACTIVITY,
  PCA_LISTAGEM_G_ACTIVITY,
  PCA_LISTAGEM_H_ACTIVITY,
] as const;

export function getPcaSubactivitiesForActivity(activity: string): readonly string[] {
  if (activity === PCA_LISTAGEM_A_ACTIVITY) return PCA_LISTAGEM_A_SUBACTIVITIES;
  if (activity === PCA_LISTAGEM_B_ACTIVITY) return PCA_LISTAGEM_B_SUBACTIVITIES;
  if (activity === PCA_LISTAGEM_C_ACTIVITY) return PCA_LISTAGEM_C_SUBACTIVITIES;
  if (activity === PCA_LISTAGEM_D_ACTIVITY) return PCA_LISTAGEM_D_SUBACTIVITIES;
  if (activity === PCA_LISTAGEM_E_ACTIVITY) return PCA_LISTAGEM_E_SUBACTIVITIES;
  if (activity === PCA_LISTAGEM_F_ACTIVITY) return PCA_LISTAGEM_F_SUBACTIVITIES;
  if (activity === PCA_LISTAGEM_G_ACTIVITY) return PCA_LISTAGEM_G_SUBACTIVITIES;
  if (activity === PCA_LISTAGEM_H_ACTIVITY) return PCA_LISTAGEM_H_SUBACTIVITIES;
  return [];
}
