param(
    [string]$OutputPath = ".\PlayBridge_next_chat_context.zip"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Get-Location).Path

if (
    -not (Test-Path ".\backend") -or
    -not (Test-Path ".\frontend")
) {
    throw "DebugNet 저장소 루트에서 실행해주세요. backend와 frontend 폴더를 찾지 못했습니다."
}

$tempRoot = Join-Path `
    ([System.IO.Path]::GetTempPath()) `
    ("PlayBridge-next-chat-" + [guid]::NewGuid().ToString("N"))

New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

$relativeFiles = @(
    ".gitignore",
    "backend\main.py",
    "backend\requirements.txt",
    "backend\app\core\security.py",
    "backend\app\core\supabase.py",
    "backend\app\schemas\clubs.py",
    "backend\app\schemas\club_events.py",
    "backend\app\repositories\club_repository.py",
    "backend\app\repositories\club_event_repository.py",
    "backend\app\services\club_service.py",
    "backend\app\services\club_event_service.py",
    "backend\app\routers\clubs.py",
    "backend\app\routers\club_events.py",
    "frontend\package.json",
    "frontend\src\main.jsx",
    "frontend\src\App.jsx",
    "frontend\src\App.css",
    "frontend\src\index.css",
    "frontend\src\api\apiClient.js",
    "frontend\src\api\clubApi.js",
    "frontend\src\layouts\ClubManageLayout.jsx",
    "frontend\src\layouts\ClubManageLayout.css",
    "frontend\src\components\BottomNav.jsx",
    "frontend\src\components\css\BottomNav.css",
    "frontend\src\pages\ClubDashboard\ClubDashboard.jsx",
    "frontend\src\pages\ClubDashboard\ClubDashboard.css",
    "frontend\src\pages\ClubCreate\ClubCreate.jsx",
    "frontend\src\pages\ClubCreate\BasicInfoStep.jsx",
    "frontend\src\pages\ClubCreate\IntroductionStep.jsx",
    "frontend\src\pages\ClubCreate\CompletionStep.jsx"
)

$missingFiles = New-Object System.Collections.Generic.List[string]

foreach ($relativeFile in $relativeFiles) {
    $sourcePath = Join-Path $repoRoot $relativeFile

    if (-not (Test-Path $sourcePath -PathType Leaf)) {
        $missingFiles.Add($relativeFile)
        continue
    }

    $destinationPath = Join-Path $tempRoot $relativeFile
    $destinationDirectory = Split-Path $destinationPath -Parent

    New-Item `
        -ItemType Directory `
        -Path $destinationDirectory `
        -Force | Out-Null

    Copy-Item $sourcePath $destinationPath
}

$migrationSource = Join-Path $repoRoot "supabase\migrations"

if (Test-Path $migrationSource -PathType Container) {
    $migrationDestination = Join-Path $tempRoot "supabase\migrations"
    New-Item `
        -ItemType Directory `
        -Path $migrationDestination `
        -Force | Out-Null

    Get-ChildItem $migrationSource -Filter "*.sql" -File |
        ForEach-Object {
            Copy-Item $_.FullName $migrationDestination
        }
} else {
    $missingFiles.Add("supabase\migrations\*.sql")
}

$metadataDirectory = Join-Path $tempRoot "handoff-metadata"
New-Item `
    -ItemType Directory `
    -Path $metadataDirectory `
    -Force | Out-Null

git status --short 2>&1 |
    Out-File `
        (Join-Path $metadataDirectory "git-status.txt") `
        -Encoding utf8

git log -5 --oneline --decorate 2>&1 |
    Out-File `
        (Join-Path $metadataDirectory "git-log.txt") `
        -Encoding utf8

if ($missingFiles.Count -gt 0) {
    $missingFiles |
        Out-File `
            (Join-Path $metadataDirectory "missing-files.txt") `
            -Encoding utf8
}

@"
이 ZIP은 새 채팅에 전달할 최소 소스 컨텍스트입니다.

- 생성 시각: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss K")
- 저장소 루트: $repoRoot
- 비밀 파일(.env 등), node_modules, dist, 가상환경은 포함하지 않았습니다.
- 파일이 없으면 handoff-metadata/missing-files.txt에 기록됩니다.
- 이 ZIP과 함께 인수인계 문서 및 운영진 동호회 UX 플로우 ZIP을 첨부해주세요.
"@ |
    Out-File `
        (Join-Path $metadataDirectory "README.txt") `
        -Encoding utf8

$resolvedOutputPath = [System.IO.Path]::GetFullPath(
    (Join-Path $repoRoot $OutputPath)
)

if (Test-Path $resolvedOutputPath -PathType Leaf) {
    Remove-Item $resolvedOutputPath -Force
}

try {
    Compress-Archive `
        -Path (Join-Path $tempRoot "*") `
        -DestinationPath $resolvedOutputPath `
        -CompressionLevel Optimal
} finally {
    if (
        (Test-Path $tempRoot -PathType Container) -and
        $tempRoot.StartsWith(
            [System.IO.Path]::GetTempPath(),
            [System.StringComparison]::OrdinalIgnoreCase
        )
    ) {
        Remove-Item $tempRoot -Recurse -Force
    }
}

Write-Host "생성 완료: $resolvedOutputPath"
Write-Host "새 채팅에 이 ZIP, 인수인계 문서, UX 플로우 ZIP을 첨부해주세요."
