import {
  ArrowRight,
  Check,
  Loader2,
  X,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import type { RegisterFormValues } from "../schemas/register.schema";
import type { RegisterProfileMode } from "../types/register.types";

type RegisterPersonalStepProps = {
  form: UseFormReturn<RegisterFormValues>;
  mode: RegisterProfileMode;
  loading: boolean;
  isTitularPlanMode: boolean;
  canAdvanceStep1: boolean;
  cpfLookupLoading: boolean;
  cpfLinkHint: string | null;
  onCancel: () => void;
  onNext: () => void;
  onTitularDocumentBlur: () => void;
};

export function RegisterPersonalStep({
  form,
  mode,
  loading,
  isTitularPlanMode,
  canAdvanceStep1,
  cpfLookupLoading,
  cpfLinkHint,
  onCancel,
  onNext,
  onTitularDocumentBlur,
}: RegisterPersonalStepProps) {
  return (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Dados Pessoais</CardTitle>
        <CardDescription>
          {mode === "representative"
            ? "Preencha suas informações para criar sua conta de representante."
            : mode === "cliente_autonomo"
              ? "Preencha suas informações para criar sua conta de Cliente Autônomo."
              : "Preencha suas informações para criar sua conta de Cliente Gestão."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {mode === "cliente_autonomo" ? (
              <>
                O CPF abaixo identifica sua conta. Se quiser vincular já um CPF
                ou CNPJ diferente ao cadastro de cliente/empreendedor na
                plataforma, use o segundo campo (opcional); caso contrário, o
                sistema usará o mesmo CPF da conta.
              </>
            ) : (
              <>
                A primeira etapa separa o CPF pessoal do usuário do CPF/CNPJ
                que será usado para vincular os dados na plataforma.
              </>
            )}
          </p>
        </div>
        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <MaskedInput
                  mask="cpf"
                  placeholder="000.000.000-00"
                  {...field}
                  onBlur={() => {
                    field.onBlur();
                    if (mode === "cliente_autonomo") {
                      onTitularDocumentBlur();
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cpfCnpjTitular"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {mode === "representative"
                  ? "CPF ou CNPJ do titular ao qual solicito acesso"
                  : mode === "cliente_autonomo"
                    ? "CPF ou CNPJ vinculado ao cliente/empreendedor (opcional)"
                    : "CPF ou CNPJ vinculado ao cliente/empreendedor"}
              </FormLabel>
              <FormControl>
                <MaskedInput
                  mask="cpfCnpj"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  {...field}
                  onBlur={() => {
                    field.onBlur();
                    onTitularDocumentBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
              {cpfLookupLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verificando cadastro existente…
                </p>
              )}
              {cpfLinkHint && !cpfLookupLoading && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {cpfLinkHint}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {mode === "representative"
                  ? "Informe o documento do cliente titular cujos dados você deseja gerenciar. O titular precisará aprovar seu acesso em Usuários."
                  : mode === "cliente_autonomo"
                    ? "Opcional: deixe em branco para usar só o seu CPF no cadastro inicial; você poderá completar ou alterar dados em Empreendedores depois. Se preencher, o documento será gravado no Cliente/Empreendedor."
                    : "Este documento será gravado no Cliente/Empreendedor e usado para ligar representantes e dados operacionais a este cadastro."}
              </p>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <MaskedInput
                    mask="phone"
                    placeholder="(31) 99999-9999"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isTitularPlanMode ? (
          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar cadastro
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={onNext}
              disabled={!canAdvanceStep1}
            >
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar cadastro
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!canAdvanceStep1 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Concluir Cadastro
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
