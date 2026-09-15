param([switch]$SkipBuild)

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
function Assert-ProjectPath([string]$Candidate) {
    $fullPath = [IO.Path]::GetFullPath($Candidate)
    if ($fullPath -ne $projectRoot -and -not $fullPath.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'A package path resolves outside the project directory.'
    }
    # Check the item and its ancestors inside the explicitly selected workspace.
    # OneDrive may mark ancestors above the workspace as cloud reparse points.
    $itemPath = $fullPath
    while ($itemPath) {
        if (Test-Path -LiteralPath $itemPath) {
            $item = Get-Item -LiteralPath $itemPath -Force
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw 'Deployment packaging does not follow file or directory links.'
            }
        }
        if ($itemPath -eq $projectRoot) { break }
        $parentPath = [IO.Path]::GetDirectoryName($itemPath)
        if ($parentPath -eq $itemPath) { break }
        $itemPath = $parentPath
    }
}
Assert-ProjectPath $projectRoot
if (-not $SkipBuild) {
    Push-Location -LiteralPath $projectRoot
    try {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'The application build failed; no deployment package was created.' }
    } finally { Pop-Location }
}

# Package only application files. Customer PDFs, logs, credentials and local dependencies are excluded.
$requiredFiles = @('package.json', 'package-lock.json', 'startup.cjs', 'web.config', 'scripts/environment.ps1')
foreach ($relative in $requiredFiles + @('dist/server.js', 'dist/companion.js', 'public/index.html')) {
    Assert-ProjectPath (Join-Path $projectRoot $relative)
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $relative) -PathType Leaf)) {
        throw "Required application file is missing: $relative"
    }
}
$outputRoot = Join-Path $projectRoot 'output/deployment'
Assert-ProjectPath $outputRoot
[IO.Directory]::CreateDirectory($outputRoot) | Out-Null
$archivePath = Join-Path $outputRoot ('appraisal-desk-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8) + '.zip')
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($relative in $requiredFiles) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, (Join-Path $projectRoot $relative), $relative.Replace('\', '/'), [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
    foreach ($directory in @('dist', 'public')) {
        $folder = Join-Path $projectRoot $directory
        Assert-ProjectPath $folder
        foreach ($entry in Get-ChildItem -LiteralPath $folder -Recurse -Force) { Assert-ProjectPath $entry.FullName }
        foreach ($file in Get-ChildItem -LiteralPath $folder -File -Recurse) {
            if ($file.Extension -notin @('.js', '.map', '.html', '.css', '.svg', '.ico', '.woff', '.woff2')) { continue }
            $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relative, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
} finally { $archive.Dispose() }
Write-Output "Deployment package: $archivePath"
Write-Output 'Deploy with App Service build automation enabled so Azure installs production npm dependencies. See docs/azure-hosting.md.'
