# Simple Build Script for Pinball Payday
Write-Host "==> Starting Build Process" -ForegroundColor Cyan

# 1. Web Build
Write-Host "==> Building web assets..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Web build failed" }

# 2. Capacitor Sync
Write-Host "==> Syncing with Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }

# 3. Gradle Build
Write-Host "==> Compiling AAB..." -ForegroundColor Yellow
cd android
./gradlew bundleRelease
if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }

Write-Host "`nDONE! Your AAB is ready at:" -ForegroundColor Green
Write-Host "android/app/build/outputs/bundle/release/app-release.aab" -ForegroundColor White
