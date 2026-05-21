# Auditoria: uploads vs menus (Firestore + Storage)

Referência gerada a partir de [`src/lib/navigation-config.ts`](../src/lib/navigation-config.ts) (`allNavItems`) e cruzamento com o código em `src/`.  
**Alvo em produção (Firebase App Hosting):** ficheiros no **Cloud Storage** via SDK no browser; metadados no **Firestore**.  
**Legado:** rotas Next [`src/app/api/uploads/*/route.ts`](../src/app/api/uploads) gravam em **`public/uploads` no disco** — não persistem de forma fiável em ambientes serverless; não há chamadas `fetch('/api/uploads/...')` no `src` (ver script abaixo).

## Comandos de verificação contínua

```bash
npm run check:uploads
```

Isto executa [`scripts/check-upload-patterns.cjs`](../scripts/check-upload-patterns.cjs): falha se aparecer `fetch` para `/api/uploads` no `src`; avisa ficheiros com `type="file"` fora dos padrões conhecidos (lista branca para GeoJSON, XLSX, input base, etc.).

Outros greps úteis:

```bash
rg "fetch\\(['\`\"]/api/uploads" src
rg "uploadFileToStorage" src --stats
```

## Matriz: menu → rota → mecanismo de ficheiro

Legenda: **Storage-SDK** = `uploadFileToStorage` ou `getStorage` + `uploadBytes` com `contentType` | **Firestore-import** = dados parseados para Firestore sem URL Storage | **Browser-only** = ficheiro lido no cliente, sem persistir no bucket | **N/A** = sem upload de ficheiro | **API-disco** = só as route handlers em `src/app/api/uploads` (não invocadas pelo `src` atual).

### Painel

| Rota | Upload / ficheiro |
|------|-------------------|
| `/` | N/A |

### Financeiro

| Rota | Upload / ficheiro |
|------|-------------------|
| `/clients` | N/A |
| `/suppliers` | N/A |
| `/invoices` | Storage-SDK — [`invoice-form.tsx`](../src/app/(app)/invoices/invoice-form.tsx) |
| `/commercial-proposals` | Storage-SDK — [`commercial-proposals/proposal-form.tsx`](../src/app/(app)/commercial-proposals/proposal-form.tsx) |
| `/contracts` | Storage-SDK — [`contracts/page.tsx`](../src/app/(app)/contracts/page.tsx) |
| `/contracts-suppliers` | Storage-SDK — [`contracts-suppliers/page.tsx`](../src/app/(app)/contracts-suppliers/page.tsx) |
| `/services` | N/A |
| `/cash-flow` | Storage-SDK — [`transaction-form.tsx`](../src/app/(app)/cash-flow/transaction-form.tsx) |
| `/financial/dre-contabil` | N/A |
| `/financial/abc-curve` | N/A |
| `/bank-access` | N/A |
| `/external?...NFe...` | N/A (link externo) |

### Cadastro

| Rota | Upload / ficheiro |
|------|-------------------|
| `/empreendedores` | N/A |
| `/projects` | N/A |
| `/responsible-company` | N/A |

### Documentos Ambientais

| Rota | Upload / ficheiro |
|------|-------------------|
| `/licenses` | Storage-SDK — [`license-form.tsx`](../src/app/(app)/licenses/license-form.tsx), [`license-form-SERVIDOR.tsx`](../src/app/(app)/licenses/license-form-SERVIDOR.tsx) |
| `/outorgas` | Storage-SDK — [`outorga-form.tsx`](../src/app/(app)/outorgas/outorga-form.tsx) |
| `/usos-insignificantes` | Storage-SDK — [`uso-insignificante-form.tsx`](../src/app/(app)/usos-insignificantes/uso-insignificante-form.tsx) (input oculto na página lista) |
| `/intervencoes` | Storage-SDK — [`intervencao-form.tsx`](../src/app/(app)/intervencoes/intervencao-form.tsx) |
| `/compliance` | Storage-SDK — [`compliance-form.tsx`](../src/app/(app)/compliance/compliance-form.tsx) |
| `/car` | Storage-SDK — [`car/page.tsx`](../src/app/(app)/car/page.tsx) |
| `/monitoring/manual` | N/A |
| `/monitoring/telemetric` | N/A |
| `/fauna` | Storage-SDK — [`fauna-upload-form.tsx`](../src/app/(app)/fauna/fauna-upload-form.tsx) |
| `/inspections/reports` | N/A (relatórios agregados; ver vistoria em `/inspections`) |

### Outros itens de topo (não submenus do bloco acima)

| Rota | Upload / ficheiro |
|------|-------------------|
| `/autos-infracao-defesa` | Storage-SDK — [`autos-infracao-defesa/page.tsx`](../src/app/(app)/autos-infracao-defesa/page.tsx) |
| `/inspections` | Storage-SDK — [`inspection-form.tsx`](../src/app/(app)/inspections/inspection-form.tsx) (`uploadBytes` + `contentType`) |
| `/requests` | Storage-SDK — [`requests/new/page.tsx`](../src/app/(app)/requests/new/page.tsx), [`requests/[id]/edit/page.tsx`](../src/app/(app)/requests/[id]/edit/page.tsx) |

### IA

| Rota | Upload / ficheiro |
|------|-------------------|
| `/reporting` | N/A |
| `/studies/assistant?...` | N/A (chat / contexto) |
| `/analise-ambiental` | N/A (mapas / API geoespacial conforme UI) |
| `/studies/analise-socioambiental` | N/A |

### Estudos Técnicos

| Rota | Upload / ficheiro |
|------|-------------------|
| `/studies/prada` … `/studies/cavidades` (várias) | N/A salvo onde o formulário específico tiver anexo (rever página se necessário) |
| `/studies/inventario` | Storage-SDK — inventário + fotos; **Firestore-import** — [`import-dialog.tsx`](../src/app/(app)/studies/inventario/[id]/import-dialog.tsx) (XLSX) |
| `/studies/relatorios-diversos` | Em **Transporte de resíduos**: Storage-SDK — [`transporte-residuos/form.tsx`](../src/app/(app)/studies/relatorios-diversos/transporte-residuos/form.tsx) (`anexoART`) |

### CRM

| Rota | Upload / ficheiro |
|------|-------------------|
| `/crm` … `/crm/settings` | N/A (ver submódulos; propostas CRM sem mesmo fluxo que `commercial-proposals`) |

### Propostas (módulo `proposals` — fora do menu Financeiro “Propostas comerciais”)

| Rota | Upload / ficheiro |
|------|-------------------|
| `/proposals` (se usado) | Storage-SDK — [`proposals/proposal-form.tsx`](../src/app/(app)/proposals/proposal-form.tsx) |

### Configurações / administração

| Rota | Upload / ficheiro |
|------|-------------------|
| `/settings/company` | N/A |
| `/technical-responsible` | N/A |
| `/settings#identidade-visual` | Storage-SDK — [`use-branding-upload.ts`](../src/hooks/use-branding-upload.ts) via [`branding-uploader.tsx`](../src/app/(app)/settings/branding-uploader.tsx) |
| `/settings/templates` | Storage-SDK — [`template-uploader.tsx`](../src/app/(app)/settings/template-uploader.tsx), [`rca-template-uploader.tsx`](../src/app/(app)/settings/rca-template-uploader.tsx) |
| `/users` | N/A |
| `/audit-log` | N/A |
| `/settings/files` | N/A |
| `/settings/deleted-backups` | N/A |
| `/ai-lab` … | N/A (ver funcionalidade específica) |
| `/settings/ai-local-source` | N/A |

### Outros

| Rota | Upload / ficheiro |
|------|-------------------|
| `/calendar` | N/A |
| `/oficios` | N/A |
| Links `external` (IDE, SEI, etc.) | N/A |

### Componentes partilhados (critério locacional em licenças)

| Ficheiro | Upload / ficheiro |
|----------|-------------------|
| [`licensing-locational-block.tsx`](../src/components/licensing/licensing-locational-block.tsx) | Browser-only — GeoJSON via `FileReader`, envio analítico para `/api/geospatial/analyze` |

### Offline

| Ficheiro | Upload / ficheiro |
|----------|-------------------|
| [`storage-queue.ts`](../src/lib/offline/storage-queue.ts) | Storage-SDK — `uploadBytes` com `contentType` na fila |

## Rotas API `POST /api/uploads/*` (disco)

Ficheiros em [`src/app/api/uploads`](../src/app/api/uploads): **API-disco**. Manter documentado; migração futura opcional para Admin SDK + bucket se ainda forem necessários.

## Checklist manual de QA (por perfil)

Repetir para **um utilizador interno** (ex.: `gestor` ou `admin`) e **um portal cliente** onde aplicável:

1. Abrir cada rota da tabela marcada **Storage-SDK**.
2. Anexar PDF pequeno (ou JPG onde permitido).
3. Guardar o formulário.
4. No Firestore (consola), confirmar campo `fileUrl` / equivalente com URL `firebasestorage.googleapis.com`.
5. Abrir o URL (autenticado) e confirmar download/visualização.

Rotas críticas mínimas: **Faturas, Contratos, Caixa, Licenças, Condicionantes, CAR, Fauna, Licenciamento (requests), Proposta comercial, Transporte resíduos (anexo ART).**

## Alterações fechadas nesta auditoria

- **Propostas comerciais:** upload de PDF/imagem no formulário → Storage `commercial-proposals/{uid}/…` + `fileUrl` no Firestore ao gravar.
- **Transporte de resíduos (anexo ART):** upload → Storage `transporte-residuos-reports/{uid}/…` + URL em `anexoART` no documento `transporteResiduosReports`.
