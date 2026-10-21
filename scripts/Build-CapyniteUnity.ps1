# Reproducible local proof: Unity editor + tests + WebGL + structural verification.
# Does not deploy or modify production.
param(
  [Parameter(Mandatory = $true)][string]$UnityExe,
  [string]$ProjectPath = (Join-Path $PSScriptRoot "../unity/Capynite")
)
$ErrorActionPreference = "Stop"
$ProjectPath = [System.IO.Path]::GetFullPath($ProjectPath)
$Root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$ResultsDir = Join-Path $Root "unity-test-results"
New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null

if (-not (Test-Path -LiteralPath $UnityExe -PathType Leaf)) { throw "Unity Editor not found: $UnityExe" }
if (-not (Test-Path (Join-Path $ProjectPath "ProjectSettings/ProjectVersion.txt"))) {
  throw "Unity project not initialized: ProjectVersion.txt missing. Create/open it in Unity Hub first."
}
$EditorArgs = @("-batchmode", "-nographics", "-quit", "-projectPath", $ProjectPath)

Write-Host "1/3 EditMode tests (must be GREEN)"
$ResultsXml = Join-Path $ResultsDir "editmode.xml"
& $UnityExe @EditorArgs "-runTests" "-testPlatform" "EditMode" "-testResults" $ResultsXml "-logFile" (Join-Path $ResultsDir "editmode.log")
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $ResultsXml)) { throw "Unity EditMode tests failed or results XML absent" }
[xml]$Results = Get-Content -LiteralPath $ResultsXml -Raw
$TestRun = $Results.SelectSingleNode("/test-run")
if ($null -eq $TestRun) { throw "Invalid Unity TestRunner XML" }
if ([int]$TestRun.GetAttribute("failed") -gt 0 -or [int]$TestRun.GetAttribute("passed") -lt 4) {
  throw "Unity EditMode suite not GREEN (4 core tests required)"
}

Write-Host "2/3 Build Unity WebGL"
& $UnityExe @EditorArgs "-buildTarget" "WebGL" "-executeMethod" "CapyniteCardBattleBuild.Build" "-logFile" (Join-Path $ResultsDir "webgl.log")
if ($LASTEXITCODE -ne 0) { throw "Unity WebGL build returned nonzero" }

Write-Host "3/3 Verify actual WebGL artifacts"
$Output = Join-Path $ProjectPath "Builds/CardBattleWebGL"
& node (Join-Path $Root "scripts/verify-capynite-webgl.mjs") $Output
if ($LASTEXITCODE -ne 0) { throw "WebGL output validation failed" }
Write-Host "Unity EditMode + WebGL STRUCTURAL gates passed. Browser smoke, asset approval and production gates remain separate."
