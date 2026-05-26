import { collection, getDocs, limit, query, where, type Firestore } from 'firebase/firestore';
import type { InventarioIndividuo, InventarioParcela } from '@/lib/types';
import { COLLECTION_INDIVIDUOS, COLLECTION_PARCELAS } from './constants';
import type { ExportCampanhaInput } from './export-excel';
import { validateCampanhaForExport, type ExportValidationIssue } from './export-excel';

export type InventoryImportFromCampanhaPayload = {
  importedSpecies: Array<{
    id: string;
    codigoEspecie: string;
    nomeCientifico: string;
    nomeComum: string;
    familia: string;
  }>;
  importedParcels: Array<{
    id: string;
    parcela: string;
    areaM2: string;
    up: string;
    us: string;
    ni: string;
    regNatural: boolean;
  }>;
  importedTrees: Array<{
    id: string;
    parcela: string;
    numArvore: string;
    nomeComum: string;
    nomeCientifico: string;
    cap: string;
    altTotal: string;
    altComercial: string;
    dap: string;
    areaParcela: string;
  }>;
};

export type CampanhaImportValidationIssue = ExportValidationIssue;

function sortParcelas(a: InventarioParcela, b: InventarioParcela): number {
  const oa = a.ordem ?? 0;
  const ob = b.ordem ?? 0;
  if (oa !== ob) return oa - ob;
  return String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''), 'pt-BR');
}

function sortIndividuos(a: InventarioIndividuo, b: InventarioIndividuo): number {
  const na = a.numero ?? 0;
  const nb = b.numero ?? 0;
  return na - nb;
}

/** Validações para carregar campanha concluída no Inventário Florestal (além do export Excel). */
export function validateCampanhaForInventoryImport(
  input: ExportCampanhaInput,
): CampanhaImportValidationIssue[] {
  const issues: CampanhaImportValidationIssue[] = [...validateCampanhaForExport(input)];
  const parcelaIds = new Set(input.parcelas.map((p) => p.id));

  for (const ind of input.individuos) {
    if (!parcelaIds.has(ind.parcelaId)) {
      issues.push({
        level: 'error',
        message: `Indivíduo sem parcela válida (parcelaId: ${ind.parcelaId}).`,
      });
    }
    const nomeCientifico = String(ind.nomeCientifico ?? ind.especie ?? '').trim();
    const nomeComum = String(ind.nomeComum ?? ind.nomePopular ?? '').trim();
    if (!nomeCientifico && !nomeComum) {
      const ref = ind.numero != null ? `nº ${ind.numero}` : 'sem número';
      issues.push({
        level: 'warn',
        message: `Árvore ${ref} sem nome científico nem comum.`,
      });
    }
  }

  const parcelasComArvore = new Set(input.individuos.map((i) => i.parcelaId));
  const parcelasVazias = input.parcelas.filter((p) => !parcelasComArvore.has(p.id));
  if (parcelasVazias.length) {
    issues.push({
      level: 'warn',
      message: `${parcelasVazias.length} parcela(s) sem árvores registradas — não entrarão nas linhas importadas.`,
    });
  }

  return issues;
}

export function hasBlockingCampanhaImportIssues(
  issues: CampanhaImportValidationIssue[],
): boolean {
  return issues.some((i) => i.level === 'error');
}

/** Converte campanha + parcelas + indivíduos para o mesmo payload do importador Excel. */
export function mapCampanhaToInventoryImport(
  input: ExportCampanhaInput,
): InventoryImportFromCampanhaPayload {
  const sortedParcelas = [...input.parcelas].sort(sortParcelas);

  const speciesMap = new Map<
    string,
    InventoryImportFromCampanhaPayload['importedSpecies'][number]
  >();
  let autoCode = 1;

  const importedTrees: InventoryImportFromCampanhaPayload['importedTrees'] = [];
  let treeIndex = 0;

  for (const parcela of sortedParcelas) {
    const codigoParcela = String(parcela.codigo ?? '').trim() || parcela.id;
    const inds = input.individuos
      .filter((i) => i.parcelaId === parcela.id)
      .sort(sortIndividuos);

    for (const ind of inds) {
      const nomeCientifico = String(ind.nomeCientifico ?? ind.especie ?? '').trim();
      const nomeComum = String(ind.nomeComum ?? ind.nomePopular ?? '').trim();
      const familia = String(ind.familia ?? '').trim();

      if (nomeCientifico || nomeComum) {
        const speciesKey = `${nomeCientifico.toLowerCase()}|${nomeComum.toLowerCase()}|${familia.toLowerCase()}`;
        if (!speciesMap.has(speciesKey)) {
          speciesMap.set(speciesKey, {
            id: speciesKey,
            codigoEspecie: String(autoCode++),
            nomeCientifico,
            nomeComum,
            familia,
          });
        }
      }

      const numArvore = ind.numero != null ? String(ind.numero) : '';
      importedTrees.push({
        id: `${codigoParcela}-${numArvore || treeIndex}-${treeIndex}`,
        parcela: codigoParcela,
        numArvore,
        nomeComum,
        nomeCientifico,
        cap: ind.cap != null ? String(ind.cap) : '',
        altTotal: ind.altura != null ? String(ind.altura) : '',
        altComercial: ind.altComercial != null ? String(ind.altComercial) : '',
        dap: ind.dap != null ? String(ind.dap) : '',
        areaParcela: parcela.area != null ? String(parcela.area) : '',
      });
      treeIndex += 1;
    }
  }

  const importedParcels = sortedParcelas.map((parcela) => {
    const codigoParcela = String(parcela.codigo ?? '').trim() || parcela.id;
    return {
      id: codigoParcela,
      parcela: codigoParcela,
      areaM2: parcela.area != null ? String(parcela.area) : '',
      up: String(parcela.up ?? '').trim(),
      us: String(parcela.us ?? '').trim(),
      ni: String(parcela.ni ?? '').trim(),
      regNatural: false,
    };
  });

  return {
    importedSpecies: Array.from(speciesMap.values()),
    importedParcels,
    importedTrees,
  };
}

/** Carrega parcelas e indivíduos de uma campanha (para o modal de importação). */
export async function fetchCampanhaColetaDetails(
  firestore: Firestore,
  campanhaId: string,
): Promise<{ parcelas: InventarioParcela[]; individuos: InventarioIndividuo[] }> {
  const [parcelasSnap, individuosSnap] = await Promise.all([
    getDocs(
      query(
        collection(firestore, COLLECTION_PARCELAS),
        where('inventarioId', '==', campanhaId),
        limit(500),
      ),
    ),
    getDocs(
      query(
        collection(firestore, COLLECTION_INDIVIDUOS),
        where('inventarioId', '==', campanhaId),
        limit(2000),
      ),
    ),
  ]);

  const parcelas = parcelasSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as InventarioParcela,
  );
  const individuos = individuosSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as InventarioIndividuo,
  );

  return { parcelas, individuos };
}
