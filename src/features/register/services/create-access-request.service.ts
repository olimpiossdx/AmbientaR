import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { normalizeDocument, isValidCpfOrCnpj } from "../schemas/register.schema";
import type { RegisterFormValues } from "../schemas/register.schema";
import type { RegisterProfileMode } from "../types/register.types";

export type CreateAccessRequestInput = {
  firestore: Firestore;
  uid: string;
  values: RegisterFormValues;
  mode: RegisterProfileMode;
};

export async function createAccessRequest({
  firestore,
  uid,
  values,
  mode,
}: CreateAccessRequestInput): Promise<void> {
  const cpfCnpjTitularRaw = (values.cpfCnpjTitular ?? "").trim();
  const cpfCnpjTitularDigits = normalizeDocument(cpfCnpjTitularRaw);
  if (!isValidCpfOrCnpj(cpfCnpjTitularDigits)) return;

  try {
    await addDoc(collection(firestore, "access_requests"), {
      requestedByUserId: uid,
      requestedByName: values.name,
      requestedByEmail: values.email,
      cpfOfInterested: cpfCnpjTitularDigits,
      requestType:
        mode === "consultor_representante"
          ? "consultor_representante"
          : "representative",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn(
      "Pedido de acesso (access_requests) não criado; solicite depois em Usuários.",
      e,
    );
  }
}
