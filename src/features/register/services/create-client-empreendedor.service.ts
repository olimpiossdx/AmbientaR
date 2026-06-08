import { doc, setDoc, updateDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { createNotificationForUser } from "@/lib/notifications";
import {
  getEntityTypeFromDocument,
  normalizeDocument,
  isValidCpfOrCnpj,
} from "../schemas/register.schema";
import type { RegisterFormValues } from "../schemas/register.schema";
import type { RegisterLinkedEntities } from "../types/register.types";

export type CreateClientEmpreendedorInput = {
  firestore: Firestore;
  uid: string;
  values: RegisterFormValues;
  linked: RegisterLinkedEntities;
};

export async function createOrUpdateClientEmpreendedor({
  firestore,
  uid,
  values,
  linked,
}: CreateClientEmpreendedorInput): Promise<void> {
  const userCpfNormalized = normalizeDocument(values.cpf);
  const titularFromField = normalizeDocument(values.cpfCnpjTitular);
  const titularDocument = !isValidCpfOrCnpj(values.cpfCnpjTitular)
    ? userCpfNormalized
    : titularFromField;
  const titularEntityType = getEntityTypeFromDocument(titularDocument);
  const hasExistingLink = Boolean(linked.linkedClientId || linked.linkedEmpreendedorId);

  const empreendedorData = {
    name: values.name,
    phone: values.phone,
    address: "",
    numero: "",
    bairro: "",
    complemento: "",
    municipio: "",
    uf: "",
    cep: "",
    email: values.email,
    cpfCnpj: titularDocument,
    entityType: [titularEntityType],
    userId: uid,
  };
  const clientData = {
    name: values.name,
    phone: values.phone,
    address: "",
    numero: "",
    bairro: "",
    municipio: "",
    uf: "",
    cep: "",
    email: values.email,
    cpfCnpj: titularDocument,
    entityType: titularEntityType,
    dataNascimento: "",
    ctfIbama: "",
    userId: uid,
  };

  try {
    if (hasExistingLink) {
      if (linked.linkedEmpreendedorId) {
        await updateDoc(
          doc(firestore, "empreendedores", linked.linkedEmpreendedorId),
          empreendedorData,
        );
      }
      if (linked.linkedClientId) {
        await updateDoc(doc(firestore, "clients", linked.linkedClientId), clientData);
      }
    } else {
      const empreendedorRef = doc(firestore, "empreendedores", uid);
      const clientRef = doc(firestore, "clients", uid);
      await setDoc(empreendedorRef, empreendedorData, { merge: true });
      await setDoc(clientRef, clientData, { merge: true });

      await createNotificationForUser(firestore, uid, {
        title: "Concluir cadastro",
        description:
          "Complete os dados do seu Cliente e Empreendedor no menu Cadastro.",
        link: `/empreendedores/${uid}/edit`,
        sourceType: "onboarding",
        sourceId: uid,
        actorRole: "admin",
      });
    }
  } catch (e) {
    console.warn(
      "Cadastro inicial de Cliente/Empreendedor não foi concluído integralmente.",
      e,
    );
  }
}
