import { redirect } from "next/navigation";

export default function StudiesFaunaPage() {
  // Esta rota existia como placeholder, mas o módulo completo está em `/fauna`.
  redirect("/fauna");
}
