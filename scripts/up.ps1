Write-Host "🚀 Starting Puente Platform Ecosystem..." -ForegroundColor Cyan
docker-compose up -d --build
Write-Host "✅ Ecosystem is up and running!" -ForegroundColor Green
Write-Host "🌍 Frontend: http://localhost:8080" -ForegroundColor Green
Write-Host "🔌 API Gateway: http://localhost:3000" -ForegroundColor Green
