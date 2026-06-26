"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type CardSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function CardSearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: CardSearchInputProps) {
  return (
    <div className={`relative w-full md:max-w-sm ${className || ""}`.trim()}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-9"
      />
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

