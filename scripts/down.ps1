Write-Host "🛑 Stopping Puente dev infrastructure..." -ForegroundColor Yellow
docker compose down
Write-Host "✅ Containers stopped. Remember to close pnpm dev processes manually (Ctrl+C)." -ForegroundColor Green
