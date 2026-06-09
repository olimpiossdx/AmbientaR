# Pacotes do portal (Cliente Autônomo / titular)

Fonte única de limites e preços: `src/lib/package-limits.ts`.

## Planos

| Pacote (`package`) | Empreendimentos | Storage | AmbBot/mês | Anual |
|--------------------|-----------------|---------|------------|-------|
| `gratuito` | 1 | **0** (sem upload) | 0 | R$ 0 — 1 registro/módulo, sem alertas de prazo; publicidade + contato comercial no aceite |
| `basico` | 1 | 1 GB | 0 (avulso R$ 99) | R$ 696 — marketing autorizado no contrato |
| `intermediario` | 2 | 3 GB | 1 | R$ 1.396 |
| `avancado` | 3 | 6 GB | 1 | R$ 1.996 |
| `completo` | 5 | 12 GB | 1 | R$ 2.996 |

Consultas AmbBot extras: **R$ 79** (planos 2+) ou **R$ 99** (planos 1 / gratuito).

## Marketing e publicidade (LGPD)

- **Gratuito:** **versão com publicidade** (cláusulas 9.2–9.5 do contrato de cadastro e confirmação na etapa final sem custo). Ao aceitar, o titular autoriza: (a) **publicidade de terceiros** no aplicativo e no site; (b) **contato comercial da CONTRATADA** por ligações, e-mail, WhatsApp, SMS, notificações push, atualizações do app e demais canais; (c) **uso dos dados** para oferecimento de serviços e comunicações comerciais; (d) **renúncia a reclamações** quanto a essas práticas nos termos do contrato (salvo direitos irrenunciáveis em lei). Campos técnicos: `showsThirdPartyAdvertising: true` e `allowsCommercialContact: true` em `package-limits.ts` / cadastro (`src/app/register/page.tsx`). Implementação de blocos AdSense ainda opcional.
- **Básico:** autorização ampla no aceite do contrato (telefone, e-mail, WhatsApp, SMS, etc.); sem publicidade de terceiros prevista no catálogo.
- **Intermediário+:** opt-in explícito no cadastro (`allowsCommercialContact`).

Antes de ativar rede de anúncios em produção: banner de cookies (CMP), política de privacidade atualizada e aprovação do programa (ex. AdSense).

## Quem não tem limite

- Papéis internos (`admin`, `gestor`, `technical`, etc.).
- `package: sob_consulta` ou `platformPaymentStatus: exempt`.

## Campos no Firestore (`users/{uid}`)

- `ambbotUsagePeriod` — `YYYY-MM` (UTC)
- `ambbotIncludedUsed` — consumo do incluso no mês
- `ambbotPrepaidCredits` — créditos avulsos (admin pode creditar manualmente)

## API

- `GET /api/package/usage` — Bearer idToken → uso atual e limites.

## Enforcement

- Criar empreendimento: `project-form` + `package-actions.ts`
- AmbBot: `handleAnalyseArea` + `package-enforcement-server.ts`
- Upload: `assertFileAllowedForPackage()` em `storage-upload.ts` (chamar antes do upload nos formulários)
