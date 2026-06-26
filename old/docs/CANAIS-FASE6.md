# Fase 6 – Canais e Automação (WhatsApp, Instagram, Vindi)

Este documento descreve os fluxos e integrações previstos para a Fase 6 do AmbientaR 2.0. A tela **Canais e Integrações** (`/canais`) no app aponta para este arquivo.

---

## 1. WhatsApp / n8n

### Objetivo

Fluxo mínimo: **consulta criada → laudo pronto → envio automático via WhatsApp Business**.

### Fluxo proposto

1. No AmbientaR: usuário cria uma **consulta** (ou o sistema recebe um pedido por outro canal).
2. Quando o **laudo** associado à consulta fica pronto (status "pronto" ou "enviado"), o sistema dispara um evento ou chama um webhook.
3. O **n8n** (ou outro orquestrador) recebe o evento, monta a mensagem (ex.: link do PDF, texto resumido) e envia via **WhatsApp Business API** para o número do cliente/representante vinculado à consulta.

### Payloads e endpoints necessários

- **Opção A – Webhook outbound do AmbientaR**
  - O AmbientaR expõe um endpoint interno (ou Cloud Function) que o n8n chama quando um laudo muda de status.
  - Alternativa: o próprio AmbientaR chama um **webhook do n8n** quando o laudo fica pronto, enviando um payload como:
    ```json
    {
      "event": "laudo.pronto",
      "laudoId": "...",
      "consultaId": "...",
      "empreendimentoId": "...",
      "clienteNome": "...",
      "clienteTelefone": "+55...",
      "docxUrl": "https://...",
      "pdfUrl": "https://..."   // quando existir
    }
    ```
  - O n8n usa esse payload para enviar a mensagem no WhatsApp (e opcionalmente registrar em CRM).

- **Opção B – Polling pelo n8n**
  - O n8n consulta periodicamente uma API ou coleção Firestore (ex.: `laudos` onde `status == 'pronto'` e `notificadoWhatsApp != true`), processa os novos e marca como notificados.

### Implementado no AmbientaR

- **API** `POST /api/canais/notificar-laudo-pronto`: reenvia payload para **`N8N_LAUDO_PRONTO_WEBHOOK_URL`**. Na tela do laudo: select de status e botão "Notificar (laudo pronto)"; grava `notificadoWhatsAppAt`.

### Próximos passos de implementação

- [ ] Configurar a variável e o workflow n8n. (Disparo já feito na tela do laudo.)
- [ ] Definir onde o evento "laudo pronto" será disparado (tela do laudo, Cloud Function, ou job).
- [ ] Criar webhook no AmbientaR (ou função) que envia o payload para a URL do n8n.
- [ ] Configurar workflow no n8n: receber webhook → formatar mensagem → WhatsApp Business API.
- [ ] Guardar em `laudos` (ou `consultas`) que o envio WhatsApp foi feito, para não reenviar.

---

## 2. Instagram

### Objetivo

**Captação de leads:** Story com CTA → direct → criação de lead ou consulta simplificada no AmbientaR.

### Fluxo proposto

1. **Story** com call-to-action (ex.: "Saiba se sua atividade está regular" ou "Solicite um diagnóstico").
2. Usuário envia **mensagem no direct** (Instagram).
3. Bot ou atendente (humano + script) coleta dados mínimos: nome, tipo de atividade, município, contato (e-mail/telefone).
4. Criação no AmbientaR:
   - **Opção A:** novo **lead** em coleção dedicada (ex.: `leads`), com origem `instagram`; depois conversão manual em **consulta**.
   - **Opção B:** criação direta de **consulta** simplificada (sem empreendimento/empreendedor vinculados no início), com origem `instagram`.

### Integração técnica

- **Instagram Graph API / Conversas:** receber mensagens e responder (ex.: via Meta Business Suite ou ferramenta de direct).
- **Webhook ou API no AmbientaR:** endpoint que recebe "novo lead do Instagram" (nome, contato, mensagem) e cria registro em `leads` ou `consultas`.
- Formulário simplificado (Typeform, Google Forms, ou página no próprio app) vinculado ao CTA do Story; resposta enviada para o AmbientaR via API.

### Próximos passos

- [ ] Desenhar fluxo de perguntas no direct (ou formulário) e mapear campos → `leads` ou `consultas`.
- [ ] Definir coleção `leads` (se não existir) e campos: origem, nome, email, telefone, mensagem, createdAt.
- [ ] Implementar endpoint ou Cloud Function que recebe o payload e grava no Firestore.
- [ ] Conectar Instagram (Meta) ao fluxo de mensagens (bot ou triagem humana).

---

## 3. Assinaturas (Vindi)

### Objetivo

Planos de assinatura (Gratuito, Premium, Enterprise) com limites de uso e **cobrança recorrente** via Vindi.

### Planos e limites (proposta)

| Plano       | Consultas/mês | Usuários | Armazenamento | Preço (exemplo) |
|------------|----------------|----------|---------------|------------------|
| Gratuito   | 2             | 2        | 500 MB        | R$ 0             |
| Premium    | 20            | 10       | 5 GB          | sob consulta     |
| Enterprise | Ilimitado*     | Ilimitado* | sob consulta | sob consulta     |

\* Definir tetos ou "sob consulta" conforme contrato.

### Integração Vindi

- **Produtos/planos** cadastrados na Vindi (recorrência mensal ou anual).
- **Checkout:** link ou página que envia o cliente para a Vindi (ou uso do gateway da Vindi no próprio site).
- **Webhooks Vindi → AmbientaR:** quando a assinatura é ativada/renovada/cancelada, a Vindi chama um endpoint do AmbientaR para:
  - Atualizar o "plano" da empresa (ou do tenant) no Firestore.
  - Habilitar/desabilitar recursos conforme limites (consultas, usuários, armazenamento).
- **Regras no app:** ao criar consulta ou usuário, o backend ou regras do Firestore verificam se o plano permite (ex.: número de consultas no mês, número de usuários).

### Próximos passos

- [ ] Definir tabela final de planos e limites.
- [ ] Cadastrar produtos/planos na Vindi.
- [ ] Implementar endpoint de webhook Vindi no AmbientaR (ou Cloud Function) para atualizar plano/limites.
- [ ] Implementar checagem de limites no app (consultas no mês, número de usuários, uso de Storage).

---

## Resumo

| Canal        | Status       | Próximo passo principal                          |
|-------------|--------------|--------------------------------------------------|
| WhatsApp    | Planejado    | Webhook "laudo pronto" → n8n → WhatsApp API    |
| Instagram   | Planejado    | Definir fluxo lead/consulta + endpoint + Meta    |
| Assinaturas | Planejado    | Planos na Vindi + webhook + checagem de limites  |

A tela **Canais e Integrações** (`/canais`) no app permite ao time acessar este planejamento e, em seguida, configurar cada canal conforme a prioridade do negócio.
