# [L1] Accepts a string operation parameter constrained to set or get.
param([ValidateSet('set', 'get')][string]$Operation)
# [L2] Makes PowerShell errors terminate the current operation so the catch block can handle failures.
$ErrorActionPreference = 'Stop'
# Node supplies pipes, and App Service does not guarantee an attached console.
# Encode the streams directly; Console encoding setters require a valid console handle.
$inputReader = $null
$outputWriter = $null
$errorWriter = $null
# [L6] Begins guarded handling of the requested environment-variable operation.
try {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $errorWriter = New-Object System.IO.StreamWriter([Console]::OpenStandardError(), $utf8)
    $inputReader = New-Object System.IO.StreamReader([Console]::OpenStandardInput(), $utf8)
    $outputWriter = New-Object System.IO.StreamWriter([Console]::OpenStandardOutput(), $utf8)
    # [L7] Reads all standard input and parses the incoming JSON request.
    $requestData = $inputReader.ReadToEnd() | ConvertFrom-Json
    # [L8] Defines the only five environment-variable names this helper permits callers to access.
    $allowedNames = @('APPRAISAL_AI_API_KEY', 'APPRAISAL_LOAN_NUMBER', 'APPRAISAL_FHA_CASE_NUMBER', 'APPRAISAL_PAYMENT_METHOD', 'APPRAISAL_RUSH_ORDER')
    # [L9] Rejects requests whose variable name is outside the allowlist.
    if ($requestData.name -notin $allowedNames) { throw 'Invalid environment variable' }
    # [L10] Enters the assignment branch only when the operation is set.
    if ($Operation -eq 'set') {
        # [L11] Sets the named environment variable in this PowerShell process using the request value converted to a string.
        [Environment]::SetEnvironmentVariable($requestData.name, [string]$requestData.value, 'Process')
    # [L12] Ends the optional environment-variable assignment branch.
    }
    # [L13] Documents that the worker captures this output privately instead of forwarding it to logs or model tools.
    # Output is captured privately by the worker, never forwarded to logs or model tools.
    # [L14] Reads the named variable from this PowerShell process's environment.
    $resultValue = [Environment]::GetEnvironmentVariable($requestData.name, 'Process')
    # [L15] Serializes the resulting value into a compact JSON object on standard output.
    $outputWriter.WriteLine((@{ value = $resultValue } | ConvertTo-Json -Compress))
    $outputWriter.Flush()
# [L16] Handles errors from JSON parsing, validation, or the environment-variable operation.
} catch {
    # [L17] Writes a generic failure message to standard error without exposing the requested value.
    if ($null -ne $errorWriter) {
        try {
            $errorWriter.WriteLine('Environment operation failed.')
            $errorWriter.Flush()
        } catch { }
    }
    # [L18] Exits the helper with status 1 to signal failure to its caller.
    exit 1
# Close only this helper's streams; cleanup must never disclose the private request.
} finally {
    foreach ($stream in @($inputReader, $outputWriter, $errorWriter)) {
        if ($null -ne $stream) {
            try { $stream.Dispose() } catch { }
        }
    }
}
