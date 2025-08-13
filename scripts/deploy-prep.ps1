# Vercel Deployment Preparation Script (PowerShell)

Write-Host "🚀 Preparing for Vercel deployment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project root confirmed" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Run build
Write-Host "🏗️  Building project..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Project is ready for Vercel deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push your changes to GitHub" -ForegroundColor White
Write-Host "2. Ensure environment variables are set in Vercel dashboard:" -ForegroundColor White
Write-Host "   - DATABASE_URL (your Neon production database)" -ForegroundColor Gray
Write-Host "   - JWT_SECRET (32+ character secret)" -ForegroundColor Gray
Write-Host "   - NEXT_PUBLIC_APP_URL (your Vercel app URL)" -ForegroundColor Gray
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "3. Deploy via Vercel dashboard or CLI" -ForegroundColor White
Write-Host "4. Run database migration on production" -ForegroundColor White
Write-Host "5. Seed questions using the provided script" -ForegroundColor White
