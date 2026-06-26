-- PostgreSQL + pgvector — índice legislativo enterprise (Cloud SQL / local Docker)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS legal_documents (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  external_key TEXT NOT NULL,
  tipo TEXT,
  numero TEXT,
  ano INTEGER,
  ementa TEXT,
  situacao TEXT,
  link_texto_original TEXT,
  link_texto_atualizado TEXT,
  content_hash TEXT,
  raw_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_key)
);

CREATE TABLE IF NOT EXISTS legal_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  hierarchy_path TEXT,
  chunk_text TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_legal_chunks_doc ON legal_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding ON legal_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  documents_seen INTEGER DEFAULT 0,
  chunks_created INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
