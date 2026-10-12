export const ENTREPRENEUR_MODULE_CLAIM = { claimType: "modulo.cadastro", claimValue: "acessar" } as const;
export const ENTREPRENEUR_CLAIMS = {
 view: { claimType: "recurso.empreendedor", claimValue: "visualizar" },
 create: { claimType: "recurso.empreendedor", claimValue: "criar" },
 edit: { claimType: "recurso.empreendedor", claimValue: "editar" },
 remove: { claimType: "recurso.empreendedor", claimValue: "excluir" },
} as const;
export const entityTypes = ["Pessoa Física", "Pessoa Jurídica", "Produtor Rural"] as const;
export const optionalFields = ["dataNascimento", "ctfIbama", "address", "numero", "bairro", "complemento", "municipio", "uf", "cep"] as const;
export type EntrepreneurInput = {
 name: string; cpfCnpj: string; entityType: string[]; phone: string; email: string;
} & Record<(typeof optionalFields)[number], string>;
export type Entrepreneur = EntrepreneurInput & { id: string; version: number };
export function emptyEntrepreneur(): EntrepreneurInput {
 return { name: "", cpfCnpj: "", entityType: ["Pessoa Física"], phone: "", email: "", dataNascimento: "", ctfIbama: "", address: "", numero: "", bairro: "", complemento: "", municipio: "", uf: "", cep: "" };
}
