$originalPath = Join-Path $PSScriptRoot 'originals/scripts/environment.ps1'
$currentPath = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) 'scripts/environment.ps1'
function Get-SyntaxDescription([string]$Path) {
    $parseTokens = $null
    $parseErrors = $null
    $syntaxTree = [System.Management.Automation.Language.Parser]::ParseFile($Path, [ref]$parseTokens, [ref]$parseErrors)
    if ($parseErrors.Count -gt 0) { throw "PowerShell parse failed: $Path" }
    $significant = @($parseTokens | Where-Object { $_.Kind -notin @('Comment', 'NewLine', 'EndOfInput') } | ForEach-Object { [pscustomobject]@{Kind=$_.Kind.ToString();Text=$_.Text} })
    $nodes = @($syntaxTree.FindAll({param($node) $true}, $true) | ForEach-Object { $_.GetType().FullName })
    return ([pscustomobject]@{Tokens=$significant;Nodes=$nodes} | ConvertTo-Json -Depth 8 -Compress)
}
if ((Get-SyntaxDescription $originalPath) -cne (Get-SyntaxDescription $currentPath)) { throw 'PowerShell syntax changed.' }
Write-Output 'PowerShell significant tokens and AST node sequence are unchanged.'
