"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Leaf, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RegisterInviteOnlyCard } from "@/features/register/components/RegisterInviteOnlyCard";
import { RegisterProfileChoice } from "@/features/register/components/RegisterProfileChoice";
import { RegisterStepIndicator } from "@/features/register/components/RegisterStepIndicator";
import { RegisterPersonalStep } from "@/features/register/components/RegisterPersonalStep";
import { RegisterPackageStep } from "@/features/register/components/RegisterPackageStep";
import { RegisterContractStep } from "@/features/register/components/RegisterContractStep";
import { RegisterPaymentStep } from "@/features/register/components/RegisterPaymentStep";
import { useRegisterFlow } from "@/features/register/hooks/useRegisterFlow";
import { TITULAR_STEP_COUNT } from "@/features/register/types/register.types";
import type { RegisterProfileMode } from "@/features/register/types/register.types";

function RegisterPageContent() {
  const flow = useRegisterFlow();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (flow.titularPlanMode && flow.step < TITULAR_STEP_COUNT) {
      e.preventDefault();
      return;
    }
    void flow.form.handleSubmit(flow.onSubmit)(e);
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pt-8 pb-8 bg-background">
      <div className="w-full max-w-2xl flex-1 flex flex-col animate-fade-in-up">
        <div className="mb-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-9 px-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Voltar ao início
            </Link>
          </Button>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <Link
            href="/login"
            className="flex items-center gap-2 text-foreground mb-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold text-primary">AmbientaR</h1>
          </Link>
          <p className="text-center text-muted-foreground text-sm">
            {flow.pageSubtitle}
          </p>
          {flow.hasChosenProfile && (
            <button
              type="button"
              onClick={() => {
                flow.setHasChosenProfile(false);
                flow.setStep(1);
              }}
              className="mt-2 text-xs text-primary underline underline-offset-2 hover:no-underline"
            >
              Trocar perfil
            </button>
          )}
          {flow.hasChosenProfile && (
            <ProfileModeTabs mode={flow.mode} onChange={flow.setMode} />
          )}
        </div>

        {flow.clientGestaoInviteOnly && <RegisterInviteOnlyCard />}

        {!flow.clientGestaoInviteOnly &&
          !flow.hasChosenProfile &&
          flow.showProfileChoice && (
            <RegisterProfileChoice onSelect={flow.handleSelectProfile} />
          )}

        {!flow.clientGestaoInviteOnly && flow.hasChosenProfile && (
          <>
            {flow.titularPlanMode && (
              <RegisterStepIndicator step={flow.step} />
            )}

            <p className="text-center text-sm font-medium text-muted-foreground mb-4">
              {flow.stepLabel}
            </p>

            <Form {...flow.form}>
              <form onSubmit={handleFormSubmit}>
                {flow.titularPlanMode && flow.step === 1 && (
                  <RegisterPersonalStep
                    form={flow.form}
                    mode={flow.mode}
                    loading={flow.loading}
                    isTitularPlanMode={flow.titularPlanMode}
                    canAdvanceStep1={flow.canAdvanceStep1}
                    cpfLookupLoading={flow.cpfLookupLoading}
                    cpfLinkHint={flow.cpfLinkHint}
                    onCancel={flow.handleCancelRegistration}
                    onNext={() => flow.setStep(2)}
                    onTitularDocumentBlur={() => void flow.handleTitularDocumentBlur()}
                  />
                )}
                {flow.titularPlanMode && flow.step === 2 && (
                  <RegisterPackageStep
                    form={flow.form}
                    canAdvance={!!flow.selectedPackage}
                    onCancel={flow.handleCancelRegistration}
                    onBack={() => flow.setStep(1)}
                    onNext={() => flow.setStep(3)}
                  />
                )}
                {flow.titularPlanMode && flow.step === 3 && (
                  <RegisterContractStep
                    form={flow.form}
                    selectedPackage={flow.selectedPackage}
                    platformCompany={flow.platformCompany}
                    onCancel={flow.handleCancelRegistration}
                    onBack={() => flow.setStep(2)}
                    onNext={() => flow.setStep(4)}
                  />
                )}
                {flow.titularPlanMode && flow.step === 4 && (
                  <RegisterPaymentStep
                    form={flow.form}
                    selectedPackage={flow.selectedPackage}
                    platformCompany={flow.platformCompany}
                    loading={flow.loading}
                    payment={flow.payment}
                    onPaymentChange={flow.updatePayment}
                    onCancel={flow.handleCancelRegistration}
                    onBack={() => flow.setStep(3)}
                    onCopyPix={() => void flow.handleCopyPix()}
                  />
                )}
                {flow.mode === "representative" && (
                  <RegisterPersonalStep
                    form={flow.form}
                    mode={flow.mode}
                    loading={flow.loading}
                    isTitularPlanMode={false}
                    canAdvanceStep1={flow.canAdvanceStep1}
                    cpfLookupLoading={flow.cpfLookupLoading}
                    cpfLinkHint={flow.cpfLinkHint}
                    onCancel={flow.handleCancelRegistration}
                    onNext={() => {}}
                    onTitularDocumentBlur={() => void flow.handleTitularDocumentBlur()}
                  />
                )}
                {flow.mode === "consultor_representante" && (
                  <RegisterPersonalStep
                    form={flow.form}
                    mode={flow.mode}
                    loading={flow.loading}
                    isTitularPlanMode={false}
                    canAdvanceStep1={flow.canAdvanceStep1}
                    cpfLookupLoading={flow.cpfLookupLoading}
                    cpfLinkHint={flow.cpfLinkHint}
                    onCancel={flow.handleCancelRegistration}
                    onNext={() => {}}
                    onTitularDocumentBlur={() => void flow.handleTitularDocumentBlur()}
                  />
                )}
              </form>
            </Form>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Button variant="outline" className="w-full max-w-sm" asChild>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  Voltar ao início
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  href="/login"
                  className="underline hover:text-primary transition-colors font-medium"
                >
                  Faça login
                </Link>
              </p>
            </div>
          </>
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Desenvolvido por Barros e Sá Investimentos
        </p>
      </div>
    </div>
  );
}

type ProfileModeTabsProps = {
  mode: RegisterProfileMode;
  onChange: (mode: RegisterProfileMode) => void;
};

function ProfileModeTabs({ mode, onChange }: ProfileModeTabsProps) {
  const tabs: { id: RegisterProfileMode; label: string }[] = [
    { id: "cliente_autonomo", label: "Cliente Autônomo" },
    { id: "representative", label: "Representante" },
    { id: "consultor_representante", label: "Consultor" },
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1 rounded-full border bg-muted px-1 py-1 text-xs max-w-full">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-2.5 py-1 rounded-full transition-colors whitespace-nowrap",
            mode === tab.id
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function RegisterPageFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando cadastro…</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
