# Modelo consolidado de ofício (Pimenta Consultoria)

Referência de arquivo: `Z:\OFICIOS PIMENTA CONSULTORIA\2025\Ofício 033.2025 - TAC - Irineu.docx`

Implementação na app: `src/lib/oficio-format.ts`, `src/lib/oficio-templates.ts`, formulário em `/oficios/new`.

## Ordem do texto (consolidado)

1. **Cabeçalho:** `OF/PIMENTAAMBIENTAL/ Nº 033/2025` + local e data (`Unaí-MG, 24 de março de 2025`)
2. **Referente:** linha temática (ex. solicitação de assinatura de TAC)
3. **Processo SEI/SLA:** número do processo
4. **Assunto:** resumo curto
5. **Saudação:** `Prezado(s) Senhores(s),`
6. **Corpo:** parágrafos e blocos CONSIDERANDO
7. **Anexo:** `Anexo, consta cópia: …`
8. **Solicitante:** qualificação do responsável legal
9. **Fecho** + linha de assinatura + `p/p Nome`
10. **Destinatário (final):** bloco `Ao` + cargo/órgão + endereço

## Modelo TAC (SEMAD/MG)

Botão **TAC — assinatura (SEMAD/MG)** no formulário aplica o template `tac_sem_ad` com placeholders `[NOME DO EMPREENDIMENTO]`, `[CPF]`, etc.

## Numeração

Ao **concluir** o ofício na lista, o sistema gera sequência `033/2025` em `oficioCounters`; a pré-visualização formata como `OF/PIMENTAAMBIENTAL/ Nº 033/2025`.

## Próximos passos (opcional)

- Exportar para `.docx` a partir do texto consolidado
- Vincular empreendimento/cliente e preencher solicitante automaticamente
