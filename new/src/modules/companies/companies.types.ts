export const COMPANY_CLAIMS = {
  view: { claimType: "recurso.empresa-responsavel", claimValue: "visualizar" },
  create: { claimType: "recurso.empresa-responsavel", claimValue: "criar" },
  edit: { claimType: "recurso.empresa-responsavel", claimValue: "editar" },
  remove: { claimType: "recurso.empresa-responsavel", claimValue: "excluir" },
} as const;

export type CompanyInput = {
  name: string;
  fantasyName: string;
  cnpj: string;
  address: string;
  numero: string;
  caixaPostal: string;
  municipio: string;
  district: string;
  uf: string;
  cep: string;
  ddd: string;
  phone: string;
  fax: string;
  email: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  bankAccountType: "" | "corrente" | "poupanca";
  pixKey: string;
  pixCopyPaste: string;
};
export type Company = CompanyInput & { id: string; version: number };
export const emptyCompany: CompanyInput = {
  name: "", fantasyName: "", cnpj: "", address: "", numero: "", caixaPostal: "",
  municipio: "", district: "", uf: "", cep: "", ddd: "", phone: "", fax: "",
  email: "", bankName: "", bankAgency: "", bankAccount: "", bankAccountType: "",
  pixKey: "", pixCopyPaste: "",
};
