param(
	[switch]$SkipInfra
)

Write-Host "🚀 Bootstrapping Puente dev stack" -ForegroundColor Cyan

if (-not $SkipInfra) {
	Write-Host "📦 Starting local databases (Postgres, Mongo, Redis)..." -ForegroundColor Yellow
	docker compose up -d postgres mongo redis
}

Write-Host "🔍 Verifying infra health..." -ForegroundColor Yellow
pnpm provision:data

Write-Host "🧱 Syncing Prisma schemas (auth + finance)..." -ForegroundColor Yellow
pnpm dev:db

Write-Host "🔥 Starting backend services with hot reload..." -ForegroundColor Green
pnpm dev:backend
