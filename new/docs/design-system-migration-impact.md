# Impacto da virada de CSS/animação do design system `old` para `new`

Este documento analisa o design system vigente na pasta `old` e os impactos de padronizar a camada visual na arquitetura da pasta `new`.

## Decisão de escopo

A virada não inclui portar componentes, Radix, shadcn, `react-hook-form`, `zod`, `tailwindcss-animate` ou qualquer biblioteca de terceiro para o projeto novo.

O destino oficial é:

- manter os componentes de `new/src/componentes`;
- migrar apenas CSS, tokens, estados visuais, motion utilities e padrões de animação;
- implementar qualquer animação necessária com CSS próprio em `new/src/index.css`;
- evitar dependências novas para comportamento visual.

Impacto direto já identificado e tratado:

- `new/src/auth/public-auth-layout.tsx` usava `animate-fade-in-up`, mas o CSS novo não definia essa animação.
- `new/src/componentes/input/input.tsx` aplica `animate-shake` em erro nativo, mas a animação não estava definida.
- `new/src/componentes/alert/alert.tsx` e `new/src/componentes/toast/container.tsx` usam classes como `animate-in`, `fade-in`, `slide-in-from-top-2` e `slide-in-from-bottom-2`, que no `old` vinham do padrão de animações do ecossistema Tailwind/shadcn.
- Essas utilities foram adicionadas em `new/src/index.css` com CSS próprio, sem plugin.

## Diagnóstico rápido

O `old` usa uma base próxima de shadcn/ui:

- Componentes em `old/src/components/ui/*`.
- Primitivas Radix para `select`, `dialog`, `dropdown`, `popover`, `tabs`, `toast`, `tooltip`, `sheet`, `radio-group`, etc.
- `react-hook-form` + `zod` nos formulários.
- `class-variance-authority` para variantes, especialmente em `Button`.
- Tokens Tailwind em `old/src/app/globals.css`.

O `new` já tem um design system próprio:

- Componentes em `new/src/componentes/*`.
- `Form` próprio com validação, loading gerenciado e notificações.
- `Input` próprio com label, helper text, estado visual, toggle de senha e máscara embutida.
- `Button` próprio com loading/disabled gerenciado por containers.
- Vários componentes equivalentes já existem, mas a API não é igual à do `old`.
- Tokens globais em `new/src/index.css`.

Conclusão: não é uma migração 1:1 por copy/paste. É uma padronização por equivalência de linguagem visual, mantendo a API dos componentes novos.

## Tokens e tema

Baixo impacto.

Os tokens principais são praticamente iguais entre `old/src/app/globals.css` e `new/src/index.css`:

- `--background`
- `--foreground`
- `--card`
- `--primary`
- `--secondary`
- `--muted`
- `--destructive`
- `--border`
- `--input`
- `--ring`
- `--sidebar-*`
- `--radius`

Impactos:

- A identidade visual verde/emerald do AmbientaR pode ser preservada sem grande mudança.
- As telas públicas (`login`, `forgot-password`, `register`) já reaproveitam `PublicAuthLayout`, `AuthHeroPanel` e tokens compatíveis.
- O risco não está nos tokens, mas em classes hardcoded no `new` usando `gray`, `slate`, `blue` em vez de tokens semânticos.

Recomendação:

- Priorizar componentes novos usando `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`.
- Reduzir gradualmente classes diretas como `text-gray-700`, `border-gray-300`, `focus:border-blue-500` nos componentes base do `new`.

## Componentes: matriz de impacto visual

Esta matriz não recomenda migrar componentes do `old`. Ela identifica quais estilos, tokens e animações do `old` precisam ser absorvidos pelos componentes do `new`.

| `old` | `new` | Impacto | Observação |
| --- | --- | --- | --- |
| `old` | `new` | Impacto | CSS/animação a absorver |
| --- | --- | --- | --- |
| `components/ui/button.tsx` | `componentes/button/button.tsx` | Médio | Tokens semânticos, foco com `ring`, radius mais próximo do tema, transições consistentes. |
| `components/ui/input.tsx` | `componentes/input/input.tsx` | Médio | Estados `focus`, `invalid`, `disabled`, `placeholder`, `ring` e `animate-shake`. |
| `components/ui/masked-input.tsx` | `componentes/input/input.tsx` com `mask` | Médio | Não criar componente novo; apenas adicionar presets de máscara/estilo quando necessário. |
| `components/ui/card.tsx` | `componentes/card/card.tsx` | Baixo/Médio | Overflow seguro (`min-w-0`, `break-words`), radius e sombra alinhados. |
| `components/ui/form.tsx` | `componentes/form/form.tsx` | Médio | Feedback visual de erro/sucesso/loading, sem portar `react-hook-form`. |
| `components/ui/select.tsx` | `componentes/select/select.tsx` | Médio | Estados visuais e transições do trigger/lista; sem portar Radix. |
| `components/ui/dialog.tsx` | `componentes/dialog` / `modal` | Médio | Overlay, fade/zoom/slide, duração e easing. |
| `components/ui/toast.tsx` | `componentes/toast` | Médio | `animate-in`, `fade-in`, `slide-in-*`, `animate-out`, `fade-out`, `slide-out-*`. |
| `components/ui/skeleton.tsx` | `componentes/skeleton` | Baixo | Pulse, cor via token `muted`, radius consistente. |
| `components/page-header.tsx` | futuro `PageHeader` novo | Médio | Borda, background `muted/20`, ações com transição e scroll horizontal. |

## Impacto nas telas públicas já viradas

Arquivos atuais:

- `new/src/auth/login-form.tsx`
- `new/src/auth/forgot-password-view.tsx`
- `new/src/auth/register-view.tsx`
- `new/src/auth/public-auth-layout.tsx`

### Login

Impacto baixo.

O design antigo já havia sido praticamente espelhado no `new`:

- Card central.
- Layout público com hero lateral.
- Links para cadastro e recuperação.
- Campos de identificador e senha.

Pendências de padronização:

- Usar `Link` do TanStack em vez de `<a href>` para navegação interna.
- Garantir `Button fullWidth` em vez de `className="w-full"` quando possível.
- Remover comentários legados de schema zod no arquivo novo.

### Esqueci minha senha

Impacto médio.

A tela nova mantém o fluxo visual do antigo, mas troca Firebase direto por `authService.passwordReset`.

Pendências:

- Definir mensagem de sucesso única e segura.
- Verificar se o backend retornará sucesso genérico mesmo para e-mail inexistente.
- Confirmar se deve haver `FormAlertRegion` além de toast em telas públicas.

### Cadastre-se

Impacto alto.

O antigo é um wizard grande com:

- Escolha de perfil.
- Busca por documento.
- Consulta pública de CNPJ.
- Escolha de pacote.
- Contrato.
- Pagamento.
- Criação/vínculo de cliente e empreendedor.

A virada inicial no `new` cobre a conta inicial e os modos principais, mas ainda não replica o wizard inteiro.

Pendências de design/system:

- Criar padrão oficial de wizard/stepper para cadastro longo.
- Criar componente de escolha de perfil/plano reaproveitável.
- Adicionar máscara `cpfCnpj` ao `Input` novo ou criar resolução dinâmica de máscara.
- Trazer `DynamicPixCheckout` do `old` para componente novo quando virar pagamento.
- Trazer `RegisterContractContent` do `old` para o novo contrato visual.

## Impacto nos componentes base do `new`

### `Button`

O `new` tem bom controle de loading e integração com `Form`. Porém:

- Usa `rounded-xl`, enquanto o `old` usa `rounded-md`.
- Variantes têm nomes diferentes.
- `primary` usa `sky`, enquanto token principal do sistema é `primary` emerald.

Risco:

- Telas migradas podem ficar com botões azuis em uma identidade predominantemente verde.

Recomendação:

- Ajustar `Button` para usar tokens semânticos:
  - `primary`: `bg-primary text-primary-foreground hover:bg-primary/90`
  - foco: `ring-ring`
  - `outline`: `border-input bg-background hover:bg-accent`
- Reduzir radius para `rounded-md` ou garantir que o radius global governe a aparência.

### `Input`

O `new` é mais rico que o `old`, porque incorpora label/helper/máscara.

Riscos:

- Algumas telas antigas esperam `FormControl` e `FormMessage` separados.
- Máscara `cpfCnpj` ainda não existe.
- Classes internas usam escala `gray/sky` em vez de tokens.

Recomendação:

- Evoluir `Input` novo como fonte única.
- Não recriar `MaskedInput`.
- Adicionar preset `cpfCnpj` no `mask-builder`.
- Padronizar estados com tokens (`border-input`, `ring-ring`, `text-muted-foreground`, `text-destructive`).

### `Form`

Esse é o maior impacto técnico.

O `old` usa:

- `useForm`
- `zodResolver`
- `FormField`
- `FormItem`
- `FormControl`
- `FormMessage`

O `new` usa:

- `Form` próprio com `validation.schema`
- `ApiServiceResponse`
- controle de loading dos botões
- notificações integradas

Risco:

- Migração direta de formulários grandes será trabalhosa.
- Validações complexas zod do `old` precisam virar validadores do `new` ou ficar em schema compartilhado de domínio/API.

Recomendação:

- Para telas simples, usar `Form` novo.
- Para wizards grandes, criar camada de helpers de validação reutilizável.
- Não trazer `react-hook-form` para o `new` sem decisão explícita, porque isso bifurcaria o design system.

### `Select`, `Dialog`, `Popover`, `Dropdown`

Impacto médio/alto.

O `old` depende bastante de Radix para acessibilidade e composição. O `new` tem equivalentes, mas alguns são mais simples.

Riscos:

- Perda de keyboard navigation.
- Perda de portal/popover em selects ricos.
- Diferenças de foco e scroll lock em modais.

Recomendação:

- Antes de migrar telas internas complexas, auditar paridade desses componentes.
- Se necessário, evoluir o componente novo por dentro, mantendo a API do `new`.

## Impacto no layout autenticado

Alto impacto.

O `old` possui:

- Sidebar estruturada.
- Header por página (`PageHeader`).
- Regras de scroll para evitar scroll duplo.
- Menus por perfil/role.
- Banners de pacote, offline, sessão, assinatura e onboarding.

O `new` hoje tem:

- `AuthenticatedLayout` simples com header horizontal.
- Links fixos `Início` e `Exemplos`.
- Sem sidebar real, sem page header padronizado, sem menu por perfil.

Recomendação:

1. Criar `PageHeader` no `new`.
2. Consolidar `AuthenticatedLayout` com sidebar antes de migrar módulos internos.
3. Definir contrato de navegação por perfil.
4. Migrar banners globais só depois que auth/session/roles estiverem estabilizados.

## Riscos principais da padronização

1. **Bifurcação de design system**: trazer componentes shadcn do `old` para o `new` ao lado dos componentes próprios criaria duas APIs concorrentes.
2. **Regressão de acessibilidade**: componentes Radix do `old` têm comportamento acessível pronto; equivalentes simples no `new` precisam verificação.
3. **Inconsistência visual**: tokens são iguais, mas componentes do `new` usam `sky/gray/slate` diretamente.
4. **Migração de formulários complexos**: `react-hook-form/zod` não migra diretamente para o `Form` novo.
5. **Fluxos longos de cadastro**: o cadastro antigo é um produto dentro do produto; precisa virar por etapas.
6. **Layout interno ainda provisório**: migrar telas internas antes do shell pode gerar retrabalho.

## Ordem recomendada de padronização

1. **Tokens e componentes base**
   - Ajustar `Button`, `Input`, `Card`, `Select`, `RadioGroup`, `Checkbox`.
   - Garantir uso de tokens semânticos.
   - Adicionar `cpfCnpj` no `mask-builder`.

2. **Telas públicas**
   - Padronizar `/login`, `/forgot-password`, `/register`.
   - Trocar `<a href>` por navegação do router.
   - Fechar paridade visual com `old`.

3. **Cadastro completo**
   - Criar wizard/stepper oficial.
   - Trazer escolha de pacote.
   - Trazer contrato.
   - Trazer pagamento/PIX.

4. **Shell autenticado**
   - Criar sidebar, page header e região de scroll.
   - Definir menu por role.

5. **Módulos internos**
   - Migrar telas por domínio, começando pelas menos dependentes de mapas, uploads e formulários gigantes.

## Checklist para considerar uma tela padronizada

- Usa componentes de `new/src/componentes`, não `old/src/components/ui`.
- Usa tokens semânticos do tema.
- Não recria máscaras fora do `Input`.
- Retorna `ApiServiceResponse` nos submits.
- Usa loading gerenciado pelo `Form`/`Button`.
- Usa navegação do TanStack Router.
- Não depende de Firebase/Firestore direto no front.
- Possui estados de erro, sucesso, loading e vazio.
- Foi verificada em desktop e mobile.
- Não cria scroll duplo.

## Decisão recomendada

Manter o design system do `new` como destino oficial, mas endurecê-lo com a maturidade visual e comportamental do `old`.

Na prática:

- Não copiar shadcn inteiro para o `new`.
- Não manter dois estilos de formulário.
- Evoluir os componentes próprios do `new` para absorver os padrões do `old`.
- Migrar telas por adaptação, não por transposição literal.
