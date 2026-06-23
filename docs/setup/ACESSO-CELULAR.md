# Acessar AmbientaR pelo celular na rede local

Quando você acessa pelo celular o endereço da aplicação (ex.: `192.168.15.4:9002`) e a solicitação **esgota o tempo** (timeout), siga estes passos.

## 1. Liberar a porta 9002 no Firewall do Windows

O Windows pode estar bloqueando conexões de entrada na porta 9002.

- Clique com o botão direito em **`liberar-porta-9002-firewall.ps1`**
- Escolha **"Executar com PowerShell"** (e confirme **Executar como administrador** se pedir)
- Ou abra o **PowerShell como Administrador**, vá até a pasta do projeto e rode:
  ```powershell
  .\liberar-porta-9002-firewall.ps1
  ```

Depois disso, tente de novo no celular.

## 2. Usar HTTP (não HTTPS)

No navegador do celular use **exatamente**:

```text
http://192.168.15.4:9002
```

- Não use `https://` (a aplicação em dev não usa HTTPS).
- Substitua `192.168.15.4` pelo IP do seu PC na rede local (o script do firewall pode mostrar o IP; ou use `ipconfig` no PC e veja o endereço IPv4 da sua rede).

## 3. Primeira carga pode demorar

No modo de desenvolvimento, a **primeira** requisição ao abrir uma página pode levar 1–2 minutos (compilação no servidor). O celular pode dar timeout nesse tempo.

- Aguarde um pouco e **recarregue** a página.
- Ou, no PC, use o servidor com Turbopack (mais rápido):
  ```bash
  npm run dev:turbo
  ```
  Depois acesse de novo `http://SEU_IP:9002` no celular.

## 4. Celular e PC na mesma rede

- Celular e PC precisam estar na **mesma rede Wi‑Fi**.
- Se o roteador tiver **isolamento de cliente** ou **AP Isolation**, ele pode impedir o celular de falar com o PC; desative essa opção para teste ou use outro meio (ex.: PC como ponto de acesso).

## Resumo rápido

| Problema              | O que fazer                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| Timeout ao abrir no celular | 1) Rodar `liberar-porta-9002-firewall.ps1` como **Admin** 2) Usar `http://` 3) Primeira vez: aguardar ou usar `npm run dev:turbo` |
| “Conexão recusada”    | Verificar se no PC está rodando `npm run dev` (ou `npm run dev:turbo`)      |
| IP do PC              | No PC: `ipconfig` e ver o IPv4 da sua rede (ex.: 192.168.15.4)             |
