import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  Loader2,
  Smartphone,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { ClientPackage, PlatformContractPublic, PlatformPaymentMethod } from "@/lib/types";
import { CLIENT_PACKAGE_CATALOG } from "@/lib/package-limits";
import {
  clientPackageRequiresAnnualPaymentStep,
  isPlatformPaymentAutoApproveEnabled,
  PACKAGE_ANNUAL_AMOUNT_LABEL,
} from "@/lib/platform-access";
import {
  formatBankAccountLabel,
  hasPlatformBankDetails,
  resolvePlatformPixCopyPaste,
} from "@/lib/platform-company";
import type { RegisterFormValues } from "../schemas/register.schema";
import type { RegisterPaymentState } from "../types/register.types";

type RegisterPaymentStepProps = {
  form: UseFormReturn<RegisterFormValues>;
  selectedPackage: ClientPackage | undefined;
  platformCompany: PlatformContractPublic | null | undefined;
  loading: boolean;
  payment: RegisterPaymentState;
  onPaymentChange: (patch: Partial<RegisterPaymentState>) => void;
  onCancel: () => void;
  onBack: () => void;
  onCopyPix: () => void;
};

export function RegisterPaymentStep({
  form,
  selectedPackage: pkg,
  platformCompany,
  loading,
  payment,
  onPaymentChange,
  onCancel,
  onBack,
  onCopyPix,
}: RegisterPaymentStepProps) {
  const annual = clientPackageRequiresAnnualPaymentStep(pkg);
  const amount = (pkg && PACKAGE_ANNUAL_AMOUNT_LABEL[pkg]) ?? "Consulte a equipe";
  const pixCode = resolvePlatformPixCopyPaste(platformCompany);

  return (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Pagamento anual</CardTitle>
        <CardDescription>
          Acesso à plataforma AmbientaR mediante{" "}
          <strong>pagamento único anual</strong> por usuário titular. Após a
          confirmação, o acesso fica liberado por 12 meses; ao vencer, será
          necessário renovar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Valor de referência</p>
          <p className="text-2xl font-bold text-primary">{amount}</p>
          {annual && (
            <p className="text-xs text-muted-foreground mt-1">
              Plano selecionado:{" "}
              {CLIENT_PACKAGE_CATALOG.find((p) => p.id === pkg)?.name ?? pkg}
            </p>
          )}
        </div>

        {annual && (
          <>
            <div className="space-y-3">
              <Label className="text-base">Quitação do valor anual</Label>
              <RadioGroup
                value={payment.billingMode}
                onValueChange={(v) =>
                  onPaymentChange({
                    billingMode: v as "annual_upfront" | "monthly_12x",
                  })
                }
                className="grid gap-2 sm:grid-cols-2"
              >
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <RadioGroupItem value="annual_upfront" id="bill-upfront" />
                  <Label htmlFor="bill-upfront" className="cursor-pointer text-sm">
                    À vista (anual)
                  </Label>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <RadioGroupItem value="monthly_12x" id="bill-12x" />
                  <Label htmlFor="bill-12x" className="cursor-pointer text-sm">
                    12 parcelas mensais (sem juros)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Forma de pagamento</Label>
              <RadioGroup
                value={payment.paymentMethod}
                onValueChange={(v) =>
                  onPaymentChange({ paymentMethod: v as PlatformPaymentMethod })
                }
                className="grid gap-3 sm:grid-cols-3"
              >
                <div
                  className={cn(
                    "flex gap-3 rounded-lg border-2 p-4 transition-colors",
                    payment.paymentMethod === "pix"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <RadioGroupItem value="pix" id="pay-pix" className="mt-0.5" />
                  <Label
                    htmlFor="pay-pix"
                    className="flex flex-1 cursor-pointer flex-col gap-1 font-normal"
                  >
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <Smartphone className="h-5 w-5 text-primary shrink-0" />
                      PIX
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Confirmação em até 1 dia útil
                    </span>
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex gap-3 rounded-lg border-2 p-4 transition-colors",
                    payment.paymentMethod === "credit_card"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <RadioGroupItem
                    value="credit_card"
                    id="pay-credit"
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="pay-credit"
                    className="flex flex-1 cursor-pointer flex-col gap-1 font-normal"
                  >
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <CreditCard className="h-5 w-5 text-primary shrink-0" />
                      Cartão de crédito
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Gateway em integração
                    </span>
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex gap-3 rounded-lg border-2 p-4 transition-colors",
                    payment.paymentMethod === "debit_card"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <RadioGroupItem value="debit_card" id="pay-debit" className="mt-0.5" />
                  <Label
                    htmlFor="pay-debit"
                    className="flex flex-1 cursor-pointer flex-col gap-1 font-normal"
                  >
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <Building2 className="h-5 w-5 text-primary shrink-0" />
                      Cartão de débito
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Gateway em integração
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {payment.paymentMethod === "pix" && (
              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-sm font-medium">Pagamento via PIX</p>
                <p className="text-xs text-muted-foreground">
                  Transfira o valor indicado para{" "}
                  <strong>{platformCompany?.name ?? "a CONTRATADA"}</strong> usando
                  os dados abaixo. Envie o comprovante se solicitado pela equipe.
                </p>
                {hasPlatformBankDetails(platformCompany) && (
                  <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                    {platformCompany?.bankName ? (
                      <li>Banco: {platformCompany.bankName}</li>
                    ) : null}
                    {platformCompany?.bankAgency ? (
                      <li>Agência: {platformCompany.bankAgency}</li>
                    ) : null}
                    {platformCompany?.bankAccount ? (
                      <li>
                        Conta {formatBankAccountLabel(platformCompany.bankAccountType)}:{" "}
                        {platformCompany.bankAccount}
                      </li>
                    ) : null}
                    {platformCompany?.pixKey ? (
                      <li>Chave PIX: {platformCompany.pixKey}</li>
                    ) : null}
                  </ul>
                )}
                {pixCode ? (
                  <>
                    <div className="max-h-24 overflow-y-auto rounded bg-muted p-2 font-mono text-[11px] break-all">
                      {pixCode}
                    </div>
                    <Button type="button" variant="secondary" onClick={onCopyPix}>
                      Copiar código PIX
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    O administrador deve cadastrar o PIX copia e cola em{" "}
                    <strong>Cadastro → Empresas</strong> (empresa da plataforma) ou
                    configurar{" "}
                    <code className="rounded bg-muted px-1">
                      NEXT_PUBLIC_AMBIENTAR_PIX_COPIA_E_COLA
                    </code>
                    .
                  </p>
                )}
              </div>
            )}

            {(payment.paymentMethod === "credit_card" ||
              payment.paymentMethod === "debit_card") &&
              hasPlatformBankDetails(platformCompany) && (
                <div className="rounded-lg border p-4 text-sm space-y-1">
                  <p className="font-medium">Titular do recebimento</p>
                  <p className="text-muted-foreground">
                    {platformCompany?.name} — CNPJ {platformCompany?.cnpj}
                  </p>
                </div>
              )}

            {(payment.paymentMethod === "credit_card" ||
              payment.paymentMethod === "debit_card") && (
              <div className="rounded-lg border p-4 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Dados para o contrato assinado (a cópia registra titular e final
                  do cartão — <strong>não</strong> armazenamos o código de segurança).
                  Processamento via gateway em integração.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Titular do cartão</Label>
                    <Input
                      value={payment.cardHolder}
                      onChange={(e) =>
                        onPaymentChange({ cardHolder: e.target.value })
                      }
                      placeholder={form.watch("name") || "Nome no cartão"}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bandeira</Label>
                    <Input
                      value={payment.cardBrand}
                      onChange={(e) => onPaymentChange({ cardBrand: e.target.value })}
                      placeholder="Visa, Master…"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Final do cartão (4 dígitos)</Label>
                    <Input
                      value={payment.cardLast4}
                      onChange={(e) =>
                        onPaymentChange({
                          cardLast4: e.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                      placeholder="0000"
                      maxLength={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Validade (mês)</Label>
                      <Input
                        value={payment.cardExpiryMonth}
                        onChange={(e) =>
                          onPaymentChange({
                            cardExpiryMonth: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 2),
                          })
                        }
                        placeholder="MM"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Ano</Label>
                      <Input
                        value={payment.cardExpiryYear}
                        onChange={(e) =>
                          onPaymentChange({
                            cardExpiryYear: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4),
                          })
                        }
                        placeholder="AAAA"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {pkg === "gratuito" && (
          <p className="text-sm text-muted-foreground">
            Plano gratuito (versão com publicidade): sem cobrança neste momento. Ao
            aceitar o contrato, você declara ciência de que a interface poderá
            exibir anúncios de terceiros; a CONTRATADA não fará marketing direto
            pelo só aceite. Seu acesso será registrado com vigência anual para
            controle da plataforma.
          </p>
        )}

        {pkg === "sob_consulta" && (
          <p className="text-sm text-muted-foreground">
            Plano sob consulta: nossa equipe combinará valor e forma de pagamento
            (incluindo boleto, quando aplicável a prestação de serviço sob medida).
            Você já poderá acessar a plataforma enquanto o contrato comercial é
            alinhado. Pagamento online padrão: PIX, débito ou crédito.
          </p>
        )}

        <div className="flex flex-row items-start space-x-3 space-y-0">
          <Checkbox
            id="pay-ack"
            checked={payment.paymentAcknowledged}
            onCheckedChange={(c) =>
              onPaymentChange({ paymentAcknowledged: c === true })
            }
          />
          <Label htmlFor="pay-ack" className="text-sm leading-snug cursor-pointer">
            {annual
              ? isPlatformPaymentAutoApproveEnabled()
                ? "Confirmo que realizei o pagamento conforme as instruções acima e desejo concluir meu cadastro."
                : "Estou ciente de que o acesso à plataforma será liberado após a confirmação do pagamento pela equipe e desejo concluir meu cadastro."
              : "Li as informações desta etapa e desejo concluir meu cadastro."}
          </Label>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || !payment.paymentAcknowledged}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Concluir cadastro
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
