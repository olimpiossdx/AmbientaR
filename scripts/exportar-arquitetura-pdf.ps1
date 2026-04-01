Param(
    [string]$InputPath = "docs/ARQUITETURA_ATUAL.md",
    [string]$OutputPath = "docs/ARQUITETURA_ATUAL.pdf"
)

Write-Host "=== Exportando arquitetura para PDF ===" -ForegroundColor Cyan
Write-Host "Markdown de entrada: $InputPath"
Write-Host "PDF de saída:       $OutputPath"

if (-not (Test-Path $InputPath)) {
    Write-Error "Arquivo de entrada não encontrado: $InputPath"
    exit 1
}

try {
    Write-Host "Instalando/atualizando markdown-pdf (via npx)..." -ForegroundColor Yellow
    npx --yes markdown-pdf $InputPath -o $OutputPath
    if (Test-Path $OutputPath) {
        Write-Host "PDF gerado com sucesso em: $OutputPath" -ForegroundColor Green
    } else {
        Write-Error "markdown-pdf terminou sem erro, mas o arquivo $OutputPath não foi encontrado."
        exit 1
    }
} catch {
    Write-Error "Falha ao gerar PDF: $_"
    exit 1
}

