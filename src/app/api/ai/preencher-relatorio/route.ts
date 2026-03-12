import { NextRequest, NextResponse } from 'next/server';
import { preencherRelatorio } from '@/ai/flows/preencher-relatorio-flow';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tipoDocumento,
      empreendimentoNome,
      empreendedorNome,
      municipio,
      uf,
      atividade,
      numeroCAR,
    } = body;

    if (!tipoDocumento || !empreendimentoNome) {
      return NextResponse.json(
        { success: false, error: 'tipoDocumento e empreendimentoNome são obrigatórios.' },
        { status: 400 }
      );
    }

    const result = await preencherRelatorio({
      tipoDocumento: String(tipoDocumento),
      empreendimentoNome: String(empreendimentoNome),
      empreendedorNome: empreendedorNome != null ? String(empreendedorNome) : undefined,
      municipio: municipio != null ? String(municipio) : undefined,
      uf: uf != null ? String(uf) : undefined,
      atividade: atividade != null ? String(atividade) : undefined,
      numeroCAR: numeroCAR != null ? String(numeroCAR) : undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error('POST /api/ai/preencher-relatorio:', e);
    return NextResponse.json(
      { success: false, error: (e as Error).message || 'Erro ao gerar rascunho.' },
      { status: 500 }
    );
  }
}
