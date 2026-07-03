import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import type { FaunaStudy } from "@/lib/types";

export async function saveFaunaStudy(
  firestore: Firestore,
  data: Record<string, unknown> & { id?: string },
  studyType: FaunaStudy["studyType"],
  status: "draft" | "completed",
): Promise<string> {
  const { id, ...rest } = data;
  const payload = { ...rest, studyType, status };

  if (id && typeof id === "string") {
    await updateDoc(doc(firestore, "faunaStudies", id), payload);
    return id;
  }

  const ref = await addDoc(collection(firestore, "faunaStudies"), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
