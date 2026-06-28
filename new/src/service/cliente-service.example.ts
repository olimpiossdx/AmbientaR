// src/service/cliente-service.example.ts
import { api } from "./api";

export type ClienteModel = {
  nome: string;
  email: string;
  telefone?: string;
};

export type ClienteModelResponse = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  createdAt: string;
  updatedAt?: string;
};

export const clienteService = {
  salvar: (model: ClienteModel) =>
    api.post<ClienteModelResponse>("/clientes", model),

  listar: () =>
    api.get<ClienteModelResponse[]>("/clientes"),

  buscarPorId: (id: string) =>
    api.get<ClienteModelResponse>(`/clientes/${id}`),

  atualizar: (id: string, model: ClienteModel) =>
    api.put<ClienteModelResponse>(`/clientes/${id}`, model),

  atualizarParcial: (id: string, model: Partial<ClienteModel>) =>
    api.patch<ClienteModelResponse>(`/clientes/${id}`, model),

  remover: (id: string) =>
    api.delete(`/clientes/${id}`),

  uploadContrato: (clienteId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<{ arquivoId: string }>(
      `/clientes/${clienteId}/contrato`,
      formData,
    );
  },
};
