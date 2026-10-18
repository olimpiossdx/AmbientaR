import { api, API_BASE_URL } from "../../service/api";
import type { ApiResponse } from "../../service/http/types";
import type { HttpClient } from "../../service/http/client";
import type { Condition, ConditionFile, ConditionInput, ConditionStatus } from "./conditions.types";
export class ConditionsApiError extends Error { readonly httpStatus: number; constructor(message: string, httpStatus: number) { super(message); this.httpStatus=httpStatus; } }
function data<T>(r: ApiResponse<T>): T { if (!r.ok || r.data === null) { const fallback: Record<number,string> = { 0:"API indisponível.",401:"Sua sessão expirou.",403:"Você não possui permissão para esta operação.",404:"Condicionante não encontrada.",409:"O registro mudou. Recarregue e tente novamente." }; throw new ConditionsApiError(r.error?.message ?? fallback[r.httpStatus] ?? "Não foi possível concluir a operação.",r.httpStatus); } return r.data; }
function condition(value: unknown): Condition { if(!value||typeof value!=="object") throw new Error("Resposta de condicionante inválida."); const item=value as Record<string,unknown>; if(typeof item.id!=="string"||!Number.isSafeInteger(item.version)||typeof item.description!=="string"||!Array.isArray(item.files)) throw new Error("Resposta de condicionante inválida."); return item as unknown as Condition; }
export function createConditionsService(client: HttpClient) { return {
  async list(search:string,status:string,page:number,signal?:AbortSignal) { const value=data(await client.get<unknown>("/conditions",{params:{search,status:status||undefined,page,size:10},signal}));if(!value||typeof value!=="object")throw new Error("Listagem inválida.");const result=value as {items?:unknown[];total?:number};if(!Array.isArray(result.items)||!Number.isSafeInteger(result.total))throw new Error("Listagem inválida.");return {items:result.items.map(condition),total:Number(result.total)}; },
  async create(input:ConditionInput) { return condition(data(await client.post<unknown,ConditionInput>("/conditions",input))); },
  async update(id:string,version:number,input:ConditionInput) { return condition(data(await client.patch<unknown,ConditionInput>(`/conditions/${encodeURIComponent(id)}`,input,{params:{version}}))); },
  async remove(id:string,version:number) { data(await client.delete(`/conditions/${encodeURIComponent(id)}`,{params:{version}})); },
  async setStatus(id:string,version:number,status:ConditionStatus) { return condition(data(await client.patch<unknown,{status:ConditionStatus}>(`/conditions/${encodeURIComponent(id)}/status`,{status},{params:{version}}))); },
  async fulfill(id:string) { return condition(data(await client.post<unknown>(`/conditions/${encodeURIComponent(id)}/fulfill`,{}))); },
  async uploadEvidence(id:string,file:File):Promise<ConditionFile> { const form=new FormData();form.append("file",file);return data(await client.post<ConditionFile,FormData>(`/conditions/${encodeURIComponent(id)}/evidence`,form)); },
  async downloadEvidence(id:string,file:ConditionFile) { const response=await fetch(`${API_BASE_URL.replace(/\/+$/,"")}/conditions/${encodeURIComponent(id)}/evidence/${encodeURIComponent(file.id)}`,{credentials:"include"}); if(!response.ok)throw new ConditionsApiError("Não foi possível baixar a evidência.",response.status);const url=URL.createObjectURL(await response.blob());const link=document.createElement("a");link.href=url;link.download=file.name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000); }
}; }
export const conditionsService=createConditionsService(api);
