/**

 * GET /api/studies/[slug]/form-schema

 *

 * Retorna o schema do formulário do estudo (estático, cache ou gerado a partir do DOCX).

 * Query: source=static|docx|auto (default auto), refresh=1 para forçar reprocessamento.

 * Query opcional: listagem, listagemCode, activity, subactivity, subActivity, atividade

 */



import { NextRequest, NextResponse } from 'next/server';

import {

  apiAuthErrorResponse,

  requireAuthenticatedApi,

} from '@/lib/api-auth';

import { getStaticFormSchema } from '@/lib/study-form-schema';

import { isStudyLinkedToTr } from '@/lib/termos-referencia-study-folders';

import { getTermosReferenciaPathForStudy } from '@/lib/termos-referencia-config.server';

import { resolveAndCacheStudyFormSchema } from '@/lib/study-form-schema-cache';
import { enhanceStudyFormSchema } from '@/lib/study-form-schema-enhance';
import { extractListagemCode } from '@/lib/listagem-activities';
import { resolveRcaTermosReferenciaPath } from '@/lib/rca/rca-termos-referencia-paths';



type SourceMode = 'static' | 'docx' | 'auto';



export async function GET(

  request: NextRequest,

  context: { params: Promise<{ slug: string }> }

) {

  try {

    await requireAuthenticatedApi(request);

  } catch (e) {

    return apiAuthErrorResponse(e);

  }



  const { slug } = await context.params;

  const studySlug = slug?.toLowerCase().trim();

  if (!studySlug) {

    return NextResponse.json(

      { success: false, error: 'Slug do estudo é obrigatório.' },

      { status: 400 }

    );

  }



  const source = (request.nextUrl.searchParams.get('source') as SourceMode) || 'auto';

  const refresh = request.nextUrl.searchParams.get('refresh') === '1';

  const listagemQuery =

    request.nextUrl.searchParams.get('listagem') ||

    request.nextUrl.searchParams.get('listagemCode') ||

    request.nextUrl.searchParams.get('activity');

  const subactivityQuery =

    request.nextUrl.searchParams.get('subactivity') ||

    request.nextUrl.searchParams.get('subActivity') ||

    request.nextUrl.searchParams.get('atividade');



  const staticSchema = getStaticFormSchema(studySlug);

  const enhanceCtx = {
    studySlug,
    listagemCode: extractListagemCode(listagemQuery),
    activity: listagemQuery,
    subactivity: subactivityQuery,
  };
  const applyEnhance = (schema: NonNullable<typeof staticSchema>) =>
    enhanceStudyFormSchema(schema, enhanceCtx);

  const linked = isStudyLinkedToTr(studySlug);

  if (!staticSchema && !linked) {

    return NextResponse.json(

      { success: false, error: `Estudo "${studySlug}" não possui schema de formulário configurado.` },

      { status: 404 }

    );

  }



  if (source === 'static') {

    if (!staticSchema) {

      return NextResponse.json(

        { success: false, error: 'Schema estático não disponível para este estudo.' },

        { status: 404 }

      );

    }

    return NextResponse.json({

      success: true,

      schema: applyEnhance(staticSchema),

      source: 'static',

    });

  }



  let dirPath = getTermosReferenciaPathForStudy(studySlug);

  if (studySlug === 'rca') {
    const listagemCode =
      extractListagemCode(listagemQuery) ?? extractListagemCode(subactivityQuery);
    if (listagemCode) {
      const rcaPath = await resolveRcaTermosReferenciaPath(listagemCode);
      if (rcaPath) dirPath = rcaPath;
    }
  }

  if (!dirPath) {

    if (!staticSchema) {

      return NextResponse.json(

        { success: false, error: 'Estudo sem vínculo com pasta de termos de referência.' },

        { status: 404 }

      );

    }

    return NextResponse.json({

      success: true,

      schema: applyEnhance(staticSchema),

      source: 'static',

    });

  }



  if (source === 'docx' || source === 'auto' || refresh) {

    try {

      const result = await resolveAndCacheStudyFormSchema({

        studySlug,

        dirPath,

        activity: listagemQuery,

        subactivity: subactivityQuery,

        refresh: refresh || source === 'docx',

      });



      if (result.ok) {

        return NextResponse.json({

          success: true,

          schema: result.schema,

          source: result.source,

          matchedBy: result.matchedBy,

        });

      }



      if (source === 'docx') {

        return NextResponse.json(

          { success: false, error: result.reason },

          { status: 404 }

        );

      }

    } catch (e) {

      console.error('form-schema: resolveAndCacheStudyFormSchema failed', e);

      if (source === 'docx') {

        return NextResponse.json(

          { success: false, error: 'Falha ao extrair estrutura do documento base.' },

          { status: 500 }

        );

      }

    }

  }



  if (staticSchema) {

    return NextResponse.json({

      success: true,

      schema: applyEnhance(staticSchema),

      source: 'static',

    });

  }



  return NextResponse.json(

    {

      success: false,

      error:

        'Nenhum documento base (.dotx/.docx) encontrado na pasta vinculada e sem schema estático.',

    },

    { status: 404 }

  );

}


