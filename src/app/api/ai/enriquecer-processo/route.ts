import { NextRequest, NextResponse } from 'next/server';
import { analyseArea } from '@/ai/flows/analise-ambiental-flow';

export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataType, data } = body;

    if (!dataType || data === undefined) {
      return NextResponse.json(
        { success: false, error: 'dataType e data são obrigatórios (dataType: car | kml | shp | polygon).' },
        { status: 400 }
      );
    }

    const validTypes = ['car', 'kml', 'shp', 'polygon'];
    if (!validTypes.includes(String(dataType))) {
      return NextResponse.json(
        { success: false, error: 'dataType deve ser: car, kml, shp ou polygon.' },
        { status: 400 }
      );
    }

    const result = await analyseArea({
      dataType: dataType as 'car' | 'kml' | 'shp' | 'polygon',
      data: String(data),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error('POST /api/ai/enriquecer-processo:', e);
    return NextResponse.json(
      { success: false, error: (e as Error).message || 'Erro ao enriquecer processo.' },
      { status: 500 }
    );
  }
}
