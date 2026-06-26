import { doc, getDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';

export type PiaFloraSpeciesRow = {
  nomeCientifico: string;
  nomeComum: string;
  familia: string;
  nIndividuos: number;
};

export type PiaFloraParcelRow = {
  parcela: string;
  areaM2: string;
  estrato?: string;
};

export type PiaInventorySnapshot = {
  inventoryId: string;
  projectName: string;
  importedAt?: string;
  totalSpecies: number;
  totalParcels: number;
  totalTrees: number;
  species: PiaFloraSpeciesRow[];
  parcels: PiaFloraParcelRow[];
  summaryText: string;
};

function txt(v: string | undefined | null, fallback = '—'): string {
  const s = v != null ? String(v).trim() : '';
  return s || fallback;
}

export function buildInventorySnapshotFromProject(
  project: InventoryProject,
): PiaInventorySnapshot {
  const speciesList = project.importedSpecies ?? [];
  const trees = project.importedTrees ?? [];
  const parcels = project.importedParcels ?? [];

  const countByScientific = new Map<string, PiaFloraSpeciesRow>();

  for (const sp of speciesList) {
    const key = txt(sp.nomeCientifico, sp.codigoEspecie || sp.id);
    countByScientific.set(key, {
      nomeCientifico: txt(sp.nomeCientifico, key),
      nomeComum: txt(sp.nomeComum),
      familia: txt(sp.familia),
      nIndividuos: 0,
    });
  }

  for (const tree of trees) {
    const key = txt(tree.nomeCientifico, tree.nomeComum || tree.id);
    const existing = countByScientific.get(key);
    if (existing) {
      existing.nIndividuos += 1;
      if (!existing.nomeComum && tree.nomeComum) existing.nomeComum = tree.nomeComum;
    } else {
      countByScientific.set(key, {
        nomeCientifico: txt(tree.nomeCientifico, key),
        nomeComum: txt(tree.nomeComum),
        familia: '—',
        nIndividuos: 1,
      });
    }
  }

  const species = [...countByScientific.values()].sort(
    (a, b) => b.nIndividuos - a.nIndividuos || a.nomeCientifico.localeCompare(b.nomeCientifico, 'pt-BR'),
  );

  const parcelRows: PiaFloraParcelRow[] = parcels.map((p) => ({
    parcela: txt(p.parcela),
    areaM2: txt(p.areaM2),
    estrato: txt(p.up),
  }));

  const totalTrees = trees.length;
  const summaryLines = [
    `Projeto de inventário: ${txt(project.nome)}`,
    `Espécies cadastradas: ${speciesList.length}`,
    `Indivíduos (árvores) amostrados: ${totalTrees}`,
    `Parcelas: ${parcels.length}`,
  ];
  if (species.length > 0) {
    summaryLines.push('', 'Composição florística (resumo):');
    for (const s of species.slice(0, 40)) {
      summaryLines.push(
        `• ${s.nomeComum} (${s.nomeCientifico}) — ${s.nIndividuos} indivíduo(s)`,
      );
    }
    if (species.length > 40) {
      summaryLines.push(`… e mais ${species.length - 40} espécies.`);
    }
  } else {
    summaryLines.push(
      '',
      'Nenhum dado de espécies/árvores importado neste inventário. Importe planilhas no módulo Inventário Florestal.',
    );
  }

  if (parcelRows.length > 0) {
    summaryLines.push('', 'Parcelas amostrais:');
    for (const p of parcelRows.slice(0, 20)) {
      summaryLines.push(`• Parcela ${p.parcela} — área ${p.areaM2} m²${p.estrato !== '—' ? ` — UP ${p.estrato}` : ''}`);
    }
  }

  return {
    inventoryId: project.id,
    projectName: txt(project.nome),
    totalSpecies: speciesList.length,
    totalParcels: parcels.length,
    totalTrees,
    species,
    parcels: parcelRows,
    summaryText: summaryLines.join('\n'),
  };
}

export async function loadPiaInventorySnapshot(
  firestore: Firestore,
  inventoryId: string,
): Promise<PiaInventorySnapshot | null> {
  if (!inventoryId?.trim()) return null;
  const snap = await getDoc(doc(firestore, 'inventories', inventoryId.trim()));
  if (!snap.exists()) return null;
  const project = { id: snap.id, ...snap.data() } as InventoryProject;
  return buildInventorySnapshotFromProject(project);
}
