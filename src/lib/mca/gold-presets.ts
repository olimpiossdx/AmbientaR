/** Presets dos mapas ouro Pimenta (Célio Fontana) para preencher o formulário MCA. */

export type McaGoldPresetId = "gold_palmeiras" | "gold_mangabeiras" | "gold_catingueiro";

export type McaGoldPreset = {
  id: McaGoldPresetId;
  label: string;
  title: string;
  propertyName: string;
  ownerName: string;
  municipality: string;
  matriculas: string[];
  car: string;
  areaTotalHa: string;
  scale: string;
};

export const MCA_GOLD_PRESETS: McaGoldPreset[] = [
  {
    id: "gold_palmeiras",
    label: "Palmeiras (~1.748 ha)",
    title: "Faz. Palmeiras — MCA",
    propertyName: "Fazenda Palmeiras",
    ownerName: "Célio Fontana",
    municipality: "Unaí-MG",
    matriculas: ["37.666", "37.667"],
    car: "MG-3170404-8063.A469.8E47.450D.AF96.72D7.7CE4.F581",
    areaTotalHa: "1747,9104",
    scale: "1:12.000",
  },
  {
    id: "gold_mangabeiras",
    label: "Mangabeiras (~1.125 ha)",
    title: "Faz. Mangabeiras — MCA",
    propertyName: "Faz. Mangabeira e outras",
    ownerName: "Célio Fontana",
    municipality: "Unaí-MG",
    matriculas: ["37.668", "37.669"],
    car: "",
    areaTotalHa: "1125,4836",
    scale: "1:12.000",
  },
  {
    id: "gold_catingueiro",
    label: "Catingueiro (~2.074 ha) — ouro",
    title: "Faz. Catingueiro — MCA",
    propertyName: "Faz. Araras, Catingueiro, Desbarrancado e Barro Branco",
    ownerName: "Célio Fontana",
    municipality: "Unaí-MG",
    matriculas: ["37.674", "37.671", "37.672", "37.663", "37.665", "37.664", "37.673"],
    car: "",
    areaTotalHa: "2073,8318",
    scale: "1:17.000",
  },
];

export function getGoldPreset(id: McaGoldPresetId): McaGoldPreset | undefined {
  return MCA_GOLD_PRESETS.find((p) => p.id === id);
}
