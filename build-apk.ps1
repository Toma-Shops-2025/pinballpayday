# Pinball Payday - Build Debug APK for Testing
# Usage: .\build-apk.ps1

$ProjectPath = "$env:USERPROFILE\Desktop\pinball-payday"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Switching to project: $ProjectPath"
Set-Location $ProjectPath

Step "npm install"
npm install

Step "Building web app..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "Web build failed" }

Step "Syncing with Android..."
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }

Step "Compiling Debug APK..."
Set-Location "$ProjectPath\android"
& .\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }

$apk = "$ProjectPath\android\app\build\outputs\apk/debug/app-debug.apk"
Set-Location $ProjectPath

if (Test-Path $apk) {
    Write-Host "`n  SUCCESS" -ForegroundColor Green
    Write-Host "  Debug APK: $apk" -ForegroundColor Green
    Write-Host "  You can now transfer this file to your phone and install it.`n"
    Start-Process explorer.exe "/select,`"$apk`""
} else {
    Write-Host "`n  Build FAILED. Could not find APK." -ForegroundColor Red
}
