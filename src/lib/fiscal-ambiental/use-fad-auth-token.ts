import { getAuth } from "firebase/auth";

export async function getFadAuthToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error("Faça login para continuar.");
  }
  return user.getIdToken();
}
