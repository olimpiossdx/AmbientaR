export const USERS_CLAIMS = {
 view: { claimType: "recurso.usuario", claimValue: "visualizar" },
 create: { claimType: "recurso.usuario", claimValue: "criar" },
 edit: { claimType: "recurso.usuario", claimValue: "editar" },
 delete: { claimType: "recurso.usuario", claimValue: "excluir" },
} as const;

export const USERS_MODULE_CLAIM = { claimType: "modulo.cadastro", claimValue: "acessar" } as const;

export const AUTHORIZATION_CLAIMS = {
 viewGroups: { claimType: "recurso.grupo-autorizacao", claimValue: "visualizar" },
 createGroup: { claimType: "recurso.grupo-autorizacao", claimValue: "criar" },
 editGroup: { claimType: "recurso.grupo-autorizacao", claimValue: "editar" },
 deleteGroup: { claimType: "recurso.grupo-autorizacao", claimValue: "excluir" },
 linkClaim: { claimType: "recurso.grupo-autorizacao", claimValue: "vincular-claim" },
 linkUser: { claimType: "recurso.grupo-autorizacao", claimValue: "vincular-usuario" },
 viewClaims: { claimType: "recurso.claim", claimValue: "visualizar" },
} as const;

export type UserListItem = {
 id: string;
 nome: string;
 email: string;
 telefone: string;
 cpfCnpj: string;
 tipo: string;
 entityType?: string;
 onboardingStatus?: string;
 municipio?: string;
 uf?: string;
 cep?: string;
 logradouro?: string;
 numero?: string;
 bairro?: string;
 rg?: string;
 emissor?: string;
 nacionalidade?: string;
 estadoCivil?: string;
 dataNascimento?: string;
 ctfIbama?: string;
};

export type UserInput = {
 tipo: "FISICA" | "JURIDICA" | "ProdutorRural";
 cpfCnpj: string;
 entityType: string;
 nome: string;
 email: string;
 telefone: string;
 cep: string;
 logradouro: string;
 numero: string;
 bairro: string;
 municipio: string;
 uf: string;
 rg?: string;
 emissor?: string;
 nacionalidade: string;
 estadoCivil?: string;
 dataNascimento?: string | null;
 ctfIbama?: string;
};

export type AuthorizationClaim = { id: string; type: string; value: string };

export type AuthorizationGroup = {
 id: string;
 name: string;
 description?: string | null;
 claimIds: string[];
 version: number;
};

export type AuthorizationGroupInput = {
 name: string;
 description?: string | null;
 claimIds?: string[];
};

export type UsersListParams = {
 search?: string;
 page: number;
 size: number;
 signal?: AbortSignal;
};

export type UsersListPage = {
 items: readonly UserListItem[];
 page: number;
 size: number;
 total: number;
};

export type UsersListResult =
 | { status: "success"; page: UsersListPage }
 | { status: "forbidden"; message: string }
 | { status: "error"; message: string };

export type UsersListViewState =
 | { status: "loading" }
 | { status: "ready"; page: UsersListPage }
 | { status: "empty"; page: UsersListPage }
 | { status: "forbidden"; message: string }
 | { status: "error"; message: string };
