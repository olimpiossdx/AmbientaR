import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { parseNumeroFormulario, BISHOP_CENARIOS, GRAVITY_DAM_FS_MIN } from '@/lib/barragem/calculos';

export type BarragemValidationIssue = {
  field: string;
  message: string;
  severity?: 'error' | 'warning';
};

function hasText(v: string | undefined | null): boolean {
  return v != null && String(v).trim().length > 0;
}

export function validateBarragemForExport(
  projeto: ProjetoTecnicoBarragem,
): BarragemValidationIssue[] {
  const issues: BarragemValidationIssue[] = [];

  if (!hasText(projeto.requerente?.nome)) {
    issues.push({
      field: 'requerente.nome',
      message: 'Nome do proprietário/requerente é obrigatório.',
      severity: 'error',
    });
  }
  if (!hasText(projeto.empreendimento?.nome)) {
    issues.push({
      field: 'empreendimento.nome',
      message: 'Nome do empreendimento é obrigatório.',
      severity: 'error',
    });
  }
  if (!hasText(projeto.responsavelTecnico?.nome)) {
    issues.push({
      field: 'responsavelTecnico.nome',
      message: 'Responsável técnico é obrigatório.',
      severity: 'error',
    });
  }

  const cotaEspelho = parseNumeroFormulario(projeto.capacidadeReservatorio?.cotaEspelhoDagua);
  const cotaTerreno = parseNumeroFormulario(projeto.capacidadeReservatorio?.cotaTerrenoNatural);
  if (cotaEspelho != null && cotaTerreno != null && cotaEspelho <= cotaTerreno) {
    issues.push({
      field: 'capacidadeReservatorio.cotaEspelhoDagua',
      message: 'Cota do espelho d\'água deve ser superior à cota do terreno natural.',
      severity: 'error',
    });
  }

  const tabela = projeto.capacidadeReservatorio?.tabelaNiveis ?? [];
  let prevVol: number | null = null;
  for (let i = 0; i < tabela.length; i++) {
    const vol = parseNumeroFormulario(tabela[i]?.volumeAcumuladoM3);
    if (vol != null && prevVol != null && vol < prevVol) {
      issues.push({
        field: `capacidadeReservatorio.tabelaNiveis.${i}.volumeAcumuladoM3`,
        message: `Volume acumulado deve crescer com a cota (linha ${i + 1}).`,
        severity: 'error',
      });
      break;
    }
    if (vol != null) prevVol = vol;
  }

  const volumeDeclarado = parseNumeroFormulario(projeto.capacidadeReservatorio?.volumeArmazenadoM3);
  const ultimaLinha = tabela[tabela.length - 1];
  const volumeTabela = parseNumeroFormulario(ultimaLinha?.volumeAcumuladoM3);
  if (
    volumeDeclarado != null &&
    volumeTabela != null &&
    Math.abs(volumeDeclarado - volumeTabela) > volumeDeclarado * 0.05
  ) {
    issues.push({
      field: 'capacidadeReservatorio.volumeArmazenadoM3',
      message:
        'Volume armazenado declarado difere mais de 5% do volume acumulado na última linha da tabela — conferir.',
      severity: 'warning',
    });
  }

  const hidro = projeto.calculosHidrologicos;
  if (hasText(hidro?.coeficienteEscoamento)) {
    const C = parseNumeroFormulario(hidro?.coeficienteEscoamento);
    if (C != null && (C <= 0 || C > 1)) {
      issues.push({
        field: 'calculosHidrologicos.coeficienteEscoamento',
        message: 'Coeficiente de escoamento C deve estar entre 0 e 1.',
        severity: 'warning',
      });
    }
  }

  const vRippl = parseNumeroFormulario(projeto.regularizacaoRippl?.volumeUtilRipplM3);
  const vCap =
    parseNumeroFormulario(projeto.capacidadeArmazenamentoM3) ??
    parseNumeroFormulario(projeto.capacidadeReservatorio?.volumeArmazenadoM3);
  if (vRippl != null && vCap != null && vRippl > vCap) {
    issues.push({
      field: 'regularizacaoRippl.volumeUtilRipplM3',
      message: 'Volume útil Rippl supera a capacidade declarada do reservatório — revisar.',
      severity: 'warning',
    });
  }

  const fs = parseNumeroFormulario(projeto.estabilidadeTaludes?.fatorSeguranca);
  const cenario = projeto.estabilidadeTaludes?.cenario ?? 'operacao_normal';
  const crit = BISHOP_CENARIOS.find((c) => c.value === cenario);
  if (fs != null && crit && fs < crit.fsMin) {
    issues.push({
      field: 'estabilidadeTaludes.fatorSeguranca',
      message: `FS Bishop (${fs.toFixed(2)}) abaixo do mínimo preliminar (${crit.fsMin}) para ${crit.label}.`,
      severity: 'warning',
    });
  }

  const fsD = parseNumeroFormulario(projeto.estabilidadeConcretoGravidade?.fsDeslizamento);
  const fsT = parseNumeroFormulario(projeto.estabilidadeConcretoGravidade?.fsTombamento);
  if (fsD != null && fsD < GRAVITY_DAM_FS_MIN.deslizamento) {
    issues.push({
      field: 'estabilidadeConcretoGravidade.fsDeslizamento',
      message: `FS deslizamento (${fsD.toFixed(2)}) abaixo do mínimo preliminar (${GRAVITY_DAM_FS_MIN.deslizamento}).`,
      severity: 'warning',
    });
  }
  if (fsT != null && fsT < GRAVITY_DAM_FS_MIN.tombamento) {
    issues.push({
      field: 'estabilidadeConcretoGravidade.fsTombamento',
      message: `FS tombamento (${fsT.toFixed(2)}) abaixo do mínimo preliminar (${GRAVITY_DAM_FS_MIN.tombamento}).`,
      severity: 'warning',
    });
  }

  const sigmaMin = parseNumeroFormulario(projeto.estabilidadeConcretoGravidade?.tensaoMinKpa);
  if (sigmaMin != null && sigmaMin < 0) {
    issues.push({
      field: 'estabilidadeConcretoGravidade.tensaoMinKpa',
      message: `Tensão mínima na base (${sigmaMin.toFixed(0)} kPa) indica tração — revisar antes de exportar.`,
      severity: 'warning',
    });
  }

  return issues;
}

export function barragemExportBlockingIssues(
  issues: BarragemValidationIssue[],
): BarragemValidationIssue[] {
  return issues.filter((i) => i.severity !== 'warning');
}

export function barragemExportWarnings(issues: BarragemValidationIssue[]): BarragemValidationIssue[] {
  return issues.filter((i) => i.severity === 'warning');
}
