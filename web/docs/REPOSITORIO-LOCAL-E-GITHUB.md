# Repositório local (`E:\AmbientaR`) e GitHub

Este documento fixa a **cópia de trabalho canónica** no Windows e o fluxo para manter **GitHub** alinhado com o que está em disco.

## Onde clonar e trabalhar

- **Pasta local recomendada:** `E:\AmbientaR` (mesmo caminho em todos os PCs da equipa evita scripts, regras Cursor e documentação desencontrados).
- O **GitHub** guarda o mesmo código e a pasta `docs/`; não há segunda “fonte” de verdade além do remoto e desta cópia local.

## Manter o remoto atualizado (enviar alterações)

Na raiz do projeto:

```powershell
cd E:\AmbientaR
git status
git add -A
git commit -m "Descrição clara do que mudou."
git push origin HEAD
```

Use o ramo que a equipa adotar (`main`, `master`, etc.). Antes do primeiro push num clone novo: `git remote -v` e `git branch -u origin/<ramo>` se necessário.

## Trazer o que está no GitHub para o E:

```powershell
cd E:\AmbientaR
git pull --rebase origin <ramo>
```

Resolve conflitos no editor, `git add` nos ficheiros corrigidos e `git rebase --continue` (se estiver em rebase).

## Git: “dubious ownership”

Se o Git recusar operações por permissão/dono do diretório, adicione o caminho real da cópia:

```powershell
git config --global --add safe.directory E:/AmbientaR
```

Se a pasta estiver noutra unidade (ex.: `G:\AmbientaR`), use esse caminho em vez de `E:`.

## Regras Firestore (uma única fonte)

- **Ficheiro usado no deploy:** `src/firebase/rules/firestore.rules` (definido em `firebase.json`).
- **Não existem** ficheiros espelho em `src/firestore.rules` nem `firestore.rules` na raiz — evitam divergência entre o que está no GitHub e o que se publica com `npm run deploy:rules`.

## Firebase e GitHub

- O **Firebase** não clona o repositório: só recebe o que publicas (regras, hosting, etc.).
- Para alingar **App Hosting** ou CI ao GitHub, configura o projeto no console Firebase / GitHub Actions com o mesmo ramo que usas em `E:\AmbientaR`.
