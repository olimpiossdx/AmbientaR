import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ClientPackage, PlatformContractPublic } from "@/lib/types";
import {
  RegisterContractContent,
  packageRequiresMarketingOptIn,
} from "@/app/register/contract-content";
import type { RegisterFormValues } from "../schemas/register.schema";

type RegisterContractStepProps = {
  form: UseFormReturn<RegisterFormValues>;
  selectedPackage: ClientPackage | undefined;
  platformCompany: PlatformContractPublic | null | undefined;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function RegisterContractStep({
  form,
  selectedPackage,
  platformCompany,
  onCancel,
  onBack,
  onNext,
}: RegisterContractStepProps) {
  const contractAccepted = form.watch("contractAccepted");
  const marketingContactConsent = form.watch("marketingContactConsent");
  const canAdvance =
    contractAccepted &&
    (!packageRequiresMarketingOptIn(selectedPackage) || marketingContactConsent);

  return (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Contrato e Assinatura</CardTitle>
        <CardDescription>
          Leia os termos e assine para seguir para o pagamento anual da
          plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-white dark:bg-muted/30 max-h-[min(28rem,70vh)] overflow-y-auto shadow-inner">
          <RegisterContractContent
            packageId={selectedPackage}
            platformCompany={platformCompany}
          />
        </div>

        {packageRequiresMarketingOptIn(selectedPackage) && (
          <FormField
            control={form.control}
            name="marketingContactConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-primary/25 bg-primary/5 p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm cursor-pointer font-medium">
                    Autorizo o uso dos meus dados de contato (e-mail, telefone e
                    demais informações fornecidas) para receber comunicações
                    comerciais, ofertas e novidades da CONTRATADA, nos termos da
                    cláusula de privacidade e marketing deste contrato.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="contractAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true ? true : undefined)
                  }
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm cursor-pointer">
                  Li e aceito os termos do contrato de prestação de serviços.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-3 flex-wrap">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button type="button" className="flex-1" onClick={onNext} disabled={!canAdvance}>
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
