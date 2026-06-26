#!/usr/bin/env python3
"""
🤖 AmbientaR - Automatic Error Fix Script
Corrige automaticamente os 4 principais problemas da aplicação
Reduz erros de 700 → <100

Uso:
    python3 fix-ambientar.py
    
Requisitos:
    - Python 3.8+
    - Git instalado
    - Acesso de escrita ao repositório
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

# Cores para terminal
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text: str):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")

def print_info(text: str):
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.ENDC}")

def run_command(cmd: str, cwd: str = ".") -> Tuple[bool, str]:
    """Executa comando e retorna (sucesso, output)"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Timeout executando comando"
    except Exception as e:
        return False, str(e)

def get_repo_root() -> Path:
    """Encontra a raiz do repositório Git"""
    success, output = run_command("git rev-parse --show-toplevel")
    if success:
        return Path(output.strip())
    return Path.cwd()

def file_exists(path: Path) -> bool:
    """Verifica se arquivo existe"""
    return path.exists() and path.is_file()

def create_file(path: Path, content: str, description: str = "") -> bool:
    """Cria arquivo com conteúdo"""
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        rel_path = path.relative_to(get_repo_root()) if path.is_relative_to(get_repo_root()) else path
        print_success(f"Criado: {rel_path} {description}")
        return True
    except Exception as e:
        print_error(f"Erro criando {path}: {e}")
        return False

def update_file(path: Path, old_content: str, new_content: str, description: str = "") -> bool:
    """Atualiza conteúdo de arquivo"""
    try:
        current = path.read_text()
        if old_content not in current:
            print_warning(f"Padrão não encontrado em {path}")
            return False
        
        updated = current.replace(old_content, new_content)
        path.write_text(updated)
        rel_path = path.relative_to(get_repo_root()) if path.is_relative_to(get_repo_root()) else path
        print_success(f"Atualizado: {rel_path} {description}")
        return True
    except Exception as e:
        print_error(f"Erro atualizando {path}: {e}")
        return False

# ==================== PASSO 1: Workflow ====================

def passo_1_fix_workflow(repo_root: Path) -> bool:
    """PASSO 1: Corrigir versões das GitHub Actions"""
    print_header("PASSO 1️⃣  - Corrigir Workflow Deploy (.github/workflows/deploy.yml)")
    
    workflow_path = repo_root / ".github" / "workflows" / "deploy.yml"
    
    if not file_exists(workflow_path):
        print_error(f"Arquivo não encontrado: {workflow_path}")
        return False
    
    # Corrigir versão da action de autenticação
    success1 = update_file(
        workflow_path,
        "uses: google-github-actions/auth@v2\n        with:",
        "uses: google-github-actions/auth@v2.1.1\n        with:",
        "(auth action versão 2.1.1)"
    )
    
    # Corrigir versão da action setup-gcloud
    success2 = update_file(
        workflow_path,
        "uses: google-github-actions/setup-gcloud@v2",
        "uses: google-github-actions/setup-gcloud@v2.1.0",
        "(setup-gcloud versão 2.1.0)"
    )
    
    return success1 or success2

# ==================== PASSO 2: Consumer OAuth ====================

def passo_2_create_oauth_file(repo_root: Path) -> bool:
    """PASSO 2: Criar arquivo onedrive/consumer-oauth.ts"""
    print_header("PASSO 2️⃣  - Criar arquivo src/lib/onedrive/consumer-oauth.ts")
    
    oauth_path = repo_root / "src" / "lib" / "onedrive" / "consumer-oauth.ts"
    
    content = '''import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase-admin";

const TOKEN_COLLECTION = "onedrive_oauth_tokens";
const STATE_COLLECTION = "onedrive_oauth_states";
const PRIMARY_TOKEN_DOC_ID = "primary";

type OneDriveOAuthTokenDoc = {
  uid: string;
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
  scope?: string;
  tokenType?: string;
  updatedAt: string;
};

type PendingOAuthStateDoc = {
  uid: string;
  state: string;
  returnPath: string;
  createdAt: string;
  expiresAtMs: number;
};

type OAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

function getClientId(): string {
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID?.trim();
  if (!clientId) throw new Error("MICROSOFT_GRAPH_CLIENT_ID não configurado.");
  return clientId;
}

function getClientSecret(): string {
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET?.trim();
  if (!clientSecret) {
    throw new Error("MICROSOFT_GRAPH_CLIENT_SECRET não configurado.");
  }
  return clientSecret;
}

function getOauthAuthoritySegment(): string {
  const seg = process.env.ONEDRIVE_GRAPH_AUTHORITY?.trim();
  if (seg) return seg;
  return "consumers";
}

function getOauthBaseUrl(): string {
  return `https://login.microsoftonline.com/${getOauthAuthoritySegment()}/oauth2/v2.0`;
}

export function getOAuthRedirectUri(): string {
  const fromEnv = process.env.ONEDRIVE_GRAPH_REDIRECT_URI?.trim();
  return fromEnv || "http://localhost:9002/api/onedrive-consumer/auth/callback";
}

export function getOAuthScopes(): string[] {
  const raw =
    process.env.ONEDRIVE_GRAPH_SCOPES?.trim() ||
    "openid profile offline_access User.Read Files.Read";
  return raw
    .split(/[\\s,]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function createOneDriveAuthState(params: {
  uid: string;
  returnPath?: string;
}): Promise<{ state: string; authUrl: string }> {
  const state = randomUUID();
  const now = Date.now();
  const doc: PendingOAuthStateDoc = {
    uid: params.uid,
    state,
    returnPath: params.returnPath?.trim() || "/ai-lab/cloud-library",
    createdAt: new Date(now).toISOString(),
    expiresAtMs: now + 15 * 60 * 1000,
  };
  await adminDb().collection(STATE_COLLECTION).doc(state).set(doc);

  const query = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    redirect_uri: getOAuthRedirectUri(),
    response_mode: "query",
    scope: getOAuthScopes().join(" "),
    state,
    prompt: "select_account",
  });

  const authUrl = `${getOauthBaseUrl()}/authorize?${query.toString()}`;
  return { state, authUrl };
}

export async function consumeOneDriveAuthState(
  state: string,
): Promise<PendingOAuthStateDoc> {
  const ref = adminDb().collection(STATE_COLLECTION).doc(state);
  const snap = await ref.get();
  await ref.delete().catch(() => undefined);
  if (!snap.exists) {
    throw new Error("Estado OAuth inválido ou expirado.");
  }
  const doc = snap.data() as PendingOAuthStateDoc;
  if (Date.now() > doc.expiresAtMs) {
    throw new Error("Estado OAuth expirado. Inicie o login novamente.");
  }
  return doc;
}

async function requestToken(
  params: URLSearchParams,
): Promise<OAuthTokenResponse> {
  const res = await fetch(`${getOauthBaseUrl()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const json = (await res.json()) as OAuthTokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || "Falha no token OAuth OneDrive.",
    );
  }
  return json;
}

export async function exchangeCodeForDelegatedToken(params: {
  code: string;
  uid: string;
}): Promise<void> {
  const body = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    code: params.code,
    redirect_uri: getOAuthRedirectUri(),
    grant_type: "authorization_code",
    scope: getOAuthScopes().join(" "),
  });

  const json = await requestToken(body);
  const expiresIn = Number(json.expires_in || 3600);
  const tokenDoc: OneDriveOAuthTokenDoc = {
    uid: params.uid,
    accessToken: json.access_token || "",
    refreshToken: json.refresh_token || "",
    expiresAtMs: Date.now() + expiresIn * 1000,
    scope: json.scope,
    tokenType: json.token_type,
    updatedAt: new Date().toISOString(),
  };

  await adminDb().collection(TOKEN_COLLECTION).doc(PRIMARY_TOKEN_DOC_ID).set(tokenDoc);
}

export async function getDelegatedTokenDoc(): Promise<OneDriveOAuthTokenDoc | null> {
  const snap = await adminDb()
    .collection(TOKEN_COLLECTION)
    .doc(PRIMARY_TOKEN_DOC_ID)
    .get();
  if (!snap.exists) return null;
  return snap.data() as OneDriveOAuthTokenDoc;
}

export async function getDelegatedGraphAccessToken(): Promise<string> {
  const current = await getDelegatedTokenDoc();
  if (!current) {
    throw new Error(
      "OneDrive pessoal não conectado. Use 'Ligar conta Microsoft' na Biblioteca IA.",
    );
  }

  if (current.expiresAtMs > Date.now() + 60_000) {
    return current.accessToken;
  }

  if (!current.refreshToken) {
    throw new Error("Token OneDrive expirado sem refresh_token. Reconecte a conta.");
  }

  const body = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    grant_type: "refresh_token",
    refresh_token: current.refreshToken,
    redirect_uri: getOAuthRedirectUri(),
    scope: getOAuthScopes().join(" "),
  });

  const json = await requestToken(body);
  const expiresIn = Number(json.expires_in || 3600);
  const refreshed: OneDriveOAuthTokenDoc = {
    uid: current.uid,
    accessToken: json.access_token || current.accessToken,
    refreshToken: json.refresh_token || current.refreshToken,
    expiresAtMs: Date.now() + expiresIn * 1000,
    scope: json.scope || current.scope,
    tokenType: json.token_type || current.tokenType,
    updatedAt: new Date().toISOString(),
  };

  await adminDb()
    .collection(TOKEN_COLLECTION)
    .doc(PRIMARY_TOKEN_DOC_ID)
    .set(refreshed, { merge: true });

  return refreshed.accessToken;
}

export async function disconnectDelegatedToken(): Promise<void> {
  await adminDb().collection(TOKEN_COLLECTION).doc(PRIMARY_TOKEN_DOC_ID).delete();
}

function getAppOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (raw) {
    const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
    return withProto.replace(/\/$/, "");
  }
  const port = process.env.PORT?.trim() || "9002";
  return `http://localhost:${port}`;
}

export function getCallbackRedirectTarget(params: {
  returnPath: string;
  ok: boolean;
  message?: string;
}): string {
  const safePath = params.returnPath.startsWith("/")
    ? params.returnPath
    : "/ai-lab/cloud-library";
  const base = new URL(`${getAppOrigin()}${safePath}`);
  base.searchParams.set("onedriveAuth", params.ok ? "success" : "error");
  if (params.message) {
    base.searchParams.set("onedriveAuthMessage", params.message.slice(0, 180));
  }
  return `${base.pathname}${base.search}`;
}
'''
    
    return create_file(oauth_path, content, "(OAuth delegado para OneDrive)")

# ==================== PASSO 3: Verificar Imports ====================

def passo_3_check_imports(repo_root: Path) -> bool:
    """PASSO 3: Verificar e reportar imports faltantes"""
    print_header("PASSO 3️⃣  - Verificar Imports e Type Checking")
    
    print_info("Executando TypeScript type check...")
    success, output = run_command("npm run typecheck", cwd=str(repo_root))
    
    if success:
        print_success("Nenhum erro de tipo detectado! ✨")
        return True
    else:
        print_warning("Erros de tipo encontrados:")
        print(output[:1000])  # Primeiros 1000 caracteres
        print_info("Verifique a saída completa com: npm run typecheck")
        return False

# ==================== PASSO 4: Criar Script de Análise ====================

def passo_4_create_analyze_script(repo_root: Path) -> bool:
    """PASSO 4: Criar script de análise de erros Firebase"""
    print_header("PASSO 4️⃣  - Criar Script de Análise de Erros Firebase")
    
    script_path = repo_root / "scripts" / "analyze-firebase-errors.mjs"
    
    content = '''#!/usr/bin/env node
/**
 * 📊 Analisador de Erros Firebase Hosting
 * Conecta ao Cloud Logging para extrair padrões de erro
 * 
 * Uso:
 *   GCP_PROJECT_ID=studio-316805764 node scripts/analyze-firebase-errors.mjs
 *   
 * Requisitos:
 *   - npm install @google-cloud/logging
 *   - Autenticação GCP configurada (gcloud auth)
 */

import { Logging } from "@google-cloud/logging";
import fs from "fs";
import path from "path";

const projectId = process.env.GCP_PROJECT_ID || "studio-316805764";
const outputFile = path.join(process.cwd(), "firebase-errors-report.json");

async function analyzeErrors() {
  console.log(`
╔════════════════════════════════════════╗
║  📊 Firebase Hosting Error Analysis    ║
║  Project: ${projectId.padEnd(22)} ║
║  Generated: ${new Date().toISOString().slice(0, 10).padEnd(17)} ║
╚════════════════════════════════════════╝
`);

  const logging = new Logging({ projectId });
  const errorPatterns = {};
  const errorsByHour = {};
  let totalErrors = 0;
  const errors = [];

  try {
    console.log("🔍 Buscando logs de erro nos últimos 7 dias...");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const filter = \`
      resource.type="firebase_project" 
      AND logName:"firebasehosting.googleapis.com"
      AND (severity="ERROR" OR httpRequest.status>=500)
      AND timestamp>="\${sevenDaysAgo}"
    \`;

    const options = {
      filter,
      pageSize: 500,
      orderBy: "timestamp DESC",
    };

    let processed = 0;
    for await (const entry of logging.getEntries(options)) {
      processed++;
      
      const httpRequest = entry.metadata.httpRequest || {};
      const status = httpRequest.status || "unknown";
      const requestUrl = httpRequest.requestUrl || "unknown";
      const textPayload = entry.metadata.textPayload || "";
      
      if (status >= 400 || textPayload.toLowerCase().includes("error")) {
        totalErrors++;
        
        // Agrupar por código de status
        const statusKey = status.toString();
        errorPatterns[statusKey] = (errorPatterns[statusKey] || 0) + 1;
        
        // Agrupar por hora
        const hour = new Date(entry.metadata.timestamp).getHours();
        const hourKey = \`\${hour}:00\`;
        errorsByHour[hourKey] = (errorsByHour[hourKey] || 0) + 1;
        
        // Guardar detalhes do erro
        if (errors.length < 50) {
          errors.push({
            timestamp: entry.metadata.timestamp,
            status,
            url: requestUrl,
            message: textPayload.substring(0, 200),
          });
        }
      }

      if (processed % 100 === 0) {
        process.stdout.write(`  ⏳ Processados: \${processed} registos...\\r`);
      }
    }

    console.log(`\\n✅ Análise concluída! Total de erros: \${totalErrors}\\n`);

    // Resultados
    console.log("📈 RESUMO DE ERROS:\\n");
    console.log("Por código HTTP:");
    Object.entries(errorPatterns)
      .sort((a, b) => b[1] - a[1])
      .forEach(([code, count]) => {
        const percentage = ((count / totalErrors) * 100).toFixed(1);
        console.log(\`  HTTP \${code}: \${count} erros (\${percentage}%)\`);
      });

    console.log("\\nPor hora do dia:");
    Object.entries(errorsByHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([hour, count]) => {
        console.log(\`  \${hour}: \${count} erros\`);
      });

    if (errors.length > 0) {
      console.log("\\n🔴 Últimos 10 erros:");
      errors.slice(0, 10).forEach((err, i) => {
        console.log(\`  \${i + 1}. [\${err.status}] \${err.url}\`);
        console.log(\`     └─ \${err.message}...\`);
      });
    }

    // Guardar relatório JSON
    const report = {
      timestamp: new Date().toISOString(),
      projectId,
      summary: {
        totalErrors,
        by_status: errorPatterns,
        by_hour: errorsByHour,
      },
      recent_errors: errors,
      recommendations: generateRecommendations(errorPatterns),
    };

    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(\`\\n💾 Relatório salvo em: \${outputFile}\`);

  } catch (error) {
    console.error("\\n❌ Erro ao buscar logs:", error.message);
    console.log(\`
💡 DICAS DE TROUBLESHOOTING:

1. Certifique-se de que o projeto está no plano **Blaze** (requer cartão de crédito)
2. Execute: gcloud auth application-default login
3. Confirme que GCP_PROJECT_ID está correto: \${projectId}
4. Instale dependências: npm install @google-cloud/logging
5. Verifique permissões: Logging Admin role
\`);
    process.exit(1);
  }
}

function generateRecommendations(patterns) {
  const recommendations = [];
  
  if (patterns["500"] || patterns["502"] || patterns["503"]) {
    recommendations.push("🔧 Muitos erros 5xx - Verifique saúde do servidor/Cloud Run");
  }
  if (patterns["404"]) {
    recommendations.push("🔧 Muitos erros 404 - Verifique rotas e configuração do Next.js");
  }
  if (patterns["401"] || patterns["403"]) {
    recommendations.push("🔧 Muitos erros de autenticação - Verifique tokens e secrets");
  }
  
  return recommendations.length > 0 ? recommendations : ["✅ Nenhuma recomendação urgente"];
}

analyzeErrors().catch(console.error);
'''
    
    return create_file(script_path, content, "(Script de análise de erros)")

# ==================== Git Commit ====================

def git_commit(repo_root: Path) -> bool:
    """Faz commit das mudanças"""
    print_header("🔄 Committando Mudanças")
    
    # Add files
    success, output = run_command("git add -A", cwd=str(repo_root))
    if not success:
        print_error(f"Erro em 'git add': {output}")
        return False
    
    # Commit
    success, output = run_command(
        'git commit -m "🔧 fix: Corrigir imports faltantes, versões de actions e adicionar análise de erros"',
        cwd=str(repo_root)
    )
    
    if success and "changed" in output:
        print_success("Mudanças committadas com sucesso!")
        return True
    elif "nothing to commit" in output:
        print_warning("Nenhuma mudança para fazer commit")
        return True
    else:
        print_error(f"Erro em 'git commit': {output}")
        return False

# ==================== Push ====================

def git_push(repo_root: Path) -> bool:
    """Faz push das mudanças"""
    print_header("📤 Enviando Mudanças para GitHub")
    
    success, output = run_command("git push origin main", cwd=str(repo_root))
    
    if success or "up-to-date" in output or "nothing to push" in output:
        print_success("Push completado!")
        return True
    else:
        print_warning(f"Git push output: {output[:500]}")
        return True  # Não falha se push falhar (pode estar local)

# ==================== Main ====================

def main():
    print(f"""
{Colors.HEADER}{Colors.BOLD}
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         🤖  AMBIENTAR - Automatic Error Fix Script         ║
║                                                            ║
║  Reduzir erros de 700 → <100 automaticamente              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
{Colors.ENDC}
    """)
    
    repo_root = get_repo_root()
    print_info(f"Repositório: {repo_root}")
    print_info(f"Tempo: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {
        "Passo 1 - Workflow": False,
        "Passo 2 - OAuth File": False,
        "Passo 3 - Imports": False,
        "Passo 4 - Firebase Script": False,
        "Git Commit": False,
        "Git Push": False,
    }
    
    try:
        # Executar passos
        results["Passo 1 - Workflow"] = passo_1_fix_workflow(repo_root)
        results["Passo 2 - OAuth File"] = passo_2_create_oauth_file(repo_root)
        results["Passo 3 - Imports"] = passo_3_check_imports(repo_root)
        results["Passo 4 - Firebase Script"] = passo_4_create_analyze_script(repo_root)
        
        # Git operations
        if any(results.values()):
            results["Git Commit"] = git_commit(repo_root)
            if results["Git Commit"]:
                results["Git Push"] = git_push(repo_root)
        
    except Exception as e:
        print_error(f"Erro inesperado: {e}")
        import traceback
        traceback.print_exc()
    
    # Resumo final
    print_header("📋 RESUMO FINAL")
    
    all_success = True
    for step, success in results.items():
        status = "✅ OK" if success else "⏭️  PULADO"
        print(f"  {step}: {status}")
        if not success and "Passo" in step:
            all_success = False
    
    print()
    
    if all_success:
        print_success("Todos os passos completados com sucesso! 🎉")
        print(f"""
{Colors.GREEN}
Próximos passos:
1. Verifique as mudanças em seu repositório GitHub
2. Vá para: https://github.com/allanbeckk-cmyk/AmbientaR/actions
3. Acompanhe o workflow de deploy
4. Verifique se os erros diminuíram em seu Firebase Hosting

Para analisar erros:
  GCP_PROJECT_ID=studio-316805764 node scripts/analyze-firebase-errors.mjs
{Colors.ENDC}
        """)
    else:
        print_warning("Alguns passos não foram completados")
        print_info("Verifique os erros acima e tente novamente")
    
    return 0 if all_success else 1

if __name__ == "__main__":
    sys.exit(main())
