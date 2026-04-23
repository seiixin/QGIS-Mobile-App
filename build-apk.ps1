$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\sidne\AppData\Local\Android\Sdk"
$env:PATH = $env:JAVA_HOME + "\bin;" + $env:ANDROID_HOME + "\platform-tools;" + $env:ANDROID_HOME + "\tools;" + $env:PATH
$env:CI = "1"

Write-Host "Running expo prebuild..."
npx expo prebuild --platform android --clean --no-install

# Patch AndroidManifest: largeHeap
$manifest = "android\app\src\main\AndroidManifest.xml"
$content = Get-Content $manifest -Raw
if ($content -notmatch 'largeHeap="true"') {
    $content = $content -replace 'android:enableOnBackInvokedCallback="false"', 'android:enableOnBackInvokedCallback="false" android:largeHeap="true"'
    Set-Content $manifest $content -Encoding UTF8
    Write-Host "largeHeap=true applied"
}

# Patch gradle.properties: disable edgeToEdge + newArch
$gp = "android\gradle.properties"
$gc = Get-Content $gp -Raw
$gc = $gc -replace 'newArchEnabled=true',       'newArchEnabled=false'
$gc = $gc -replace 'edgeToEdgeEnabled=true',    'edgeToEdgeEnabled=false'
$gc = $gc -replace 'expo\.edgeToEdgeEnabled=true', 'expo.edgeToEdgeEnabled=false'
Set-Content $gp $gc -Encoding UTF8
Write-Host "gradle.properties patched"

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
