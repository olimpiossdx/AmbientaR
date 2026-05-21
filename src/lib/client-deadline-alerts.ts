import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import {
  diasCorridosRestantesDefesa,
  parseDateOnly,
  PRAZO_DEFESA_1_INSTANCIA_DIAS,
} from "@/lib/multas-defesas";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import {
  getRecipientUserIdsForEmpreendedor,
  getRecipientUserIdsFromCondicionanteReference,
} from "@/lib/notification-recipients";
import { notifyPortalUsers } from "@/lib/notifications";

const PRAZO_ALERTA_DIAS = [5, 3, 1, 0] as const;

function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Dias corridos até a data (0 = hoje, negativo = vencido). */
export function daysUntilIsoDate(iso?: string | null): number | null {
  const due = parseDateOnly(iso ?? undefined);
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function isPrazoAlertDay(dias: number): boolean {
  return PRAZO_ALERTA_DIAS.includes(dias as (typeof PRAZO_ALERTA_DIAS)[number]);
}

async function buildAllowedPortalUserSet(
  firestore: Firestore,
  empreendedorIds: string[],
): Promise<Set<string>> {
  const allowed = new Set<string>();
  for (const empId of empreendedorIds) {
    const ids = await getRecipientUserIdsForEmpreendedor(firestore, empId);
    ids.forEach((id) => allowed.add(id));
  }
  return allowed;
}

async function runMultaDefesaDeadlineAlerts(
  firestore: Firestore,
  empreendedorIds: string[],
  options?: { excludeUserId?: string },
): Promise<void> {
  for (const chunk of chunkArray(empreendedorIds, 10)) {
    const snap = await getDocs(
      query(
        collection(firestore, "autoInfracaoDefesas"),
        where("empreendedorId", "in", chunk),
      ),
    );

    for (const docSnap of snap.docs) {
      const data = docSnap.data() as {
        empreendedorId?: string;
        processNumber?: string;
        dataCientificacao?: string;
        prazoDefesaDias?: number;
        status?: string;
      };

      if (
        data.status &&
        data.status !== "aguardando_opcao" &&
        data.status !== "demanda_defesa_pendente"
      ) {
        continue;
      }

      const dias = diasCorridosRestantesDefesa(
        data.dataCientificacao,
        data.prazoDefesaDias ?? PRAZO_DEFESA_1_INSTANCIA_DIAS,
      );
      if (dias === null || dias < 0 || dias > 5 || !isPrazoAlertDay(dias)) continue;

      const recipients = await getRecipientUserIdsForEmpreendedor(
        firestore,
        data.empreendedorId,
      );
      if (recipients.length === 0) continue;

      const title =
        dias === 0
          ? "Prazo de defesa encerra hoje"
          : `Prazo de defesa: ${dias} dia(s) restante(s)`;

      await notifyPortalUsers(
        firestore,
        recipients,
        {
          title,
          description: `Processo ${data.processNumber || docSnap.id}. Confira em Multas e Defesas.`,
          link: NOTIFICATION_LINKS.multasDefesas,
          sourceType: NOTIFICATION_SOURCE.prazo_multa_defesa,
          sourceId: `${docSnap.id}_d${dias}`,
          actorRole: "gestor",
        },
        options,
      );
    }
  }
}

async function runCondicionanteDeadlineAlerts(
  firestore: Firestore,
  allowedPortalUsers: Set<string>,
  options?: { excludeUserId?: string },
): Promise<void> {
  if (allowedPortalUsers.size === 0) return;

  const snap = await getDocs(collection(firestore, "condicionantes"));
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as {
      description?: string;
      dueDate?: string;
      status?: string;
      referenceType?: "licenca" | "outorga" | "intervencao";
      referenceId?: string;
    };

    if (
      data.status === "Cumprida" ||
      data.status === "Não Aplicável" ||
      !data.referenceType ||
      !data.referenceId
    ) {
      continue;
    }

    const dias = daysUntilIsoDate(data.dueDate);
    if (dias === null || dias < 0 || dias > 5 || !isPrazoAlertDay(dias)) continue;

    const recipients = (
      await getRecipientUserIdsFromCondicionanteReference(
        firestore,
        data.referenceType,
        data.referenceId,
      )
    ).filter((id) => allowedPortalUsers.has(id));

    if (recipients.length === 0) continue;

    const title =
      dias === 0
        ? "Condicionante vence hoje"
        : `Condicionante: ${dias} dia(s) para o vencimento`;

    await notifyPortalUsers(
      firestore,
      recipients,
      {
        title,
        description:
          (data.description || "Condicionante ambiental").slice(0, 120) +
          " — veja em Condicionantes.",
        link: NOTIFICATION_LINKS.compliance,
        sourceType: NOTIFICATION_SOURCE.prazo_condicionante,
        sourceId: `${docSnap.id}_d${dias}`,
        actorRole: "gestor",
      },
      options,
    );
  }
}

async function notifyDocumentExpiration(
  firestore: Firestore,
  recipients: string[],
  opts: {
    dias: number;
    label: string;
    permitNumber?: string;
    link: string;
    sourceType: string;
    sourceId: string;
  },
  options?: { excludeUserId?: string },
): Promise<void> {
  if (recipients.length === 0) return;
  const title =
    opts.dias === 0
      ? `${opts.label} vence hoje`
      : `${opts.label}: ${opts.dias} dia(s) para o vencimento`;

  await notifyPortalUsers(
    firestore,
    recipients,
    {
      title,
      description: `Documento ${opts.permitNumber || ""}. Confira em Documentos Ambientais.`,
      link: opts.link,
      sourceType: opts.sourceType,
      sourceId: opts.sourceId,
      actorRole: "gestor",
    },
    options,
  );
}

async function runLicencaExpirationAlerts(
  firestore: Firestore,
  empreendedorIds: string[],
  options?: { excludeUserId?: string },
): Promise<void> {
  for (const chunk of chunkArray(empreendedorIds, 10)) {
    const projectsSnap = await getDocs(
      query(collection(firestore, "projects"), where("empreendedorId", "in", chunk)),
    );
    const projectEmpMap = new Map(
      projectsSnap.docs.map((d) => [
        d.id,
        (d.data() as { empreendedorId?: string }).empreendedorId,
      ]),
    );
    const projectIds = [...projectEmpMap.keys()];
    if (projectIds.length === 0) continue;

    for (const projChunk of chunkArray(projectIds, 10)) {
      const licSnap = await getDocs(
        query(collection(firestore, "licenses"), where("projectId", "in", projChunk)),
      );
      for (const licDoc of licSnap.docs) {
        const data = licDoc.data() as {
          projectId?: string;
          permitNumber?: string;
          expirationDate?: string;
        };
        const dias = daysUntilIsoDate(data.expirationDate);
        if (dias === null || dias < 0 || dias > 5 || !isPrazoAlertDay(dias)) continue;

        const recipients = await getRecipientUserIdsForEmpreendedor(
          firestore,
          data.projectId ? projectEmpMap.get(data.projectId) : undefined,
        );

        await notifyDocumentExpiration(
          firestore,
          recipients,
          {
            dias,
            label: "Licença",
            permitNumber: data.permitNumber,
            link: NOTIFICATION_LINKS.licenses,
            sourceType: NOTIFICATION_SOURCE.prazo_licenca,
            sourceId: `${licDoc.id}_d${dias}`,
          },
          options,
        );
      }
    }
  }
}

async function runOutorgaExpirationAlerts(
  firestore: Firestore,
  empreendedorIds: string[],
  options?: { excludeUserId?: string },
): Promise<void> {
  for (const chunk of chunkArray(empreendedorIds, 10)) {
    const snap = await getDocs(
      query(collection(firestore, "outorgas"), where("empreendedorId", "in", chunk)),
    );
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as {
        empreendedorId?: string;
        permitNumber?: string;
        expirationDate?: string;
      };
      const dias = daysUntilIsoDate(data.expirationDate);
      if (dias === null || dias < 0 || dias > 5 || !isPrazoAlertDay(dias)) continue;

      const recipients = await getRecipientUserIdsForEmpreendedor(
        firestore,
        data.empreendedorId,
      );
      await notifyDocumentExpiration(
        firestore,
        recipients,
        {
          dias,
          label: "Outorga",
          permitNumber: data.permitNumber,
          link: NOTIFICATION_LINKS.outorgas,
          sourceType: NOTIFICATION_SOURCE.prazo_outorga,
          sourceId: `${docSnap.id}_d${dias}`,
        },
        options,
      );
    }
  }
}

async function runIntervencaoExpirationAlerts(
  firestore: Firestore,
  empreendedorIds: string[],
  options?: { excludeUserId?: string },
): Promise<void> {
  for (const chunk of chunkArray(empreendedorIds, 10)) {
    const snap = await getDocs(
      query(
        collection(firestore, "intervencoes"),
        where("empreendedorId", "in", chunk),
      ),
    );
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as {
        empreendedorId?: string;
        processNumber?: string;
        expirationDate?: string;
      };
      const dias = daysUntilIsoDate(data.expirationDate);
      if (dias === null || dias < 0 || dias > 5 || !isPrazoAlertDay(dias)) continue;

      const recipients = await getRecipientUserIdsForEmpreendedor(
        firestore,
        data.empreendedorId,
      );
      await notifyDocumentExpiration(
        firestore,
        recipients,
        {
          dias,
          label: "DAIA / intervenção",
          permitNumber: data.processNumber,
          link: NOTIFICATION_LINKS.intervencoes,
          sourceType: NOTIFICATION_SOURCE.prazo_intervencao,
          sourceId: `${docSnap.id}_d${dias}`,
        },
        options,
      );
    }
  }
}

/**
 * Alertas de prazo no sino do portal do cliente (multas, condicionantes, vencimento de documentos).
 */
export async function runClientPortalDeadlineAlerts(
  firestore: Firestore,
  empreendedorIds: string[],
  options?: { excludeUserId?: string },
): Promise<void> {
  const uniqueEmp = [...new Set(empreendedorIds.filter(Boolean))];
  if (uniqueEmp.length === 0) return;

  const allowedPortalUsers = await buildAllowedPortalUserSet(firestore, uniqueEmp);

  await runMultaDefesaDeadlineAlerts(firestore, uniqueEmp, options);
  await runCondicionanteDeadlineAlerts(firestore, allowedPortalUsers, options);
  await runLicencaExpirationAlerts(firestore, uniqueEmp, options);
  await runOutorgaExpirationAlerts(firestore, uniqueEmp, options);
  await runIntervencaoExpirationAlerts(firestore, uniqueEmp, options);
}

/** @deprecated Use {@link runClientPortalDeadlineAlerts} */
export async function runClientDeadlineAlerts(
  firestore: Firestore,
  empreendedorIds: string[],
  options?: { excludeUserId?: string },
): Promise<void> {
  return runClientPortalDeadlineAlerts(firestore, empreendedorIds, options);
}
