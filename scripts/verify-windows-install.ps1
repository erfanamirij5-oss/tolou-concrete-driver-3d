$ErrorActionPreference = 'Stop'

$distDir = Join-Path $PSScriptRoot '..\dist'
$distDir = [System.IO.Path]::GetFullPath($distDir)
$installDir = Join-Path $env:RUNNER_TEMP 'tolou-concrete-driver-rc-install'

Write-Host "[rc-install] dist: $distDir"
Write-Host "[rc-install] install target: $installDir"

$installer = Get-ChildItem -Path $distDir -Filter 'TolouConcreteDriver-Setup-*.exe' -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $installer) {
  throw 'NSIS installer not found in dist.'
}

if ($installer.Length -lt 1MB) {
  throw "Installer is unexpectedly small: $($installer.Length) bytes"
}

if (Test-Path $installDir) {
  Remove-Item -Path $installDir -Recurse -Force
}

Write-Host "[rc-install] installing $($installer.Name)"
$install = Start-Process -FilePath $installer.FullName -ArgumentList '/S', "/D=$installDir" -Wait -PassThru
if ($install.ExitCode -ne 0) {
  throw "Installer exited with code $($install.ExitCode)"
}

$appExe = Get-ChildItem -Path $installDir -Filter 'Tolou Concrete Driver 3D.exe' -File -Recurse |
  Select-Object -First 1
if (-not $appExe) {
  throw 'Installed application executable not found.'
}

$appAsar = Get-ChildItem -Path $installDir -Filter 'app.asar' -File -Recurse |
  Select-Object -First 1
if (-not $appAsar) {
  throw 'Installed app.asar not found.'
}

Write-Host "[rc-install] launching installed executable in renderer smoke mode"
$smoke = Start-Process -FilePath $appExe.FullName -ArgumentList '--tolou-smoke-test' -PassThru
if (-not $smoke.WaitForExit(30000)) {
  Stop-Process -Id $smoke.Id -Force -ErrorAction SilentlyContinue
  throw 'Installed application smoke mode timed out.'
}
if ($smoke.ExitCode -ne 0) {
  throw "Installed application smoke mode exited with code $($smoke.ExitCode)"
}

$uninstaller = Get-ChildItem -Path $installDir -Filter 'Uninstall*.exe' -File -Recurse |
  Select-Object -First 1
if (-not $uninstaller) {
  throw 'NSIS uninstaller not found after installation.'
}

Write-Host '[rc-install] uninstalling smoke-test installation'
$uninstall = Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -Wait -PassThru
if ($uninstall.ExitCode -ne 0) {
  throw "Uninstaller exited with code $($uninstall.ExitCode)"
}

Write-Host '[rc-install] PASS: installer, installed files, renderer boot, and uninstall validated.'
