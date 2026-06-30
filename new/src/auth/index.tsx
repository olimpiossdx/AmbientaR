import { Suspense } from "react";
import { PublicAuthLayout } from "./public-auth-layout";
import { LoginForm } from "./login-form";
export { ForgotPasswordView } from "./forgot-password-view";
export { RegisterView } from "./register-view";

function LoginPageContent() {
  return (
    <PublicAuthLayout>
      <div className="space-y-6">
        <LoginForm />

        <div className="space-y-4 text-center text-sm">
          <p className="text-muted-foreground">
            Não tem uma conta?{" "}
            <a
              href="/register"
              className="font-medium text-primary underline underline-offset-2 hover:no-underline"
            >
              Cadastre-se
            </a>
          </p>
          <a
            href="/forgot-password"
            className="inline-block text-primary underline underline-offset-2 hover:no-underline"
          >
            Esqueceu a senha?
          </a>
        </div>
      </div>
    </PublicAuthLayout>
  );
}

export function LoginView() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
