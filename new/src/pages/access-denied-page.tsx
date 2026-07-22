import { Link } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../componentes";

export function AccessDeniedPage() {
 return (
  <div className="flex min-h-full items-center justify-center p-6">
   <Card className="w-full max-w-lg text-center">
    <CardHeader>
     <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
      <ShieldX aria-hidden="true" />
     </div>
     <CardTitle>Acesso não autorizado</CardTitle>
     <CardDescription>
      Sua sessão não possui a claim necessária para acessar esta funcionalidade.
     </CardDescription>
    </CardHeader>
    <CardContent>
     <Link
      to="/app"
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
     >
      Voltar ao início
     </Link>
    </CardContent>
   </Card>
  </div>
 );
}
