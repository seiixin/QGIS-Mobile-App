$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\sidne\AppData\Local\Android\Sdk"
$env:PATH = $env:JAVA_HOME + "\bin;" + $env:ANDROID_HOME + "\platform-tools;" + $env:ANDROID_HOME + "\tools;" + $env:PATH

Write-Host "Building APK..."
Set-Location android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "BUILD SUCCESSFUL"
    Write-Host "APK: android/app/build/outputs/apk/release/app-release.apk"
} else {
    Write-Host "BUILD FAILED"
}
