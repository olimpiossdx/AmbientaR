import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { toUserCreateInput, toUserUpdateInput, UserValidationError } from "./users.schemas";
import { UsersApiError } from "./users.service";
import type { UserFieldErrors, UserInput, UserListItem } from "./users.types";

function initialInput(user?: UserListItem): UserInput {
 return {
  tipo: user?.tipo === "JURIDICA" || user?.tipo === "ProdutorRural" ? user.tipo : "FISICA",
  cpfCnpj: user?.cpfCnpj ?? "", entityType: user?.entityType ?? "CLIENTE",
  nome: user?.nome ?? "", email: user?.email ?? "", telefone: user?.telefone ?? "",
  cep: user?.cep ?? "", logradouro: user?.logradouro ?? "", numero: user?.numero ?? "",
  bairro: user?.bairro ?? "", municipio: user?.municipio ?? "", uf: user?.uf ?? "",
  rg: user?.rg ?? "", emissor: user?.emissor ?? "", nacionalidade: user?.nacionalidade ?? "Brasileira",
  estadoCivil: user?.estadoCivil ?? "", dataNascimento: user?.dataNascimento?.slice(0, 10) ?? null,
  ctfIbama: user?.ctfIbama ?? "",
 };
}

function errorMessage(error: unknown): string {
 if (error instanceof UsersApiError && error.httpStatus === 409) return "Os dados foram alterados ou já existem. Atualize a página e tente novamente.";
 if (error instanceof UsersApiError && error.httpStatus === 401) return "Sua sessão expirou. Entre novamente para salvar.";
 if (error instanceof UsersApiError && error.httpStatus === 403) return "Você não possui permissão para concluir esta operação.";
 if (error instanceof UsersApiError && error.httpStatus === 404) return "O usuário não existe mais ou está fora do seu escopo.";
 return error instanceof Error ? error.message : "Não foi possível salvar o usuário.";
}

export function UserFormDialog({ open, user, onOpenChange, onSave }: {
 open: boolean;
 user?: UserListItem;
 onOpenChange: (open: boolean) => void;
 onSave: (input: UserInput) => Promise<void>;
}) {
 const [input, setInput] = useState<UserInput>(() => initialInput(user));
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({});

 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); setSaving(true); setError(null); setFieldErrors({});
  try {
   const normalized = user ? toUserUpdateInput(input) : toUserCreateInput(input);
   await onSave({
    ...input,
    ...normalized,
    dataNascimento: normalized.dataNascimento ? new Date(`${normalized.dataNascimento}T12:00:00`).toISOString() : null,
   });
   onOpenChange(false);
  } catch (caught) {
   if (caught instanceof UserValidationError) setFieldErrors(caught.fieldErrors);
   if (caught instanceof UsersApiError) setFieldErrors(caught.fieldErrors as UserFieldErrors);
   setError(errorMessage(caught));
  }
  finally { setSaving(false); }
 }

 const set = <K extends keyof UserInput>(key: K, value: UserInput[K]) => setInput((current) => ({ ...current, [key]: value }));
 return <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
  <DialogContent className="max-w-3xl">
   <DialogHeader><DialogTitle>{user ? "Editar usuário" : "Novo usuário"}</DialogTitle><DialogDescription>Informe os dados cadastrais. Senhas e hashes não são solicitados por esta tela.</DialogDescription></DialogHeader>
   <form className="space-y-5" onSubmit={submit}>
    {error ? <Alert variant="error" title="Não foi possível salvar">{error}</Alert> : null}
    <div className="grid gap-4 sm:grid-cols-2">
     <Input name="user-name" label="Nome" required aria-invalid={Boolean(fieldErrors.nome)} helperText={fieldErrors.nome} helperStatus="error" value={input.nome} onChange={(e) => set("nome", e.target.value)} />
     <Input name="user-email" label="E-mail" type="email" required aria-invalid={Boolean(fieldErrors.email)} helperText={fieldErrors.email} helperStatus="error" value={input.email} onChange={(e) => set("email", e.target.value)} />
     <Select name="user-type" label="Tipo de pessoa" required disabled={Boolean(user)} invalid={Boolean(fieldErrors.tipo)} value={input.tipo} onChange={(e) => set("tipo", e.target.value as UserInput["tipo"])}>
      <option value="FISICA">Pessoa física</option><option value="JURIDICA">Pessoa jurídica</option><option value="ProdutorRural">Produtor rural</option>
     </Select>
     <Input name="user-document" label="CPF/CNPJ" required disabled={Boolean(user)} aria-invalid={Boolean(fieldErrors.cpfCnpj)} helperText={fieldErrors.cpfCnpj} helperStatus="error" value={input.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} />
     <Input name="user-phone" label="Telefone" required aria-invalid={Boolean(fieldErrors.telefone)} helperText={fieldErrors.telefone} helperStatus="error" value={input.telefone} onChange={(e) => set("telefone", e.target.value)} />
     <Input name="user-entity-type" label="Categoria" required disabled={Boolean(user)} value={input.entityType} onChange={(e) => set("entityType", e.target.value)} />
     <Input name="user-birth" label="Data de nascimento" type="date" required={input.tipo === "FISICA"} aria-invalid={Boolean(fieldErrors.dataNascimento)} helperText={fieldErrors.dataNascimento} helperStatus="error" value={input.dataNascimento ?? ""} onChange={(e) => set("dataNascimento", e.target.value || null)} />
     <Select name="user-civil-state" label="Estado civil" required={input.tipo === "FISICA"} invalid={Boolean(fieldErrors.estadoCivil)} value={input.estadoCivil ?? ""} onChange={(e) => set("estadoCivil", e.target.value)}>
      <option value="">Selecione</option><option value="SOLTEIRO">Solteiro(a)</option><option value="CASADO">Casado(a)</option><option value="DIVORCIADO">Divorciado(a)</option><option value="VIUVO">Viúvo(a)</option><option value="OUTROS">Outros</option>
     </Select>
     <Input name="user-rg" label="RG/Inscrição estadual" aria-invalid={Boolean(fieldErrors.rg)} helperText={fieldErrors.rg} helperStatus="error" value={input.rg ?? ""} onChange={(e) => set("rg", e.target.value)} />
     <Input name="user-emitter" label="Órgão emissor" value={input.emissor ?? ""} onChange={(e) => set("emissor", e.target.value)} />
     <Input name="user-nationality" label="Nacionalidade" required value={input.nacionalidade} onChange={(e) => set("nacionalidade", e.target.value)} />
     <Input name="user-ctf" label="CTF Ibama" value={input.ctfIbama ?? ""} onChange={(e) => set("ctfIbama", e.target.value)} />
     <Input name="user-cep" label="CEP" required aria-invalid={Boolean(fieldErrors.cep)} helperText={fieldErrors.cep} helperStatus="error" value={input.cep} onChange={(e) => set("cep", e.target.value)} />
     <Input name="user-street" label="Logradouro" required aria-invalid={Boolean(fieldErrors.logradouro)} helperText={fieldErrors.logradouro} helperStatus="error" value={input.logradouro} onChange={(e) => set("logradouro", e.target.value)} />
     <Input name="user-number" label="Número" required aria-invalid={Boolean(fieldErrors.numero)} helperText={fieldErrors.numero} helperStatus="error" value={input.numero} onChange={(e) => set("numero", e.target.value)} />
     <Input name="user-neighborhood" label="Bairro" required aria-invalid={Boolean(fieldErrors.bairro)} helperText={fieldErrors.bairro} helperStatus="error" value={input.bairro} onChange={(e) => set("bairro", e.target.value)} />
     <Input name="user-city" label="Município" required aria-invalid={Boolean(fieldErrors.municipio)} helperText={fieldErrors.municipio} helperStatus="error" value={input.municipio} onChange={(e) => set("municipio", e.target.value)} />
     <Input name="user-state" label="UF" required minLength={2} maxLength={2} aria-invalid={Boolean(fieldErrors.uf)} helperText={fieldErrors.uf} helperStatus="error" value={input.uf} onChange={(e) => set("uf", e.target.value.toUpperCase())} />
    </div>
    <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" isLoading={saving}>Salvar</Button></DialogFooter>
   </form>
  </DialogContent>
 </Dialog>;
}
