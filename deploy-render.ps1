$ErrorActionPreference = 'Stop'

Write-Host "=== BluSkyFinCorp Render deployment helper ===" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed or not available in this terminal." -ForegroundColor Yellow
    Write-Host "Install Git first, then run this script again." -ForegroundColor Yellow
    exit 1
}

$gitStatus = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "No Git repo found. Initializing repository..." -ForegroundColor Green
    git init
}

Write-Host "Adding project files to Git..." -ForegroundColor Green
git add .

git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "chore: prepare BluSkyFinCorp for Render deployment"
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

$repoUrl = $env:GITHUB_REPO
if (-not $repoUrl) {
    Write-Host "Set the environment variable GITHUB_REPO to your GitHub repository HTTPS URL before pushing." -ForegroundColor Yellow
    Write-Host "Example: $env:GITHUB_REPO = 'https://github.com/yourname/bluskyfincorp.git'" -ForegroundColor Yellow
} else {
    Write-Host "Configuring remote origin..." -ForegroundColor Green
    git remote remove origin 2>$null | Out-Null
    git remote add origin $repoUrl
    git branch -M main
    git push -u origin main
}

Write-Host "" 
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push this repository to GitHub." -ForegroundColor White
Write-Host "2. Open Render and create a new Web Service." -ForegroundColor White
Write-Host "3. Connect the GitHub repository and deploy using render.yaml." -ForegroundColor White
Write-Host "4. Add your SMTP and admin environment variables in Render." -ForegroundColor White

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "" 
    Write-Host "Optional: install GitHub CLI (gh) for easier repo creation." -ForegroundColor Yellow
}
