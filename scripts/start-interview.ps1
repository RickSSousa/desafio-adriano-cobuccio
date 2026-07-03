# Roteiro rápido para subir o projeto no dia da entrevista
# Pré-requisito: Docker Desktop aberto e rodando

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Arquivo .env criado a partir de .env.example"
}

Write-Host "Verificando Docker..."
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERRO: Docker Desktop não está rodando. Abra o Docker Desktop e tente novamente." -ForegroundColor Red
  exit 1
}

Write-Host "Subindo aplicação com Docker Compose..."
docker compose up --build
