import { FadWorkspaceForm } from "@/components/fiscal-ambiental/fad-workspace-form";

export const metadata = {
  title: "Novo imóvel — Fiscal Ambiental Digital",
};

export default function FadWorkspaceNovoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Novo imóvel</h1>
        <p className="text-sm text-muted-foreground">
          Nome e perímetro da propriedade. As imagens INPE serão ligadas a este workspace na Fase 1.
        </p>
      </div>
      <FadWorkspaceForm mode="create" />
    </div>
  );
}
