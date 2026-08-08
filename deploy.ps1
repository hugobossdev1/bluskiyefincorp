Param(
  [switch]$NoStart
)

Write-Host "Deploying BluSkyFinCorp project..."

function Resolve-NodeNpm {
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  $npmCmd = Get-Command npm -ErrorAction SilentlyContinue

  $nodePath = if ($nodeCmd) { $nodeCmd.Source } else { "C:\Program Files\nodejs\node.exe" }
  $npmPath = if ($npmCmd) { $npmCmd.Source } else { "C:\Program Files\nodejs\npm.cmd" }

  if (-not (Test-Path $nodePath)) {
    Write-Error "Node.js not found at $nodePath. Install Node.js before continuing."
    exit 1
  }

  if (-not (Test-Path $npmPath)) {
    Write-Error "npm not found at $npmPath. Install Node.js before continuing."
    exit 1
  }

  return @{ Node = $nodePath; Npm = $npmPath }
}

$resolved = Resolve-NodeNpm
Write-Host "Using Node: $($resolved.Node)"
Write-Host "Using npm: $($resolved.Npm)"

Write-Host "Installing dependencies..."
& $resolved.Npm install
if ($LASTEXITCODE -ne 0) {
  Write-Error "npm install failed."
  exit 1
}

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host "Created .env from .env.example. Update environment values before production use."
} else {
  Write-Host ".env already exists."
}

if (-not $NoStart) {
  Write-Host "Starting server in the background..."
  Start-Process -NoNewWindow -FilePath $resolved.Node -ArgumentList 'server.js'
  Start-Sleep -Seconds 4
}

function Validate-Url($url) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
    Write-Host "$url -> $($response.StatusCode)"
  } catch {
    Write-Warning "$url -> failed: $($_.Exception.Message)"
  }
}

Validate-Url 'http://localhost:3000'
Validate-Url 'http://localhost:3000/admin'

Write-Host "\nDeployment helper completed."
Write-Host "Open http://localhost:3000 and http://localhost:3000/admin to verify the app locally."
Write-Host "To deploy to Render, push your repo to GitHub and connect Render using render.yaml."
Write-Host "If you want Azure deployment, add secrets AZURE_WEBAPP_NAME and AZURE_CREDENTIALS and push to GitHub."