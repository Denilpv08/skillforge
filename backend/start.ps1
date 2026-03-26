# SkillForge — Backend starter
Write-Host "🚀 Iniciando SkillForge Backend..." -ForegroundColor Cyan

# Activar venv
$venvPath = "venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    . $venvPath
    Write-Host "✅ Entorno virtual activado" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró el venv. Ejecuta: python -m venv venv" -ForegroundColor Red
    exit 1
}

# Verificar .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ No se encontró .env. Copia .env.example y configúralo" -ForegroundColor Red
    exit 1
}

# Correr migraciones
Write-Host "📦 Aplicando migraciones..." -ForegroundColor Yellow
alembic upgrade head

# Iniciar servidor
Write-Host "🌐 Servidor en http://localhost:8000" -ForegroundColor Green
Write-Host "📚 Docs en http://localhost:8000/api/docs" -ForegroundColor Green
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000