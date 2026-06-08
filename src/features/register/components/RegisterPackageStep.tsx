import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
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
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { CLIENT_PACKAGE_CATALOG } from "@/lib/package-limits";
import { PACKAGE_ICONS } from "../constants/package-icons";
import type { RegisterFormValues } from "../schemas/register.schema";

type RegisterPackageStepProps = {
  form: UseFormReturn<RegisterFormValues>;
  canAdvance: boolean;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function RegisterPackageStep({
  form,
  canAdvance,
  onCancel,
  onBack,
  onNext,
}: RegisterPackageStepProps) {
  return (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Escolha seu Pacote</CardTitle>
        <CardDescription>
          Selecione o plano que melhor atende às suas necessidades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="selectedPackage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CLIENT_PACKAGE_CATALOG.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => field.onChange(pkg.id)}
                      className={cn(
                        "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md",
                        field.value === pkg.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50",
                        pkg.highlighted &&
                          field.value !== pkg.id &&
                          "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
                      )}
                    >
                      {pkg.highlighted && (
                        <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                          Mais Popular
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            field.value === pkg.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {PACKAGE_ICONS[pkg.id]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold">{pkg.name}</h3>
                            <span className="text-sm font-bold text-primary whitespace-nowrap">
                              {pkg.price}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pkg.description}
                          </p>
                          <ul className="mt-2 space-y-1">
                            {pkg.features.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                              >
                                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {field.value === pkg.id && (
                        <div className="absolute top-3 right-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3 mt-6 flex-wrap">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={onNext}
            disabled={!canAdvance}
          >
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
