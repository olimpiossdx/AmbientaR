import { collection, getDocs, query, where, type Firestore } from "firebase/firestore";
import { daysUntilIsoDate } from "@/lib/client-deadline-alerts";
import type { OfficeTask } from "@/lib/gestao-processos/task-types";
import { isOfficeTaskActive } from "@/lib/gestao-processos/task-utils";
import { GESTAO_PROCESSOS_TAREFAS_PATH } from "@/lib/gestao-processos-menu";
import { NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyPortalUsers } from "@/lib/notifications";

const PRAZO_ALERTA_DIAS = [5, 3, 1, 0] as const;
const PRAZO_ATRASO_DIAS = [1, 3, 5] as const;

function isPrazoAlertDay(dias: number): boolean {
  return PRAZO_ALERTA_DIAS.includes(dias as (typeof PRAZO_ALERTA_DIAS)[number]);
}

function isPrazoAtrasoAlertDay(diasAtraso: number): boolean {
  return PRAZO_ATRASO_DIAS.includes(diasAtraso as (typeof PRAZO_ATRASO_DIAS)[number]);
}

/**
 * Alertas de prazo de tarefas avulsas para o técnico atribuído (equipa interna).
 */
export async function runOfficeTaskDeadlineAlerts(
  firestore: Firestore,
  assigneeUid: string,
  options?: { excludeUserId?: string },
): Promise<void> {
  if (!assigneeUid?.trim()) return;

  const snap = await getDocs(
    query(
      collection(firestore, "officeTasks"),
      where("assigneeUid", "==", assigneeUid),
    ),
  );

  for (const docSnap of snap.docs) {
    const task = { id: docSnap.id, ...docSnap.data() } as OfficeTask;
    if (!isOfficeTaskActive(task.status) || !task.prazo) continue;

    const dias = daysUntilIsoDate(task.prazo);
    if (dias === null) continue;

    if (dias >= 0 && dias <= 5 && isPrazoAlertDay(dias)) {
      const title =
        dias === 0
          ? "Tarefa com prazo hoje"
          : `Tarefa: ${dias} dia(s) para o prazo`;

      await notifyPortalUsers(
        firestore,
        [assigneeUid],
        {
          title,
          description: `${task.titulo}. Confira em Gestão de Projetos e Processos → Tarefas.`,
          link: `${GESTAO_PROCESSOS_TAREFAS_PATH}?tarefa=${encodeURIComponent(task.id)}`,
          sourceType: NOTIFICATION_SOURCE.prazo_tarefa,
          sourceId: `${task.id}_d${dias}`,
          actorRole: "gestor",
        },
        options,
      );
      continue;
    }

    if (dias < 0) {
      const diasAtraso = Math.abs(dias);
      if (!isPrazoAtrasoAlertDay(diasAtraso)) continue;

      await notifyPortalUsers(
        firestore,
        [assigneeUid],
        {
          title: `Tarefa atrasada há ${diasAtraso} dia(s)`,
          description: `${task.titulo}. Confira em Gestão de Projetos e Processos → Tarefas.`,
          link: `${GESTAO_PROCESSOS_TAREFAS_PATH}?tarefa=${encodeURIComponent(task.id)}`,
          sourceType: NOTIFICATION_SOURCE.prazo_tarefa,
          sourceId: `${task.id}_late${diasAtraso}`,
          actorRole: "gestor",
        },
        options,
      );
    }
  }
}

/** Link usado em notificações de atribuição de tarefa. */
export const OFFICE_TASK_NOTIFICATION_LINK = GESTAO_PROCESSOS_TAREFAS_PATH;
