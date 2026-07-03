import type { ListagemLetter } from './listagem-form-activity';
import { applyListagemTabActivity } from './listagem-form-activity';
import { LISTAGEM_A_ACTIVITY_BY_TIPO, LISTAGEM_A_FORM_TIPO_PADRAO } from './listagem-a-form-registry';
import { LISTAGEM_B_ACTIVITY_BY_TIPO, LISTAGEM_B_FORM_TIPO_PADRAO } from './listagem-b-form-registry';
import { LISTAGEM_C_ACTIVITY_BY_TIPO, LISTAGEM_C_FORM_TIPO_PADRAO } from './listagem-c-form-registry';
import { LISTAGEM_D_ACTIVITY_BY_TIPO, LISTAGEM_D_FORM_TIPO_PADRAO } from './listagem-d-form-registry';
import { LISTAGEM_E_ACTIVITY_BY_TIPO, LISTAGEM_E_FORM_TIPO_PADRAO } from './listagem-e-form-registry';
import { LISTAGEM_F_ACTIVITY_BY_TIPO, LISTAGEM_F_FORM_TIPO_PADRAO } from './listagem-f-form-registry';
import { LISTAGEM_G_ACTIVITY_BY_TIPO, LISTAGEM_G_FORM_TIPO_PADRAO } from './listagem-g-form-registry';
import { LISTAGEM_H_ACTIVITY_BY_TIPO, LISTAGEM_H_FORM_TIPO_PADRAO } from './listagem-h-form-registry';

const TAB_ACTIVITY_CONFIG: Record<
  ListagemLetter,
  { activityByTipo: Record<string, string>; defaultTipo: string }
> = {
  A: { activityByTipo: LISTAGEM_A_ACTIVITY_BY_TIPO, defaultTipo: LISTAGEM_A_FORM_TIPO_PADRAO },
  B: { activityByTipo: LISTAGEM_B_ACTIVITY_BY_TIPO, defaultTipo: LISTAGEM_B_FORM_TIPO_PADRAO },
  C: { activityByTipo: LISTAGEM_C_ACTIVITY_BY_TIPO, defaultTipo: LISTAGEM_C_FORM_TIPO_PADRAO },
  D: { activityByTipo: LISTAGEM_D_ACTIVITY_BY_TIPO, defaultTipo: LISTAGEM_D_FORM_TIPO_PADRAO },
  E: { activityByTipo: LISTAGEM_E_ACTIVITY_BY_TIPO, defaultTipo: LISTAGEM_E_FORM_TIPO_PADRAO },
  F: { activityByTipo: LISTAGEM_F_ACTIVITY_BY_TIPO, defaultTipo: LISTAGEM_F_FORM_TIPO_PADRAO },
  G: { activityByTipo: LISTAGEM_G_ACTIVITY_BY_TIPO, defaultTipo: LISTAGEM_G_FORM_TIPO_PADRAO },
  H: { activityByTipo: LISTAGEM_H_ACTIVITY_BY_TIPO, defaultTipo: LISTAGEM_H_FORM_TIPO_PADRAO },
};

export function onListagemTabSelect(
  form: { getValues: (n: string) => unknown; setValue: (n: string, v: string, o?: object) => void },
  letter: ListagemLetter,
): void {
  const cfg = TAB_ACTIVITY_CONFIG[letter];
  applyListagemTabActivity(form, letter, cfg.activityByTipo, cfg.defaultTipo);
}
