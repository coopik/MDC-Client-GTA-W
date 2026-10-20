param([string]$Compiler)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not $Compiler) {
    $compilerCommand = Get-Command ISCC.exe -ErrorAction SilentlyContinue
    if ($compilerCommand) { $Compiler = $compilerCommand.Source }
}

if (-not $Compiler) {
    $locations = @(${env:ProgramFiles(x86)}, $env:ProgramFiles, (Join-Path $env:LOCALAPPDATA 'Programs')) | Where-Object { $_ }
    foreach ($location in $locations) {
        foreach ($release in @('7', '6')) {
            $candidate = Join-Path $location "Inno Setup $release\ISCC.exe"
            if (Test-Path -LiteralPath $candidate -PathType Leaf) { $Compiler = $candidate; break }
        }
        if ($Compiler) { break }
    }
}

if (-not $Compiler -or -not (Test-Path -LiteralPath $Compiler -PathType Leaf)) {
    throw 'Inno Setup compiler not found. Install Inno Setup 6/7, or pass -Compiler with the full path to ISCC.exe.'
}

Push-Location -LiteralPath $projectRoot
try {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
    & npm.cmd run smoke
    if ($LASTEXITCODE -ne 0) { throw 'Smoke checks failed.' }
    & npm.cmd run verify
    if ($LASTEXITCODE -ne 0) { throw 'Electron UI checks failed.' }
    & npm.cmd run pack -- --win --x64
    if ($LASTEXITCODE -ne 0) { throw 'Application packaging failed.' }
    & $Compiler (Join-Path $projectRoot 'installer\mdc-client.iss')
    if ($LASTEXITCODE -ne 0) { throw 'Inno Setup compilation failed.' }
    $version = (Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json).version
    Write-Output (Join-Path $projectRoot "installer\Output\PatrolOne-Mobile-Client-Setup-$version.exe")
}
finally {
    Pop-Location
}
