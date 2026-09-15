# [L1] Accepts a string operation parameter constrained to set or get.
param([ValidateSet('set', 'get')][string]$Operation)
# [L2] Makes PowerShell errors terminate the current operation so the catch block can handle failures.
$ErrorActionPreference = 'Stop'
# [L3] Explains why the helper explicitly uses UTF-8 for the standard-input and standard-output pipes.
# Node uses UTF-8 on both pipes; Windows PowerShell otherwise uses the console code page.
# [L4] Configures standard-input decoding as UTF-8 without a byte-order mark.
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
# [L5] Configures standard-output encoding as UTF-8 without a byte-order mark.
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
# [L6] Begins guarded handling of the requested environment-variable operation.
try {
    # [L7] Reads all standard input and parses the incoming JSON request.
    $requestData = [Console]::In.ReadToEnd() | ConvertFrom-Json
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
    @{ value = $resultValue } | ConvertTo-Json -Compress
# [L16] Handles errors from JSON parsing, validation, or the environment-variable operation.
} catch {
    # [L17] Writes a generic failure message to standard error without exposing the requested value.
    [Console]::Error.WriteLine('Environment operation failed.')
    # [L18] Exits the helper with status 1 to signal failure to its caller.
    exit 1
# [L19] Ends environment-operation error handling.
}
