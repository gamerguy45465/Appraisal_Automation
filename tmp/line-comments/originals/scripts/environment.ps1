param([ValidateSet('set', 'get')][string]$Operation)
$ErrorActionPreference = 'Stop'
# Node uses UTF-8 on both pipes; Windows PowerShell otherwise uses the console code page.
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
try {
    $requestData = [Console]::In.ReadToEnd() | ConvertFrom-Json
    $allowedNames = @('APPRAISAL_AI_API_KEY', 'APPRAISAL_LOAN_NUMBER', 'APPRAISAL_FHA_CASE_NUMBER', 'APPRAISAL_PAYMENT_METHOD', 'APPRAISAL_RUSH_ORDER')
    if ($requestData.name -notin $allowedNames) { throw 'Invalid environment variable' }
    if ($Operation -eq 'set') {
        [Environment]::SetEnvironmentVariable($requestData.name, [string]$requestData.value, 'Process')
    }
    # Output is captured privately by the worker, never forwarded to logs or model tools.
    $resultValue = [Environment]::GetEnvironmentVariable($requestData.name, 'Process')
    @{ value = $resultValue } | ConvertTo-Json -Compress
} catch {
    [Console]::Error.WriteLine('Environment operation failed.')
    exit 1
}
