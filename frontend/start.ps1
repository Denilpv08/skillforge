# SkillForge — Frontend starter
Write-Host "⚛️  Iniciando SkillForge Frontend..." -ForegroundColor Cyan

# Verificar .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  No se encontró .env.local. Creando desde ejemplo..." -ForegroundColor Yellow
    "NEXT_PUBLIC_API_URL=http://localhost:8000" | Out-File ".env.local"
}

# Instalar dependencias si no existen
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    pnpm install
}

Write-Host "🌐 Frontend en http://localhost:3000" -ForegroundColor Green
pnpm dev