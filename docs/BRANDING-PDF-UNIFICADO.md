# Identidade visual unificada em PDFs (jsPDF)

## Módulo central

- `src/lib/pdf-branding-layout.ts` — cabeçalho, rodapé, marca d'água (~15% opacidade) e numeração em todas as páginas.
- `src/lib/branding-pdf.ts` — carga de imagens (Storage/cache), opacidade da marca d'água, toasts de slots em falta.

## Ordem das camadas

1. Marca d'água (antes do texto, em cada página nova).
2. Conteúdo do relatório.
3. Ao final: `finalizePdfBranding()` desenha cabeçalho e rodapé em **todas** as páginas + `página/total`.

## Uso rápido (A4 mm)

```ts
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  reportBrandingPdfIssues,
} from '@/lib/pdf-branding-layout';

const urls = brandingUrlsFromLocal(brandingData);
const session = await createMmBrandedPdfSession(urls);
reportBrandingPdfIssues(urls, session.branding.images, toast);
let y = session.startY;
// ... conteúdo; quebras: y = session.ensureSpace(y, alturaNecessariaMm);
session.finalize();
```

Contratos (unidade `cm`): `loadPdfBranding` + `drawWatermarkOnPage` em `onNewPage` + `finalizePdfBranding` com `headerX` alinhado ao layout do contrato.

## Referência visual

Calibrar com o PDF modelo do utilizador (`exemplo_branding.pdf`): A4, cabeçalho no topo, rodapé centrado, marca d'água central sem cobrir o texto.

## Word (.docx)

- `src/lib/branding-docx.ts` — cabeçalho, marca d'água e rodapé reutilizáveis (ofícios, complemento geoespacial, etc.).
- Usar `useLocalBranding().pdfImages` + `guardBrandingPdfExport` (ou `guardBrandingDocumentExport`) antes de exportar PDF **ou** Word.

## Configuração

Configurações → Identidade visual (`companySettings/branding`). **Obrigatório:** cabeçalho, rodapé e marca d'água — sem as três imagens, exportações oficiais (PDF e Word) são bloqueadas.

## Servidor (Word por template)

- `src/lib/branding/branding-server.ts` — carrega imagens via Firebase Admin.
- `src/lib/branding/branding-docx-merge.ts` — aplica o mesmo cabeçalho/rodapé/marca d'água após Docxtemplater.
- APIs: `POST /api/laudos/gerar-docx`, `/api/pradas/export-docx`, `/api/barragens/export-docx`.

URLs `firebasestorage.googleapis.com` e `firebasestorage.app` são aceites em `storagePathFromDownloadUrl`.

## Contratos e propostas

Ao gerar PDF de contrato ou proposta, aguardar `isPdfImagesLoading === false` e passar `pdfImages` pré-carregados para `loadPdfBranding` / `generateContractPdf` — evita PDF sem identidade visual em produção (corrida com o proxy `/api/branding/image`).

## Páginas alinhadas (guard + `pdfImages`)

Contratos, propostas, fornecedores, vistorias (lista + relatórios), CRM, usuários (log PDF), monitoramento hídrico (manual + telemétrico), solicitações/licenciamento, PTRF/PRAD, faturas, DRE, fluxo de caixa, curva ABC, ofícios, complemento geoespacial (PDF + Word), menu IA.

## CORS no Firebase Storage (erro no console)

Se no DevTools aparecer `blocked by CORS policy` ao carregar imagens de `firebasestorage.googleapis.com` a partir de `http://localhost:9002`, o PDF não consegue desenhar cabeçalho/rodapé/marca d'água no browser.

**Correção automática na app:** o cliente usa o proxy same-origin `GET /api/branding/image?url=...` (ver `src/app/api/branding/image/route.ts`).

**Opcional (recomendado em produção):** publicar CORS no bucket para não depender só do proxy:

```bash
gcloud storage buckets update gs://studio-316805764-e4d13.firebasestorage.app --cors-file=config/storage-cors.json
```

(Requer Google Cloud SDK autenticado no projeto Firebase.)
