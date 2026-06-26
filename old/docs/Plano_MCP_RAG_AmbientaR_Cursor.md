# Plano Enterprise v3 — MCP + RAG / Inteligência do Sistema

> Projeto: **AmbientaR / EcoGestão MG**  
> Menu: **Configurações > MCP + RAG / Inteligência do Sistema**  
> Uso: documento técnico para colar no Cursor AI e iniciar implementação incremental.  
> Foco: legislação ambiental, documentos técnicos, bases oficiais, RAG jurídico, MCP, GCP, rastreabilidade, custo controlado e produção.

---

## 0. Decisão estratégica desta versão

Esta versão substitui a abordagem inicial simples por uma arquitetura mais madura para produção:

1. **Não fazer scraping da ALMG como primeira opção.** A ALMG possui Dados Abertos e documentação de legislação mineira desde 1947. A ingestão deve priorizar arquivos/API oficiais e usar scraping apenas como fallback.
2. **Chunking jurídico estrutural.** Nunca dividir uma norma legal somente por quantidade fixa de tokens. Preservar artigo, parágrafos, incisos, alíneas e contexto normativo.
3. **Banco unificado por padrão.** Evitar Firestore + Atlas em produção inicial, salvo necessidade real. Preferir PostgreSQL + pgvector no GCP ou MongoDB Atlas único.
4. **Cache persistente de embeddings.** Nunca usar apenas dicionário em memória em Cloud Run.
5. **Extração resiliente.** Implementar retry, rate limit, checkpoint, idempotência, hash, logs, fila e fallback para Playwright/OCR.
6. **OCR para PDFs escaneados.** Usar pdfplumber para PDFs nativos e Document AI/Cloud Vision quando o texto extraído for insuficiente.
7. **RAG auditável.** Toda resposta deve trazer fonte, órgão, tipo de norma, número, artigo/chunk, score e link original.

---

## 1. Objetivo do submenu no SaaS

```txt
Configurações
└── MCP + RAG / Inteligência do Sistema
```

### Rota sugerida

```txt
/configuracoes/mcp-rag
```

### Objetivo funcional

Criar uma área administrativa para configurar, monitorar e testar a inteligência documental do AmbientaR/EcoGestão MG:

- bases de conhecimento;
- fontes oficiais;
- conectores MCP;
- ingestão de legislação;
- ingestão de documentos técnicos;
- embeddings;
- banco vetorial;
- busca híbrida;
- logs e auditoria;
- controle de custos;
- reprocessamento;
- testes de perguntas;
- permissões por papel de usuário;
- rastreabilidade das fontes.

---

## 2. Arquitetura recomendada

### 2.1 Visão geral

```txt
[Fontes oficiais]
   ├── ALMG Dados Abertos / API
   ├── SEMAD / FEAM / IEF / IGAM
   ├── Diário Oficial MG
   ├── Documentos internos
   └── Uploads de clientes
          ↓
[Extractors]
          ↓
[Raw storage / staging]
          ↓
[Parsers HTML/PDF/OCR]
          ↓
[Normalização jurídica]
          ↓
[Chunking estrutural]
          ↓
[Hash + deduplicação]
          ↓
[Embeddings persistentes]
          ↓
[PostgreSQL + pgvector OU MongoDB Atlas]
          ↓
[Busca híbrida + reranking]
          ↓
[API FastAPI / Next.js API]
          ↓
[MCP Server]
          ↓
[SaaS AmbientaR]
```

---

## 3. Decisão de banco de dados

### 3.1 Recomendação principal para o AmbientaR

Como o AmbientaR já está no ecossistema Google Cloud/Firebase, a melhor opção inicial para produção é:

```txt
Cloud SQL PostgreSQL + pgvector
```

### Por quê?

- centraliza metadados, texto, chunks, embeddings e auditoria;
- permite filtros relacionais fortes;
- facilita busca do tipo: “similaridade vetorial somente em normas do IGAM, vigentes, publicadas depois de 2018”;
- reduz sincronização entre bancos;
- fica dentro do GCP;
- facilita backups, migração e controle de custo;
- permite SQL auditável.

### 3.2 Alternativa válida

```txt
MongoDB Atlas único
```

Usar se o projeto preferir documento JSON flexível e quiser guardar documento, chunks, embeddings e metadados em uma única coleção. Nesse caso, usar **Atlas Vector Search com `vectorSearch`**, não `knnBeta`.

### 3.3 Evitar na primeira versão

```txt
Firestore para metadados + Atlas para vetores
```

Funciona, mas aumenta:

- custo operacional;
- pontos de falha;
- risco de inconsistência;
- complexidade de reprocessamento;
- manutenção de sincronização.

---

## 4. Modelo de dados recomendado — PostgreSQL + pgvector

### 4.1 Extensões

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

### 4.2 Tabela de fontes

```sql
CREATE TABLE rag_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  base_url TEXT,
  official BOOLEAN DEFAULT TRUE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Tabela de documentos

```sql
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES rag_sources(id),
  external_id TEXT NOT NULL,
  url TEXT,
  title TEXT NOT NULL,
  document_type TEXT,
  norma_tipo TEXT,
  norma_numero TEXT,
  norma_ano INT,
  publication_date DATE,
  effective_date DATE,
  issuing_body TEXT,
  status TEXT,
  subject TEXT,
  raw_hash TEXT NOT NULL,
  normalized_hash TEXT,
  raw_storage_uri TEXT,
  markdown_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  extraction_status TEXT DEFAULT 'pending',
  last_extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_id, external_id)
);
```

### 4.4 Tabela de chunks

> Ajustar a dimensão do vector conforme o modelo de embedding escolhido.

```sql
CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  chunk_type TEXT,
  hierarchy_path TEXT,
  article_number TEXT,
  paragraph_number TEXT,
  section_title TEXT,
  text TEXT NOT NULL,
  contextual_header TEXT,
  enriched_text TEXT NOT NULL,
  token_count INT,
  chunk_hash TEXT NOT NULL,
  embedding vector(768),
  embedding_model TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, chunk_hash)
);
```

### 4.5 Índices

```sql
CREATE INDEX idx_rag_documents_source ON rag_documents(source_id);
CREATE INDEX idx_rag_documents_type ON rag_documents(document_type);
CREATE INDEX idx_rag_documents_body ON rag_documents(issuing_body);
CREATE INDEX idx_rag_documents_status ON rag_documents(status);
CREATE INDEX idx_rag_documents_publication_date ON rag_documents(publication_date);
CREATE INDEX idx_rag_documents_metadata ON rag_documents USING GIN(metadata);

CREATE INDEX idx_rag_chunks_document ON rag_chunks(document_id);
CREATE INDEX idx_rag_chunks_hash ON rag_chunks(chunk_hash);
CREATE INDEX idx_rag_chunks_metadata ON rag_chunks USING GIN(metadata);
CREATE INDEX idx_rag_chunks_text_trgm ON rag_chunks USING GIN(text gin_trgm_ops);

CREATE INDEX idx_rag_chunks_embedding
ON rag_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## 5. Estrutura de pastas recomendada

```txt
legislation_pipeline/
├── src/
│   ├── config/
│   │   ├── settings.py
│   │   └── logging.py
│   ├── domain/
│   │   ├── models.py
│   │   ├── enums.py
│   │   └── errors.py
│   ├── extractors/
│   │   ├── base_extractor.py
│   │   ├── almg_open_data_extractor.py
│   │   ├── almg_portal_scraper.py
│   │   ├── diario_oficial_extractor.py
│   │   └── government_page_extractor.py
│   ├── parsers/
│   │   ├── html_parser.py
│   │   ├── pdf_parser.py
│   │   ├── ocr_document_ai.py
│   │   └── legal_markdown_parser.py
│   ├── normalizers/
│   │   ├── legal_text_normalizer.py
│   │   ├── metadata_extractor.py
│   │   └── hash_service.py
│   ├── chunking/
│   │   ├── legal_structural_chunker.py
│   │   ├── markdown_header_chunker.py
│   │   └── token_counter.py
│   ├── embedding/
│   │   ├── embedding_client.py
│   │   ├── embedding_cache_repository.py
│   │   └── embedding_service.py
│   ├── repositories/
│   │   ├── postgres.py
│   │   ├── document_repository.py
│   │   ├── chunk_repository.py
│   │   └── ingestion_checkpoint_repository.py
│   ├── retrieval/
│   │   ├── hybrid_search.py
│   │   ├── reranker.py
│   │   └── citation_builder.py
│   ├── pipeline/
│   │   ├── ingestion_pipeline.py
│   │   ├── incremental_pipeline.py
│   │   └── reprocess_pipeline.py
│   ├── api/
│   │   ├── main.py
│   │   ├── routes_search.py
│   │   ├── routes_documents.py
│   │   └── schemas.py
│   ├── mcp/
│   │   ├── server.py
│   │   └── tools.py
│   └── main.py
├── tests/
├── scripts/
├── docs/
├── migrations/
├── data/
├── Dockerfile
├── cloudbuild.yaml
├── pyproject.toml
└── README.md
```

---

## 6. Correção importante do extractor ALMG enviado

O código enviado tem boa intenção, mas precisa de ajustes antes de produção.

### 6.1 Pontos a corrigir

1. Nome da classe está como `ALMNGExtractor`. O correto deveria ser `ALMGExtractor` ou, melhor, separar:
   - `ALMGOpenDataExtractor`
   - `ALMGPortalScraper`
2. A URL do portal de legislação não deve ser a primeira fonte para coleta massiva.
3. A coleta “todas as normas desde 1947” não deve depender de HTML paginado do portal.
4. Falta fechamento do trecho de código em `_buscar_proxima_pagina(soup`.
5. Falta checkpoint para continuar depois de falha.
6. Falta hash por documento.
7. Falta upsert idempotente.
8. Falta separação entre “descobrir documentos” e “baixar/processar documento”.
9. Falta tratamento de robots, status 429, 403, captcha e mudança de layout.
10. Falta modo incremental por ano/tipo/data.

### 6.2 Decisão de design

Criar dois extractors:

```txt
ALMGOpenDataExtractor  -> fonte principal
ALMGPortalScraper      -> fallback para completar lacunas
```

---

## 7. Modelos de domínio

### `src/domain/models.py`

```python
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Any, Optional


class SourceType(str, Enum):
    OPEN_DATA = "open_data"
    API = "api"
    HTML = "html"
    PDF = "pdf"
    MANUAL_UPLOAD = "manual_upload"


class ExtractionStatus(str, Enum):
    PENDING = "pending"
    EXTRACTED = "extracted"
    PARSED = "parsed"
    CHUNKED = "chunked"
    EMBEDDED = "embedded"
    FAILED = "failed"
    SKIPPED_UNCHANGED = "skipped_unchanged"


@dataclass(frozen=True)
class RawDocument:
    source: str
    source_type: SourceType
    external_id: str
    url: Optional[str]
    title: str
    publication_date: Optional[date]
    document_type: Optional[str]
    raw_content: bytes | None = None
    text_content: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    raw_hash: str | None = None


@dataclass(frozen=True)
class ParsedDocument:
    external_id: str
    title: str
    markdown_text: str
    metadata: dict[str, Any]
    normalized_hash: str


@dataclass(frozen=True)
class LegalChunk:
    document_external_id: str
    chunk_index: int
    text: str
    enriched_text: str
    chunk_hash: str
    hierarchy_path: str | None = None
    article_number: str | None = None
    paragraph_number: str | None = None
    chunk_type: str | None = None
    token_count: int | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
```

---

## 8. Extractor principal — ALMG Dados Abertos

### 8.1 Estratégia

1. Descobrir anos disponíveis.
2. Baixar arquivos oficiais por ano/tipo.
3. Validar colunas.
4. Gerar `external_id` estável.
5. Calcular hash do conteúdo bruto.
6. Fazer upsert no banco.
7. Processar somente documentos novos ou alterados.

### 8.2 Código base

```python
# src/extractors/almg_open_data_extractor.py

from __future__ import annotations

import csv
import hashlib
import io
import logging
from datetime import date
from typing import Iterable

import requests

from src.domain.models import RawDocument, SourceType
from src.utils.retry_handler import retry_with_backoff
from src.utils.rate_limiter import RateLimiter


class ALMGOpenDataExtractor:
    """Extractor oficial da legislação mineira via Dados Abertos da ALMG.

    Regra: usar como fonte principal para coleta em massa.
    Scraping do portal fica apenas como fallback.
    """

    SOURCE_NAME = "ALMG Dados Abertos"

    def __init__(self, base_url: str, timeout: int = 60) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()
        self.rate_limiter = RateLimiter(min_delay=0.5, max_delay=2.0)
        self.logger = logging.getLogger(self.__class__.__name__)

    def discover(self, start_year: int = 1947, end_year: int | None = None) -> Iterable[dict]:
        """Descobre arquivos por ano.

        A URL exata deve ser ajustada conforme a documentação da ALMG.
        O ponto importante é manter essa camada isolada para trocar a fonte
        sem quebrar parsers, chunking e embeddings.
        """
        current_year = date.today().year
        end_year = end_year or current_year

        for year in range(start_year, end_year + 1):
            yield {
                "year": year,
                "url": f"{self.base_url}/legislacao-mineira?ano={year}&formato=csv",
            }

    @retry_with_backoff(max_retries=4)
    def fetch_file(self, url: str) -> bytes:
        self.rate_limiter.wait()
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.content

    def extract_year(self, year: int, url: str) -> list[RawDocument]:
        content = self.fetch_file(url)
        content_hash = hashlib.sha256(content).hexdigest()

        # Tentar UTF-8 e fallback Latin-1, comum em bases públicas antigas.
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")

        reader = csv.DictReader(io.StringIO(text), delimiter=";")
        documents: list[RawDocument] = []

        for row_index, row in enumerate(reader):
            external_id = self._build_external_id(row=row, year=year, row_index=row_index)
            title = self._build_title(row)

            documents.append(
                RawDocument(
                    source=self.SOURCE_NAME,
                    source_type=SourceType.OPEN_DATA,
                    external_id=external_id,
                    url=row.get("url") or row.get("link") or None,
                    title=title,
                    publication_date=self._parse_date(row.get("data_publicacao") or row.get("data")),
                    document_type=row.get("tipo") or row.get("sigla_tipo"),
                    text_content=row.get("texto") or row.get("ementa") or None,
                    raw_content=None,
                    raw_hash=hashlib.sha256(str(row).encode("utf-8")).hexdigest(),
                    metadata={
                        "year": year,
                        "file_hash": content_hash,
                        "row": row,
                    },
                )
            )

        return documents

    def extract_all(self, start_year: int = 1947, end_year: int | None = None) -> Iterable[RawDocument]:
        for item in self.discover(start_year=start_year, end_year=end_year):
            year = item["year"]
            url = item["url"]
            self.logger.info("Extraindo ALMG Dados Abertos ano=%s", year)
            try:
                yield from self.extract_year(year=year, url=url)
            except Exception:
                self.logger.exception("Falha ao extrair ano=%s url=%s", year, url)
                continue

    def _build_external_id(self, row: dict, year: int, row_index: int) -> str:
        tipo = row.get("tipo") or row.get("sigla_tipo") or "norma"
        numero = row.get("numero") or row.get("num") or str(row_index)
        ano = row.get("ano") or str(year)
        return f"almg:{tipo}:{numero}:{ano}".lower().replace(" ", "-")

    def _build_title(self, row: dict) -> str:
        tipo = row.get("tipo") or row.get("sigla_tipo") or "Norma"
        numero = row.get("numero") or "s/n"
        ano = row.get("ano") or ""
        ementa = row.get("ementa") or ""
        return f"{tipo} {numero}/{ano} — {ementa}".strip(" —")

    def _parse_date(self, value: str | None) -> date | None:
        if not value:
            return None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return date.strptime(value.strip(), fmt)  # type: ignore[attr-defined]
            except Exception:
                pass
        return None
```

> Observação para o Cursor: ajustar os nomes reais das colunas conforme o arquivo oficial da ALMG. A camada acima já deixa isso isolado.

---

## 9. Scraper ALMG como fallback

### 9.1 Quando usar

Usar scraping somente quando:

- o dado aberto não trouxer texto integral;
- houver link do portal com versão consolidada;
- for necessário recuperar áudio/texto/link atualizado;
- houver lacunas de metadados.

### 9.2 Código corrigido e robusto

```python
# src/extractors/almg_portal_scraper.py

from __future__ import annotations

import hashlib
import logging
from datetime import date
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from src.domain.models import RawDocument, SourceType
from src.utils.rate_limiter import RateLimiter
from src.utils.retry_handler import retry_with_backoff


class ALMGPortalScraper:
    """Scraper de fallback para o portal da ALMG.

    Não usar como fonte primária para ingestão total desde 1947.
    """

    SOURCE_NAME = "ALMG Portal"

    def __init__(self, base_url: str, timeout: int = 30) -> None:
        self.base_url = base_url.rstrip("/") + "/"
        self.timeout = timeout
        self.session = requests.Session()
        self.rate_limiter = RateLimiter(min_delay=1.0, max_delay=3.0)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.session.headers.update(
            {
                "User-Agent": (
                    "AmbientaR-RAG/1.0 "
                    "(+https://ambientar.app; contato técnico; coleta respeitosa)"
                ),
                "Accept-Language": "pt-BR,pt;q=0.9",
            }
        )

    @retry_with_backoff(max_retries=3)
    def fetch(self, url: str) -> str:
        self.rate_limiter.wait()
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.text

    def extract_detail(self, url: str) -> RawDocument:
        html = self.fetch(url)
        soup = BeautifulSoup(html, "html.parser")

        title = self._extract_title(soup)
        main_text = self._extract_main_text(soup)
        metadata = self._extract_metadata(soup)

        external_id = metadata.get("external_id") or self._external_id_from_url(url)
        raw_hash = hashlib.sha256(html.encode("utf-8")).hexdigest()

        return RawDocument(
            source=self.SOURCE_NAME,
            source_type=SourceType.HTML,
            external_id=external_id,
            url=url,
            title=title,
            publication_date=metadata.get("publication_date"),
            document_type=metadata.get("document_type"),
            text_content=main_text,
            raw_content=html.encode("utf-8"),
            raw_hash=raw_hash,
            metadata=metadata,
        )

    def extract_listing_page(self, url: str) -> tuple[list[str], str | None]:
        html = self.fetch(url)
        soup = BeautifulSoup(html, "html.parser")

        links = []
        for a in soup.select("a[href]"):
            href = a.get("href")
            text = a.get_text(" ", strip=True).lower()
            if not href:
                continue
            if "lei" in text or "decreto" in text or "norma" in text:
                links.append(urljoin(self.base_url, href))

        next_url = self._find_next_page(soup)
        return sorted(set(links)), next_url

    def _find_next_page(self, soup: BeautifulSoup) -> str | None:
        for a in soup.select("a[href]"):
            label = a.get_text(" ", strip=True).lower()
            if label in {"próxima", "proxima", "seguinte", ">", "»"}:
                return urljoin(self.base_url, a["href"])
        return None

    def _extract_title(self, soup: BeautifulSoup) -> str:
        h1 = soup.find("h1")
        if h1:
            return h1.get_text(" ", strip=True)
        title = soup.find("title")
        return title.get_text(" ", strip=True) if title else "Documento ALMG"

    def _extract_main_text(self, soup: BeautifulSoup) -> str:
        for selector in ["main", "article", "#conteudo", ".conteudo", ".texto"]:
            node = soup.select_one(selector)
            if node:
                return node.get_text("\n", strip=True)
        return soup.get_text("\n", strip=True)

    def _extract_metadata(self, soup: BeautifulSoup) -> dict:
        text = soup.get_text("\n", strip=True)
        return {
            "document_type": self._guess_type(text),
            "publication_date": None,
        }

    def _guess_type(self, text: str) -> str | None:
        upper = text[:500].upper()
        for candidate in ["LEI", "DECRETO", "RESOLUÇÃO", "DELIBERAÇÃO", "PORTARIA"]:
            if candidate in upper:
                return candidate
        return None

    def _external_id_from_url(self, url: str) -> str:
        return "almg-portal:" + hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
```

---

## 10. Retry, rate limit e checkpoint

### 10.1 Retry com backoff

```python
# src/utils/retry_handler.py

from __future__ import annotations

import functools
import random
import time
from typing import Callable, TypeVar

T = TypeVar("T")


def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0, max_delay: float = 30.0):
    def decorator(fn: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(fn)
        def wrapper(*args, **kwargs) -> T:
            last_error: Exception | None = None
            for attempt in range(max_retries + 1):
                try:
                    return fn(*args, **kwargs)
                except Exception as exc:
                    last_error = exc
                    if attempt >= max_retries:
                        break
                    delay = min(max_delay, base_delay * (2**attempt))
                    delay += random.uniform(0, 0.5)
                    time.sleep(delay)
            raise last_error  # type: ignore[misc]

        return wrapper

    return decorator
```

### 10.2 Rate limiter

```python
# src/utils/rate_limiter.py

from __future__ import annotations

import random
import time


class RateLimiter:
    def __init__(self, min_delay: float = 0.5, max_delay: float = 2.0) -> None:
        self.min_delay = min_delay
        self.max_delay = max_delay
        self._last_call = 0.0

    def wait(self) -> None:
        now = time.time()
        elapsed = now - self._last_call
        target_delay = random.uniform(self.min_delay, self.max_delay)
        if elapsed < target_delay:
            time.sleep(target_delay - elapsed)
        self._last_call = time.time()
```

### 10.3 Checkpoint

```sql
CREATE TABLE ingestion_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  checkpoint_key TEXT NOT NULL,
  checkpoint_value JSONB NOT NULL,
  status TEXT DEFAULT 'running',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_name, checkpoint_key)
);
```

---

## 11. Parser PDF com fallback OCR

### 11.1 Regra

1. Tentar pdfplumber.
2. Medir qualidade do texto.
3. Se texto extraído for muito pequeno para o tamanho do PDF, acionar OCR.
4. Salvar flag `ocr_used = true`.
5. Salvar custo estimado por documento.

### 11.2 Código base

```python
# src/parsers/pdf_parser.py

from __future__ import annotations

import logging
from dataclasses import dataclass

import pdfplumber

from src.parsers.ocr_document_ai import DocumentAIOCRClient


@dataclass(frozen=True)
class PDFParseResult:
    text: str
    pages: int
    ocr_used: bool
    confidence: float | None = None


class PDFParser:
    def __init__(self, ocr_client: DocumentAIOCRClient | None = None) -> None:
        self.ocr_client = ocr_client
        self.logger = logging.getLogger(self.__class__.__name__)

    def parse(self, pdf_bytes: bytes, min_chars_per_page: int = 80) -> PDFParseResult:
        text_parts: list[str] = []
        pages = 0

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:  # type: ignore[name-defined]
            pages = len(pdf.pages)
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")

        text = "\n\n".join(text_parts).strip()
        expected_min = max(1, pages) * min_chars_per_page

        if len(text) >= expected_min or self.ocr_client is None:
            return PDFParseResult(text=text, pages=pages, ocr_used=False)

        self.logger.warning(
            "PDF parece escaneado ou com extração ruim. chars=%s pages=%s. Acionando OCR.",
            len(text),
            pages,
        )
        ocr_result = self.ocr_client.process_pdf(pdf_bytes)
        return PDFParseResult(
            text=ocr_result.text,
            pages=pages,
            ocr_used=True,
            confidence=ocr_result.confidence,
        )
```

> Corrigir no Cursor: adicionar `import io` no topo. Mantido aqui como alerta proposital para o Cursor revisar imports.

### 11.3 Cliente Document AI

```python
# src/parsers/ocr_document_ai.py

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class OCRResult:
    text: str
    confidence: float | None = None
    raw: dict | None = None


class DocumentAIOCRClient:
    """Wrapper para Google Document AI OCR.

    Implementar com google-cloud-documentai.
    Usar batch para PDFs grandes e modo síncrono para documentos pequenos.
    """

    def __init__(self, project_id: str, location: str, processor_id: str) -> None:
        self.project_id = project_id
        self.location = location
        self.processor_id = processor_id

    def process_pdf(self, pdf_bytes: bytes) -> OCRResult:
        # TODO Cursor:
        # from google.cloud import documentai
        # client = documentai.DocumentProcessorServiceClient()
        # name = client.processor_path(self.project_id, self.location, self.processor_id)
        # raw_document = documentai.RawDocument(content=pdf_bytes, mime_type="application/pdf")
        # request = documentai.ProcessRequest(name=name, raw_document=raw_document)
        # result = client.process_document(request=request)
        # return OCRResult(text=result.document.text, raw={...})
        raise NotImplementedError
```

---

## 12. Normalização jurídica

### 12.1 Regras

- preservar acentos;
- remover cabeçalhos repetidos;
- remover rodapés;
- normalizar quebras de linha;
- detectar Título, Capítulo, Seção, Subseção;
- detectar Artigos;
- detectar parágrafos;
- detectar incisos romanos;
- detectar alíneas;
- preservar redações como “revogado”, “vetado”, “acrescido por”.

### 12.2 Regex base

```python
LEGAL_PATTERNS = {
    "title": r"^T[ÍI]TULO\s+[IVXLCDM]+\b.*$",
    "chapter": r"^CAP[ÍI]TULO\s+[IVXLCDM]+\b.*$",
    "section": r"^SE[ÇC][ÃA]O\s+[IVXLCDM]+\b.*$",
    "article": r"^Art\.\s*\d+[ºo]?(?:-[A-Z])?\b.*$",
    "paragraph": r"^§\s*\d+[ºo]?\b.*$|^Par[áa]grafo\s+único\b.*$",
    "item": r"^[IVXLCDM]+\s*[-–—]\s+.*$",
    "letter": r"^[a-z]\)\s+.*$",
}
```

---

## 13. Chunking jurídico estrutural

### 13.1 Regra principal

Nunca separar um inciso do artigo principal quando isso comprometer o sentido jurídico.

### 13.2 Hierarquia desejada

```txt
Norma
└── Título
    └── Capítulo
        └── Seção
            └── Artigo
                ├── Caput
                ├── Parágrafos
                ├── Incisos
                └── Alíneas
```

### 13.3 Estratégia

1. Converter para Markdown com cabeçalhos.
2. Identificar blocos legais por regex.
3. Criar chunk por artigo completo sempre que couber.
4. Se artigo for muito grande, dividir por parágrafos, mantendo cabeçalho contextual.
5. Enriquecer chunk com metadados.
6. Gerar hash do `enriched_text`.

### 13.4 Código base

```python
# src/chunking/legal_structural_chunker.py

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from typing import Any


ARTICLE_RE = re.compile(r"(?m)^Art\.\s*\d+[ºo]?(?:-[A-Z])?\b.*")
STRUCTURE_RE = re.compile(
    r"(?m)^(T[ÍI]TULO\s+.*|CAP[ÍI]TULO\s+.*|SE[ÇC][ÃA]O\s+.*|SUBSE[ÇC][ÃA]O\s+.*)$"
)


@dataclass
class ChunkCandidate:
    text: str
    hierarchy_path: str
    article_number: str | None = None
    chunk_type: str = "article"
    metadata: dict[str, Any] = field(default_factory=dict)


class LegalStructuralChunker:
    def __init__(self, max_chars: int = 6000, soft_max_chars: int = 4500) -> None:
        self.max_chars = max_chars
        self.soft_max_chars = soft_max_chars

    def chunk(self, markdown_text: str, document_metadata: dict[str, Any]) -> list[dict[str, Any]]:
        blocks = self._split_by_articles(markdown_text)
        chunks: list[dict[str, Any]] = []

        for block_index, block in enumerate(blocks):
            if len(block.text) <= self.max_chars:
                chunks.append(self._to_chunk(block, block_index, document_metadata))
                continue

            subblocks = self._split_large_article(block)
            for sub_index, subblock in enumerate(subblocks):
                chunks.append(self._to_chunk(subblock, len(chunks), document_metadata, sub_index=sub_index))

        return chunks

    def _split_by_articles(self, text: str) -> list[ChunkCandidate]:
        lines = text.splitlines()
        current_structure: list[str] = []
        current_article: list[str] = []
        current_article_number: str | None = None
        blocks: list[ChunkCandidate] = []

        def flush() -> None:
            nonlocal current_article, current_article_number
            if current_article:
                blocks.append(
                    ChunkCandidate(
                        text="\n".join(current_article).strip(),
                        hierarchy_path=" > ".join(current_structure),
                        article_number=current_article_number,
                    )
                )
                current_article = []
                current_article_number = None

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            if STRUCTURE_RE.match(stripped):
                flush()
                current_structure.append(stripped)
                current_structure = current_structure[-5:]
                continue

            if ARTICLE_RE.match(stripped):
                flush()
                current_article_number = self._extract_article_number(stripped)
                current_article.append(stripped)
            else:
                if current_article:
                    current_article.append(stripped)
                else:
                    # Preâmbulo/ementa antes do primeiro artigo.
                    blocks.append(
                        ChunkCandidate(
                            text=stripped,
                            hierarchy_path=" > ".join(current_structure),
                            chunk_type="preamble",
                        )
                    )

        flush()
        return [b for b in blocks if b.text]

    def _split_large_article(self, block: ChunkCandidate) -> list[ChunkCandidate]:
        parts = re.split(r"(?m)(?=^§\s*\d+[ºo]?\b|^Par[áa]grafo\s+único\b|^[IVXLCDM]+\s*[-–—]\s+)", block.text)
        result: list[ChunkCandidate] = []
        buffer = ""

        for part in parts:
            if not part.strip():
                continue
            if len(buffer) + len(part) > self.soft_max_chars and buffer:
                result.append(
                    ChunkCandidate(
                        text=buffer.strip(),
                        hierarchy_path=block.hierarchy_path,
                        article_number=block.article_number,
                        chunk_type="article_part",
                        metadata=block.metadata,
                    )
                )
                buffer = part
            else:
                buffer += "\n" + part

        if buffer.strip():
            result.append(
                ChunkCandidate(
                    text=buffer.strip(),
                    hierarchy_path=block.hierarchy_path,
                    article_number=block.article_number,
                    chunk_type="article_part",
                    metadata=block.metadata,
                )
            )

        return result

    def _to_chunk(
        self,
        block: ChunkCandidate,
        chunk_index: int,
        document_metadata: dict[str, Any],
        sub_index: int | None = None,
    ) -> dict[str, Any]:
        header = self._build_contextual_header(document_metadata, block)
        enriched_text = f"{header}\n\n{block.text}".strip()
        chunk_hash = hashlib.sha256(enriched_text.encode("utf-8")).hexdigest()

        return {
            "chunk_index": chunk_index,
            "chunk_type": block.chunk_type,
            "hierarchy_path": block.hierarchy_path,
            "article_number": block.article_number,
            "text": block.text,
            "contextual_header": header,
            "enriched_text": enriched_text,
            "chunk_hash": chunk_hash,
            "metadata": {
                **document_metadata,
                **block.metadata,
                "sub_index": sub_index,
            },
        }

    def _build_contextual_header(self, meta: dict[str, Any], block: ChunkCandidate) -> str:
        lines = [
            f"> Fonte: {meta.get('source', 'desconhecida')}",
            f"> Tipo: {meta.get('norma_tipo') or meta.get('document_type') or 'documento'}",
            f"> Número: {meta.get('norma_numero', 's/n')}",
            f"> Ano: {meta.get('norma_ano', '')}",
            f"> Órgão: {meta.get('issuing_body', '')}",
            f"> Status: {meta.get('status', '')}",
        ]
        if block.hierarchy_path:
            lines.append(f"> Estrutura: {block.hierarchy_path}")
        if block.article_number:
            lines.append(f"> Artigo: {block.article_number}")
        return "\n".join(lines)

    def _extract_article_number(self, line: str) -> str | None:
        match = re.search(r"Art\.\s*(\d+[ºo]?(?:-[A-Z])?)", line)
        return match.group(1) if match else None
```

---

## 14. Embeddings com cache persistente

### 14.1 Regra

Não usar apenas:

```python
_cache: Dict[str, list[float]] = {}
```

Em Cloud Run isso perde o cache a cada nova instância.

### 14.2 Fluxo correto

```txt
chunk_hash
   ↓
consulta rag_chunks where chunk_hash = ? and embedding_model = ?
   ↓
se existe embedding -> reutiliza
   ↓
se não existe -> chama API de embedding
   ↓
salva embedding no banco
```

### 14.3 Serviço de embedding

```python
# src/embedding/embedding_service.py

from __future__ import annotations

import logging


class EmbeddingService:
    def __init__(self, client, chunk_repository, model_name: str) -> None:
        self.client = client
        self.chunk_repository = chunk_repository
        self.model_name = model_name
        self.logger = logging.getLogger(self.__class__.__name__)

    def embed_chunk_if_needed(self, chunk: dict) -> list[float]:
        existing = self.chunk_repository.get_embedding_by_hash(
            chunk_hash=chunk["chunk_hash"],
            embedding_model=self.model_name,
        )
        if existing is not None:
            self.logger.info("Embedding cache hit chunk_hash=%s", chunk["chunk_hash"])
            return existing

        self.logger.info("Embedding cache miss chunk_hash=%s", chunk["chunk_hash"])
        embedding = self.client.embed_text(chunk["enriched_text"])
        self.chunk_repository.save_embedding(
            chunk_hash=chunk["chunk_hash"],
            embedding_model=self.model_name,
            embedding=embedding,
        )
        return embedding
```

### 14.4 Cliente GCP

```python
# src/embedding/embedding_client.py

from __future__ import annotations


class GCPEmbeddingClient:
    def __init__(self, project_id: str, location: str, model_name: str) -> None:
        self.project_id = project_id
        self.location = location
        self.model_name = model_name

    def embed_text(self, text: str) -> list[float]:
        # TODO Cursor:
        # Implementar usando Vertex AI ou Generative AI SDK conforme decisão do projeto.
        # Garantir truncamento controlado, logs de tokens e retry.
        raise NotImplementedError
```

---

## 15. Busca híbrida

### 15.1 Requisito

A busca não deve ser só vetorial. Para legislação, termos exatos importam muito:

- “outorga”;
- “uso insignificante”;
- “DN COPAM”;
- “LAS/RAS”;
- “PTRF”;
- “Reserva Legal”;
- “condicionantes”.

### 15.2 Estratégia

```txt
score_final = 0.65 * score_vetorial + 0.25 * score_textual + 0.10 * score_recencia/status
```

### 15.3 SQL exemplo

```sql
WITH vector_results AS (
  SELECT
    c.id,
    1 - (c.embedding <=> :query_embedding) AS vector_score
  FROM rag_chunks c
  JOIN rag_documents d ON d.id = c.document_id
  WHERE (:issuing_body IS NULL OR d.issuing_body = :issuing_body)
    AND (:status IS NULL OR d.status = :status)
  ORDER BY c.embedding <=> :query_embedding
  LIMIT 50
),
text_results AS (
  SELECT
    c.id,
    similarity(unaccent(c.text), unaccent(:query)) AS text_score
  FROM rag_chunks c
  WHERE unaccent(c.text) ILIKE '%' || unaccent(:query) || '%'
  LIMIT 50
)
SELECT
  c.id,
  c.enriched_text,
  d.title,
  d.url,
  COALESCE(v.vector_score, 0) AS vector_score,
  COALESCE(t.text_score, 0) AS text_score,
  (0.65 * COALESCE(v.vector_score, 0) + 0.25 * COALESCE(t.text_score, 0)) AS final_score
FROM rag_chunks c
JOIN rag_documents d ON d.id = c.document_id
LEFT JOIN vector_results v ON v.id = c.id
LEFT JOIN text_results t ON t.id = c.id
WHERE v.id IS NOT NULL OR t.id IS NOT NULL
ORDER BY final_score DESC
LIMIT :top_k;
```

---

## 16. API REST

### 16.1 Endpoints

```txt
POST /rag/search
GET  /rag/documents/{document_id}
GET  /rag/chunks/{chunk_id}
POST /rag/ingestion/run
GET  /rag/ingestion/status
POST /rag/reprocess/document/{document_id}
```

### 16.2 Schema de busca

```python
# src/api/schemas.py

from __future__ import annotations

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(min_length=3)
    top_k: int = Field(default=8, ge=1, le=30)
    issuing_body: str | None = None
    document_type: str | None = None
    status: str | None = None
    date_from: str | None = None
    date_to: str | None = None
    tenant_id: str | None = None


class SearchResult(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    url: str | None
    excerpt: str
    score: float
    vector_score: float | None = None
    text_score: float | None = None
    source: dict
    metadata: dict


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
```

---

## 17. MCP Server

### 17.1 Tools

```txt
search_legislation
get_legal_document
get_legal_chunk
explain_normative_context
list_available_sources
```

### 17.2 Tool schema

```json
{
  "name": "search_legislation",
  "description": "Busca legislação ambiental e normas técnicas em base RAG auditável do AmbientaR.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "top_k": { "type": "integer", "default": 8 },
      "issuing_body": { "type": "string" },
      "document_type": { "type": "string" },
      "status": { "type": "string" }
    },
    "required": ["query"]
  }
}
```

### 17.3 Regra de resposta MCP

Toda resposta deve trazer:

```json
{
  "answer": "texto gerado",
  "sources": [
    {
      "title": "Lei ...",
      "url": "https://...",
      "chunk_id": "...",
      "article": "Art. 3º",
      "score": 0.91,
      "issuing_body": "ALMG",
      "status": "vigente"
    }
  ]
}
```

---

## 18. Pipeline de ingestão

### 18.1 Full ingestion

```txt
1. criar execução em ingestion_runs
2. descobrir documentos
3. comparar hashes
4. baixar/obter conteúdo bruto
5. salvar raw/staging
6. parsear HTML/PDF/OCR
7. normalizar texto jurídico
8. gerar markdown
9. aplicar chunking estrutural
10. gerar/reutilizar embeddings
11. salvar chunks
12. atualizar índices
13. registrar métricas
14. finalizar execução
```

### 18.2 Incremental

```txt
1. consultar checkpoint da fonte
2. buscar apenas ano/data/tipo alterado
3. comparar raw_hash
4. pular documentos sem alteração
5. reprocessar documentos alterados
6. invalidar chunks antigos do documento
7. inserir novos chunks
8. reaproveitar embeddings por chunk_hash quando possível
9. atualizar checkpoint
```

### 18.3 Código de orquestração

```python
# src/pipeline/ingestion_pipeline.py

from __future__ import annotations

import logging


class IngestionPipeline:
    def __init__(
        self,
        extractor,
        parser,
        normalizer,
        chunker,
        embedding_service,
        document_repository,
        chunk_repository,
    ) -> None:
        self.extractor = extractor
        self.parser = parser
        self.normalizer = normalizer
        self.chunker = chunker
        self.embedding_service = embedding_service
        self.document_repository = document_repository
        self.chunk_repository = chunk_repository
        self.logger = logging.getLogger(self.__class__.__name__)

    def run_full(self) -> None:
        for raw_doc in self.extractor.extract_all():
            self.process_one(raw_doc)

    def process_one(self, raw_doc) -> None:
        existing = self.document_repository.get_by_external_id(raw_doc.external_id)
        if existing and existing.raw_hash == raw_doc.raw_hash:
            self.logger.info("Documento inalterado: %s", raw_doc.external_id)
            return

        parsed = self.parser.parse(raw_doc)
        normalized = self.normalizer.normalize(parsed)
        document_id = self.document_repository.upsert(raw_doc, normalized)

        chunks = self.chunker.chunk(
            normalized.markdown_text,
            document_metadata={
                **raw_doc.metadata,
                "source": raw_doc.source,
                "document_type": raw_doc.document_type,
                "url": raw_doc.url,
            },
        )

        self.chunk_repository.delete_by_document_id(document_id)

        for chunk in chunks:
            embedding = self.embedding_service.embed_chunk_if_needed(chunk)
            self.chunk_repository.insert(document_id=document_id, chunk=chunk, embedding=embedding)
```

---

## 19. Observabilidade e custo

### 19.1 Métricas mínimas

- documentos descobertos;
- documentos novos;
- documentos alterados;
- documentos ignorados;
- PDFs com OCR;
- caracteres extraídos;
- chunks gerados;
- embeddings gerados;
- embeddings reaproveitados;
- custo estimado por execução;
- erros por fonte;
- tempo por etapa;
- top queries dos usuários;
- taxa de resposta sem fonte.

### 19.2 Tabela de execução

```sql
CREATE TABLE ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  documents_seen INT DEFAULT 0,
  documents_new INT DEFAULT 0,
  documents_changed INT DEFAULT 0,
  documents_skipped INT DEFAULT 0,
  chunks_created INT DEFAULT 0,
  embeddings_created INT DEFAULT 0,
  embeddings_reused INT DEFAULT 0,
  ocr_documents INT DEFAULT 0,
  estimated_cost_usd NUMERIC(12, 4) DEFAULT 0,
  error_count INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

---

## 20. Segurança e multi-tenant

### 20.1 Tipos de base

```txt
PUBLIC_LEGAL      -> legislação pública
INTERNAL_TEMPLATE -> modelos internos da consultoria
CLIENT_DOCUMENT   -> documentos de clientes
PROCESS_DOCUMENT  -> documentos de processos ambientais
```

### 20.2 Regra

- Legislação pública pode ser compartilhada entre tenants.
- Documentos de cliente devem ser isolados por `tenant_id`.
- Busca RAG deve sempre aplicar filtro de permissão.
- Logs não devem salvar documentos sensíveis completos.
- Respostas da IA devem respeitar o papel do usuário.

### 20.3 Campos extras

```sql
ALTER TABLE rag_documents ADD COLUMN tenant_id TEXT;
ALTER TABLE rag_documents ADD COLUMN visibility TEXT DEFAULT 'public_legal';
ALTER TABLE rag_chunks ADD COLUMN tenant_id TEXT;
ALTER TABLE rag_chunks ADD COLUMN visibility TEXT DEFAULT 'public_legal';
```

---

## 21. Interface no AmbientaR

### 21.1 Página principal

Cards:

```txt
[Status da Base]
[Fontes Oficiais]
[Ingestões]
[Busca de Teste]
[Custos]
[Logs]
[Configurações MCP]
[Permissões]
```

### 21.2 Componentes sugeridos

```txt
src/app/configuracoes/mcp-rag/page.tsx
src/components/mcp-rag/StatusCards.tsx
src/components/mcp-rag/SourceTable.tsx
src/components/mcp-rag/IngestionRunsTable.tsx
src/components/mcp-rag/RagSearchTester.tsx
src/components/mcp-rag/CostPanel.tsx
src/components/mcp-rag/McpToolsPanel.tsx
src/components/mcp-rag/PermissionPanel.tsx
```

### 21.3 Tipo TypeScript

```ts
export type RagSource = {
  id: string;
  name: string;
  sourceType: 'open_data' | 'api' | 'html' | 'pdf' | 'manual_upload';
  enabled: boolean;
  official: boolean;
  lastRunAt?: string;
  documentCount?: number;
  chunkCount?: number;
};

export type RagSearchResult = {
  chunkId: string;
  documentId: string;
  title: string;
  url?: string;
  excerpt: string;
  score: number;
  source: {
    name: string;
    issuingBody?: string;
    documentType?: string;
    status?: string;
  };
};
```

---

## 22. `.env.example`

```env
APP_ENV=development
LOG_LEVEL=INFO

DATABASE_URL=postgresql+psycopg://user:password@host:5432/ambientar_rag

GCP_PROJECT_ID=ambientar-prod
GCP_LOCATION=us-central1
GCP_EMBEDDING_MODEL=text-embedding-004
GCP_DOCUMENT_AI_PROCESSOR_ID=

ALMG_OPEN_DATA_BASE_URL=https://dadosabertos.almg.gov.br
ALMG_PORTAL_BASE_URL=https://www.almg.gov.br/atividade-parlamentar/leis/legislacao-mineira/

RAG_MAX_TOP_K=30
RAG_DEFAULT_TOP_K=8
RAG_ENABLE_OCR=true
RAG_ENABLE_PORTAL_SCRAPER_FALLBACK=false
```

---

## 23. Dependências Python sugeridas

### `pyproject.toml`

```toml
[project]
name = "ambientar-legislation-rag"
version = "0.1.0"
description = "Pipeline MCP + RAG para legislação ambiental MG"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic>=2.8.0",
  "pydantic-settings>=2.4.0",
  "requests>=2.32.0",
  "beautifulsoup4>=4.12.0",
  "markdownify>=0.13.0",
  "pdfplumber>=0.11.0",
  "psycopg[binary,pool]>=3.2.0",
  "sqlalchemy>=2.0.0",
  "pgvector>=0.3.0",
  "google-cloud-documentai>=2.29.0",
  "google-cloud-aiplatform>=1.67.0",
  "python-dotenv>=1.0.0",
  "tenacity>=8.5.0",
  "structlog>=24.4.0"
]

[project.optional-dependencies]
dev = [
  "pytest>=8.3.0",
  "pytest-cov>=5.0.0",
  "ruff>=0.6.0",
  "mypy>=1.11.0"
]
```

---

## 24. Dockerfile

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir .

COPY src ./src

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## 25. Scripts úteis

### `scripts/run_full_ingestion.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
python -m src.main ingest --source almg --mode full --start-year 1947
```

### `scripts/run_incremental.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
python -m src.main ingest --source almg --mode incremental
```

### `scripts/run_api.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
uvicorn src.api.main:app --host 0.0.0.0 --port 8080 --reload
```

---

## 26. Testes obrigatórios

### 26.1 Chunking jurídico

```python
# tests/test_legal_structural_chunker.py

from src.chunking.legal_structural_chunker import LegalStructuralChunker


def test_artigo_preserva_incisos():
    text = """
CAPÍTULO I
Art. 1º Fica instituída a regra principal.
I - primeiro requisito;
II - segundo requisito;
§ 1º O disposto neste artigo aplica-se aos casos ambientais.
Art. 2º Esta Lei entra em vigor.
""".strip()

    chunker = LegalStructuralChunker(max_chars=3000)
    chunks = chunker.chunk(text, {"source": "teste", "norma_tipo": "Lei", "norma_numero": "1"})

    artigo_1 = [c for c in chunks if c.get("article_number") == "1º"][0]
    assert "I - primeiro requisito" in artigo_1["text"]
    assert "§ 1º" in artigo_1["text"]
```

### 26.2 Cache persistente

```python
def test_embedding_cache_hit_nao_chama_api(fake_repo, fake_client):
    fake_repo.existing_embedding = [0.1, 0.2, 0.3]
    service = EmbeddingService(fake_client, fake_repo, "text-embedding-004")

    result = service.embed_chunk_if_needed({"chunk_hash": "abc", "enriched_text": "texto"})

    assert result == [0.1, 0.2, 0.3]
    assert fake_client.calls == 0
```

---

## 27. Prompt pronto para o Cursor AI

Copie e cole este prompt no Cursor:

```txt
Você é o engenheiro principal do projeto AmbientaR/EcoGestão MG.

Implemente a arquitetura MCP + RAG descrita no arquivo Plano_MCP_RAG_AmbientaR_Cursor_v3.md.

Prioridades:
1. Criar estrutura de pastas legislation_pipeline/src conforme o plano.
2. Implementar modelos de domínio em src/domain/models.py.
3. Implementar ALMGOpenDataExtractor como fonte principal.
4. Implementar ALMGPortalScraper apenas como fallback.
5. Implementar LegalStructuralChunker com testes.
6. Implementar cache persistente de embeddings via PostgreSQL.
7. Criar migrations SQL para rag_sources, rag_documents, rag_chunks, ingestion_runs e ingestion_checkpoints.
8. Criar API FastAPI com POST /rag/search.
9. Criar testes unitários mínimos para chunking, hash e cache de embeddings.
10. Não usar knnBeta. Se for MongoDB, usar vectorSearch. Se for PostgreSQL, usar pgvector.

Regras obrigatórias:
- Toda resposta RAG deve retornar fontes.
- Não separar incisos/parágrafos do artigo sem cabeçalho contextual.
- Não usar cache de embedding somente em memória.
- Não fazer scraping massivo da ALMG se os Dados Abertos resolverem.
- OCR deve ser fallback quando PDF nativo retornar pouco texto.
- Código deve ser modular, tipado e testável.

Comece criando os arquivos e testes da Fase 1.
```

---

## 28. Roadmap de implementação

### Fase 1 — Base técnica

- modelos de domínio;
- migrations;
- repositórios PostgreSQL;
- chunker jurídico;
- testes unitários.

### Fase 2 — ALMG

- ALMG Dados Abertos;
- fallback portal;
- checkpoint;
- logs;
- ingestão incremental.

### Fase 3 — Embeddings e busca

- cliente GCP;
- cache persistente;
- pgvector;
- busca híbrida;
- reranking opcional.

### Fase 4 — API + MCP

- FastAPI;
- MCP server;
- autenticação;
- permissões;
- retorno de fontes.

### Fase 5 — UI AmbientaR

- página Configurações > MCP + RAG;
- status da base;
- teste de busca;
- painel de custos;
- logs de ingestão.

### Fase 6 — Produção

- Cloud Run;
- Cloud Scheduler;
- Cloud SQL;
- Secret Manager;
- monitoramento;
- alertas;
- backup;
- limites de custo.

---

## 29. Checklist de produção

- [ ] Dados Abertos ALMG configurados como fonte principal.
- [ ] Scraping ativável apenas por feature flag.
- [ ] Checkpoint por fonte/ano/tipo.
- [ ] Hash de documento bruto.
- [ ] Hash de documento normalizado.
- [ ] Hash de chunk enriquecido.
- [ ] Cache persistente de embeddings.
- [ ] OCR fallback.
- [ ] Busca híbrida.
- [ ] Filtros por órgão, tipo, status e data.
- [ ] Resposta com fontes.
- [ ] Logs estruturados.
- [ ] Métrica de custo.
- [ ] Testes de chunking jurídico.
- [ ] Testes de permissões multi-tenant.
- [ ] Deploy Cloud Run.
- [ ] Secrets fora do código.
- [ ] Backup Cloud SQL.
- [ ] Alertas de erro e custo.

---

## 30. Fontes técnicas consultadas

- ALMG Dados Abertos — Legislação mineira desde 1947: https://dadosabertos.almg.gov.br/documentacao/arquivos/legislacao-mineira
- Portal de Dados Abertos da ALMG: https://www.almg.gov.br/sites-da-almg/Dados-Abertos
- MongoDB Atlas — `knnBeta` depreciado; usar `vectorSearch`: https://www.mongodb.com/docs/atlas/atlas-search/knn-beta/
- Google Cloud Document AI Enterprise OCR: https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr
- Google Cloud Document AI: https://cloud.google.com/document-ai

---

## 31. Conclusão

Esta versão deixa o plano pronto para iniciar implementação no Cursor AI com padrão de produção.

A decisão mais importante é começar pela base correta:

```txt
ALMG Dados Abertos + PostgreSQL/pgvector + chunking jurídico estrutural + cache persistente
```

Depois disso, adicionar scraping, OCR e MCP se torna evolução natural, sem retrabalho estrutural.
