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
import { cn } from "@/lib/utils";

export type StudyFormShellVariant = "modal" | "page";

const DEFAULT_DIALOG_CLASS =
  "sm:max-w-7xl h-full max-h-[90dvh] flex flex-col";
const DEFAULT_PAGE_WIDTH = "max-w-7xl mx-auto";

export function useStudyFormShellSuccess(
  variant: StudyFormShellVariant,
  listPath: string,
) {
  const router = useRouter();
  return React.useCallback(() => {
    if (variant === "modal") router.back();
    else router.push(listPath);
  }, [variant, listPath, router]);
}

export type StudyFormShellProps = {
  variant: StudyFormShellVariant;
  title: string;
  description: string;
  notFoundTitle: string;
  pageHeaderTitle?: string;
  pageHeaderActions?: React.ReactNode;
  pageWidthClassName?: string;
  dialogContentClassName?: string;
  cardHeaderExtra?: React.ReactNode;
  cardContentClassName?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
  notFoundMessage?: string;
};

export function StudyFormShell({
  variant,
  title,
  description,
  notFoundTitle,
  pageHeaderTitle,
  pageHeaderActions,
  pageWidthClassName = DEFAULT_PAGE_WIDTH,
  dialogContentClassName = DEFAULT_DIALOG_CLASS,
  cardHeaderExtra,
  cardContentClassName,
  children,
  open = true,
  onOpenChange,
  isLoading = false,
  notFoundMessage,
}: StudyFormShellProps) {
  const router = useRouter();

  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) onOpenChange(isOpen);
    else if (!isOpen) router.back();
  };

  if (variant === "modal") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={cn(dialogContentClassName)}>
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
          <div className={pageWidthClassName}>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[500px] w-full" />
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
              <CardTitle>{notFoundTitle}</CardTitle>
              <CardDescription>{notFoundMessage}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={pageHeaderTitle ?? title}>
        {pageHeaderActions}
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className={pageWidthClassName}>
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
              {cardHeaderExtra}
            </CardHeader>
            <CardContent className={cardContentClassName}>{children}</CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export function StudyFormModalSuspenseFallback() {
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
