import { z } from "zod";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import type { EntityType } from "@/lib/types";
import { packageRequiresMarketingOptIn } from "@/app/register/contract-content";

export const normalizeDocument = normalizeDocumentDigits;

export const isValidCpfOrCnpj = (raw: string | undefined | null) => {
  const digits = normalizeDocument(raw);
  return digits.length === 11 || digits.length === 14;
};

export const getEntityTypeFromDocument = (document: string): EntityType =>
  normalizeDocument(document).length === 14 ? "Pessoa Jurídica" : "Pessoa Física";

export const registerFormSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    email: z.string().email("Por favor, insira um e-mail válido."),
    phone: z.string().min(10, "Insira um telefone válido com DDD."),
    cpf: z.string().min(11, "Insira um CPF válido."),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
    /** CPF/CNPJ vinculado ao titular/empreendedor ou ao titular ao qual o representante solicita acesso. */
    cpfCnpjTitular: z.string().optional(),
    selectedPackage: z.enum(
      [
        "gratuito",
        "basico",
        "intermediario",
        "avancado",
        "completo",
        "sob_consulta",
      ],
      {
        required_error: "Selecione um pacote.",
      },
    ),
    contractAccepted: z.literal(true, {
      errorMap: () => ({ message: "Você deve aceitar os termos do contrato." }),
    }),
    /** Obrigatório para planos acima de Básico: opt-in explícito para contato comercial. */
    marketingContactConsent: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (!packageRequiresMarketingOptIn(data.selectedPackage)) return true;
      return data.marketingContactConsent === true;
    },
    {
      message:
        "Para este plano, é necessário autorizar o uso dos dados para contato comercial.",
      path: ["marketingContactConsent"],
    },
  );

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

/** @deprecated Use registerFormSchema */
export const formSchema = registerFormSchema;

/** @deprecated Use RegisterFormValues */
export type FormValues = RegisterFormValues;
