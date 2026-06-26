import type { Firestore } from "firebase/firestore";
import type { AppUser } from "@/lib/types";
import { isClientePortalRole } from "@/lib/role-guards";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import {
  ensureUnreadNotification,
  markNotificationsReadBySource,
} from "@/lib/notifications";

function cadastroIncompletoLink(user: AppUser): string {
  const uid = user.uid || user.id;
  if (user.role === "client" && uid) {
    return user.linkedEmpreendedorId
      ? `/empreendedores/${user.linkedEmpreendedorId}/edit`
      : `/empreendedores/${uid}/edit`;
  }
  if (uid) {
    return `/empreendedores/${uid}/edit`;
  }
  return NOTIFICATION_LINKS.empreendedores;
}

/** Sincroniza notificação de cadastro incompleto de empreendedor no sino/push. */
export async function syncCadastroIncompletoNotification(
  firestore: Firestore,
  user: AppUser,
): Promise<void> {
  const uid = user.uid || user.id;
  if (!uid) return;

  const isTitularPortal = isClientePortalRole(user.role);
  if (!isTitularPortal) return;

  if (user.cadastroIncompleto) {
    await ensureUnreadNotification(firestore, uid, {
      title: "Cadastro incompleto",
      description:
        "Complete os dados do empreendedor no menu Cadastro para utilizar todos os recursos.",
      link: cadastroIncompletoLink(user),
      sourceType: NOTIFICATION_SOURCE.cadastro_incompleto,
      sourceId: uid,
      actorRole: "admin",
    });
    return;
  }

  await markNotificationsReadBySource(
    firestore,
    uid,
    NOTIFICATION_SOURCE.cadastro_incompleto,
    uid,
  );
  await markNotificationsReadBySource(
    firestore,
    uid,
    NOTIFICATION_SOURCE.onboarding,
    uid,
  );
}

export async function clearCadastroIncompletoNotifications(
  firestore: Firestore,
  userId: string,
): Promise<void> {
  if (!userId?.trim()) return;
  await markNotificationsReadBySource(
    firestore,
    userId,
    NOTIFICATION_SOURCE.cadastro_incompleto,
    userId,
  );
  await markNotificationsReadBySource(
    firestore,
    userId,
    NOTIFICATION_SOURCE.onboarding,
    userId,
  );
}
