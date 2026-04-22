/**
 * Fase 5 – Canais.
 * POST /api/canais/notificar-laudo-pronto
 * Envia payload para o webhook n8n quando um laudo está pronto (para envio via WhatsApp ou outro canal).
 *
 * Body: {
 *   laudoId: string;
 *   consultaId?: string;
 *   empreendimentoNome?: string;
 *   clienteNome?: string;
 *   clienteTelefone?: string;
 *   docxUrl?: string;
 *   pdfUrl?: string;
 * }
 *
 * Variável de ambiente: N8N_LAUDO_PRONTO_WEBHOOK_URL (URL do webhook n8n).
 * Se não estiver definida, retorna 503.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isLaudoWebhookEnabled } from '@/lib/deploy-flags';

const WEBHOOK_URL = process.env.N8N_LAUDO_PRONTO_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  if (!isLaudoWebhookEnabled()) {
    return NextResponse.json(
      { error: 'Webhook de laudo desativado temporariamente para estabilização do deploy.' },
      { status: 503 }
    );
  }

  if (!WEBHOOK_URL || WEBHOOK_URL.trim() === '') {
    return NextResponse.json(
      { error: 'Webhook não configurado. Defina N8N_LAUDO_PRONTO_WEBHOOK_URL.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const payload = {
      event: 'laudo.pronto',
      laudoId: body.laudoId ?? '',
      consultaId: body.consultaId ?? '',
      empreendimentoNome: body.empreendimentoNome ?? '',
      clienteNome: body.clienteNome ?? '',
      clienteTelefone: body.clienteTelefone ?? '',
      docxUrl: body.docxUrl ?? '',
      pdfUrl: body.pdfUrl ?? '',
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'Webhook respondeu com erro', detail: text, status: res.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Notificação enviada ao webhook.' });
  } catch (e) {
    return NextResponse.json(
      { error: 'Erro ao chamar webhook', detail: (e as Error).message },
      { status: 500 }
    );
  }
}
