Param(
  [string]$EnvFile = ".env"
)

Write-Host "Setting up BluSkyFinCorp project..."

# Ensure Node is available
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue

$nodePath = if ($nodeCmd) { $nodeCmd.Source } else { "C:\Program Files\nodejs\node.exe" }
$npmPath = if ($npmCmd) { $npmCmd.Source } else { "C:\Program Files\nodejs\npm.cmd" }

if (-not (Test-Path $nodePath) -or -not (Test-Path $npmPath)) {
  Write-Error "Node.js or npm is not available. Please install Node.js and reopen the terminal."
  exit 1
}

# Install dependencies
Write-Host "Installing npm dependencies..."
& $npmPath install
if ($LASTEXITCODE -ne 0) {
  Write-Error "npm install failed."
  exit 1
}

# Create .env if missing
if (-not (Test-Path $EnvFile)) {
  Copy-Item .env.example $EnvFile
  Write-Host "Created $EnvFile from .env.example. Update the SMTP settings before running the app."
} else {
  Write-Host "$EnvFile already exists."
}

# Start the server
Write-Host "Starting the server..."

if (Test-Path $nodePath) {
  Start-Process -NoNewWindow -FilePath $nodePath -ArgumentList "server.js"
  Write-Host "BluSkyFinCorp is starting in the background. Open http://localhost:3000 when ready."
} else {
  Write-Error "Cannot start the server because Node.js path could not be found."
  exit 1
}
