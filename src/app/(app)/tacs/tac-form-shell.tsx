"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export type TacFormShellVariant = "modal" | "page";

const TACS_LIST_PATH = "/tacs";

export function useTacFormShellSuccess(variant: TacFormShellVariant) {
  const router = useRouter();
  return React.useCallback(() => {
    if (variant === "modal") router.back();
    else router.push(TACS_LIST_PATH);
  }, [variant, router]);
}

export type TacFormShellProps = {
  variant: TacFormShellVariant;
  title: string;
  description: string;
  pageHeaderTitle?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
  notFoundMessage?: string;
};

export function TacFormShell({
  variant,
  title,
  description,
  pageHeaderTitle,
  children,
  open = true,
  onOpenChange,
  isLoading = false,
  notFoundMessage,
}: TacFormShellProps) {
  const router = useRouter();

  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) onOpenChange(isOpen);
    else if (!isOpen) router.back();
  };

  if (variant === "modal") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : notFoundMessage ? (
            <div className="p-6">
              <p>{notFoundMessage}</p>
            </div>
          ) : (
            children
          )}
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={`Carregando ${title}...`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (notFoundMessage) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Erro" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>TAC não encontrado</CardTitle>
              <CardDescription>{notFoundMessage}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={pageHeaderTitle ?? title} />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export function TacFormModalSuspenseFallback() {
  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Carregando...</DialogTitle>
        </DialogHeader>
        <Skeleton className="h-[500px] w-full" />
      </DialogContent>
    </Dialog>
  );
}
