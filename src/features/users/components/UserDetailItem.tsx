import { Label } from "@/components/ui/label";

type UserDetailItemProps = {
  label: string;
  value?: string | null | string[];
};

export function UserDetailItem({ label, value }: UserDetailItemProps) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-sm text-muted-foreground">
        {Array.isArray(value) ? value.join(", ") : value || "Não informado"}
      </p>
    </div>
  );
}
