"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFirebase } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Leaf,
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  Star,
  Zap,
  Rocket,
  Gift,
  MessageSquareMore,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ClientPackage, ClientPackageInfo } from "@/lib/types";
import { createNotificationForUser } from "@/lib/notifications";

const PACKAGES: ClientPackageInfo[] = [
  {
    id: "gratuito",
    name: "Gratuito",
    description: "Acesso básico para conhecer a plataforma.",
    price: "R$ 0",
    features: [
      "Acesso ao dashboard básico",
      "Visualização de licenças",
      "Suporte por email",
    ],
  },
  {
    id: "basico",
    name: "Básico",
    description: "Ideal para quem está começando na gestão ambiental.",
    price: "R$ 49,90/mês",
    features: [
      "Tudo do plano Gratuito",
      "Gestão de licenças ambientais",
      "Calendário de prazos",
      "Relatórios básicos",
    ],
  },
  {
    id: "intermediario",
    name: "Intermediário",
    description: "Para empresas que precisam de mais recursos.",
    price: "R$ 99,90/mês",
    highlighted: true,
    features: [
      "Tudo do plano Básico",
      "Gestão de condicionantes",
      "Monitoramento ambiental",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
  {
    id: "avancado",
    name: "Avançado",
    description: "Recursos completos para gestão ambiental profissional.",
    price: "R$ 199,90/mês",
    features: [
      "Tudo do plano Intermediário",
      "Elaboração de estudos ambientais",
      "Análise com Inteligência Artificial",
      "Gestão financeira integrada",
      "Suporte dedicado",
    ],
  },
  {
    id: "completo",
    name: "Completo",
    description: "A solução definitiva para gestão ambiental.",
    price: "R$ 349,90/mês",
    features: [
      "Acesso a todos os módulos",
      "Análises com IA ilimitadas",
      "CRM e gestão comercial",
      "Geração de PDFs e relatórios",
      "Suporte VIP 24h",
    ],
  },
  {
    id: "sob_consulta",
    name: "Sob Consulta",
    description:
      "Soluções personalizadas para demandas específicas que vão além da plataforma.",
    price: "Personalizado",
    features: [
      "Consultoria ambiental dedicada",
      "Assessoria técnica especializada",
      "Projetos sob demanda",
      "Atendimento presencial",
      "Orçamento personalizado",
    ],
  },
];

const PACKAGE_ICONS: Record<ClientPackage, React.ReactNode> = {
  gratuito: <Gift className="h-6 w-6" />,
  basico: <Star className="h-6 w-6" />,
  intermediario: <Zap className="h-6 w-6" />,
  avancado: <Rocket className="h-6 w-6" />,
  completo: <Crown className="h-6 w-6" />,
  sob_consulta: <MessageSquareMore className="h-6 w-6" />,
};

const formSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    email: z.string().email("Por favor, insira um e-mail válido."),
    phone: z.string().min(10, "Insira um telefone válido com DDD."),
    cpf: z.string().min(11, "Insira um CPF válido."),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
    /** CPF ou CNPJ do titular ao qual o representante solicita acesso (obrigatório só para perfil representante). */
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

function ContractContent({
  packageId,
}: {
  packageId: ClientPackage | undefined;
}) {
  const clauseNum = (n: number) => {
    const ordinals = ["", "1ª", "2ª", "3ª", "4ª", "5ª", "6ª", "7ª"];
    return ordinals[n] || `${n}ª`;
  };
  let nextClause = 5;

  return (
    <div
      className="font-sans text-xs leading-relaxed text-foreground/80"
      style={{
        paddingTop: "1.5cm",
        paddingBottom: "1cm",
        paddingLeft: "1.5cm",
        paddingRight: "1cm",
        textAlign: "justify",
      }}
    >
      <h2 className="text-sm font-bold text-center mb-4 uppercase">
        Termos de Uso e Contrato de Prestação de Serviços
      </h2>

      <p className="mb-3">
        PIMENTA CONSULTORIA AMBIENTAL, pessoa jurídica de direito privado,
        doravante denominada CONTRATADA, e o USUÁRIO, pessoa física ou jurídica
        que realiza o cadastro nesta plataforma, doravante denominado
        CONTRATANTE, celebram o presente contrato mediante as seguintes
        cláusulas:
      </p>

      <h3 className="font-bold mt-4 mb-1">CLÁUSULA 1ª — DO OBJETO</h3>
      <p className="mb-3">
        O presente contrato tem por objeto a prestação de serviços de acesso à
        plataforma AmbientaR — Gestão Ambiental Inteligente, conforme o plano
        selecionado pelo CONTRATANTE.
      </p>

      <h3 className="font-bold mt-4 mb-1">
        CLÁUSULA 2ª — DAS OBRIGAÇÕES DO CONTRATANTE
      </h3>
      <p className="mb-1">O CONTRATANTE se compromete a:</p>
      <p className="pl-4 mb-0.5">
        a) Fornecer informações verdadeiras e atualizadas;
      </p>
      <p className="pl-4 mb-0.5">
        b) Manter a confidencialidade de suas credenciais de acesso;
      </p>
      <p className="pl-4 mb-3">
        c) Utilizar a plataforma de acordo com a legislação vigente.
      </p>

      <h3 className="font-bold mt-4 mb-1">
        CLÁUSULA 3ª — DAS OBRIGAÇÕES DA CONTRATADA
      </h3>
      <p className="mb-1">A CONTRATADA se compromete a:</p>
      <p className="pl-4 mb-0.5">
        a) Disponibilizar os serviços contratados conforme o plano escolhido;
      </p>
      <p className="pl-4 mb-0.5">
        b) Manter a segurança e a integridade dos dados do CONTRATANTE;
      </p>
      <p className="pl-4 mb-3">
        c) Prestar suporte técnico conforme o nível do plano contratado.
      </p>

      <h3 className="font-bold mt-4 mb-1">
        CLÁUSULA 4ª — DA PRIVACIDADE E PROTEÇÃO DE DADOS
      </h3>
      <p className="mb-3">
        Os dados pessoais do CONTRATANTE serão tratados em conformidade com a
        Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </p>

      {packageId === "basico" && (
        <>
          <h3 className="font-bold mt-4 mb-1">
            CLÁUSULA 5ª — DO CONSENTIMENTO PARA COMUNICAÇÃO COMERCIAL (PLANO
            BÁSICO)
          </h3>
          <p className="mb-1">
            Ao optar pelo plano Básico, o CONTRATANTE autoriza expressamente a
            CONTRATADA a acessar seus dados cadastrais (nome, e-mail, telefone e
            endereço) para fins de:
          </p>
          <p className="pl-4 mb-0.5">
            a) Comunicação sobre serviços de consultoria e assessoria ambiental;
          </p>
          <p className="pl-4 mb-0.5">
            b) Envio de propostas comerciais relacionadas à área ambiental;
          </p>
          <p className="pl-4 mb-1">
            c) Contato para oferecimento de serviços complementares.
          </p>
          <p className="mb-3">
            O CONTRATANTE pode revogar este consentimento a qualquer momento
            mediante solicitação formal.
          </p>
          {(() => {
            nextClause = 6;
            return null;
          })()}
        </>
      )}

      <h3 className="font-bold mt-4 mb-1">
        CLÁUSULA {clauseNum(nextClause)} — DO FORO
      </h3>
      <p className="mb-3">
        Fica eleito o foro da comarca de Belo Horizonte — MG para dirimir
        quaisquer dúvidas ou controvérsias decorrentes deste contrato.
      </p>

      <p className="mt-4 text-center italic">
        Ao aceitar abaixo, o CONTRATANTE declara ter lido e concordado com todos
        os termos deste contrato.
      </p>
    </div>
  );
}

const PROFILE_CHOICE_TEXT = {
  intro: "Escolha seu perfil de cadastro para continuar:",
  client:
    "Sou o titular da empresa ou projeto e quero contratar a plataforma para gestão ambiental (licenças, prazos, relatórios).",
  representative:
    "Atuo em nome de um cliente titular e preciso de acesso à plataforma para gerenciar os dados dele.",
};

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const initialTipo = searchParams.get("tipo");
  const [mode, setMode] = React.useState<"client" | "representative">(
    initialTipo === "representante" ? "representative" : "client",
  );
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const showProfileChoice = !initialTipo;
  const [hasChosenProfile, setHasChosenProfile] = React.useState(!!initialTipo);
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      confirmPassword: "",
      cpfCnpjTitular: "",
      selectedPackage: undefined,
      contractAccepted: undefined as any,
    },
    mode: "onChange",
  });

  // Ao abrir o Cadastre-se, garantir que e-mail e senha comecem vazios (só placeholders).
  React.useEffect(() => {
    form.reset({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      confirmPassword: "",
      cpfCnpjTitular: "",
      selectedPackage: undefined,
      contractAccepted: undefined as any,
    });
  }, [form]);

  // Para representantes, não exibimos escolha de plano/contrato.
  // Preenchemos internamente com plano gratuito e contrato aceito
  // apenas para satisfazer o schema, sem cobrar nada.
  React.useEffect(() => {
    if (mode === "representative") {
      form.setValue("selectedPackage", "gratuito");
      form.setValue("contractAccepted", true as any);
      setStep(1);
    }
  }, [mode, form]);

  const selectedPackage = form.watch("selectedPackage");
  const watchedStep1 = form.watch([
    "name",
    "email",
    "phone",
    "cpf",
    "password",
    "confirmPassword",
    "cpfCnpjTitular",
  ]);

  const canAdvanceStep1 = React.useMemo(() => {
    const [
      name = "",
      email = "",
      phone = "",
      cpf = "",
      password = "",
      confirmPassword = "",
      cpfCnpjTitular = "",
    ] = watchedStep1;
    const digitsCpf = (cpf ?? "").replace(/\D/g, "");
    const digitsPhone = (phone ?? "").replace(/\D/g, "");
    const base =
      (name ?? "").trim().length >= 3 &&
      (email ?? "").includes("@") &&
      digitsPhone.length >= 10 &&
      digitsCpf.length >= 11 &&
      (password ?? "").length >= 6 &&
      (confirmPassword ?? "").length >= 6 &&
      password === confirmPassword;
    if (mode === "representative") {
      const digitsTitular = (cpfCnpjTitular ?? "").replace(/\D/g, "");
      return base && digitsTitular.length >= 11;
    }
    return base;
  }, [mode, watchedStep1]);

  const canAdvanceStep2 = () => {
    return !!selectedPackage;
  };

  const handleCancelRegistration = () => {
    if (
      window.confirm(
        "Deseja cancelar o cadastro? Os dados preenchidos serão descartados.",
      )
    ) {
      form.reset();
      router.push("/login");
    }
  };

  const normalizeCpf = (raw: string) => raw.replace(/\D/g, "").trim();

  async function onSubmit(values: FormValues) {
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Serviços não disponíveis. Tente novamente.",
      });
      return;
    }

    if (mode === "representative") {
      const digitsTitular = (values.cpfCnpjTitular ?? "").replace(/\D/g, "");
      if (digitsTitular.length < 11) {
        toast({
          variant: "destructive",
          title: "Campo obrigatório",
          description:
            "Informe o CPF ou CNPJ do titular ao qual solicita acesso.",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      const uid = cred.user.uid;
      const cpfNormalized = normalizeCpf(values.cpf);

      await setDoc(doc(firestore, "users", uid), {
        uid: uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        cpf: cpfNormalized,
        userCpf: cpfNormalized,
        cnpjs: [],
        role: mode === "representative" ? "representative" : "client",
        status: "active",
        package: mode === "representative" ? null : values.selectedPackage,
        contractAcceptedAt:
          mode === "representative" ? null : serverTimestamp(),
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isOnline: true,
        cadastroIncompleto: true,
      });

      // Representante: criar pedido de acesso para o titular aprovar (não falha o cadastro se der erro de permissão/rede).
      if (mode === "representative") {
        const cpfCnpjTitularRaw = (values.cpfCnpjTitular ?? "").trim();
        const cpfCnpjTitularDigits = cpfCnpjTitularRaw.replace(/\D/g, "");
        if (cpfCnpjTitularDigits.length >= 11) {
          try {
            await addDoc(collection(firestore, "access_requests"), {
              requestedByUserId: uid,
              requestedByName: values.name,
              requestedByEmail: values.email,
              cpfOfInterested: cpfCnpjTitularRaw || cpfCnpjTitularDigits,
              status: "pending",
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn(
              "Pedido de acesso (access_requests) não criado; o representante pode solicitar depois em Usuários.",
              e,
            );
          }
        }
      }

      // Clientes (titulares): criar apenas o Empreendedor (faltas serão completadas em Cadastro > Empreendedores).
      // Também cria o espelho em Financeiro > Clientes para já aparecer no submenu Clientes.
      if (mode === "client") {
        try {
          const empreendedorRef = doc(firestore, "empreendedores", uid);
          const clientRef = doc(firestore, "clients", uid);
          const empreendedorData = {
            name: values.name,
            phone: values.phone,
            address: "",
            numero: "",
            bairro: "",
            complemento: "",
            municipio: "",
            uf: "",
            cep: "",
            email: values.email,
            cpfCnpj: cpfNormalized,
            entityType: ["Pessoa Física"] as const,
            userId: uid,
          };
          const clientData = {
            name: values.name,
            phone: values.phone,
            address: "",
            numero: "",
            bairro: "",
            municipio: "",
            uf: "",
            cep: "",
            email: values.email,
            cpfCnpj: cpfNormalized,
            entityType: "Pessoa Física",
            dataNascimento: "",
            ctfIbama: "",
            userId: uid,
          };
          await setDoc(empreendedorRef, empreendedorData, { merge: true });
          await setDoc(clientRef, clientData, { merge: true });

          // Alerta no sino para completar o cadastro.
          await createNotificationForUser(firestore, uid, {
            title: "Complete seu cadastro",
            description:
              "Seu cadastro inicial foi criado. Clique para atualizar os dados do empreendedor.",
            link: `/empreendedores/${uid}/edit`,
            sourceType: "onboarding",
            sourceId: uid,
            actorRole: "admin",
          });
        } catch (e) {
          console.warn(
            "Cadastro inicial de Cliente/Empreendedor não foi concluído integralmente.",
            e,
          );
        }
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description:
          mode === "representative"
            ? "Sua conta de representante foi criada. Aguarde o titular conceder acesso aos dados."
            : "Bem-vindo ao AmbientaR. Você será redirecionado.",
      });

      router.push("/");
    } catch (error: any) {
      let description = "Ocorreu um erro ao criar sua conta. Tente novamente.";
      if (error.code === "auth/email-already-in-use") {
        description = "Este e-mail já está cadastrado. Tente fazer login.";
      } else if (error.code === "auth/weak-password") {
        description = "A senha deve ter no mínimo 6 caracteres.";
      }
      toast({ variant: "destructive", title: "Erro no Cadastro", description });
    } finally {
      setLoading(false);
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
              step === s
                ? "bg-primary text-primary-foreground scale-110"
                : step > s
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {step > s ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div
              className={cn(
                "h-0.5 w-8 transition-all",
                step > s ? "bg-primary" : "bg-muted",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Dados Pessoais</CardTitle>
        <CardDescription>
          {mode === "representative"
            ? "Preencha suas informações para criar sua conta de representante."
            : "Preencha suas informações para criar sua conta."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            A primeira etapa do cadastro é informar seu CPF.
          </p>
        </div>
        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <MaskedInput
                  mask="cpf"
                  placeholder="000.000.000-00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <MaskedInput
                    mask="phone"
                    placeholder="(31) 99999-9999"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === "representative" && (
          <FormField
            control={form.control}
            name="cpfCnpjTitular"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  CPF ou CNPJ do titular ao qual solicito acesso
                </FormLabel>
                <FormControl>
                  <MaskedInput
                    mask="cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Informe o CPF ou CNPJ do cliente (titular) cujos dados você
                  deseja gerenciar. O titular precisará aprovar seu acesso em
                  Usuários.
                </p>
              </FormItem>
            )}
          />
        )}
        {mode === "client" ? (
          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancelRegistration}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar cadastro
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={!canAdvanceStep1}
            >
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancelRegistration}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar cadastro
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!canAdvanceStep1 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Concluir Cadastro
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Escolha seu Pacote</CardTitle>
        <CardDescription>
          Selecione o plano que melhor atende às suas necessidades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="selectedPackage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => field.onChange(pkg.id)}
                      className={cn(
                        "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md",
                        field.value === pkg.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50",
                        pkg.highlighted &&
                          field.value !== pkg.id &&
                          "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
                      )}
                    >
                      {pkg.highlighted && (
                        <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                          Mais Popular
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            field.value === pkg.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {PACKAGE_ICONS[pkg.id]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold">{pkg.name}</h3>
                            <span className="text-sm font-bold text-primary whitespace-nowrap">
                              {pkg.price}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pkg.description}
                          </p>
                          <ul className="mt-2 space-y-1">
                            {pkg.features.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                              >
                                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {field.value === pkg.id && (
                        <div className="absolute top-3 right-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3 mt-6 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelRegistration}
          >
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => setStep(3)}
            disabled={!canAdvanceStep2()}
          >
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Contrato e Assinatura</CardTitle>
        <CardDescription>
          Leia os termos e assine para concluir seu cadastro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-white dark:bg-muted/30 max-h-72 overflow-y-auto shadow-inner">
          <ContractContent packageId={selectedPackage} />
        </div>

        {selectedPackage === "basico" && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
              Atenção: No plano Básico, ao aceitar este contrato, você autoriza
              a Pimenta Consultoria Ambiental a acessar seus dados cadastrais
              para fins de comunicação comercial sobre serviços de consultoria e
              assessoria ambiental. Você pode revogar este consentimento a
              qualquer momento.
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="contractAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true ? true : undefined)
                  }
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm cursor-pointer">
                  Li e aceito os termos do contrato de prestação de serviços.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelRegistration}
          >
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep(2)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Concluir Cadastro
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const stepLabels =
    mode === "client"
      ? ["Dados Pessoais", "Pacote", "Contrato"]
      : ["Dados Pessoais"];

  const renderProfileChoice = () => (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">Cadastre-se</CardTitle>
        <CardDescription>{PROFILE_CHOICE_TEXT.intro}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione o perfil que corresponde à sua situação para preencher o
          formulário de cadastro.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setMode("client");
              setHasChosenProfile(true);
            }}
            className={cn(
              "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-border",
            )}
          >
            <span className="font-semibold text-foreground">
              Sou Cliente (Titular)
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {PROFILE_CHOICE_TEXT.client}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("representative");
              setHasChosenProfile(true);
            }}
            className={cn(
              "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-border",
            )}
          >
            <span className="font-semibold text-foreground">
              Sou Representante
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {PROFILE_CHOICE_TEXT.representative}
            </span>
          </button>
        </div>
        <div className="pt-2 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-2 hover:no-underline"
          >
            Faça login
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pt-8 pb-8 bg-background">
      <div className="w-full max-w-2xl flex-1 flex flex-col animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center">
          <Link
            href="/login"
            className="flex items-center gap-2 text-foreground mb-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold text-primary">AmbientaR</h1>
          </Link>
          <p className="text-center text-muted-foreground text-sm">
            {hasChosenProfile
              ? mode === "representative"
                ? "Cadastro de Representante"
                : "Cadastro de Cliente"
              : "Novo cadastro"}
          </p>
          {hasChosenProfile && (
            <button
              type="button"
              onClick={() => {
                setHasChosenProfile(false);
                setStep(1);
              }}
              className="mt-2 text-xs text-primary underline underline-offset-2 hover:no-underline"
            >
              Trocar perfil
            </button>
          )}
          {hasChosenProfile && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border bg-muted px-1 py-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("client")}
                className={cn(
                  "px-3 py-1 rounded-full transition-colors",
                  mode === "client"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground",
                )}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => setMode("representative")}
                className={cn(
                  "px-3 py-1 rounded-full transition-colors",
                  mode === "representative"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground",
                )}
              >
                Representante
              </button>
            </div>
          )}
        </div>

        {!hasChosenProfile && showProfileChoice && renderProfileChoice()}

        {hasChosenProfile && (
          <>
            {mode === "client" && renderStepIndicator()}

            <p className="text-center text-sm font-medium text-muted-foreground mb-4">
              {mode === "client" ? (
                <>
                  Etapa {step} de 3 — {stepLabels[step - 1]}
                </>
              ) : (
                "Etapa única — Dados Pessoais"
              )}
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {mode === "client" && step === 1 && renderStep1()}
                {mode === "client" && step === 2 && renderStep2()}
                {mode === "client" && step === 3 && renderStep3()}
                {mode === "representative" && renderStep1()}
              </form>
            </Form>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="underline hover:text-primary transition-colors font-medium"
              >
                Faça login
              </Link>
            </div>
          </>
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Desenvolvido por Barros e Sá Investimentos
        </p>
      </div>
    </div>
  );
}
