import { FadSubnav } from "@/components/fiscal-ambiental/fad-subnav";

export default function FiscalAmbientalDigitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <FadSubnav />
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}
