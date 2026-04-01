# Acessar o AmbientaR no celular (desenvolvimento)

## Por que o IP local (`http://192.168.x.x:9002`) pode falhar

Mesmo com firewall liberado, **muitas redes impedem** um celular de falar com o PC:

| Causa | O que fazer |
|-------|-------------|
| **Isolamento de cliente (AP isolation)** | Comum em Wi-Fi “convidado” ou em alguns roteadores. Desative no roteador ou use outra rede. |
| **Celular em 4G/5G** | Tem que estar no **mesmo Wi-Fi** do PC. |
| **IP errado** | No PC: `ipconfig` → IPv4 do **Wi-Fi** (muda se trocar de rede). |
| **VPN no PC ou no celular** | Desligue para testar. |
| **Antivírus com firewall próprio** | Libere Node.js / porta 9002 ou teste o túnel abaixo. |

---

## Opção recomendada: túnel Cloudflare (sem senha, estável)

Não pede IP/senha. Só abrir a URL no celular.

### 1. Instalar o cloudflared (uma vez)

No PowerShell ou CMD: `winget install Cloudflare.cloudflared`  
(Sem winget: baixe em https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

### 2. Rodar app e túnel

**Terminal 1:** `cd "C:\Users\Andrew\OneDrive\Projects\AmbientaR"` e `npm run dev`  
**Terminal 2:** mesma pasta e `npm run dev:tunnel:cf` (ou duplo clique em `scripts\tunel-celular-cloudflare.cmd`)

### 3. Copiar a URL

No terminal 2 aparece: `https://algum-nome.trycloudflare.com`

### 4. No celular

Abra a URL no navegador. Sem tela de senha. Feche o túnel (Ctrl+C) quando terminar.

**Atenção:** na primeira vez, o LocalTunnel pode pedir um **clique em “Continue”** na página de aviso.

**Alternativa LocalTunnel:** Terminal 2: `npm run dev:tunnel`. URL `....loca.lt`. Se pedir password, use o IP de https://meuip.com.br

---

## Teste rápido no próprio PC

Antes de culpar o celular, no **navegador do PC** abra:

`http://SEU_IP_WIFI:9002`  
(ex.: `http://192.168.15.4:9002`)

- Se **não abrir no PC**, o problema não é o celular (IP, firewall ou servidor).
- Se **abrir no PC** mas **não no celular**, é quase sempre **isolamento na rede Wi-Fi** → use o túnel Cloudflare (`npm run dev:tunnel:cf`) ou LocalTunnel.

---

## Hotspot do celular (alternativa)

1. Ative **ponto de acesso** no celular.  
2. Conecte o **PC** ao Wi-Fi desse hotspot.  
3. No PC, `ipconfig` e pegue o IPv4 (geralmente algo como `192.168.43.x`).  
4. No celular: `http://esse_ip:9002`  

Às vezes funciona quando o roteador de casa bloqueia comunicação entre aparelhos.
